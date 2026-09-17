-- ============================================================
-- PLATFORM CORE — Prepare public schema ownership for migration
--
-- Purpose:
--   After bootstrap-roles, transfer application objects in `public`
--   that are still owned by the bootstrap/superuser role (typically
--   `postgres`) to `platform_migration`, so `prisma migrate deploy`
--   can ALTER existing tables (e.g. profiles) without
--   "must be owner of table".
--
-- Scope (intentional minimum):
--   - public tables, sequences, composite/enum types owned by postgres
--   - does NOT modify schema auth / storage / realtime
--   - does NOT reassign objects owned by supabase_admin,
--     supabase_auth_admin, or other non-postgres roles
--
-- Public functions owned by postgres or supabase_admin that release SQL
-- must REPLACE (e.g. handle_new_user) are transferred to platform_migration.
-- Auth schema tables/types are never reassigned.
--
-- Safe to re-run (idempotent): objects already owned by
-- platform_migration are skipped.
-- ============================================================

\set ON_ERROR_STOP on

\getenv migration_role MIGRATION_ROLE_NAME

SELECT :'migration_role' <> '' AS valid_migration_role
\gset
\if :valid_migration_role
\else
  \echo 'MIGRATION_ROLE_NAME is required'
  \quit 2
\endif

SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'migration_role')
  AS migration_role_exists
\gset
\if :migration_role_exists
\else
  \echo 'migration role missing — run bootstrap-roles first'
  \quit 2
\endif

-- Abort if this does not look like the application database.
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
) AS profiles_exists
\gset
\if :profiles_exists
\else
  \echo 'public.profiles missing — refusing ownership prep'
  \quit 2
\endif

SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = '_prisma_migrations'
) AS prisma_ledger_exists
\gset
\if :prisma_ledger_exists
\else
  \echo 'public._prisma_migrations missing — refusing ownership prep'
  \quit 2
\endif

-- Refuse to touch Auth infrastructure ownership.
DO $guard$
DECLARE
  auth_users_owner text;
  missing_browser_role text;
BEGIN
  SELECT c.relowner::regrole::text
    INTO auth_users_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND c.relkind = 'r';

  IF auth_users_owner IS NULL THEN
    RAISE EXCEPTION 'auth.users missing — refusing ownership prep on non-Supabase database';
  END IF;

  IF auth_users_owner NOT IN ('supabase_auth_admin', 'supabase_admin') THEN
    RAISE EXCEPTION
      'auth.users owner is % (expected supabase_auth_admin or supabase_admin). Refusing to continue — restore fidelity or Supabase topology is wrong.',
      auth_users_owner;
  END IF;

  -- Real Supabase always has these; abort early if the topology is incomplete.
  SELECT rolname INTO missing_browser_role
  FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS required(rolname)
  WHERE NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname = required.rolname)
  LIMIT 1;

  IF missing_browser_role IS NOT NULL THEN
    RAISE EXCEPTION
      'required Supabase browser role % is missing — refusing ownership prep',
      missing_browser_role;
  END IF;
END
$guard$;

DO $transfer$
DECLARE
  migration_name text := current_setting('platform.migration_role', true);
  r record;
  transferred int := 0;
BEGIN
  IF migration_name IS NULL OR migration_name = '' THEN
    RAISE EXCEPTION 'platform.migration_role GUC is required';
  END IF;

  -- Tables (and partitioned tables)
  FOR r IN
    SELECT c.oid, format('%I.%I', n.nspname, c.relname) AS qual
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relowner = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
  LOOP
    EXECUTE format('ALTER TABLE %s OWNER TO %I', r.qual, migration_name);
    transferred := transferred + 1;
  END LOOP;

  -- Sequences
  FOR r IN
    SELECT format('%I.%I', n.nspname, c.relname) AS qual
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
      AND c.relowner = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
  LOOP
    EXECUTE format('ALTER SEQUENCE %s OWNER TO %I', r.qual, migration_name);
    transferred := transferred + 1;
  END LOOP;

  -- Enum and composite types in public owned by postgres
  FOR r IN
    SELECT format('%I.%I', n.nspname, t.typname) AS qual
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype IN ('e', 'c')
      AND t.typowner = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
  LOOP
    EXECUTE format('ALTER TYPE %s OWNER TO %I', r.qual, migration_name);
    transferred := transferred + 1;
  END LOOP;

  -- Application SQL functions in public that release migrations REPLACE.
  -- Production evidence: these are often owned by supabase_admin after a
  -- manual/early Auth SQL apply. Ownership (not mere membership) is required
  -- for CREATE OR REPLACE FUNCTION. Auth schema objects are never touched.
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_roles o ON o.oid = p.proowner
    WHERE n.nspname = 'public'
      AND o.rolname IN ('postgres', 'supabase_admin')
      AND p.prokind = 'f'
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO %I', r.sig, migration_name);
    transferred := transferred + 1;
  END LOOP;

  RAISE NOTICE 'public ownership prep transferred % object(s) to %', transferred, migration_name;
END
$transfer$;

-- Migration SQL installs triggers on auth.users. USAGE is required to
-- reference the schema; table ownership checks are satisfied via
-- bootstrap GRANT supabase_auth_admin TO platform_migration (INHERIT).
-- This does not transfer auth.* ownership.
SELECT format('GRANT USAGE ON SCHEMA auth TO %I', :'migration_role') \gexec

-- Assertions: migration role must own the critical ledgers/tables.
DO $assert$
DECLARE
  migration_name text := current_setting('platform.migration_role', true);
  owner text;
BEGIN
  SELECT c.relowner::regrole::text INTO owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'profiles';

  IF owner IS DISTINCT FROM migration_name THEN
    RAISE EXCEPTION 'public.profiles owner is %, expected %', owner, migration_name;
  END IF;

  SELECT c.relowner::regrole::text INTO owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = '_prisma_migrations';

  IF owner IS DISTINCT FROM migration_name THEN
    RAISE EXCEPTION 'public._prisma_migrations owner is %, expected %', owner, migration_name;
  END IF;

  -- Auth must still not be owned by the migration role.
  SELECT c.relowner::regrole::text INTO owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'auth' AND c.relname = 'users';

  IF owner = migration_name THEN
    RAISE EXCEPTION 'auth.users must not be owned by migration role';
  END IF;
END
$assert$;

SELECT 'public schema ownership prep valid' AS result;
