-- Canonical Roles catalog write protection (R-020) with approved read surface (R-021).
--
-- Documentary basis:
-- - docs/core/modules/roles/TASKS.md R-020: deny direct INSERT/UPDATE/DELETE of Roles
-- - docs/core/modules/roles/TASKS.md R-021: Role visibility != Role possession; Roles are
--   global reference data, not tenant-owned rows
-- - docs/core/modules/roles/PRISMA.md "Role Read Security": read policy may be broader
--   than tenant-owned resources
-- - docs/core/modules/roles/API.md "Authorization": system Role definitions may be safely
--   consumed by authenticated application workflows
--
-- Approved client surface:
-- - anon: no privileges on public.roles
-- - authenticated: SELECT only (global Role visibility)
-- - anon/authenticated: INSERT/UPDATE/DELETE denied
-- - RLS enabled; SELECT policy for authenticated USING (true); no write policies

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.roles FROM anon, authenticated;

DROP POLICY IF EXISTS roles_select_authenticated ON public.roles;

CREATE POLICY roles_select_authenticated
ON public.roles
FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON TABLE public.roles TO authenticated;
