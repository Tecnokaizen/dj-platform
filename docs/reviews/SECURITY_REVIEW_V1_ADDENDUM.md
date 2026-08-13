# Security Review V1 — Addendum

**Status:** Remediation record (does not rewrite V1)
**Date:** 2026-08-13
**Related:** `SECURITY_REVIEW_V1.md`, Draft PR #1
**Scope:** Post-closeout independent audit remediation

## Purpose

Security Review V1 remains the historical Foundation security closure snapshot.

This addendum records security-relevant gaps found after that closure and the
corrective controls implemented before merge of Draft PR #1.

## Material corrections

### Roles catalog (R-020 / R-021)

V1 stated that invitation and **permission** catalogs remain server-only. It did
not assert the same for `public.roles`.

Approved Roles architecture distinguishes Role visibility from Role possession.
Remediation migration
`supabase/migrations/20260813180000_roles_catalog_client_grants.sql`:

- enables RLS on `public.roles`
- revokes all client privileges, then grants **SELECT only** to `authenticated`
- policy `roles_select_authenticated` `USING (true)`
- denies INSERT/UPDATE/DELETE for `anon` and `authenticated`
- denies SELECT for `anon`

Behavioral privilege probes confirm pre-hardening grants are removed and write
attempts fail with insufficient privilege (`42501`).

### Organization recovery authorization

Authorized `reactivate` / `restore` paths now pass an explicit server-side
`allowedOrganizationStatuses` list. Default tenancy authorization remains
ACTIVE-only and fail-closed.

### OWNER invariant helpers

Forward Prisma migration
`20260813181000_harden_organization_owner_invariant_functions`:

- fixed empty `search_path`
- schema-qualified `public.*` references
- `SECURITY DEFINER` only on the three `check_*` trigger functions that must
  nest-call `assert_*` without granting EXECUTE to runtime roles
- no EXECUTE grants to `anon` / `authenticated`

Portability evidence: a distinct runtime role without EXECUTE on `assert_*`
can perform legitimate Membership DML while zero/multi ACTIVE OWNER commits
still raise `23514`, and direct `assert_*` execution remains denied.

### Ownership permission test honesty

The previous tautological Permission-key equality check was replaced with an
ADMIN actor behavioral denial for `organizations.transfer_ownership`.

## Validation evidence (post-remediation)

- Vitest suite after remediation: **36 files / 209 tests / 0 failed**
- Prisma / typecheck / lint / production Next.js build: PASS on Node 22.23.2

## Pending

- Claude focused re-audit (not claimed passed)
- Production deployment and operational security evidence

## Decision continuity

Foundation security closure remains valid for the approved Core scope after
these remediations, still **NOT PRODUCTION READY**.
