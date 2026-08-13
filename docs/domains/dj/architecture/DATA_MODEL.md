# DJ Domain — Conceptual Data Model

**Status:** Living Document
**Scope:** DJ Domain
**Purpose:** define the conceptual information model of DJ Platform independently from its current persistence implementation.

## 1. Purpose

DJ Platform models electronic-music knowledge as interconnected domain concepts.

This document describes:

- what the DJ Domain knows about;
- how its principal concepts relate;
- which concepts belong to the current implemented foundation;
- which concepts remain part of the Product roadmap;
- where DJ Domain ownership ends and Platform Core ownership begins.

This document is not a Prisma schema specification.

Physical tables, fields, indexes, constraints and migration state are documented under:

`docs/domains/dj/database/`

The active Prisma implementation is:

`prisma/schema.prisma`

## 2. Architectural boundary

DJ Platform is a Product built from Platform Core capabilities plus the DJ Domain.

Platform Core owns reusable SaaS capabilities such as:

- authentication identity;
- application profiles;
- organizations and tenancy;
- memberships;
- roles;
- permissions.

The DJ Domain owns electronic-music knowledge and DJ-specific product behaviour.

Therefore:

`Profile` is application identity exposed to the Product, but identity ownership belongs to Platform Core.

A DJ is not a user.

A DJ is not an authentication identity.

A DJ is not an organization membership or role.

The DJ Domain must not introduce parallel `User`, `Role`, `Membership` or authentication models.

## 3. Knowledge layers

DJ Platform separates information according to its semantic role.

### 3.1 Verifiable domain knowledge

Facts that can normally be supported by external or internal evidence.

Examples include:

- artist names;
- releases;
- tracks;
- labels;
- genres;
- dates;
- external identifiers;
- official links;
- festival appearances;
- published sessions.

### 3.2 Editorial knowledge

Human-reviewed interpretation and context.

Examples include:

- biographies;
- historical context;
- style descriptions;
- influence;
- curated selections;
- editorial notes;
- articles;
- ranking methodology.

Editorial interpretation must remain distinguishable from externally verifiable fact.

### 3.3 Intelligence

Information calculated, inferred or proposed by automated processes.

Examples include:

- similarity;
- classification suggestions;
- metadata enrichment;
- entity matching;
- confidence;
- completeness;
- trend indicators;
- duplicate probability.

Intelligence must not automatically become verified fact.

Provenance, confidence and review state must be preserved whenever the process requires them.

### 3.4 Personal product data

Information belonging to an individual application profile rather than to the global music catalog.

Examples include:

- personal track library;
- tags;
- notes;
- ratings or classifications;
- playlists;
- cue information;
- prepared sets.

Global musical entities must not be duplicated for each profile.

## 4. Canonical music knowledge

### 4.1 Artist

`Artist` is the canonical musical-persona entity used by the current DJ Domain model.

It replaces the earlier persistence concept named `Dj`.

Product language may still use “DJ” when describing DJs to users, but persistence and reusable domain relationships should not assume that every musical artist is exclusively a DJ.

Artist may participate in relationships such as:

- tracks;
- releases;
- genres;
- labels;
- external identities;
- editorial content;
- festivals;
- sessions;
- rankings;
- similarity relationships.

Artist aliases, alternate identities and related musical projects remain valid domain concepts, but their final persistence design must be approved before implementation if they are not represented by the active schema.

### 4.2 Track

`Track` represents a canonical musical recording or version.

Different meaningful musical versions may be represented independently when required by the Product.

Examples include:

- original mix;
- remix;
- extended mix;
- radio edit;
- bootleg;
- live version.

Track relationships may include:

- artists;
- genres;
- releases;
- external entities;
- provenance;
- playlists;
- personal library state.

### 4.3 Release

`Release` groups tracks into a published musical release.

A release may relate to:

- tracks;
- label;
- external sources;
- provenance.

### 4.4 Label

`Label` represents a record label or equivalent publishing entity relevant to the music catalog.

Labels may connect artists, releases and editorial discovery.

### 4.5 Genre

`Genre` represents musical taxonomy.

The model may support:

- hierarchical relationships;
- related genres;
- classification confidence;
- artist relationships;
- track relationships.

Genre taxonomy should support discovery without forcing uncertain classifications to become absolute facts.

## 5. Provenance and knowledge acquisition

DJ Platform is designed to ingest and reconcile information from multiple sources.

Conceptually the domain distinguishes:

- external data sources;
- external entity references;
- captured source snapshots;
- extracted facts;
- canonical values;
- ingestion processes;
- enrichment processes.

The active persistence model represents these concerns through concepts including:

- `DataSource`;
- `ExternalEntity`;
- `SourceSnapshot`;
- `EntityFact`;
- `IngestionJob`;
- `IngestionItem`;
- `EnrichmentJob`.

Provenance is part of the knowledge model, not implementation metadata that may be discarded after import.

Automated acquisition must not silently overwrite conflicting canonical knowledge.

## 6. Personal music library

The global catalog and personal library are separate concerns.

A `Profile` may relate to canonical tracks through personal product concepts such as:

- `UserTrack`;
- `Tag`;
- `UserTrackTag`;
- `Playlist`;
- `PlaylistTrack`.

Personal metadata enriches a profile's use of a canonical track without creating another copy of that track.

Future capabilities may include:

- local track-file references;
- cue points;
- prepared DJ sets;
- set transitions.

These future concepts must not be treated as implemented until they exist in the active persistence model.

## 7. Editorial and discovery concepts

DJ Platform has a broader editorial Product vision than the currently implemented Prisma foundation.

The following remain valid DJ Domain concepts even when they are not represented by active Prisma models.

### 7.1 Festival

A festival represents an electronic-music event or recurring event identity.

Conceptually it may contain editions and artist appearances.

Relevant relationships may include:

- location;
- editions;
- dates;
- stages;
- artist appearances;
- headliners;
- sources;
- editorial content.

### 7.2 Festival Edition

Represents one occurrence of a recurring festival.

It provides the temporal context required to distinguish lineups and appearances across years or editions.

### 7.3 Festival Appearance

Connects an Artist with a Festival Edition.

It may eventually describe context such as stage, date, billing or headliner status.

### 7.4 Session

Represents a DJ set, radio show, live recording reference or comparable published performance.

DJ Platform stores metadata, editorial information and permitted references.

A Session concept does not imply storage or distribution of copyrighted audio.

### 7.5 Article

Represents long-form editorial content.

Articles may relate to:

- artists;
- genres;
- festivals;
- tracks;
- scenes;
- historical events;
- other DJ Domain concepts.

### 7.6 Ranking

Represents an ordered editorial or externally sourced classification with explicit methodology and edition context.

Rankings must preserve enough context to explain what is being ranked, for which period, and according to which methodology.

Rankings must not be silently manipulated by automated intelligence.

### 7.7 Media

Represents media metadata or assets used to support Product presentation.

Media persistence, storage provider and ownership relationships require explicit architectural decisions and are not defined by this conceptual document.

## 8. Relationships and discovery

DJ Platform should support discovery through explicit domain relationships rather than relying only on isolated records.

Examples include:

`Artist → Track`

`Artist → Genre`

`Track → Genre`

`Track → Release`

`Release → Label`

`Artist → Festival Appearance → Festival Edition → Festival`

`Artist → Session`

`Artist → Ranking Entry → Ranking Edition → Ranking`

`Article → Artist / Genre / Festival / Track`

`Profile → UserTrack → Track`

`Profile → Playlist → PlaylistTrack → Track`

Relationships may be stored directly, derived from evidence or proposed by intelligence depending on their nature.

## 9. Similarity and inferred relationships

Similarity remains a valid DJ Domain concept.

A similarity relationship may eventually connect Artists, Tracks, Genres or other suitable concepts.

Similarity may originate from:

- editorial curation;
- metadata analysis;
- behavioural signals;
- machine-learning processes;
- AI-assisted analysis.

Similarity must preserve its origin and must not be presented as objective fact when it is inferred.

The historical `DjSimilarity` persistence model is not authoritative.

Any future implementation must use the current Artist-centered domain model and receive explicit persistence design approval.

## 10. Conceptual model overview

The current and planned domain can be viewed approximately as:

    Platform Core
    │
    └── Profile
         │
         ├── UserTrack ───────────── Track
         │                            │
         ├── Tag                      ├── Artist
         │                            ├── Genre
         └── Playlist ─ PlaylistTrack ├── Release ─ Label
                                      │
                                      └── Provenance / Ingestion / Enrichment

    DJ Domain roadmap
    │
    ├── Artist
    │    ├── Festival Appearance ─ Festival Edition ─ Festival
    │    ├── Session
    │    ├── Ranking Entry ─ Ranking Edition ─ Ranking
    │    ├── Editorial Content
    │    └── Similarity
    │
    ├── Genre
    ├── Track
    ├── Release
    └── Label

This diagram is conceptual and does not imply one Prisma model for every node.

## 11. Current implementation boundary

The active Prisma foundation currently represents:

- Profile integration;
- Artist;
- Track and artist relationships;
- Genre and track relationships;
- Label;
- Release and release tracks;
- provenance and external-source concepts;
- ingestion;
- enrichment;
- personal track library;
- tags;
- playlists.

The authoritative implementation details live in:

`docs/domains/dj/database/DATA_MODEL.md`

and:

`prisma/schema.prisma`

Concepts such as Festival, Article, Ranking, Session, media ownership, artist similarity, track files, cue points and prepared DJ sets remain roadmap/domain concepts unless and until separately approved and implemented.

## 12. Historical model migration

Earlier DJ Platform designs used persistence concepts including:

- `Dj`;
- `DjAlias`;
- `DjGenre`;
- `TrackCredit`;
- `FestivalAppearance`;
- `RankingEntry`;
- `User`;
- `Role`;
- `Favorite`;
- `ImportJob`;
- `AiGeneration`;
- `DjSimilarity`.

These historical models must not be copied automatically into the active Prisma schema.

Their useful business semantics are preserved at the conceptual level where still relevant.

Current architecture takes precedence for implementation.

In particular:

`Dj` has evolved toward the broader `Artist` concept.

Authentication identity is provided by Supabase Auth.

Application identity is represented through `Profile`.

Roles, memberships, organizations and permissions belong to Platform Core rather than the DJ Domain.

Ingestion and enrichment use the current provenance architecture rather than the historical import and AI-generation models.

## 13. Evolution rules

A Product requirement does not automatically imply a new persistence model.

Before introducing a new DJ Domain entity:

1. confirm that the business concept is required;
2. determine whether it belongs to DJ Domain, Platform Core or Shared infrastructure;
3. define its relationships and ownership;
4. determine whether existing concepts already represent it;
5. design persistence only when demonstrated Product requirements justify it;
6. update the relevant Domain and database documentation;
7. implement migrations only after the model is approved.

Historical schemas are references, not implementation authority.

## 14. Related documents

Conceptual Product direction:

- `../VISION.md`
- `../PRD.md`

Active persistence design:

- `../database/DATA_MODEL.md`
- `../database/ERD.md`
- `../database/ENUMS.md`
- `../database/DATA_INGESTION_MODEL.md`

Security and identity:

- `../database/AUTH_ARCHITECTURE.md`
- `../database/RLS.md`

Active implementation:

- `../../../../prisma/schema.prisma`
- `../../../../prisma/migrations/`

This conceptual model should evolve with the DJ Domain while remaining independent from incidental database implementation details.
