---
title: DJ-STUDIO-001 Formal Closure
status: CLOSED — STAGING MVP READY
updated: 2026-09-15
related:
  - DJ-STUDIO-001.md
  - ../../adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md
  - ../../CURRENT_STATE.md
  - ../../operations/DEPLOYMENT.md
---

# DJ-STUDIO-001 — Formal Closure

**Status:** STAGING MVP READY — MILESTONE CLOSED  
**Date:** 2026-09-15  
**Branch:** `feature/deployment-readiness`  
**Production:** NOT MODIFIED  
**Main:** NOT MERGED

## Objective

Deliver Organization-scoped Music Library + Playlist Foundation for DJ Studio
Product on Platform Core, validated through clean install, CI, and staging
OWNER Product E2E smoke.

## Architecture boundary

| Layer | Role |
|-------|------|
| Platform Core | Reusable Foundation — Identity, Organizations, Memberships, Roles, Permissions, tenancy |
| DJ Studio | Product Domain on Platform Core — Library, Tags, Playlists, DjStudioProfile |
| Product | App composition (`src/app`) exposing Domain services |
| Tenant | `Organization` |
| Actor identity | Core `Profile` |
| Domain extension | `DjStudioProfile` |
| Authorization | Membership → Role → Permission (RBAC) + RLS isolation floor |
| Operational DJ data | Organization-scoped |
| Shared catalog | Installation-global; Product MVP read-only via `app_runtime` |

## Scope delivered

- Platform Core Foundation release path (Prisma + Supabase S1–S7)
- Auth + Profiles (including PostgREST authenticated grants)
- Organizations + Memberships + personal Organization bootstrap
- Active Organization resolution (RSC-safe; cookie write only via Server Action)
- Domain RBAC (`library.read` / `library.manage` / `playlists.read` / `playlists.manage`)
- DjStudioProfile Product surface
- Library + Tags + catalog search
- Playlists + repeated PlaylistItem + reorder + notes + transitionNotes
- Domain RLS + `app_runtime` Domain DML (M5) + catalog SELECT (M6)
- Canonical phased release pipeline, clean install, idempotent release, CI
- Staging deployment (web + DB release) with TLS, health, readiness

## Migrations / release contract

| Ledger | Count | Versions / notes |
|--------|-------|------------------|
| Foundation Prisma | 8 | finished / 0 rolled_back |
| Foundation Supabase | 7 | S1–S7 (includes S7 profiles authenticated grants) |
| DJ Studio Prisma | 4 | M1–M4 |
| DJ Studio Supabase | 2 | M5 `20260913240000` RLS + Domain runtime grants; M6 `20260915150000` catalog SELECT |
| Product Supabase total | 9 | Foundation 7 + Domain 2 |

Clean install: **PASS**  
Idempotent second release: **PASS**  
Product / app_runtime validators: **PASS**

## Security model

- RLS = tenant / own-row isolation floor
- RBAC = server-side business authorization
- Browser authenticated: Profile SELECT/UPDATE own row (S7); Domain tables not writable via PostgREST for Product MVP manage paths
- `app_runtime`: Domain DML (M5) + catalog SELECT only on `tracks`, `track_artists`, `artists` (M6); no catalog INSERT/UPDATE/DELETE
- Active Organization cookie = preference only; membership revalidated on switch

## Staging result

**STAGING MVP READY**

| Item | Evidence |
|------|----------|
| Latest repository commit | `49cdb0c068626d5d56194dea9e670f592a2ca53a` — `fix(dj-studio): grant runtime read access to catalog` |
| CI | GREEN on `feature/deployment-readiness` |
| Staging web artifact | Deployed from `30d93abf808fcb1b46112f2bf67482f0f966c957` (cookie RSC fix) |
| Staging DB release | Through Foundation S1–S7 + Domain M5 + M6 |

### Web vs repo SHA

The staging web image remains on `30d93ab`. Repository HEAD `49cdb0c` is
DB/migration/contract/tests/docs only; Product web runtime did not require a
functional code change for the catalog grants fix. SHA divergence is accepted
for this closure. No redeploy solely to align SHA.

## Smoke evidence (OWNER Product E2E)

| Flow | Result |
|------|--------|
| Dashboard | PASS |
| Login | PASS |
| Logout / login | PASS |
| Studio Profile | PASS |
| Library catalog search | PASS |
| Add track | PASS |
| Duplicate LibraryItem idempotency | PASS |
| Library metadata | PASS |
| Tags | PASS |
| Playlist create | PASS |
| Repeated LibraryItem | PASS |
| Reorder | PASS |
| Notes | PASS |
| transitionNotes | PASS |
| Browser direct DML denial | PASS |
| Personal Organizations | 1 |
| Memberships | 1 ACTIVE |
| Duplicate personal Organizations | 0 |

## Fixes discovered in staging (positive evidence)

### A. Profiles PostgREST grants

- **Issue:** `authenticated` lacked table privileges on `profiles` (RLS alone insufficient).
- **Resolution:** Foundation S7 — `authenticated` SELECT + UPDATE own profile via RLS; no INSERT/DELETE.

### B. Organization cookie mutation from RSC

- **Issue:** `resolveActiveOrganization` called `cookies().set()` during RSC render.
- **Resolution:** Resolver READ ONLY; cookie WRITE only through explicit Server Action.

### C. Catalog `app_runtime` grants

- **Issue:** Product Prisma could not read `tracks` (and related catalog joins).
- **Resolution:** Domain M6 — `app_runtime` SELECT only on `tracks`, `track_artists`, `artists`; no catalog writes.

## Pre-production gates

Required **before** production rollout. **Not** blockers for STAGING MVP closure:

1. **Cross-tenant Product smoke** — fixtures Organization A / B; verify isolation on Product + server paths.
2. **VIEWER Product smoke** — VIEWER membership; `library.read` / `playlists.read` allowed; `library.manage` / `playlists.manage` denied; UI + server authorization.

## Infrastructure debt (unchanged)

| Priority | Item |
|----------|------|
| P1 | Coolify web Docker network attachment not fully durable |
| P1 | Mailpit SMTP/TLS/auth staging configuration |
| P2 | Readiness hairpin via public Supabase URL |
| P2 | Coolify healthcheck / runner image without curl-wget |

**Architecture decision required before production:** production Supabase is
Kong + PostgreSQL 15; canonical staging is Envoy + PostgreSQL 17.

These items are not resolved in DJ-STUDIO-001 closure.

## Production status

**PRODUCTION NOT MODIFIED**  
**Main branch NOT MERGED**

## Next milestone

**DJ-STUDIO-002** — AI Playlist / Session Builder  

Preliminary direction: generate playlist/session proposals from prompt and DJ
context using catalog/library and available musical metadata (e.g. “Sunset Afro
House, 90 minutes, 118→123 BPM…”). Design of DJ-STUDIO-002 is out of scope for
this closure.
