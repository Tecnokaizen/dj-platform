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

## Next phases (ordered)

1. **Cleanup / deprecation** of `platform-core-bd` (observe → stop → delete later).
2. **DJ Studio Domain** — extract DJ-specific schema/semantics from Core contamination; Product composition.
3. Do **not** treat deployment of DJ Studio Product UI as the immediate next infra step.

## Explicit non-goals right now

- No speculative Core features (Billing, Storage Core, queues, …).
- No silent Core↔Domain boundary redesign during cleanup.
- No production schema changes without an authorized window.
