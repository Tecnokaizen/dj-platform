---
title: DJ Studio Domain Documentation
status: Living Document
updated: 2026-09-16
related:
  - ../../adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md
  - DJ-STUDIO-001.md
  - DJ-STUDIO-001-CLOSURE.md
  - DJ-STUDIO-002.md
  - DJ-STUDIO-002-CLOSURE.md
  - DJ-STUDIO-003.md
  - ../dj/
---

# DJ Studio Domain

Canonical Domain documentation for **DJ Studio** (Product: DJ Kaizen Studio)
built on Platform Core.

## Authority

| Document | Role |
|----------|------|
| [ADR-011](../../adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md) | Domain boundary, Organization tenancy, Profile extraction intent, RBAC extension |
| [DJ-STUDIO-001](./DJ-STUDIO-001.md) | Milestone design — Organization-scoped Music Library + Playlist Foundation |
| [DJ-STUDIO-001-CLOSURE](./DJ-STUDIO-001-CLOSURE.md) | Formal staging closure — STAGING MVP READY |
| [DJ-STUDIO-002](./DJ-STUDIO-002.md) | AI Session Builder MVP specification |
| [DJ-STUDIO-002-CLOSURE](./DJ-STUDIO-002-CLOSURE.md) | Formal staging closure — STAGING MVP READY |
| [DJ-STUDIO-003](./DJ-STUDIO-003.md) | Real AI provider — **SPEC READY** |

## Status

- Architecture boundary: **Accepted** (ADR-011)
- **DJ-STUDIO-001:** **CLOSED — STAGING MVP READY**
- **DJ-STUDIO-002:** **CLOSED — STAGING MVP READY**
- **DJ-STUDIO-003:** **SPEC READY** (implementation not started)
- Production schema / Product: **NOT DEPLOYED to production**
- Main: **NOT MERGED**

## Product routes

| Route | Role |
|-------|------|
| `/library` | Music Library + add catalog track + tags |
| `/playlists` | Playlist list + create |
| `/playlists/[id]` | Detail, items, reorder up/down |
| `/studio-profile` | DjStudioProfile SoT (`stageName`, `experienceLevel`) |
| `/session-builder` | AI Session Builder — generate / review / save |

Server write path:

auth → `resolveActiveOrganization` → Domain service → Prisma/`app_runtime`

Active Organization cookie = preference only (validated membership).

## Authorization + runtime

| Layer | Role |
|-------|------|
| RLS | Isolation floor |
| RBAC | Business authorization (`RolePermission`) |
| Active Organization | Server resolution + optional cookie preference (write via Server Action only) |
| Catalog reads | `app_runtime` SELECT on `tracks` / `track_artists` / `artists` (Domain M6) |
| Writes | Trusted server → Domain services → Prisma |
| Session Builder provider (002) | MockPlaylistGenerationProvider (default) |
| Real AI provider (003) | SPEC READY — OpenAI adapter deferred until P1 authorization |

## Legacy Domain docs

`docs/domains/dj/` is **legacy / reference pending review**.

## Next

1. Authorize DJ-STUDIO-003 **P1** (OpenAI adapter implementation) explicitly when ready.
2. Keep 001 pre-production gates (cross-tenant + VIEWER + topology) before production.
3. Do **not** deploy production / merge main without authorization.
