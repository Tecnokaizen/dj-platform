# ADR-001 — Platform Core and Domain Boundary

**Status:** Accepted
**Date:** 2026-08-09
**Decision Type:** Foundation Architecture

## Context

`dj-platform` is the current repository and DJ Platform is the current Product.

The architecture is intended to support the extraction of reusable SaaS capabilities when reuse has been demonstrated across Products or business contexts.

This requires a clear separation between:

- Platform Core;
- Product composition;
- business Domains;
- shared technical code;
- infrastructure adapters.

Earlier project iterations risked treating Product, Domain and reusable platform capabilities as equivalent concepts.

That would create premature abstraction, business leakage into Core and unnecessary coupling between future Products.

## Decision

The architecture distinguishes the following concepts.

### Product

A Product is a concrete application assembled for a particular market or use case.

Examples may include:

- DJ Platform;
- Copy Platform;
- future Products built from the same reusable foundation.

A Product is not itself a Domain.

Product composition belongs primarily to the application layer.

### Platform Core

Platform Core owns reusable SaaS capabilities that are independent from a particular business vertical.

Current Core concerns include or may include:

- Identity;
- Organizations;
- Roles;
- Memberships;
- Permissions.

A capability belongs in Platform Core only when its reusable semantics are justified.

Potential reuse is not sufficient.

The governing question is not:

> Could another Product use this?

The stronger requirement is demonstrated or architecturally validated reuse without importing business-specific semantics.

### Domain

A Domain owns business-specific concepts, rules and behavior.

The current business Domain is the DJ Domain.

DJ Domain concepts include musical and editorial concerns such as:

- Artist;
- Track;
- Release;
- Genre;
- Label;
- playlist behavior;
- music ingestion and enrichment;
- festivals;
- rankings;
- sessions;
- editorial content.

Domain behavior must not be promoted into Platform Core merely because another Product could theoretically need something similar.

### Shared

`src/shared` is reserved for business-agnostic technical reuse.

Shared code must not own:

- Core business rules;
- Dain semantics;
- authorization policy;
- tenant ownership;
- Product-specific workflows.

### Infrastructure

`src/lib` owns infrastructure adapters and provider connectivity.

Examples include:

- Supabase connectivity;
- future Prisma client infrastructure;
- future external-provider adapters when actually implemented.

Infrastructure adapters do not own business semantics.

### Application

`src/app` composes Product behavior and transport concerns.

It may contain:

- routes;
- layouts;
- Server Components;
- Server Actions when composition-owned;
- Route Handlers when a real HTTP boundary is required.

Application code must not become the hidden owner of Domain or Core business rules.

## Source Boundaries

The canonical high-level source structure is:

    src/
    ├── app/
    ├── config/
    ├── core/
    ├── domains/
    ├── generated/
    ├── lib/
    └── shared/

Physical directories do not need to exist before they contain implementation.

An architectural boundary may therefore be documented before a corresponding source directory is materialized.

Empty placeholder directories are not required to represent planned architecture.

## Dependency Direction

Allowed high-level dependencies are:

    app
    → core / domains / shared

    domains
    → core / shared / lib

    core
    → shared / lib

    lib
    → generated / external providers

Forbidden dependencies include:

    core
    → domains

    shared
    → core

    shared
    → domains

    Domain A
    → Domain B

Cross-Domain collaboration must occur through an explicitly approved boundary rather than direct coupling.

## Product and Domain Relationship

Product and Domain are different architectural concepts.

DJ Platform is the current Product.

DJ is the current business Domain.

The repository remains named:

    dj-platform

This repository name does not redefine Platform Core as DJ-specific infrastructure.

A repository split or rename is not required unless future demonstrated multi-Product development creates a concrete need.

## Core Promotion Rule

Business functionality begins with the owner that currently needs it.

Promotion toward Platform Core requires evidence that:

1. the semantics are genuinely reusable;
2. business-specific assumptions can be removed;
3. ownership remains coherent;
4. dependency direction remains valid;
5. reuse provides demonstrated value rather than speculative abstraction.

Core evolves from demonstrated reuse.

It is not a collection of everything that might someday be reusable.

## Consequences

### Positive

- Core remains business-agnostic.
- DJ-specific semantics remain in the DJ Domain.
- future Products can reuse validated capabilities without inheriting DJ assumptions.
- implementation agents receive clearer ownership boundaries.
- premature abstraction is reduced.
- repository structure can evolve without forcing empty placeholder implementations.

### Costs

- some capabilities may initially exist inside a Domain before reusable patterns become clear;
- promotion to Core requires deliberate review;
- similar concepts in different Domains may temporarily remain separate until genuine common semantics are demonstrated.

These costs are preferred over premature coupling.

## Rejected Alternatives

### Product equals Domain

Rejected because Product composition and business semantics are separate concerns.

### Everything potentially reusable belongs in Core

Rejected because theoretical reuse creates speculative abstractions and contaminates Core with business assumptions.

### Core may depend on Domains

Rejected because it reverses the intended dependency direction and makes reusable capabilities dependent on specific verticals.

### Shared as a generic dumping ground

Rejected because technical reuse must not become an unowned location for business behavior.

### Mandatory repository split before multiple Products exist

Rejected because repository topology should respond to demonstrated development needs rather than hypothetical future scale.

## Current Application

Current implementation reflects this decision through:

- `src/core/identity/` for implemented Identity behavior;
- `src/lib/supabase/` for Supabase infrastructure;
- `src/app/` for Product composition;
- DJ Domain documentation under `docs/domains/dj/`;
- Core specifications under `docs/core/`.

Organizations, Roles, Memberships and Permissions are specified Core capabilities but are not considered implemented merely because specifications exist.

The DJ Domain is conceptually defined even when `src/domains/dj/` has no current source implementation.

## Related Decisions

This decision is foundational for:

- ADR-002 — Identity Source of Truth;
- ADR-003 — Internal Identifier Strategy;
- ADR-004 — Tenancy and Organization Model;
- ADR-005 — Roles, Memberships and Ownership Model;
- ADR-006 — Authorization and Permission Model;
- ADR-007 — Prisma and Data Access Conventions;
- ADR-008 — Deployment and Infrastructure Strategy.

## Final Rule

Put behavior where its semantics belong today.

Promote behavior to Platform Core only when reusable semantics are demonstrated and the abstraction remains independent from Product-specific business logic.
