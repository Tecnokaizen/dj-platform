-- Foundation Supabase S7 — authenticated PostgREST table privileges for profiles.
--
-- Root cause:
-- Core Identity loads/updates Profile through Supabase SSR + PostgREST as the
-- JWT role `authenticated` (see getCurrentProfile / updateCurrentProfile).
-- Row policies profiles_select_own / profiles_update_own already exist, but
-- PostgreSQL evaluates TABLE PRIVILEGES before RLS. Without SELECT/UPDATE
-- grants, PostgREST returns "permission denied for table profiles".
--
-- Contract:
-- - anon: no privileges on public.profiles
-- - authenticated: SELECT + UPDATE only (row scope remains RLS)
-- - authenticated: no INSERT / DELETE (Profile rows are created by auth trigger)
-- - app_runtime Prisma grants are unchanged (S6)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;

GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
