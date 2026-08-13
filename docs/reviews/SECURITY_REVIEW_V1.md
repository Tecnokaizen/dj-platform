# Security Review V1

**Status:** Approved for Foundation closure
**Date:** 2026-08-13
**Repository:** `dj-platform`
**Review Type:** Platform Core Foundation Security

## Scope

Identity, public notices, tenant isolation, authorization, ownership,
Membership and Invitation lifecycles, Prisma persistence, Supabase RLS and the
minimal Organization application composition.

## Findings

### Authentication and public output — PASS

- Supabase Auth remains the source of authentication truth.
- Redirect targets are restricted to safe internal paths.
- `error`, `message` and `success` URL parameters are interpreted only through
  allowlisted codes; unknown values are ignored.
- Public notices do not reflect provider, database or user-controlled text.

### Profile boundary — PASS

- Auth email normalization is derived and server-only.
- Profile client updates are column-restricted; `is_admin`, identifiers,
  timestamps and the email projection are protected.
- DTOs and public forms do not expose the normalized email projection.

### Tenant isolation — PASS within Foundation scope

- Organization is the tenant boundary.
- RLS tenant reads depend on an ACTIVE Membership and ACTIVE Organization.
- Invitations and permission catalogs remain server-only.
- `anon` and `authenticated` do not receive administrative table writes.

### Authorization and TOCTOU — PASS

- Administrative operations resolve identity before transaction, then
  revalidate target Organization, context, Membership, Role and Permission in
  the same SERIALIZABLE transaction as the write.
- No wildcard, inherited Role or implicit OWNER authorization exists.

### Ownership — PASS

- PostgreSQL preflight aborts on ownership drift.
- Deferred constraint triggers reject ownerless or multi-owner commits for all
  persisted Organization lifecycle states.
- Functions are not executable by PUBLIC.
- Organization-row locking serializes Membership writes per tenant.
- Ownership transfer uses an explicit non-OWNER Role, conditional updates and
  bounded serialization retries.

### Invitation security — PASS

- Raw invitation tokens are transient.
- Only lowercase SHA-256 hashes are persisted.
- Repository/DTO projections exclude `tokenHash`.
- Pending uniqueness and conditional lifecycle mutations prevent silent token
  replacement or double acceptance.

### Application integration — PASS

- `/organizations` lists only ACTIVE Organizations with persisted
  `organizations.read` evidence.
- UI visibility is not the enforcement boundary; the update service checks
  `organizations.update` server-side in-transaction.
- The Server Action validates identifiers and fields, delegates to Core, and
  emits only allowlisted public codes.

## Residual risks and non-production gaps

- Production deployment, migration rollback/forward-fix drills and environment
  configuration have not been verified.
- Backup and restore procedures have not been demonstrated.
- Monitoring, alerting, incident runbooks and rate-abuse controls remain
  operational gaps.
- Product E2E and browser authorization tests remain pending.
- `npm audit` findings, if any, require dependency-owner triage; automated
  audit output alone is not a production security approval.

## Decision

No known security defect blocks closure of the approved Platform Core
Foundation. The result is **Foundation security PASS**, explicitly **NOT
PRODUCTION READY**. The closure gate executed 33 Vitest files with 198 passing
tests.
