-- Harden Organization OWNER invariant helpers for role-separated deployments.
--
-- Privilege model (PostgreSQL semantics):
-- - Trigger execution (PG 11+) does not require the session role to hold EXECUTE
--   on the trigger function.
-- - Nested PERFORM assert_* from an INVOKER trigger DOES require the session
--   role to EXECUTE assert_*. After REVOKE FROM PUBLIC that breaks when the
--   runtime role != migration/function owner.
-- - Therefore only the three check_* trigger functions are SECURITY DEFINER so
--   nested calls to assert_* run as the function owner without granting EXECUTE
--   on assert_* to runtime roles.
-- - assert_* and lock_* remain SECURITY INVOKER but gain a fixed empty
--   search_path and schema-qualified public.* references.
-- - No EXECUTE grants to anon/authenticated/PUBLIC beyond REVOKE ALL FROM PUBLIC.

CREATE OR REPLACE FUNCTION public.assert_organization_owner_invariant(
  target_organization_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  PERFORM 1
  FROM public.organizations
  WHERE id = target_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO owner_count
  FROM public.organization_memberships AS membership
  INNER JOIN public.roles AS role
    ON role.id = membership.role_id
  WHERE membership.organization_id = target_organization_id
    AND membership.status = 'ACTIVE'
    AND role.key = 'OWNER';

  IF owner_count <> 1 THEN
    RAISE EXCEPTION
      'Organization % must have exactly one ACTIVE OWNER Membership; found %',
      target_organization_id,
      owner_count
      USING ERRCODE = '23514';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_organization_owner_invariant(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.lock_organization_owner_invariant_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM 1
    FROM public.organizations
    WHERE id = NEW.organization_id
    FOR UPDATE;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM 1
    FROM public.organizations
    WHERE id = OLD.organization_id
    FOR UPDATE;
  ELSE
    PERFORM 1
    FROM public.organizations
    WHERE id IN (OLD.organization_id, NEW.organization_id)
    ORDER BY id
    FOR UPDATE;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_organization_owner_invariant_scope() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.check_organization_owner_from_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.assert_organization_owner_invariant(NEW.id);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_organization_owner_from_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.assert_organization_owner_invariant(OLD.organization_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.assert_organization_owner_invariant(NEW.organization_id);
  ELSE
    PERFORM public.assert_organization_owner_invariant(NEW.organization_id);

    IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
      PERFORM public.assert_organization_owner_invariant(OLD.organization_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_organization_owner_from_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_organization_id UUID;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.key = 'OWNER' THEN
    FOR affected_organization_id IN
      SELECT DISTINCT membership.organization_id
      FROM public.organization_memberships AS membership
      WHERE membership.role_id = OLD.id
    LOOP
      PERFORM public.assert_organization_owner_invariant(affected_organization_id);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND (OLD.key = 'OWNER' OR NEW.key = 'OWNER') THEN
    FOR affected_organization_id IN
      SELECT DISTINCT membership.organization_id
      FROM public.organization_memberships AS membership
      WHERE membership.role_id IN (OLD.id, NEW.id)
    LOOP
      PERFORM public.assert_organization_owner_invariant(affected_organization_id);
    END LOOP;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.check_organization_owner_from_organization() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_organization_owner_from_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_organization_owner_from_role() FROM PUBLIC;
