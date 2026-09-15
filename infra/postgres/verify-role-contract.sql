\set ON_ERROR_STOP on

\getenv migration_role MIGRATION_ROLE_NAME
\getenv runtime_role APP_RUNTIME_ROLE_NAME

DO $contract$
DECLARE
  runtime_name text := current_setting('platform.runtime_role', true);
  migration_name text := current_setting('platform.migration_role', true);
  runtime_record pg_roles%ROWTYPE;
BEGIN
  SELECT * INTO runtime_record FROM pg_roles WHERE rolname = runtime_name;

  IF runtime_record.rolname IS NULL THEN
    RAISE EXCEPTION 'runtime role is missing';
  END IF;

  IF NOT runtime_record.rolcanlogin
     OR runtime_record.rolsuper
     OR runtime_record.rolcreatedb
     OR runtime_record.rolcreaterole
     OR runtime_record.rolreplication
     OR runtime_record.rolinherit
     OR NOT runtime_record.rolbypassrls THEN
    RAISE EXCEPTION 'runtime role attributes violate ADR-010';
  END IF;

  IF pg_has_role(runtime_name, migration_name, 'MEMBER') THEN
    RAISE EXCEPTION 'runtime role can assume migration role';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin')
     AND pg_has_role(runtime_name, 'supabase_admin', 'MEMBER') THEN
    RAISE EXCEPTION 'runtime role can assume supabase_admin';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin')
     AND pg_has_role(runtime_name, 'supabase_auth_admin', 'MEMBER') THEN
    RAISE EXCEPTION 'runtime role can assume supabase_auth_admin';
  END IF;

  IF has_schema_privilege(runtime_name, 'public', 'CREATE') THEN
    RAISE EXCEPTION 'runtime role has DDL privilege on public schema';
  END IF;

  IF has_database_privilege(runtime_name, current_database(), 'CREATE') THEN
    RAISE EXCEPTION 'runtime role can create database schemas';
  END IF;

  IF NOT has_database_privilege(migration_name, current_database(), 'CREATE') THEN
    RAISE EXCEPTION 'migration role cannot create its Supabase ledger schema';
  END IF;
END
$contract$;

SELECT 'role contract valid' AS result;
