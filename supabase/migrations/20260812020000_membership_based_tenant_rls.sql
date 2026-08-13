-- ============================================================
-- PLATFORM CORE
-- Membership-based tenant RLS
--
-- This migration deliberately exposes only the minimum read surface needed
-- for tenant discovery. Administrative writes remain server-only until the
-- Permissions foundation is implemented.
-- ============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_active_organization_membership(
    target_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_memberships AS membership
        INNER JOIN public.organizations AS organization
            ON organization.id = membership.organization_id
        WHERE membership.organization_id = target_organization_id
          AND membership.profile_id = (SELECT auth.uid())
          AND membership.status = 'ACTIVE'
          AND organization.status = 'ACTIVE'
    );
$$;

REVOKE ALL ON FUNCTION private.has_active_organization_membership(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.has_active_organization_membership(UUID)
TO authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_select_active_member
ON public.organizations;

CREATE POLICY organizations_select_active_member
ON public.organizations
FOR SELECT
TO authenticated
USING (
    status = 'ACTIVE'
    AND (SELECT private.has_active_organization_membership(id))
);

DROP POLICY IF EXISTS organization_memberships_select_own_active
ON public.organization_memberships;

CREATE POLICY organization_memberships_select_own_active
ON public.organization_memberships
FOR SELECT
TO authenticated
USING (
    profile_id = (SELECT auth.uid())
    AND status = 'ACTIVE'
    AND (
        SELECT private.has_active_organization_membership(organization_id)
    )
);

-- RLS filters rows, not secret columns. Invitations contain token_hash and
-- therefore remain inaccessible to Supabase client roles. There is no
-- permissive policy on organization_invitations.
REVOKE ALL PRIVILEGES ON TABLE public.organizations
FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.organization_memberships
FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.organization_invitations
FROM anon, authenticated;

REVOKE ALL PRIVILEGES (
    id,
    name,
    slug,
    status,
    logo_url,
    locale,
    timezone,
    created_at,
    updated_at,
    archived_at
) ON TABLE public.organizations FROM anon, authenticated;

REVOKE ALL PRIVILEGES (
    id,
    organization_id,
    profile_id,
    role_id,
    status,
    suspended_at,
    removed_at,
    created_at,
    updated_at
) ON TABLE public.organization_memberships FROM anon, authenticated;

REVOKE ALL PRIVILEGES (
    id,
    organization_id,
    recipient_email,
    normalized_email,
    role_id,
    status,
    token_hash,
    expires_at,
    invited_by_membership_id,
    accepted_by_profile_id,
    accepted_at,
    revoked_at,
    created_at,
    updated_at
) ON TABLE public.organization_invitations FROM anon, authenticated;

GRANT SELECT ON TABLE public.organizations TO authenticated;
GRANT SELECT ON TABLE public.organization_memberships TO authenticated;

COMMIT;
