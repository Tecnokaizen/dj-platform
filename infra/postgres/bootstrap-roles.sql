\set ON_ERROR_STOP on

\getenv migration_role MIGRATION_ROLE_NAME
\getenv migration_password MIGRATION_ROLE_PASSWORD
\getenv runtime_role APP_RUNTIME_ROLE_NAME
\getenv runtime_password APP_RUNTIME_ROLE_PASSWORD

SELECT :'migration_role' <> '' AS valid_migration_role,
       :'migration_password' <> '' AS valid_migration_password,
       :'runtime_role' <> '' AS valid_runtime_role,
       :'runtime_password' <> '' AS valid_runtime_password
\gset

\if :valid_migration_role
\else
  \quit 2
\endif
\if :valid_migration_password
\else
  \quit 2
\endif
\if :valid_runtime_role
\else
  \quit 2
\endif
\if :valid_runtime_password
\else
  \quit 2
\endif

SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'migration_role')
  AS migration_role_exists
\gset
\if :migration_role_exists
  SELECT format(
    'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT NOBYPASSRLS',
    :'migration_role', :'migration_password'
  ) \gexec
\else
  SELECT format(
    'CREATE ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION INHERIT NOBYPASSRLS',
    :'migration_role', :'migration_password'
  ) \gexec
\endif

SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'runtime_role')
  AS runtime_role_exists
\gset
\if :runtime_role_exists
  SELECT format(
    'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT BYPASSRLS',
    :'runtime_role', :'runtime_password'
  ) \gexec
\else
  SELECT format(
    'CREATE ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT BYPASSRLS',
    :'runtime_role', :'runtime_password'
  ) \gexec
\endif

SELECT format('REVOKE %I FROM %I', :'migration_role', :'runtime_role') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'migration_role') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'runtime_role') \gexec
SELECT format('GRANT CREATE ON DATABASE %I TO %I', current_database(), :'migration_role') \gexec
SELECT format('REVOKE CREATE ON DATABASE %I FROM %I', current_database(), :'runtime_role') \gexec
SELECT format('GRANT USAGE, CREATE ON SCHEMA public TO %I', :'migration_role') \gexec
SELECT format('REVOKE CREATE ON SCHEMA public FROM %I', :'runtime_role') \gexec

-- Supabase CLI owns a separate migration ledger and always issues CREATE
-- SCHEMA IF NOT EXISTS. Database CREATE is therefore reserved for the release
-- role; the web runtime is explicitly denied it above.
SELECT format(
  'CREATE SCHEMA IF NOT EXISTS supabase_migrations AUTHORIZATION %I',
  :'migration_role'
) \gexec
SELECT format('ALTER SCHEMA supabase_migrations OWNER TO %I', :'migration_role') \gexec
SELECT format(
  'GRANT USAGE, CREATE ON SCHEMA supabase_migrations TO %I',
  :'migration_role'
) \gexec
SELECT format(
  'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA supabase_migrations TO %I',
  :'migration_role'
) \gexec

-- The official Supabase stack owns auth objects through supabase_admin. The
-- release migrator needs this membership to install triggers on auth.users.
-- It is deliberately never granted to app_runtime.
SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin')
  AS supabase_admin_exists
\gset
\if :supabase_admin_exists
  SELECT format('GRANT supabase_admin TO %I', :'migration_role') \gexec
\endif

-- Auth objects are owned by a dedicated official role. Membership is required
-- only because repository migrations install constraints and triggers on
-- auth.users; it is never granted to the web runtime.
SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin')
  AS supabase_auth_admin_exists
\gset
\if :supabase_auth_admin_exists
  SELECT format('GRANT supabase_auth_admin TO %I', :'migration_role') \gexec
\endif
