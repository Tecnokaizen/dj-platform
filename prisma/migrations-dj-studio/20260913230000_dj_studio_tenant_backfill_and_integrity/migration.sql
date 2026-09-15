-- DJ Studio M4: Organization bootstrap + legacy backfill + composite tenant FKs
-- Forward-only. Does not DROP legacy tables, create RLS, or touch production.
-- Mapping policy: Profile → oldest ACTIVE Organization membership (created_at ASC,
-- tie-break organization_id); else create personal Organization + OWNER membership.
-- Personal slug: personal-<profile uuid without dashes> (no PII).

DO $$
DECLARE
  owner_role_id UUID;
  profiles_needing INTEGER;
  collision_count INTEGER;
  violating_count INTEGER;
BEGIN
  ---------------------------------------------------------------------------
  -- 1. Profile → Organization mapping (temp)
  ---------------------------------------------------------------------------
  CREATE TEMP TABLE m4_profile_org_map (
    profile_id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    bootstrapped BOOLEAN NOT NULL DEFAULT false
  ) ON COMMIT DROP;

  -- Profiles with any legacy Domain operational data
  INSERT INTO m4_profile_org_map (profile_id, organization_id, bootstrapped)
  SELECT p.id, '00000000-0000-0000-0000-000000000000'::uuid, false
  FROM profiles p
  WHERE EXISTS (SELECT 1 FROM legacy_user_tracks lut WHERE lut.user_id = p.id)
     OR EXISTS (SELECT 1 FROM legacy_profile_tags lpt WHERE lpt.user_id = p.id)
     OR EXISTS (SELECT 1 FROM legacy_profile_playlists lpp WHERE lpp.user_id = p.id);

  GET DIAGNOSTICS profiles_needing = ROW_COUNT;

  -- A) Existing ACTIVE membership → oldest org
  UPDATE m4_profile_org_map AS map
  SET organization_id = chosen.organization_id
  FROM (
    SELECT DISTINCT ON (m.profile_id)
      m.profile_id,
      m.organization_id
    FROM organization_memberships m
    INNER JOIN organizations o ON o.id = m.organization_id
    WHERE m.status = 'ACTIVE'
      AND o.status = 'ACTIVE'
    ORDER BY m.profile_id, m.created_at ASC, m.organization_id ASC
  ) AS chosen
  WHERE map.profile_id = chosen.profile_id;

  -- B) No ACTIVE membership → personal Organization + OWNER membership
  --    Deferred OWNER constraint triggers fire at COMMIT of this DO block.
  --    OWNER role required only when bootstrap is actually needed.
  DECLARE
    r RECORD;
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM m4_profile_org_map
      WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    ) THEN
      SELECT id INTO owner_role_id FROM roles WHERE key = 'OWNER' LIMIT 1;
      IF owner_role_id IS NULL THEN
        RAISE EXCEPTION
          'M4 ABORT: OWNER role missing — seed Foundation roles before DJ Studio backfill'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;

    FOR r IN
      SELECT map.profile_id, p.display_name, p.username
      FROM m4_profile_org_map map
      INNER JOIN profiles p ON p.id = map.profile_id
      WHERE map.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    LOOP
      org_slug := 'personal-' || replace(r.profile_id::text, '-', '');
      org_name := COALESCE(
        NULLIF(BTRIM(r.display_name), ''),
        NULLIF(BTRIM(r.username), ''),
        'Personal Studio'
      );

      SELECT id INTO new_org_id FROM organizations WHERE slug = org_slug;
      IF new_org_id IS NULL THEN
        new_org_id := gen_random_uuid();
        INSERT INTO organizations (
          id, name, slug, status, locale, timezone, created_at, updated_at
        ) VALUES (
          new_org_id, org_name, org_slug, 'ACTIVE', 'es', 'UTC', now(), now()
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.organization_id = new_org_id
          AND om.profile_id = r.profile_id
      ) THEN
        INSERT INTO organization_memberships (
          id, organization_id, profile_id, role_id, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), new_org_id, r.profile_id, owner_role_id, 'ACTIVE', now(), now()
        );
      END IF;

      UPDATE m4_profile_org_map
      SET organization_id = new_org_id, bootstrapped = true
      WHERE profile_id = r.profile_id;
    END LOOP;
  END;

  IF EXISTS (
    SELECT 1 FROM m4_profile_org_map
    WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  ) THEN
    RAISE EXCEPTION 'M4 ABORT: unresolved Profile→Organization mapping'
      USING ERRCODE = 'P0001';
  END IF;

  ---------------------------------------------------------------------------
  -- 3. Collision preflights (ABORT — no silent merge)
  ---------------------------------------------------------------------------
  SELECT COUNT(*) INTO collision_count
  FROM (
    SELECT map.organization_id, lut.track_id
    FROM legacy_user_tracks lut
    INNER JOIN m4_profile_org_map map ON map.profile_id = lut.user_id
    GROUP BY map.organization_id, lut.track_id
    HAVING COUNT(DISTINCT lut.id) > 1
  ) collisions;
  IF collision_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: ambiguous LibraryItem collision — % org+track groups with multiple legacy_user_tracks',
      collision_count
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO collision_count
  FROM (
    SELECT map.organization_id, lpt.normalized_name
    FROM legacy_profile_tags lpt
    INNER JOIN m4_profile_org_map map ON map.profile_id = lpt.user_id
    GROUP BY map.organization_id, lpt.normalized_name
    HAVING COUNT(DISTINCT lpt.id) > 1
  ) collisions;
  IF collision_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: ambiguous Tag collision — % org+normalized_name groups with multiple legacy_profile_tags',
      collision_count
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO collision_count
  FROM (
    SELECT map.organization_id, lpp.slug
    FROM legacy_profile_playlists lpp
    INNER JOIN m4_profile_org_map map ON map.profile_id = lpp.user_id
    WHERE lpp.slug IS NOT NULL
    GROUP BY map.organization_id, lpp.slug
    HAVING COUNT(DISTINCT lpp.id) > 1
  ) collisions;
  IF collision_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: ambiguous Playlist slug collision — % org+slug groups with multiple legacy_profile_playlists',
      collision_count
      USING ERRCODE = 'P0001';
  END IF;

  -- Inconsistent legacy tag joins (user_track owner org ≠ tag owner org after map)
  SELECT COUNT(*) INTO collision_count
  FROM legacy_user_track_tags lutt
  INNER JOIN legacy_user_tracks lut ON lut.id = lutt.user_track_id
  INNER JOIN legacy_profile_tags lpt ON lpt.id = lutt.tag_id
  INNER JOIN m4_profile_org_map map_ut ON map_ut.profile_id = lut.user_id
  INNER JOIN m4_profile_org_map map_tag ON map_tag.profile_id = lpt.user_id
  WHERE map_ut.organization_id <> map_tag.organization_id;
  IF collision_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: inconsistent legacy_user_track_tags — % joins map to different Organizations',
      collision_count
      USING ERRCODE = 'P0001';
  END IF;

  ---------------------------------------------------------------------------
  -- 4. Backfill LibraryItems (preserve legacy ids)
  ---------------------------------------------------------------------------
  INSERT INTO library_items (
    id, organization_id, track_id, added_by_profile_id,
    status, rating, energy, familiarity, notes, custom_bpm, custom_key,
    is_favorite, play_count, date_added, last_played_at, created_at, updated_at
  )
  SELECT
    lut.id,
    map.organization_id,
    lut.track_id,
    lut.user_id,
    lut.status,
    lut.rating,
    lut.energy,
    lut.familiarity,
    lut.notes,
    lut.custom_bpm,
    lut.custom_key,
    lut.is_favorite,
    lut.play_count,
    lut.date_added,
    lut.last_played_at,
    lut.created_at,
    lut.updated_at
  FROM legacy_user_tracks lut
  INNER JOIN m4_profile_org_map map ON map.profile_id = lut.user_id
  WHERE NOT EXISTS (SELECT 1 FROM library_items li WHERE li.id = lut.id);

  ---------------------------------------------------------------------------
  -- 5. Backfill Tags (preserve legacy ids)
  ---------------------------------------------------------------------------
  INSERT INTO tags (
    id, organization_id, name, normalized_name, color, created_at, updated_at
  )
  SELECT
    lpt.id,
    map.organization_id,
    lpt.name,
    lpt.normalized_name,
    lpt.color,
    lpt.created_at,
    lpt.updated_at
  FROM legacy_profile_tags lpt
  INNER JOIN m4_profile_org_map map ON map.profile_id = lpt.user_id
  WHERE NOT EXISTS (SELECT 1 FROM tags t WHERE t.id = lpt.id);

  ---------------------------------------------------------------------------
  -- 6. Backfill LibraryItemTags
  ---------------------------------------------------------------------------
  INSERT INTO library_item_tags (organization_id, library_item_id, tag_id)
  SELECT
    map_ut.organization_id,
    lutt.user_track_id,
    lutt.tag_id
  FROM legacy_user_track_tags lutt
  INNER JOIN legacy_user_tracks lut ON lut.id = lutt.user_track_id
  INNER JOIN m4_profile_org_map map_ut ON map_ut.profile_id = lut.user_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM library_item_tags lit
    WHERE lit.library_item_id = lutt.user_track_id
      AND lit.tag_id = lutt.tag_id
  );

  -- Sanity: LibraryItem and Tag must share organization_id
  SELECT COUNT(*) INTO violating_count
  FROM library_item_tags lit
  INNER JOIN library_items li ON li.id = lit.library_item_id
  INNER JOIN tags t ON t.id = lit.tag_id
  WHERE lit.organization_id <> li.organization_id
     OR lit.organization_id <> t.organization_id
     OR li.organization_id <> t.organization_id;
  IF violating_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: library_item_tags tenant mismatch after backfill (% rows)',
      violating_count
      USING ERRCODE = 'P0001';
  END IF;

  ---------------------------------------------------------------------------
  -- 7. Backfill Playlists (preserve legacy ids)
  ---------------------------------------------------------------------------
  INSERT INTO playlists (
    id, organization_id, name, slug, description, playlist_type, visibility,
    artwork_url, source_url, metadata, created_at, updated_at
  )
  SELECT
    lpp.id,
    map.organization_id,
    lpp.name,
    lpp.slug,
    lpp.description,
    lpp.playlist_type,
    lpp.visibility,
    lpp.artwork_url,
    lpp.source_url,
    lpp.metadata,
    lpp.created_at,
    lpp.updated_at
  FROM legacy_profile_playlists lpp
  INNER JOIN m4_profile_org_map map ON map.profile_id = lpp.user_id
  WHERE NOT EXISTS (SELECT 1 FROM playlists pl WHERE pl.id = lpp.id);

  ---------------------------------------------------------------------------
  -- 8. Ensure LibraryItems for playlist-only Tracks (playlist ⊆ library)
  ---------------------------------------------------------------------------
  INSERT INTO library_items (
    id, organization_id, track_id, added_by_profile_id,
    status, is_favorite, play_count, date_added, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    src.organization_id,
    src.track_id,
    CASE
      WHEN src.added_by IS NOT NULL
        AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = src.added_by)
      THEN src.added_by
      ELSE NULL
    END,
    'LIBRARY',
    false,
    0,
    COALESCE(src.created_at, now()),
    COALESCE(src.created_at, now()),
    now()
  FROM (
    SELECT DISTINCT ON (pl.organization_id, lpt.track_id)
      pl.organization_id,
      lpt.track_id,
      lpt.added_by,
      lpt.created_at
    FROM legacy_playlist_tracks lpt
    INNER JOIN playlists pl ON pl.id = lpt.playlist_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM library_items li
      WHERE li.organization_id = pl.organization_id
        AND li.track_id = lpt.track_id
    )
    ORDER BY pl.organization_id, lpt.track_id, lpt.created_at ASC NULLS LAST
  ) AS src;

  ---------------------------------------------------------------------------
  -- 9. Backfill PlaylistItems (preserve legacy ids; → LibraryItem)
  ---------------------------------------------------------------------------
  INSERT INTO playlist_items (
    id, organization_id, playlist_id, library_item_id, position,
    added_by_profile_id, notes, transition_notes, source_timestamp_ms, created_at
  )
  SELECT
    lpt.id,
    pl.organization_id,
    lpt.playlist_id,
    li.id,
    lpt.position,
    CASE
      WHEN lpt.added_by IS NOT NULL
        AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = lpt.added_by)
      THEN lpt.added_by
      ELSE NULL
    END,
    lpt.notes,
    lpt.transition_notes,
    lpt.source_timestamp_ms,
    lpt.created_at
  FROM legacy_playlist_tracks lpt
  INNER JOIN playlists pl ON pl.id = lpt.playlist_id
  INNER JOIN library_items li
    ON li.organization_id = pl.organization_id
   AND li.track_id = lpt.track_id
  WHERE NOT EXISTS (SELECT 1 FROM playlist_items pi WHERE pi.id = lpt.id);

  ---------------------------------------------------------------------------
  -- 10. Preflight before composite FKs
  ---------------------------------------------------------------------------
  SELECT COUNT(*) INTO violating_count
  FROM library_item_tags lit
  LEFT JOIN library_items li
    ON li.id = lit.library_item_id AND li.organization_id = lit.organization_id
  WHERE li.id IS NULL;
  IF violating_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: % library_item_tags rows violate (org, library_item) composite',
      violating_count
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO violating_count
  FROM library_item_tags lit
  LEFT JOIN tags t
    ON t.id = lit.tag_id AND t.organization_id = lit.organization_id
  WHERE t.id IS NULL;
  IF violating_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: % library_item_tags rows violate (org, tag) composite',
      violating_count
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO violating_count
  FROM playlist_items pi
  LEFT JOIN playlists pl
    ON pl.id = pi.playlist_id AND pl.organization_id = pi.organization_id
  WHERE pl.id IS NULL;
  IF violating_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: % playlist_items rows violate (org, playlist) composite',
      violating_count
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO violating_count
  FROM playlist_items pi
  LEFT JOIN library_items li
    ON li.id = pi.library_item_id AND li.organization_id = pi.organization_id
  WHERE li.id IS NULL;
  IF violating_count > 0 THEN
    RAISE EXCEPTION
      'M4 ABORT: % playlist_items rows violate (org, library_item) composite',
      violating_count
      USING ERRCODE = 'P0001';
  END IF;

  RAISE NOTICE 'M4 backfill complete; profiles_mapped=%', profiles_needing;
END;
$$;

-- 11. Replace simple parent FKs with composite tenant FKs (organization_id retained)
ALTER TABLE "library_item_tags"
  DROP CONSTRAINT IF EXISTS "library_item_tags_library_item_id_fkey",
  DROP CONSTRAINT IF EXISTS "library_item_tags_tag_id_fkey";

ALTER TABLE "library_item_tags"
  ADD CONSTRAINT "library_item_tags_organization_id_library_item_id_fkey"
  FOREIGN KEY ("organization_id", "library_item_id")
  REFERENCES "library_items" ("organization_id", "id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "library_item_tags"
  ADD CONSTRAINT "library_item_tags_organization_id_tag_id_fkey"
  FOREIGN KEY ("organization_id", "tag_id")
  REFERENCES "tags" ("organization_id", "id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "playlist_items"
  DROP CONSTRAINT IF EXISTS "playlist_items_playlist_id_fkey",
  DROP CONSTRAINT IF EXISTS "playlist_items_library_item_id_fkey";

ALTER TABLE "playlist_items"
  ADD CONSTRAINT "playlist_items_organization_id_playlist_id_fkey"
  FOREIGN KEY ("organization_id", "playlist_id")
  REFERENCES "playlists" ("organization_id", "id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "playlist_items"
  ADD CONSTRAINT "playlist_items_organization_id_library_item_id_fkey"
  FOREIGN KEY ("organization_id", "library_item_id")
  REFERENCES "library_items" ("organization_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
