-- Rich legacy baseline for Validation C (Foundation complete, Domain not applied)
DO $$
DECLARE
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  member_c uuid := gen_random_uuid();
  org_existing uuid := gen_random_uuid();
  owner_role uuid;
  member_role uuid;
  t1 uuid := gen_random_uuid();
  t2 uuid := gen_random_uuid();
  t3 uuid := gen_random_uuid(); -- playlist-only
  t_repeat uuid := gen_random_uuid();
  pl uuid := gen_random_uuid();
  tag1 uuid := gen_random_uuid();
BEGIN
  SELECT id INTO owner_role FROM public.roles WHERE key = 'OWNER';
  SELECT id INTO member_role FROM public.roles WHERE key = 'MEMBER';

  INSERT INTO auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    instance_id, is_sso_user, is_anonymous
  ) VALUES
    (owner_a, 'authenticated', 'authenticated', 'a@example.com', 'x', now(), '{}', '{}', now(), now(), '00000000-0000-0000-0000-000000000000', false, false),
    (owner_b, 'authenticated', 'authenticated', 'b@example.com', 'x', now(), '{}', '{}', now(), now(), '00000000-0000-0000-0000-000000000000', false, false),
    (member_c, 'authenticated', 'authenticated', 'c@example.com', 'x', now(), '{}', '{}', now(), now(), '00000000-0000-0000-0000-000000000000', false, false);

  INSERT INTO public.profiles (id, username, display_name, preferred_language, created_at, updated_at)
  VALUES
    (owner_a, 'rich_a', 'Rich A', 'es', now(), now()),
    (owner_b, 'rich_b', 'Rich B', 'es', now(), now()),
    (member_c, 'rich_c', 'Rich C', 'es', now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organizations (id, name, slug, status, locale, timezone, created_at, updated_at)
  VALUES (org_existing, 'Existing Org', 'rich-existing-org', 'ACTIVE', 'es', 'UTC', now(), now());

  INSERT INTO public.organization_memberships (id, organization_id, profile_id, role_id, status, created_at, updated_at)
  VALUES
    (gen_random_uuid(), org_existing, owner_a, owner_role, 'ACTIVE', now(), now()),
    (gen_random_uuid(), org_existing, member_c, member_role, 'ACTIVE', now() + interval '1 second', now());

  INSERT INTO public.tracks (id, title, normalized_title, metadata, created_at, updated_at)
  VALUES
    (t1, 'rich-t1', 'rich-t1', '{}', now(), now()),
    (t2, 'rich-t2', 'rich-t2', '{}', now(), now()),
    (t3, 'rich-playlist-only', 'rich-playlist-only', '{}', now(), now()),
    (t_repeat, 'rich-repeat', 'rich-repeat', '{}', now(), now());

  -- user_tracks for A (existing org) and B (needs personal bootstrap)
  INSERT INTO public.user_tracks (id, user_id, track_id, status, is_favorite, play_count, date_added, created_at, updated_at)
  VALUES
    (gen_random_uuid(), owner_a, t1, 'LIBRARY', true, 2, now(), now(), now()),
    (gen_random_uuid(), owner_a, t_repeat, 'LIBRARY', false, 0, now(), now(), now()),
    (gen_random_uuid(), owner_b, t2, 'LIBRARY', false, 0, now(), now(), now());

  INSERT INTO public.tags (id, user_id, name, normalized_name, color, created_at, updated_at)
  VALUES (tag1, owner_a, 'Warm Up', 'warm up', '#ff0', now(), now());

  INSERT INTO public.playlists (id, user_id, name, slug, description, playlist_type, visibility, metadata, created_at, updated_at)
  VALUES (pl, owner_a, 'Rich Set', 'rich-set', 'demo', 'MANUAL', 'PRIVATE', '{}', now(), now());

  -- playlist tracks: library track + playlist-only + repeat of library track
  INSERT INTO public.playlist_tracks (id, playlist_id, track_id, position, added_by, notes, created_at)
  VALUES
    (gen_random_uuid(), pl, t1, 0, owner_a, null, now()),
    (gen_random_uuid(), pl, t3, 1, owner_a, 'only in playlist', now()),
    (gen_random_uuid(), pl, t1, 2, owner_a, 'repeat', now());
END $$;
