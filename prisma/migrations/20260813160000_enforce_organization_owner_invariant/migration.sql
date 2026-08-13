-- Platform Core requires exactly one ACTIVE OWNER Membership for every
-- persisted Organization. OWNER semantics are resolved through roles.key;
-- no environment-specific Role UUID is embedded in this migration.

DO $$
DECLARE
  invalid_organizations INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_organizations
  FROM (
    SELECT organization.id
    FROM organizations AS organization
    LEFT JOIN organization_memberships AS membership
      ON membership.organization_id = organization.id
    LEFT JOIN roles AS role
      ON role.id = membership.role_id
    GROUP BY organization.id
    HAVING COUNT(*) FILTER (
      WHERE membership.status = 'ACTIVE'
        AND role.key = 'OWNER'
    ) <> 1
  ) AS invalid;

  IF invalid_organizations > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce Organization OWNER invariant: % invalid Organization(s)',
      invalid_organizations
      USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE FUNCTION assert_organization_owner_invariant(target_organization_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  -- Serialize invariant checks and ownership transfers per Organization.
  PERFORM 1
  FROM organizations
  WHERE id = target_organization_id
  FOR UPDATE;

  -- Deleting an Organization and its Memberships in one transaction is valid.
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO owner_count
  FROM organization_memberships AS membership
  INNER JOIN roles AS role
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

REVOKE ALL ON FUNCTION assert_organization_owner_invariant(UUID) FROM PUBLIC;

CREATE FUNCTION lock_organization_owner_invariant_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Lock before the Membership statement acquires its foreign-key lock. This
  -- avoids lock-upgrade deadlocks when concurrent writes target one tenant.
  IF TG_OP = 'INSERT' THEN
    PERFORM 1 FROM organizations WHERE id = NEW.organization_id FOR UPDATE;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM 1 FROM organizations WHERE id = OLD.organization_id FOR UPDATE;
  ELSE
    PERFORM 1
    FROM organizations
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

REVOKE ALL ON FUNCTION lock_organization_owner_invariant_scope() FROM PUBLIC;

CREATE FUNCTION check_organization_owner_from_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM assert_organization_owner_invariant(NEW.id);
  RETURN NULL;
END;
$$;

CREATE FUNCTION check_organization_owner_from_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM assert_organization_owner_invariant(OLD.organization_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM assert_organization_owner_invariant(NEW.organization_id);
  ELSE
    PERFORM assert_organization_owner_invariant(NEW.organization_id);

    IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
      PERFORM assert_organization_owner_invariant(OLD.organization_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE FUNCTION check_organization_owner_from_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_organization_id UUID;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.key = 'OWNER' THEN
    FOR affected_organization_id IN
      SELECT DISTINCT membership.organization_id
      FROM organization_memberships AS membership
      WHERE membership.role_id = OLD.id
    LOOP
      PERFORM assert_organization_owner_invariant(affected_organization_id);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND (OLD.key = 'OWNER' OR NEW.key = 'OWNER') THEN
    FOR affected_organization_id IN
      SELECT DISTINCT membership.organization_id
      FROM organization_memberships AS membership
      WHERE membership.role_id IN (OLD.id, NEW.id)
    LOOP
      PERFORM assert_organization_owner_invariant(affected_organization_id);
    END LOOP;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION check_organization_owner_from_organization() FROM PUBLIC;
REVOKE ALL ON FUNCTION check_organization_owner_from_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION check_organization_owner_from_role() FROM PUBLIC;

CREATE TRIGGER organization_memberships_lock_owner_scope
BEFORE INSERT OR UPDATE OR DELETE ON organization_memberships
FOR EACH ROW
EXECUTE FUNCTION lock_organization_owner_invariant_scope();

CREATE CONSTRAINT TRIGGER organizations_exactly_one_active_owner
AFTER INSERT ON organizations
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_organization_owner_from_organization();

CREATE CONSTRAINT TRIGGER organization_memberships_exactly_one_active_owner
AFTER INSERT OR UPDATE OR DELETE ON organization_memberships
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_organization_owner_from_membership();

CREATE CONSTRAINT TRIGGER roles_preserve_organization_owner
AFTER UPDATE OR DELETE ON roles
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_organization_owner_from_role();
