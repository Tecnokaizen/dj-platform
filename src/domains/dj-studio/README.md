# DJ Studio Domain

Ownership:

- this module owns DJ Studio business/domain logic
- it may depend on Platform Core
- Platform Core **must not** import this module

Tenant:

- `Organization`

Actor:

- `Profile`

Shared catalog (Domain-owned, installation-global):

- Track / Artist / Genre / Label / Release (and related joins)
- `catalog/searchCatalogTracks` — authenticated read search for Product Add Track

Tenant data (Organization-scoped):

- library (`LibraryItem`)
- tags
- playlists
- `DjStudioProfile` (Profile-owned Domain SoT)

## Product composition (M7)

App routes under `src/app/(private)/` consume Domain services:

- `/library`, `/playlists`, `/playlists/[id]`, `/studio-profile`
- org switcher when >1 ACTIVE membership
- server actions → Domain services (no browser manage writes)

## References

- [ADR-011 — DJ Studio Domain Boundary and Organization Tenancy](../../../docs/adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md)
- [DJ-STUDIO-001](../../../docs/domains/dj-studio/DJ-STUDIO-001.md)
- [Domain docs README](../../../docs/domains/dj-studio/README.md)

## Phase status

| Phase | Status |
|-------|--------|
| 1 Domain scaffold | **implemented** |
| 2 / M1–M6 | **COMPLETE locally** (not production) |
| 2 / M7 Product UI | **COMPLETE locally** (not production) |

## Open decisions (do not resolve here)

- MEMBER default Domain permission grants (policy already seeded for M5)
- playlist visibility beyond PRIVATE
- Sessions / Sources / Devices / Companion (future)
