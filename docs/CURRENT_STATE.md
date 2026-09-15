---
title: Current State
version: 1.0.0
status: Living Document
updated: 2026-09-13
related:
  - ../PROJECT_CONTEXT.md
  - operations/PLATFORM_CORE_RECOVERY.md
  - PLATFORM_MATURITY.md
---

# Current State

Operational snapshot of Platform Core as of 2026-09-13.

## Platform Core Foundation

| Item | Status |
|------|--------|
| Foundation scope | CLOSED / PASS (architecture) **and** production recovered |
| Canonical database | Coolify **supabase-db** (Supabase Postgres 15.8) |
| Prisma migrations | **8 finished / 0 rolled_back** |
| Supabase repo migrations | **6** (`supabase_migrations.schema_migrations`) |
| Seed catalogs | roles=5, permissions=12, role_permissions=27 |
| Auth | Supabase Auth operational; profiles=2 aligned with auth.users=2 |
| Runtime roles | `platform_migration`, `app_runtime` provisioned (ADR-010) |
| Validator | `validate-database` PASS on production |
| Stack health | Supabase service stack healthy |

## Databases

| Resource | Role | Notes |
|----------|------|--------|
| `supabase-db` | **Canonical** | Prisma `public` + Auth + Storage schemas |
| `platform-core-bd` | **Legacy** | Empty app schema; backup exists; **pending deprecation** — do not delete yet |

## Architecture decisions (Domain)

- **ADR-011** Accepted — DJ Studio Domain boundary, Organization tenancy for
  Domain operational data, Profile DJ-field extraction intent, RBAC extension
  boundary. No schema/code moves authorized by the ADR alone.
- **DJ-STUDIO-001** design Approved —
  `docs/domains/dj-studio/DJ-STUDIO-001.md` (Organization-scoped Music Library +
  Playlist Foundation).
- **DJ-STUDIO-001 Phase 1** — Domain scaffold implemented at
  `src/domains/dj-studio/` (ownership, contracts, P0 permission keys).
- **DJ-STUDIO-001 Phase 2 / M1–M5** — COMPLETE locally (schema, bootstrap,
  backfill, composite FKs, Domain RLS + permissions). **Not production.**
- **DJ-STUDIO-001 Phase 2 / M6** — COMPLETE locally — Domain runtime services
  (active Organization resolution, ensure personal Organization, Library / Tags /
  Playlists / DjStudioProfile) with Domain RBAC. **Not production.**
- **DJ-STUDIO-001 Phase 2 / M7** — COMPLETE locally — minimal Product routes
  `/library`, `/playlists`, `/playlists/[id]`, `/studio-profile` consuming M6
  services. **Not production.**
- **DJ-STUDIO-001 release pipeline fix** — COMPLETE locally. Phased release:
  Foundation Prisma → Supabase S1–S7 → Foundation seed → Domain Prisma M1–M4 →
  Supabase M5–M6 → Product seed → key-based validator. Clean install + production-like
  upgrade + rich upgrade PASS on disposable DBs. **Not production.**
- **DJ-STUDIO-001 FULL FINAL VALIDATION** — **READY FOR STAGING** (local
  disposable DBs only; canonical `migrate-release`). Production NOT MODIFIED.

## Next phases (ordered)

1. Prepare commit/review of the DJ-STUDIO-001 set (no staging deploy until
   authorized after review).
2. **Cleanup / deprecation** of `platform-core-bd` (observe until 2026-09-27 → delete later).
3. Do **not** deploy DJ-STUDIO-001 to production without explicit deploy authorization.

## Explicit non-goals right now

- No speculative Core features (Billing, Storage Core, queues, …).
- No silent Core↔Domain boundary redesign during cleanup.
- No production schema changes without an authorized window.
