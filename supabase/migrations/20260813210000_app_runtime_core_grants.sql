-- Trusted Prisma backend role. The role itself is created by the cluster-level
-- operational bootstrap before either application migration ledger is run.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    RAISE EXCEPTION 'app_runtime must be provisioned before schema migrations';
  END IF;
END
$$;

REVOKE CREATE ON SCHEMA public FROM app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profiles,
  public.organizations,
  public.roles,
  public.organization_memberships,
  public.organization_invitations,
  public.permissions,
  public.role_permissions
TO app_runtime;

REVOKE ALL ON SCHEMA auth FROM app_runtime;
REVOKE ALL ON SCHEMA private FROM app_runtime;

