---
title: DJ Studio Domain Documentation
status: Living Document
updated: 2026-09-14
related:
  - ../../adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md
  - DJ-STUDIO-001.md
  - ../dj/
---

# DJ Studio Domain

Canonical Domain documentation for **DJ Studio** (Product: DJ Kaizen Studio)
built on Platform Core.

## Authority

| Document | Role |
|----------|------|
| [ADR-011](../../adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md) | Domain boundary, Organization tenancy, Profile extraction intent, RBAC extension |
| [DJ-STUDIO-001](./DJ-STUDIO-001.md) | Approved milestone design — Organization-scoped Music Library + Playlist Foundation |

## Status

- Architecture boundary: **Accepted** (ADR-011)
- Milestone 001 design: **Approved for implementation design**
- Phase 1 Domain scaffold: **COMPLETE**
- Phase 2 / M1–M6 (schema → RLS/RBAC → Domain runtime): **COMPLETE locally**
- Phase 2 / M7 (minimal Product API/UI): **COMPLETE locally**
- Release pipeline fix (phased Foundation → Domain): **COMPLETE locally**
- Production schema: **NOT DEPLOYED**

## Product routes (M7)

| Route | Role |
|-------|------|
| `/library` | Music Library + add catalog track + tags |
| `/playlists` | Playlist list + create |
| `/playlists/[id]` | Detail, items, reorder up/down |
| `/studio-profile` | DjStudioProfile SoT (`stageName`, `experienceLevel`) |

Server write path:

auth → `resolveActiveOrganization` → Domain service → Prisma/`app_runtime`

Active Organization cookie = preference only (validated membership).

## Authorization + runtime (M5/M6/M7)

| Layer | Role |
|-------|------|
| RLS | Isolation floor |
| RBAC | Business authorization (`RolePermission`) |
| Active Organization | Server resolution + optional cookie preference |
| Writes | Trusted server → Domain services → Prisma |

## Legacy Domain docs

`docs/domains/dj/` is **legacy / reference pending review**.

## Next

Prepare **staging / dry-run validation** before any production deployment.
Do **not** deploy without authorization.
