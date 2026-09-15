---
title: Current State
version: 1.2.0
status: Living Document
updated: 2026-09-15
related:
  - ../PROJECT_CONTEXT.md
  - operations/PLATFORM_CORE_RECOVERY.md
  - PLATFORM_MATURITY.md
  - domains/dj-studio/DJ-STUDIO-001-CLOSURE.md
  - domains/dj-studio/DJ-STUDIO-002.md
---

# Current State

Operational snapshot as of 2026-09-15.

## Platform Core Foundation

| Item | Status |
|------|--------|
| Foundation scope | CLOSED / PASS (architecture) **and** production recovered |
| Canonical production database | Coolify **supabase-db** (Supabase Postgres 15.8) |
| Staging Supabase | Envoy + PostgreSQL 17 (canonical staging topology) |
| Foundation Prisma | **8** finished |
| Foundation Supabase | **7** (S1–S7) |
| Domain Prisma | **4** (M1–M4) |
| Domain Supabase | **2** (M5 + M6) |
| Product Supabase total | **9** |
| Runtime roles | `platform_migration`, `app_runtime` (ADR-010) |
| Stack health | Staging and production Supabase stacks healthy (prod read-only for DJ Studio) |

## Databases

| Resource | Role | Notes |
|----------|------|--------|
| `supabase-db` (production) | **Canonical production** | Prisma `public` + Auth; DJ Studio Product **not** deployed |
| Staging Supabase (`2gejbw…`) | **Staging Product DB** | Foundation S1–S7 + Domain M5–M6 applied |
| `platform-core-bd` | **Legacy** | Empty app schema; backup exists; **pending deprecation** — do not delete yet |

## DJ-STUDIO-001

| Item | Status |
|------|--------|
| Milestone | **CLOSED — STAGING MVP READY** |
| Closure record | [`docs/domains/dj-studio/DJ-STUDIO-001-CLOSURE.md`](./domains/dj-studio/DJ-STUDIO-001-CLOSURE.md) |
| Production | **NOT MODIFIED** |
| Main | **NOT MERGED** |

## DJ-STUDIO-002

| Item | Status |
|------|--------|
| Milestone | **SPEC READY** (implementation **not started**) |
| Spec | [`docs/domains/dj-studio/DJ-STUDIO-002.md`](./domains/dj-studio/DJ-STUDIO-002.md) |
| Scope | AI Session Builder — Library-only → ephemeral draft → Save as Playlist |
| Next authorize | **P0** branding only, when explicitly approved |

Architecture (confirmed):

- Platform Core = reusable Foundation
- DJ Studio = Product Domain on Platform Core
- Tenant = `Organization`
- Actor = Core `Profile`; Domain extension = `DjStudioProfile`
- Authorization = Membership → Role → Permission
- Operational DJ data = Organization-scoped

## Architecture decisions (Domain)

- **ADR-011** Accepted — DJ Studio Domain boundary and Organization tenancy.
- **DJ-STUDIO-001** CLOSED on staging —
  [`DJ-STUDIO-001-CLOSURE.md`](./domains/dj-studio/DJ-STUDIO-001-CLOSURE.md).
- **DJ-STUDIO-002** SPEC READY —
  [`DJ-STUDIO-002.md`](./domains/dj-studio/DJ-STUDIO-002.md).

## Next phases (ordered)

1. Authorize DJ-STUDIO-002 **P0** (branding) when ready — do not auto-start.
2. Pre-production gates (001): cross-tenant Product smoke; VIEWER Product smoke.
3. Architecture decision: production Kong/PG15 vs staging Envoy/PG17 before prod rollout.
4. Cleanup / deprecation of `platform-core-bd` (observe → delete later).
5. Do **not** deploy DJ Studio to production without explicit authorization.

## Explicit non-goals right now

- No DJ-STUDIO-002 implementation until phase authorization.
- No production DB/deploy/main merge.
- No speculative Core features (Billing, Storage Core, queues, …).
- No infra debt resolution in docs-only milestone work.
