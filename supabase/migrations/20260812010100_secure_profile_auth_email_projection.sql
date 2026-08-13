-- ============================================================
-- PLATFORM CORE
-- Supabase Auth email projection + Profile column security
--
-- Prerequisite:
--   Apply Prisma migration 20260812010000_add_profile_auth_email_projection
--   before this migration.
-- ============================================================

BEGIN;

-- Abort before backfill if canonical normalization is ambiguous.
DO $$
BEGIN
    IF EXISTS (
        SELECT lower(btrim(email))
        FROM auth.users
        WHERE NULLIF(btrim(email), '') IS NOT NULL
        GROUP BY lower(btrim(email))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot project auth email: normalized auth.users email collision detected';
    END IF;
END
$$;

-- Keep Profile creation aligned with the canonical Supabase Auth identity.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles(
        id,
        username,
        auth_email_normalized,
        display_name,
        avatar_url,
        preferred_language,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NULLIF(NEW.raw_user_meta_data->>'username', ''),
        lower(NULLIF(btrim(NEW.email), '')),
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
            NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
            NULLIF(NEW.raw_user_meta_data->>'picture', '')
        ),
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''),
            'es'
        ),
        now(),
        now()
    )
    ON CONFLICT(id) DO UPDATE
    SET auth_email_normalized = EXCLUDED.auth_email_normalized;

    RETURN NEW;
END;
$$;

-- Project existing Auth identities after collision validation.
UPDATE public.profiles AS profile
SET auth_email_normalized = lower(NULLIF(btrim(auth_user.email), ''))
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id;

-- Keep the projection synchronized when Supabase changes canonical email.
CREATE OR REPLACE FUNCTION public.sync_profile_auth_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET auth_email_normalized = lower(NULLIF(btrim(NEW.email), ''))
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE OF email
ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sync_profile_auth_email();

-- Database-owned timestamp for PostgREST/Profile updates.
CREATE OR REPLACE FUNCTION public.set_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profile_updated_at ON public.profiles;

CREATE TRIGGER set_profile_updated_at
BEFORE UPDATE
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profile_updated_at();

-- RLS limits rows, not columns. Remove broad writes and grant only the
-- application-owned fields currently editable by an authenticated Profile.
REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;

GRANT UPDATE (
    display_name,
    dj_name,
    bio,
    preferred_language
) ON TABLE public.profiles TO authenticated;

COMMIT;
