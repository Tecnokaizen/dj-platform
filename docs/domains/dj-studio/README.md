---
title: DJ Studio Domain Documentation
status: Living Document
updated: 2026-09-15
related:
  - ../../adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md
  - DJ-STUDIO-001.md
  - DJ-STUDIO-001-CLOSURE.md
  - DJ-STUDIO-002.md
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
| [DJ-STUDIO-002](./DJ-STUDIO-002.md) | AI Session Builder — **SPEC READY** (not started) |

## Status

- Architecture boundary: **Accepted** (ADR-011)
- **DJ-STUDIO-001:** **CLOSED — STAGING MVP READY**
- **DJ-STUDIO-002:** **SPEC READY** (implementation not started)
- Production schema / Product: **NOT DEPLOYED to production**
- Main: **NOT MERGED**

## Product routes (001)

| Route | Role |
|-------|------|
| `/library` | Music Library + add catalog track + tags |
| `/playlists` | Playlist list + create |
| `/playlists/[id]` | Detail, items, reorder up/down |
| `/studio-profile` | DjStudioProfile SoT (`stageName`, `experienceLevel`) |

Planned (002, not implemented): `/session-builder` — Crear sesión

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

## Legacy Domain docs

`docs/domains/dj/` is **legacy / reference pending review**.

## Next

1. Authorize DJ-STUDIO-002 **P0** (branding) explicitly when ready.
2. Keep 001 pre-production gates (cross-tenant + VIEWER) before production.
3. Do **not** deploy production / merge main without authorization.
