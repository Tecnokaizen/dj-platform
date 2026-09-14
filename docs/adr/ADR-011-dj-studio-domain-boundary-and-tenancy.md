# ADR-011 — DJ Studio Domain Boundary and Organization Tenancy

**Status:** Accepted  
**Date:** 2026-09-13  
**Decision Type:** Domain / Product Architecture

**Related:** ADR-001, ADR-002, ADR-004, ADR-006, ADR-010

## Context

The repository technical identifier is `dj-platform`. Early Product naming used
“DJ Platform”. Platform Core Foundation is implemented, reviewed and recovered
in production on the canonical Supabase PostgreSQL database.

The initial Prisma schema mixed Foundation tables with DJ music-catalog and
library models. DJ Domain runtime code does not yet exist under `src/domains/`.
Several DJ operational models are currently profile-scoped (`userId` → Profile)
rather than Organization-scoped.

Without an explicit Domain boundary, Product work risks re-contaminating
Platform Core (DJ fields on Profile, Domain permissions in Core seed, Core
imports of DJ semantics, or treating Profile / “DJ Studio” as the tenant).

This ADR freezes the architectural decisions required before Domain
implementation. It does not authorize schema changes, migrations or code moves.

## Decision

### Architecture

DJ Kaizen Studio is the Product. DJ Studio is the Business Domain that Product
composes with Platform Core.

Conceptual hierarchy:

```
Platform Core
    ↓
Product composition (DJ Kaizen Studio)
    ↓
DJ Studio Domain
    ↓
Organization (tenant)
    ↓
Domain data
```

Source ownership (target; directories not created by this ADR):

| Path | Ownership |
|------|-----------|
| `src/core/**` | Platform Core Foundation |
| `src/domains/dj-studio/**` | DJ Studio Domain logic (future) |
| `src/app/**` | Product composition — not Core ownership |
| `src/lib/**` | Technical adapters / infrastructure |
| `src/shared/**` | Business-agnostic technical reuse only |

Dependency direction:

- Core must not import DJ Studio Domain.
- Domain may import authorized Core contracts and services.
- App may compose Core and Domain.
- Potential reuse alone does not move Domain semantics into Core (ADR-001).

DJ Studio is not a tenant. Profile is not a tenant.

### Tenancy

`Organization` is the logical tenant of DJ Studio Domain data (ADR-004).

Operational user work must not be modeled primarily as Profile-owned data.

Target tenant shape:

```
Organization
├── Members (Memberships + Roles)
├── Music Library
├── Playlists
├── Sessions
├── Sources
├── Devices
└── Domain Settings
```

- An individual DJ uses a personal Organization (typically one ACTIVE OWNER).
- Teams, collectives and agencies use the same model with multiple memberships.
- Do not introduce a second tenant abstraction such as `tenant_id` when
  `organization_id` already fulfills that role.

### Domain data classification

Not every DJ model requires `organization_id`.

#### A. Core data

Owned by Platform Core:

- Profile
- Organization
- OrganizationMembership
- Role
- Permission
- RolePermission
- OrganizationInvitation

#### B. Domain shared catalog

Owned by DJ Studio Domain; typically installation-global (shared across
Organizations within one Product database):

- Artist
- Track
- Genre
- Label
- Release
- ExternalEntity
- shared metadata / provenance (for example EntityFact, SourceSnapshot where
  they describe catalog entities)

Catalog entities describe music knowledge. They are not the tenant boundary.

#### C. Tenant domain data

Owned by DJ Studio Domain; must become Organization-scoped (forward-only):

- music library ownership / links (today `UserTrack`)
- playlists and playlist items
- tags bound to library/work
- sessions / set planning
- ingestion requested in a tenant context
- connected sources
- devices
- Domain settings

Current profile-scoped library/playlist/tag/ingestion models are transitional
legacy relative to this decision. Future Domain design must migrate toward
Organization tenancy; new Domain features must not deepen Profile-as-tenant.

### Profile field extraction

`Profile` remains the canonical application identity (ADR-002).

Core Profile may retain only business-agnostic fields, including:

- `id`
- `username`
- `authEmailNormalized`
- `displayName`
- `avatarUrl`
- `bio`
- `countryCode`
- `preferredLanguage`
- timestamps

The following fields do **not** belong to Platform Core:

- `djName`
- `experienceLevel`

They must move, in a future authorized change, to a Domain-owned extension
(working name `DjStudioProfile` or better Domain-approved equivalent) with an
optional 1:1 relationship to `Profile`. This ADR does not freeze the final
model name; it freezes that those fields are Domain-owned.

`isAdmin`:

- must not be an authorization authority;
- Membership → Role → RolePermission → Permission remains the authority
  (ADR-006);
- is marked **deprecated**;
- removal is forward-only and requires a later authorized change.

This ADR does not authorize column extraction or deletion.

### RBAC boundary

Platform Core defines and seeds Foundation permissions such as:

- `organizations.*`
- `memberships.*`
- `invitations.*`

DJ Studio Domain / Product registers Domain permissions such as:

- `library.*`
- `playlists.*`
- `sessions.*`
- `sources.*`
- `devices.*`

The same Foundation tables `Permission` and `RolePermission` may store both
classes. Core seed must not hardcode DJ-specific permission keys. Domain or
Product seeding owns Domain permission registration.

### Database strategy

One PostgreSQL / Supabase database per Product installation contains:

- Core tables
- Domain shared catalog
- tenant Domain data

Separate Core and Domain databases are out of scope for this phase (Auth/RLS,
operations, migrations, MVP simplicity and ADR-010).

### Migration strategy

- Do not rewrite applied migrations.
- The historical `init` migration remains even though it includes DJ models.
- All schema evolution is forward-only.
- Recommended future naming: `*_core_*` and `*_dj_studio_*` for Prisma and
  clear Core/Domain ownership markers for Supabase SQL.
- Prisma multi-file schema may be evaluated later; it is not a requirement of
  this ADR.

### Domain module target

Conceptual ownership only (do not create these directories by this ADR):

```
src/
  core/
  domains/
    dj-studio/
      catalog/
      library/
      playlists/
      sessions/
      sources/
      devices/
      shared/
```

### DJ Studio Product V1 priority (scope guard)

Architectural priority to prevent Core contamination and scope creep:

| Priority | Capabilities |
|----------|----------------|
| P0 | Music library; tracks / catalog metadata; playlists |
| P1 | Sessions / set planning; transition notes; external sources; basic ingestion |
| P2 | Enrichment AI |
| Future | Desktop Companion; Engine DJ; Rekordbox; hotcues; advanced local file sync |

This table is not a PRD. Detailed Product requirements remain separate.

## Consequences

### Positive

- Core remains reusable and business-agnostic.
- Uniform Organization tenancy for Domain operational data.
- SaaS-ready personal and team shapes without a second tenant type.
- DJ Studio can evolve under Domain ownership.
- Future Products can reuse Foundation without DJ semantics.

### Negative / tradeoffs

- Historical migrations remain mixed.
- Forward-only Profile and tenancy refactors will be required later.
- Shared catalog vs tenant data needs careful RLS and authorization design.
- Monorepo retains operational coupling between Core and Domain.

## Non-goals

This ADR does **not** authorize:

- Prisma or Supabase migrations;
- physical extraction or deletion of Profile columns;
- deletion of DJ tables;
- repository rename;
- creation of `src/domains/**` (ownership is declared only);
- Desktop Companion implementation;
- Engine DJ / Rekordbox / advanced sync work;
- production schema or deploy changes.

## References

- ADR-001 — Platform Core and Domain Boundary
- ADR-002 — Identity Source of Truth
- ADR-004 — Tenancy and Organization Model
- ADR-006 — Authorization Permission Model
- ADR-010 — Deployment Runtime and Staging Contract
- Boundary Audit — Platform Core ↔ DJ Studio (2026-09-13)
- `docs/domains/dj-studio/DJ-STUDIO-001.md` — approved milestone design
- `docs/domains/dj-studio/README.md`
- `docs/CURRENT_STATE.md`
- `PROJECT_CONTEXT.md`
