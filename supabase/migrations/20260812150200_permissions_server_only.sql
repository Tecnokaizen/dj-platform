-- Permissions Foundation is server-mediated. No direct Supabase client access
-- is approved for the canonical catalog or system Role policy.

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.permissions FROM anon, authenticated;
REVOKE ALL ON TABLE public.role_permissions FROM anon, authenticated;
