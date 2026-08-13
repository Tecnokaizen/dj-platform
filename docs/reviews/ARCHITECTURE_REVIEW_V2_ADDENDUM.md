# Architecture Review V2 — Addendum

**Status:** Remediation record (does not rewrite V2)
**Date:** 2026-08-13
**Related:** `ARCHITECTURE_REVIEW_V2.md`, Draft PR #1
**Scope:** Post-closeout independent audit remediation

## Purpose

Architecture Review V2 remains the historical Foundation closure snapshot.

This addendum records defects found by a later independent read-only audit and
the remediations applied on `feature/roles-foundation` before merge.

## Findings addressed

1. **Roles catalog client grants** — `public.roles` lacked a Supabase forward
   migration aligning R-020 write denial with the approved R-021 read surface
   (`authenticated` SELECT; `anon` denied; visibility ≠ possession).
2. **Authorized Organization recovery** — public `reactivateOrganization` /
   `restoreOrganization` were unreachable because authorization context
   required `ACTIVE` while mutations required `SUSPENDED` / `ARCHIVED`.
3. **OWNER invariant function portability** — invariant helpers used INVOKER
   semantics without a fixed `search_path`, which fails when the runtime DB
   role differs from the migration/function owner.
4. **Misleading ownership permission test** — a tautological constant assertion
   was replaced with behavioral ADMIN denial coverage.

## Remediation model

- Forward migrations only; historical applied migrations were not rewritten.
- `allowedOrganizationStatuses` is server-controlled, fail-closed, default
  `ACTIVE`, and never accepted from browser input.
- OWNER invariant: only the three `check_*` trigger helpers are
  `SECURITY DEFINER`; `assert_*` and `lock_*` remain INVOKER with
  `SET search_path = ''` and `public.*` references.

## Validation evidence (post-remediation technical gate)

- Node 22.23.2
- Prisma format / validate / generate PASS
- Guarded test DB migrate status: up to date (8 Prisma migrations)
- typecheck PASS
- lint PASS
- Vitest: 36 files / 209 tests / 0 failed
- `NODE_ENV=production` Next.js build PASS

## Explicitly pending

- Claude focused re-audit result (not claimed here)
- Production readiness / Deployment Readiness
- Domain DJ implementation
- Marking Draft PR #1 Ready for Review or merge

## Decision continuity

Foundation remains **CLOSED / PASS within approved scope** after these
corrective remediations, still **NOT PRODUCTION READY**.
