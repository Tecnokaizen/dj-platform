-- ============================================================
-- DRY-RUN ONLY — Restore fidelity toward production topology
--
-- A pg_dump/pg_restore into vanilla Postgres with --no-owner leaves
-- auth.users and Auth helpers owned by `postgres`. Production has:
--   auth.users          → supabase_auth_admin
--   handle_new_user()   → supabase_admin
--
-- This script realigns those owners so the PRODUCTION ownership prep
-- + bootstrap GRANT supabase_* membership can be validated honestly.
-- Do NOT run on production (production already has the correct owners).
-- ============================================================

\set ON_ERROR_STOP on

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin NOLOGIN;
  END IF;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT format('%I.%I', n.nspname, c.relname) AS qual
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
      AND c.relkind IN ('r', 'p')
      AND c.relowner = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
  LOOP
    EXECUTE format('ALTER TABLE %s OWNER TO supabase_auth_admin', r.qual);
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'handle_new_user',
        'sync_profile_auth_email_normalized',
        'set_profile_updated_at',
        'project_auth_email_normalized'
      )
      AND p.proowner = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO supabase_admin', r.sig);
  END LOOP;
END $$;

SELECT 'dry-run restore fidelity applied' AS result;
