# ADR-009 — Ownership Transfer and Database Enforcement

**Status:** Accepted
**Date:** 2026-08-13
**Decision Type:** Foundation Architecture

## Context

ADR-004 and ADR-005 require every persisted Organization to retain exactly one
ACTIVE Membership whose canonical Role key is `OWNER`. They intentionally left
the previous-owner Role and the PostgreSQL enforcement mechanism unresolved.

Application-only protection is insufficient against direct database writes and
concurrent ownership transfers. A fixed OWNER Role UUID would also be invalid
because canonical Role identifiers differ between environments.

## Decision

Ownership transfer requires an explicit `previousOwnerRoleId`. The referenced
Role must exist and must not have the canonical key `OWNER`. Platform Core does
not silently assume ADMIN, MEMBER or any other Product policy.

Every persisted Organization, including ACTIVE, SUSPENDED and ARCHIVED rows,
must have exactly one ACTIVE OWNER Membership at transaction commit.

PostgreSQL enforces this invariant with deferred constraint triggers that:

- resolve OWNER through `roles.key`;
- lock the affected Organization row;
- count ACTIVE OWNER Memberships at transaction end;
- reject zero or multiple OWNER Memberships;
- cover Organization insertion, Membership mutation and relevant Role changes.

No `ownerId`, `isOwner`, hard-coded Role UUID or parallel ownership source is
introduced.

## Ownership Transfer

The transfer service requires `organizations.transfer_ownership`, an ACTIVE
current OWNER and an ACTIVE target Membership in the same Organization. It
locks the Organization and atomically demotes the previous OWNER to the
explicit non-OWNER Role and promotes the target to OWNER in a SERIALIZABLE
transaction. Serializable conflicts use the bounded retry policy established
by the authorization frontier.

## Migration Safety

The migration performs a preflight and aborts when existing data violates the
invariant. It never invents or backfills an owner. Data remediation, if ever
required, must be explicit and reviewed before deployment.

## Consequences

- Normal Membership operations remain unable to assign or remove OWNER.
- Test fixtures must create and remove Organization ownership atomically.
- Ownership transfers can transiently contain zero or two OWNER rows inside the
  transaction because enforcement is deferred, but must finish with exactly
  one at commit.
- Foundation closure does not imply Production readiness.

## Function Privilege Hardening (2026-08-13)

Forward migration `20260813181000_harden_organization_owner_invariant_functions`
does not change the invariant semantics above. It hardens helper portability:

- fixed `search_path = ''` and schema-qualified `public.*` references;
- `SECURITY DEFINER` only on the three `check_*` trigger helpers that nest-call
  `assert_organization_owner_invariant`, so runtime roles do not need EXECUTE on
  `assert_*`;
- `assert_*` and `lock_*` remain `SECURITY INVOKER`;
- no EXECUTE grants to `anon` or `authenticated`.
