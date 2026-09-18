-- ============================================================
-- DJ STUDIO M5
-- Domain RLS (isolation floor) + app_runtime grants
--
-- RLS = tenant / own-row isolation
-- RBAC = business authorization (server-side RolePermission)
-- Browser: SELECT only (authenticated). No direct manage writes.
-- Server: app_runtime DML for future Domain services.
--
-- Requires: private.has_active_organization_membership (Core tenant RLS)
-- Does NOT insert Permission / RolePermission rows (Domain seed owns that).
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    INNER JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private'
      AND p.proname = 'has_active_organization_membership'
  ) THEN
    RAISE EXCEPTION
      'M5 requires private.has_active_organization_membership — apply Core tenant RLS first';
  END IF;
END
$$;

-- ------------------------------------------------------------
-- DjStudioProfile (profile-scoped)
-- ------------------------------------------------------------
ALTER TABLE public.dj_studio_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dj_studio_profiles_select_own ON public.dj_studio_profiles;
DROP POLICY IF EXISTS dj_studio_profiles_insert_own ON public.dj_studio_profiles;
DROP POLICY IF EXISTS dj_studio_profiles_update_own ON public.dj_studio_profiles;

CREATE POLICY dj_studio_profiles_select_own
ON public.dj_studio_profiles
FOR SELECT
TO authenticated
USING (profile_id = (SELECT auth.uid()));

CREATE POLICY dj_studio_profiles_insert_own
ON public.dj_studio_profiles
FOR INSERT
TO authenticated
WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY dj_studio_profiles_update_own
ON public.dj_studio_profiles
FOR UPDATE
TO authenticated
USING (profile_id = (SELECT auth.uid()))
WITH CHECK (profile_id = (SELECT auth.uid()));

-- No DELETE policy (MVP): browser cannot delete DjStudioProfile.

REVOKE ALL PRIVILEGES ON TABLE public.dj_studio_profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.dj_studio_profiles TO authenticated;
REVOKE DELETE ON TABLE public.dj_studio_profiles FROM authenticated;

-- ------------------------------------------------------------
-- Organization-scoped Domain tables (SELECT isolation only)
-- ------------------------------------------------------------
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS library_items_select_active_member ON public.library_items;
DROP POLICY IF EXISTS tags_select_active_member ON public.tags;
DROP POLICY IF EXISTS library_item_tags_select_active_member ON public.library_item_tags;
DROP POLICY IF EXISTS playlists_select_active_member ON public.playlists;
DROP POLICY IF EXISTS playlist_items_select_active_member ON public.playlist_items;

CREATE POLICY library_items_select_active_member
ON public.library_items
FOR SELECT
TO authenticated
USING (
  (SELECT private.has_active_organization_membership(organization_id))
);

CREATE POLICY tags_select_active_member
ON public.tags
FOR SELECT
TO authenticated
USING (
  (SELECT private.has_active_organization_membership(organization_id))
);

CREATE POLICY library_item_tags_select_active_member
ON public.library_item_tags
FOR SELECT
TO authenticated
USING (
  (SELECT private.has_active_organization_membership(organization_id))
);

CREATE POLICY playlists_select_active_member
ON public.playlists
FOR SELECT
TO authenticated
USING (
  (SELECT private.has_active_organization_membership(organization_id))
);

CREATE POLICY playlist_items_select_active_member
ON public.playlist_items
FOR SELECT
TO authenticated
USING (
  (SELECT private.has_active_organization_membership(organization_id))
);

REVOKE ALL PRIVILEGES ON TABLE public.library_items FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.tags FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.library_item_tags FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.playlists FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.playlist_items FROM anon, authenticated;

GRANT SELECT ON TABLE public.library_items TO authenticated;
GRANT SELECT ON TABLE public.tags TO authenticated;
GRANT SELECT ON TABLE public.library_item_tags TO authenticated;
GRANT SELECT ON TABLE public.playlists TO authenticated;
GRANT SELECT ON TABLE public.playlist_items TO authenticated;

-- ------------------------------------------------------------
-- Legacy DJ tables: close browser exposure (no Product runtime)
-- ------------------------------------------------------------
ALTER TABLE public.legacy_user_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_profile_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_user_track_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_profile_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Drop historical policy names if still attached after rename
DROP POLICY IF EXISTS user_tracks_select_own ON public.legacy_user_tracks;
DROP POLICY IF EXISTS user_tracks_insert_own ON public.legacy_user_tracks;
DROP POLICY IF EXISTS user_tracks_update_own ON public.legacy_user_tracks;
DROP POLICY IF EXISTS user_tracks_delete_own ON public.legacy_user_tracks;
DROP POLICY IF EXISTS tags_select_own ON public.legacy_profile_tags;
DROP POLICY IF EXISTS tags_insert_own ON public.legacy_profile_tags;
DROP POLICY IF EXISTS tags_update_own ON public.legacy_profile_tags;
DROP POLICY IF EXISTS tags_delete_own ON public.legacy_profile_tags;
DROP POLICY IF EXISTS user_track_tags_select_own ON public.legacy_user_track_tags;
DROP POLICY IF EXISTS user_track_tags_insert_own ON public.legacy_user_track_tags;
DROP POLICY IF EXISTS user_track_tags_delete_own ON public.legacy_user_track_tags;
DROP POLICY IF EXISTS playlists_select_own ON public.legacy_profile_playlists;
DROP POLICY IF EXISTS playlists_insert_own ON public.legacy_profile_playlists;
DROP POLICY IF EXISTS playlists_update_own ON public.legacy_profile_playlists;
DROP POLICY IF EXISTS playlists_delete_own ON public.legacy_profile_playlists;
DROP POLICY IF EXISTS playlist_tracks_select_accessible ON public.legacy_playlist_tracks;
DROP POLICY IF EXISTS playlist_tracks_insert_own ON public.legacy_playlist_tracks;
DROP POLICY IF EXISTS playlist_tracks_update_own ON public.legacy_playlist_tracks;
DROP POLICY IF EXISTS playlist_tracks_delete_own ON public.legacy_playlist_tracks;

REVOKE ALL PRIVILEGES ON TABLE public.legacy_user_tracks FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.legacy_profile_tags FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.legacy_user_track_tags FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.legacy_profile_playlists FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.legacy_playlist_tracks FROM anon, authenticated;

-- RLS enabled + no policies + no grants ⇒ browser deny.

-- ------------------------------------------------------------
-- app_runtime grants (trusted server; BYPASSRLS when role has it)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    RAISE NOTICE 'M5: app_runtime role absent — skipping Domain runtime grants';
    RETURN;
  END IF;

  REVOKE CREATE ON SCHEMA public FROM app_runtime;
  GRANT USAGE ON SCHEMA public TO app_runtime;

  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.dj_studio_profiles,
    public.library_items,
    public.tags,
    public.library_item_tags,
    public.playlists,
    public.playlist_items
  TO app_runtime;

  -- Legacy readable for migration/ops only; no Product path.
  GRANT SELECT ON TABLE
    public.legacy_user_tracks,
    public.legacy_profile_tags,
    public.legacy_user_track_tags,
    public.legacy_profile_playlists,
    public.legacy_playlist_tracks
  TO app_runtime;
END
$$;

COMMIT;
