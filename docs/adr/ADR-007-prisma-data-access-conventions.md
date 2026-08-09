# ADR-007 — Prisma and Data Access Conventions

**Status:** Accepted
**Date:** 2026-08-09
**Decision Type:** Foundation Architecture

## Context

`dj-platform` uses PostgreSQL with Prisma ORM.

Persistence must support:

- Platform Core capabilities;
- DJ Domain data;
- transactional tenancy invariants;
- ingestion and enrichment;
- migrations;
- future Products without coupling persistence behavior to a single Domain.

Earlier architectural approaches risked introducing unnecessary abstractions, direct generated-client coupling throughout the application, or assumptions about database capabilities that had not been verified.

The platform needs explicit conventions governing:

- Prisma ownership;
- generated code;
- client access;
- persistence boundaries;
- transactions;
- migrations;
- raw SQL;
- database-specific enforcement;
- validation.

## Decision

Prisma is the current ORM for application-owned PostgreSQL persistence.

The active Prisma schema is:

    prisma/schema.prisma

Migration history lives under:

    prisma/migrations/

The generated Prisma client lives under:

    src/generated/prisma/

Application infrastructure responsible for exposing Prisma Client belongs under:

    src/lib/prisma/

when that infrastructure is actually implemented.

Empty source directories are not required before implementation exists.

## PostgreSQL

PostgreSQL is the canonical application persistence engine.

Prisma is an application data-access tool.

Prisma does not redefine business ownership.

A model physically appearing inside `schema.prisma` still belongs conceptually to the Core capability or Domain that owns its semantics.

## Schema Ownership

`prisma/schema.prisma` is the active Prisma persistence definition.

It may contain models owned by different architectural capabilities.

Examples:

    Profile
    → Platform Core Identity

    Organization
    → Platform Core Organizations

    Role
    → Platform Core Roles

    OrganizationMembership
    → Platform Core Memberships

    Permission
    → Platform Core Permissions

    Artist / Track / Release
    → DJ Domain

Physical schema co-location does not create a shared business ownership layer.

## Generated Client

Prisma-generated code lives under:

    src/generated/prisma/

Generated code:

- is not an architectural ownership layer;
- must not contain manually authored business behavior;
- should not be edited manually unless Prisma tooling explicitly requires it;
- may be regenerated as part of schema evolution.

Core and Domain code should not depend on generated implementation details unnecessarily.

## Prisma Infrastructure Boundary

Reusable Prisma client infrastructure belongs under:

    src/lib/prisma/

This boundary may contain concerns such as:

- Prisma Client creation;
- runtime-safe client reuse;
- provider adapter configuration;
- connection-related infrastructure behavior.

It must not own:

- Core business rules;
- Domain rules;
- authorization policy;
- tenancy workflows;
- Product composition.

The directory does not need to exist until the first real application Prisma integration is implemented.

## Current Implementation State

Prisma currently exists for:

- schema definition;
- generated client;
- migration history;
- active seed entry point.

The current application source does not yet expose a general-purpose Prisma runtime adapter under `src/lib/prisma`.

Current `PrismaClient` instantiation exists in:

    prisma/seed.ts

Therefore architecture must not describe application Prisma infrastructure as implemented until corresponding source exists.

## Data Access Ownership

Persistence access should remain close to the capability that owns the behavior.

Conceptually:

    Product transport
        ↓
    Core / Domain service
        ↓
    persistence access
        ↓
    Prisma infrastructure
        ↓
    PostgreSQL

Business decisions must not be hidden inside generic infrastructure helpers.

## Repository Pattern

A Repository Pattern is not mandatory globally.

Repository abstractions may be introduced when they provide demonstrated value, such as:

- isolating complex persistence behavior;
- creating a meaningful testing boundary;
- supporting multiple persistence implementations;
- encapsulating repeated capability-specific query semantics.

Repositories must not be introduced merely because a generic architecture template recommends them.

Direct Prisma use inside an appropriate server-side capability service may be acceptable when it preserves ownership and remains simple.

The architecture optimizes for clear boundaries, not abstraction count.

## Browser Boundary

Prisma must not execute from browser-side application code.

Browser code must not import:

    PrismaClient

or generated server-side Prisma internals.

Database operations must occur through approved server-side application boundaries.

## Application Layer

`src/app` composes Product behavior.

Route Handlers, Server Actions and Server Components may initiate persistence-backed workflows.

They should not become the owner of Core or Domain business rules.

Prefer:

    Route / Action
        ↓
    capability service
        ↓
    persistence

rather than embedding complex persistence workflows directly in transport code.

## Transactions

Transactions are required when multiple persistence operations must preserve one logical invariant atomically.

Examples include:

- Organization + initial OWNER Membership creation;
- ownership transfer;
- membership mutations that affect sole-owner invariants;
- invitation acceptance when several records must change together;
- other multi-record workflows whose partial completion would create invalid state.

Transaction boundaries must surround the complete invariant-preserving operation.

They must not be split arbitrarily across independent service calls.

## Transactions and Capability Boundaries

A transaction may span several persistence models when one approved workflow requires it.

Architectural capability separation does not require breaking an atomic database workflow into separate transactions.

For example:

    Organizations
    +
    Roles
    +
    Memberships

participate in Organization creation even though each capability owns different semantics.

The service orchestrating the approved workflow must preserve the transaction boundary.

## Constraints

Database constraints should enforce invariants where the database can express them safely and clearly.

Examples may include:

- unique keys;
- foreign keys;
- required relationships;
- approved indexes;
- check constraints when appropriate.

Application checks must not replace straightforward database integrity constraints without reason.

Conversely, documentation must not claim an invariant is database-enforced when no such enforcement exists.

## Sole OWNER Invariant

The sole active OWNER invariant is an example where semantic enforcement is more complex.

OWNER meaning lives in the referenced Role.

Therefore a simple partial unique index over Membership alone cannot directly express the full semantic condition.

Initial enforcement relies on:

- transactional application services;
- canonical Role resolution;
- guarded membership mutations;
- tests.

Stronger PostgreSQL-specific enforcement may be added after explicit review.

## Raw SQL

Raw SQL is allowed when a demonstrated approved requirement cannot be represented safely or adequately through the current Prisma capabilities.

Before introducing raw SQL:

1. verify current Prisma capabilities;
2. identify the concrete limitation;
3. understand migration implications;
4. preserve capability ownership;
5. preserve tenancy and authorization invariants;
6. document significant database-specific behavior;
7. validate the resulting migration or runtime behavior.

Raw SQL must solve a demonstrated problem.

It must not be introduced based on an assumed Prisma limitation.

## PostgreSQL-Specific Features

PostgreSQL-specific mechanisms may be used when they provide justified integrity or operational value.

Examples may eventually include:

- partial indexes;
- expression indexes;
- triggers;
- constraint triggers;
- specialized constraints.

Their use requires deliberate review because they may not be represented completely by Prisma schema syntax.

Database-specific behavior must remain visible in migration history and documentation.

## Migrations

Schema evolution must preserve migration history.

Migrations live under:

    prisma/migrations/

A schema edit is not complete merely because:

    prisma generate

succeeds.

Relevant changes may require:

- migration creation;
- migration inspection;
- schema validation;
- data-impact analysis;
- database execution;
- runtime verification.

Validation requirements depend on the actual change.

## `prisma db push`

`prisma db push` must not be used casually as a replacement for migration history.

It may be appropriate only when the explicit workflow requires it and its consequences are understood.

Persistent environments intended to preserve schema evolution should use controlled migration history.

## Destructive Changes

Destructive migrations require explicit review.

Examples include:

- dropping tables;
- dropping columns;
- changing identifiers;
- narrowing data types;
- rewriting ownership relationships;
- changing uniqueness semantics;
- destructive data transformations.

A successful Prisma command does not prove a destructive change is safe.

## Identifier Strategy

Prisma models follow ADR-003.

Principal application entities use internally controlled identifiers, with UUID as the default strategy unless an approved model requires otherwise.

External provider IDs remain external mappings.

Slugs, names and URLs must not silently become canonical persistence identity.

## Identity

Prisma must not introduce a second canonical application `User`.

Supabase Auth owns authentication identity.

`Profile` represents application identity.

Prisma manages application persistence but does not own Supabase internal `auth.users`.

## Tenancy

Tenant-aware persistence must preserve:

- Organization identity;
- Membership state;
- Role semantics;
- Permission semantics;
- ownership invariants.

Generic data-access helpers must not silently bypass Organization scope.

## Authorization

Persistence access does not imply authorization.

A valid database query is not proof that the actor was authorized to perform the operation.

Privileged workflows require explicit server-side authorization according to ADR-006.

Authorization and persistence concerns remain complementary.

## RLS

Row Level Security may complement server-side authorization.

RLS must not be claimed as active merely because Supabase or PostgreSQL supports it.

The current initial Prisma migration does not establish verified RLS policies.

Future RLS behavior may require SQL migrations outside what Prisma schema syntax expresses directly.

Such behavior must be reviewed and verified explicitly.

## Seed

The active seed entry point is:

    prisma/seed.ts

Seed data must not become an undocumented source of architectural or Product truth.

Bootstrap data needed for canonical Core concepts may be added only when corresponding implementation requires it.

Examples may include future canonical Roles or Permissions.

Bootstrap behavior should be deterministic and idempotent where appropriate.

Historical editorial seed data has been removed and must not be revived automatically.

## External Provider Data

External data must not bypass canonical persistence rules.

Ingestion may produce:

- external references;
- snapshots;
- extracted facts;
- match candidates;
- enrichment output.

Matching external data to an internal entity does not transfer identity ownership to the provider.

## Error Handling

Persistence failures must be surfaced through the owning workflow.

Do not silently convert failed writes into apparent success.

Transaction failures must roll back the complete atomic operation.

Infrastructure-level errors should not leak secrets or sensitive connection details to client-facing responses.

## Testing

Persistence-sensitive features should test the invariants they claim to enforce.

Examples include:

- Organization creation produces exactly one OWNER;
- sole OWNER cannot be removed directly;
- ownership transfer remains atomic;
- Membership uniqueness;
- authorization-sensitive mutations;
- ingestion idempotency where applicable.

Test strategy should match implemented capabilities.

The absence of test infrastructure must not be hidden by claiming tests were run.

## Validation

Repository baseline validation currently includes:

    npm run typecheck
    npm run lint

Prisma-specific work may additionally require:

- Prisma schema validation;
- client generation;
- migration generation;
- migration inspection;
- database connectivity;
- applying migrations in an appropriate development environment;
- runtime verification.

Do not claim database behavior has been validated unless the database operation was actually exercised.

## Source of Truth

Persistence decisions should be evaluated using all relevant evidence:

- accepted ADRs;
- approved Architecture;
- Core specifications;
- Domain specifications;
- `prisma/schema.prisma`;
- migration history;
- current source;
- database runtime state.

When these materially conflict:

    STOP
        ↓
    inspect conflict
        ↓
    determine authoritative decision
        ↓
    update stale artifact
        ↓
    continue implementation

Neither schema nor documentation should be assumed automatically correct when evidence contradicts it.

## Implementation Agent Rules

An implementation agent must not independently:

- introduce a mandatory Repository Pattern;
- bypass Prisma without demonstrated need;
- invent raw SQL because a Prisma limitation is assumed;
- use `db push` as a silent migration substitute;
- create a second canonical User model;
- introduce tenant ownership fields contrary to ADR-004;
- split approved atomic workflows across unrelated transactions;
- claim RLS or database constraints exist without evidence;
- modify generated Prisma source manually;
- treat a successful typecheck as database verification.

Architectural uncertainty must be surfaced.

## Rejected Alternatives

### Mandatory Repository Pattern

Rejected because abstraction should respond to demonstrated complexity rather than template-driven architecture.

### Prisma Client imported directly throughout UI code

Rejected because server persistence requires clear ownership and runtime boundaries.

### Generated Prisma client as business layer

Rejected because generated code has no business ownership.

### Raw SQL by default

Rejected because Prisma remains the primary ORM and database-specific behavior should solve demonstrated needs.

### `db push` instead of migration history

Rejected as a general persistence workflow because it weakens controlled schema evolution.

### Prisma schema determines architectural ownership

Rejected because physical schema layout and semantic capability ownership are different concerns.

### RLS as substitute for application authorization

Rejected because authorization semantics still require explicit actor and tenant reasoning.

## Consequences

### Positive

- persistence ownership remains explicit;
- generated code is isolated;
- Prisma remains primary without becoming business architecture;
- unnecessary Repository abstractions are avoided;
- transactions preserve cross-model invariants;
- raw SQL remains available for demonstrated PostgreSQL needs;
- migration history remains meaningful;
- implementation agents receive clear persistence boundaries.

### Costs

- some workflows require deliberate transaction orchestration;
- Prisma-specific and PostgreSQL-specific concerns may coexist;
- complex constraints may require migration-level SQL;
- persistence changes require more than schema editing when runtime guarantees matter.

These costs are accepted in exchange for reliable and understandable persistence evolution.

## Related Decisions

- ADR-001 — Platform Core and Domain Boundary
- ADR-002 — Identity Source of Truth
- ADR-003 — Internal Identifier Strategy
- ADR-004 — Tenancy and Organization Model
- ADR-005 — Roles, Memberships and Ownership Model
- ADR-006 — Authorization and Permission Model
- ADR-008 — Deployment and Infrastructure Strategy

## Related Documents

- `docs/architecture/PRISMA_IMPLEMENTATION.md`
- `docs/architecture/DATA.md`
- `docs/architecture/TENANCY.md`
- `docs/backend/database/`
- `docs/domains/dj/database/`
- `prisma/README.md`

## Final Rule

Prisma is the primary ORM for application persistence.

PostgreSQL is the canonical persistence engine.

Persistence code respects Core and Domain ownership.

Transactions preserve complete business invariants.

Repository abstractions are optional, not mandatory.

Raw SQL requires demonstrated need.

Migration and runtime claims require evidence.
