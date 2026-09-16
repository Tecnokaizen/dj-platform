-- ============================================================
-- DJ STUDIO M6
-- app_runtime SELECT-only grants for Product catalog reads
--
-- Root cause:
-- M5 grants Domain DML (library/playlists/tags/...) but Product runtime
-- reads global catalog via Prisma as app_runtime:
--   listLibraryItems / searchCatalogTracks / getPlaylist
--   → tracks → track_artists → artists
--
-- Catalog is shared/global and read-only for Product MVP.
-- No INSERT/UPDATE/DELETE on catalog for app_runtime.
-- Does not modify browser authenticated/anon grants or RLS.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    RAISE EXCEPTION 'app_runtime must be provisioned before Domain catalog grants';
  END IF;
END
$$;

REVOKE CREATE ON SCHEMA public FROM app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;

GRANT SELECT ON TABLE
  public.tracks,
  public.track_artists,
  public.artists
TO app_runtime;

-- Explicitly deny catalog mutation even if broader defaults appear later.
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.tracks,
  public.track_artists,
  public.artists
FROM app_runtime;

COMMIT;
