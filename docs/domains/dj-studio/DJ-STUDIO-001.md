# DJ-STUDIO-001 — Organization-scoped Music Library + Playlist Foundation

**Status:** Approved for implementation design  
**Implementation:** Phase 1 scaffold COMPLETE; Phase 2 **M1–M7** COMPLETE locally
(schema → RLS/RBAC → Domain runtime → minimal Product UI) — **not production**.
**FULL FINAL VALIDATION: READY FOR STAGING** (local disposable evidence;
canonical release pipeline). Production NOT DEPLOYED / NOT MODIFIED.  
**Date:** 2026-09-14  
**Related:** ADR-011, ADR-001, ADR-002, ADR-004, ADR-006, ADR-010

## Context

ADR-011 freezes the DJ Studio Domain boundary: Platform Core remains the
reusable Foundation; DJ Studio is Domain + Product; `Organization` is the
logical tenant for Domain operational data.

Platform Core Foundation is recovered and operational on the canonical
Supabase PostgreSQL database. Domain runtime under `src/domains/dj-studio/`
does not yet exist.

The historical Prisma schema mixes Foundation tables with DJ models. Library,
tags and playlists are currently profile-scoped (`user_id` → Profile). That
model conflicts with Organization tenancy and must not be extended.

This milestone designs and (when separately authorized) implements the
Organization-scoped Music Library and Playlist Foundation so Product work can
start without reopening architectural decisions.

This document is a functional/technical specification. It is not an exact
Prisma schema and does not authorize migrations by itself.

## Invariants

1. `Organization` is the tenant for DJ Studio operational data.
2. `Profile` is application identity and actor — not the tenant.
3. Platform Core must not import DJ Studio Domain.
4. Shared music catalog (Artist, Track, Genre, Label, Release, …) is
   installation-global.
5. Library, Tags and Playlists are Organization-scoped.
6. Domain permissions are registered outside the Core seed.
7. Schema evolution is forward-only.
8. Applied historical migrations are immutable (no rewrite).
9. `isAdmin` is not an authorization authority (ADR-006); deprecate and remove
   from UI/runtime in this milestone; DROP column only later.
10. `ExperienceLevel` belongs conceptually to DJ Studio Domain. Physical enum
    relocation is deferred to the authorized Domain Profile schema migration.

## Target models

Conceptual models only. Exact Prisma field types and table names are fixed at
schema-implementation time.

### DjStudioProfile

Optional 1:1 Domain extension of Core `Profile`.

- `profileId` (PK/FK → Profile)
- `stageName` (replaces Core SoT for legacy `djName`)
- `experienceLevel` (Domain-owned conceptually; uses existing enum until
  schema work relocates ownership)
- `createdAt` / `updatedAt`

No speculative preference fields in this milestone.

### LibraryItem

Organization ↔ Track membership with tenant-specific metadata.

- `organizationId` (required)
- `trackId` (required)
- `addedByProfileId` (optional actor)
- Tenant-specific metadata conserved from legacy `UserTrack` as needed:
  status, rating, energy, familiarity, notes, customBpm, customKey,
  isFavorite, playCount, dateAdded, lastPlayedAt, timestamps
- Unique `(organizationId, trackId)`

### Tag

- `organizationId` (required)
- `name`
- `normalizedName`
- `color?`
- Unique `(organizationId, normalizedName)`

### LibraryItemTag

- `libraryItemId`
- `tagId`
- Composite identity; both ends must belong to the same Organization

### Playlist

- `organizationId` (required) — not profile-scoped ownership
- Useful legacy metadata: name, slug?, description?, playlistType,
  artworkUrl?, sourceUrl?, metadata?, timestamps
- MVP visibility: private only (see Open decisions)

### PlaylistItem

- `playlistId`
- `libraryItemId` (not direct `trackId`)
- `position` (unique per playlist)
- `addedByProfileId?`
- `notes?`
- `transitionNotes?` (MVP: property of the item; does not block later
  N→N+1 or Session models)
- `sourceTimestampMs?`

Rule: a playlist item implies the track is (or becomes) in the Organization
library via `LibraryItem`.

## Relationship diagram

```
Platform Core
Profile
├── OrganizationMembership
│     └── Organization
└── DjStudioProfile

DJ Studio
Organization
├── LibraryItem
│     └── Track          (shared catalog)
│           ├── Artist
│           ├── Genre
│           └── Release / Label
├── Tag
│     └── LibraryItemTag
├── Playlist
│     └── PlaylistItem
│           └── LibraryItem
└── future Domain data (Sessions, Devices, … — out of scope)
```

## Personal Organization flow

```
Profile
  ↓
ensure personal Organization if profile has no ACTIVE membership
  ↓
OWNER Membership
  ↓
active Organization resolution
  ↓
optional DjStudioProfile onboarding
```

Rules:

- Ensure is **idempotent**.
- Do not create a second personal Organization when any ACTIVE membership
  already exists.
- Multi-Organization membership remains allowed after bootstrap.
- Existing users (e.g. profiles without organizations) use the same ensure on
  first private access.
- New users: after Profile creation, ensure runs before Domain library use.

## Active Organization

MVP target (not implemented by this document alone):

- httpOnly cookie `active_organization_id`
- Server validates ACTIVE membership in an ACTIVE Organization
- Fallback: first valid Organization (stable ordering, e.g. `createdAt`)
- Exactly one valid Organization → automatic selection
- More than one → Organization selector UI

## RBAC

### P0 (in scope)

- `library.read`
- `library.manage`
- `playlists.read`
- `playlists.manage`

### P1 (documented; not required to close MVP UI)

- `sessions.read`
- `sessions.manage`
- `sources.manage`

Core seed must not define these keys. DJ Studio Domain registers them through
its own module / seed extension using Foundation `Permission` /
`RolePermission` tables.

Proposed default role mapping (open decision): MEMBER receives
`library.manage` and `playlists.manage` for Studio MVP.

## RLS target

Conceptual only — no SQL in this milestone document.

| Layer | Responsibility |
|-------|----------------|
| Tenant tables (library, tags, playlists, joins) | Membership-based RLS using `private.has_active_organization_membership(organization_id)` |
| Shared catalog | Authenticated / global read; server-side write only |
| App-layer RBAC | Domain permission checks |
| RLS | Tenant isolation floor |
| RBAC | Business authorization |

Legacy profile-owned (`*_own`) policies on migrated tables are replaced, not
extended, when schema work is authorized.

## Migration principles

- Forward-only
- Do not rewrite applied history
- Do not use DROP+recreate as a shortcut even if tables are empty
- Prefer additive schema → backfill → cutover → deprecate → later DROP

Conceptual sequence:

1. Create `DjStudioProfile`
2. Backfill from Profile `djName` / `experienceLevel`
3. Organization tenancy readiness (ensure personal orgs for existing profiles)
4. `LibraryItem` migration from `UserTrack`
5. Tags / `LibraryItemTag` migration
6. Playlist / `PlaylistItem` migration (resolve or create `LibraryItem`)
7. Domain RLS
8. Domain permissions seed
9. Runtime cutover
10. Cleanup / DROP legacy later (separate authorization)

`ExperienceLevel` enum physical placement is resolved during Domain Profile
schema implementation, not in this documentation phase.

### Local implementation progress (not production)

| Step | Status |
|------|--------|
| Phase 1 scaffold | COMPLETE |
| M1 legacy namespace + `dj_studio_profiles` | COMPLETE locally |
| M2 `library_items` + org `tags` + `library_item_tags` | COMPLETE locally |
| M3 org `playlists` + `playlist_items` → LibraryItem | COMPLETE locally |
| M4 org bootstrap + legacy backfill + composite tenant FKs | COMPLETE locally |
| M5 Domain RLS + Domain permissions registration | COMPLETE locally |
| M6 Domain services + active org + ensure personal Organization | COMPLETE locally |
| M7 minimal Product API/UI | COMPLETE locally |
| Production deploy | NOT DEPLOYED |

**M4 mapping policy:** Profile with legacy Domain data → oldest ACTIVE
Organization membership (`created_at ASC`, tie-break `organization_id`); else
create personal Organization (`slug = personal-<uuid without dashes>`) + ACTIVE
OWNER membership. OWNER role required when bootstrap is needed.

**M5 authorization model:**
- RLS = tenant / own-row isolation floor
- RBAC = server-side `RolePermission` (`library.*` / `playlists.*`)
- Browser: Domain tenant SELECT only; manage writes via trusted server

**M6 runtime:**
- `resolveActiveOrganization`: 0 → ensure personal; 1 → auto; >1 → cookie if valid else deterministic fallback
- Cookie `active_organization_id` is preference only (never authorization)
- Domain services enforce permissions; DjStudioProfile is runtime SoT (not Profile.djName)

**M7 Product routes:**
- `/library`, `/playlists`, `/playlists/[id]`, `/studio-profile`
- Server actions compose M6 services; org switcher when >1 ACTIVE membership
- Core `/profile` no longer edits `djName`; Studio Profile owns stage identity


## Scope

### In scope

- Domain scaffold (`src/domains/dj-studio/` when implementation is authorized)
- `DjStudioProfile`
- Organization-scoped `LibraryItem`
- Organization-scoped Tags + `LibraryItemTag`
- Organization-scoped Playlists + `PlaylistItem` → `LibraryItem`
- Personal Organization ensure (hybrid / idempotent)
- Active Organization resolution (cookie + server validation)
- P0 Domain RBAC + Domain seed extension
- Domain RLS
- Domain services and tests
- Minimal API/UI

### Out of scope

- Sessions implementation
- Devices
- Desktop Companion
- Engine DJ / Rekordbox / hotcues
- Advanced ingestion
- AI enrichment UI
- Final DROP of legacy Profile DJ columns / `is_admin`

## Acceptance criteria

Testable criteria for milestone completion:

1. Core does not import DJ Studio Domain.
2. Personal Organization ensure is idempotent (no duplicate ACTIVE personal
   bootstrap when membership already exists).
3. `LibraryItem` is unique per `(organizationId, trackId)`.
4. No cross-Organization library access under RLS + services.
5. Tags are isolated per Organization.
6. Playlists are isolated per Organization.
7. `PlaylistItem` references `LibraryItem` (not Track directly).
8. Profile DJ fields (`djName` / `experienceLevel`) are no longer the source of
   truth after cutover; `DjStudioProfile` is.
9. `isAdmin` is not used for authorization; UI/runtime no longer treats it as
   a privilege signal.
10. Domain permissions are external to Core seed definitions.
11. Catalog browser-role writes are blocked; catalog writes are server-side.
12. Migrations are dry-run / staging safe without rewriting history.

## Open decisions

Only these remain open for implementation kickoff:

1. **MEMBER default permissions** — Proposed: `library.manage` +
   `playlists.manage`.
2. **Playlist visibility** — MVP: private only.
3. **Migration mechanics** — Preferred: new tables + backfill vs in-place
   rename (decide at schema kickoff).
4. **Exact `ExperienceLevel` enum placement** during schema implementation
   (conceptual Domain ownership already decided; physical move deferred).

Not reopenable without a new ADR / milestone amendment:

- Tenant = Organization
- `LibraryItem` naming
- `PlaylistItem` → `LibraryItem`
- Personal Organization hybrid ensure strategy
- Active Organization cookie + server validation approach
- Domain permissions outside Core seed

## Implementation phases

| Phase | Work |
|-------|------|
| 1 | Domain scaffold |
| 2 | Additive schema |
| 3 | Migration / backfill |
| 4 | RLS / Domain RBAC |
| 5 | Services |
| 6 | Tests |
| 7 | Minimal API / UI |
| 8 | Staging validation |

Each phase requires explicit implementation authorization. This document
approves the **design**; it does not by itself authorize production schema
changes.

## References

- `docs/adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md`
- `docs/domains/dj-studio/README.md`
- `docs/CURRENT_STATE.md`
- `PROJECT_CONTEXT.md`
- Legacy reference (pending review): `docs/domains/dj/`
