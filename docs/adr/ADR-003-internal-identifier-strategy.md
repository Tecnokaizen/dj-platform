# ADR-003 — Internal Identifier Strategy

**Status:** Accepted
**Date:** 2026-08-09
**Decision Type:** Foundation Architecture

## Context

DJ Platform integrates application-owned data with external systems and providers.

Examples include:

- Supabase Auth;
- music metadata providers;
- ingestion sources;
- external catalogs;
- future Product integrations.

External systems commonly expose their own identifiers.

Those identifiers are useful for reconciliation and provenance, but allowing them to become the canonical identity of application entities would couple the platform to individual providers.

The platform therefore needs a stable internal identifier strategy that remains independent from external services.

## Decision

Application-owned persistent entities use internally controlled identifiers.

UUID is the default identifier strategy for principal application entities unless a specific approved model requires another form.

External provider identifiers must remain external references.

They must not replace canonical internal identifiers.

Conceptually:

    Internal entity
    ├── internal UUID
    └── zero or more external identities

## Internal Identity

Internal identifiers exist to identify application-owned records independently from:

- provider lifecycle;
- provider naming;
- URLs;
- slugs;
- mutable business attributes;
- imported source identifiers.

Internal identity should remain stable when external metadata changes.

## UUID

UUID is the current default for principal persisted application entities.

Benefits include:

- independence from external providers;
- compatibility with PostgreSQL and Supabase;
- safe generation without relying on centralized sequential allocation;
- suitability for distributed or asynchronous ingestion;
- reduced coupling between Products and persistence environments.

UUID usage must follow the active Prisma schema and approved capability design.

This ADR does not require every relation table or internal technical record to introduce an unnecessary standalone UUID when another approved key better represents the model.

## Supabase Authentication Identity

Supabase Auth owns authentication identity.

`auth.users.id` is a Supabase-managed UUID.

Application `Profile` maintains the approved stable identity relationship with the authenticated Supabase identity.

This relationship does not change the ownership decision established in ADR-002:

- Supabase Auth owns authentication identity;
- Profile owns application identity.

The application must not create a second competing identity solely to mirror the same authenticated person.

## External Identifiers

External identifiers belong to provenance or integration concerns.

Examples may include identifiers from:

- Beatport;
- MusicBrainz;
- Discogs;
- Spotify;
- YouTube;
- other music or content providers.

External identifiers must be stored together with enough provider context to understand their namespace.

Conceptually:

    canonical internal entity
        ↓
    ExternalEntity
        ├── source
        ├── entity type
        └── external identifier

An external ID without provider context is not a canonical platform identifier.

## Source URLs

URLs may be stored for:

- provenance;
- external navigation;
- source snapshots;
- evidence;
- imported content.

URLs are not canonical internal identifiers.

URLs may change while the underlying entity remains the same.

## Slugs

Slugs are presentation and routing identifiers.

They may support:

- human-readable URLs;
- SEO;
- Product navigation.

Slugs must not be treated as immutable database identity.

A slug may change without changing the underlying entity UUID.

## Names

Human-readable names must never act as canonical identifiers.

Examples include:

- Artist name;
- Track title;
- Label name;
- Genre name;
- Organization name.

Names may:

- change;
- collide;
- contain aliases;
- differ between sources;
- require normalization.

Matching by name alone must not silently merge canonical entities.

## Composite Identity

Some relationship models may use composite uniqueness when the relationship itself is naturally defined by multiple references.

Examples can include:

- membership uniqueness within an Organization;
- role-permission mappings;
- canonical many-to-many relationships.

Composite uniqueness and primary-key strategy are separate decisions.

A model should use the key shape that best preserves its approved invariants.

Do not introduce an artificial UUID purely for stylistic consistency when the model does not require one.

Conversely, do not remove a standalone identifier when the entity has an independent lifecycle that requires it.

## Domain Entity Matching

Matching imported data to canonical entities is not the same as assigning identity.

An ingestion process may use signals such as:

- normalized names;
- ISRC;
- release metadata;
- duration;
- source identifiers;
- artist relationships;
- confidence scoring.

Those signals help resolve a canonical entity.

They do not replace its internal identifier.

## Tenant Identifiers

Organizations and other Platform Core tenant entities use internally controlled identifiers.

Tenant ownership and authorization must never depend on mutable values such as:

- organization name;
- organization slug;
- user email.

Stable internal identifiers are used for persistence relationships and authorization context.

## API Boundaries

Stable internal identifiers may be exposed through approved server-side interfaces when appropriate.

Public URLs or Product-facing interfaces may prefer slugs or other presentation identifiers.

The choice of external representation does not change internal persistence identity.

Transport identifiers must not silently redefine database identity.

## Migration Rules

Identifier changes are high-impact persistence changes.

Before changing an identifier strategy, evaluate:

- foreign keys;
- existing data;
- external mappings;
- tenant relationships;
- API contracts;
- migrations;
- indexing;
- rollback or forward-fix strategy.

Identifier migrations require explicit architectural review when they alter canonical identity semantics.

## Rejected Alternatives

### External provider ID as primary application identifier

Rejected because it couples canonical entities to individual providers.

### Slug as canonical primary identifier

Rejected because slugs are presentation-oriented and may change.

### Name as canonical identifier

Rejected because names are mutable and non-unique.

### Email as canonical application identifier

Rejected because authentication contact data may change and is not a stable ownership key.

### Sequential integer IDs required everywhere

Rejected because the current architecture benefits from UUID-based identifiers and does not require globally sequential identity.

### UUID required blindly on every table

Rejected because relationship models may have different lifecycle and uniqueness requirements.

## Consequences

### Positive

- canonical identity remains provider-independent;
- external integrations can change without replacing internal identity;
- provenance can preserve multiple external references;
- tenant and authorization relationships use stable keys;
- ingestion can reconcile multiple sources into one canonical entity;
- routing and SEO identifiers remain decoupled from persistence identity.

### Costs

- external data requires explicit mapping;
- human-readable URLs may require slug-to-ID resolution;
- migrations must preserve UUID relationships carefully;
- imported entities require matching rather than direct provider-ID adoption.

These costs are accepted in exchange for stable platform ownership of identity.

## Current Application

The active DJ Domain persistence model follows this strategy through internally controlled identifiers and explicit external-source mapping.

Relevant concepts include:

    Profile
    Artist
    Track
    Genre
    Label
    Release
    Playlist
    DataSource
    ExternalEntity
    SourceSnapshot
    EntityFact

The active implementation is defined by:

    prisma/schema.prisma

Persistence semantics are documented under:

    docs/domains/dj/database/

Platform Core modules must follow the same identifier principles when implemented.

## Related Decisions

- ADR-001 — Platform Core and Domain Boundary
- ADR-002 — Identity Source of Truth
- ADR-004 — Tenancy and Organization Model
- ADR-005 — Roles, Memberships and Ownership Model
- ADR-007 — Prisma and Data Access Conventions

## Final Rule

Canonical application identity is internally controlled.

UUID is the default identifier for principal application entities.

External IDs, slugs, names and URLs are references or presentation identifiers, not replacements for canonical internal identity.
