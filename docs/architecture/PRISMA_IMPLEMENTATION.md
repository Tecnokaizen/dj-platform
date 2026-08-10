---
title: Prisma Implementation
version: 2.1.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - DATA.md
  - ARCHITECTURE.md
  - IDENTITY.md
  - PROJECT_STRUCTURE.md
  - SOURCE_STRUCTURE.md
---

# Prisma Implementation

## Purpose

This document defines how Prisma is used within Platform Core.

It establishes conventions for:

- Schema management
- Database migrations
- Type generation
- Database client generation
- Persistence access
- Identifier strategy
- Transactions
- Seed data
- Persistence boundaries

Business-specific models belong to their corresponding Business Domain.

---

# Scope

Prisma is the application persistence layer for Platform Core and Business Domains.

It is responsible for:

- Schema definition
- Database migrations
- Type generation
- Database client generation
- Database access through approved server-side persistence boundaries

Prisma does not own business logic.

Prisma must never be accessed directly from:

- Pages
- UI Components
- Server Actions

---

# Prisma Project Layout

```text
prisma/
├── schema.prisma
├── seed.ts
└── migrations/

prisma.config.ts

src/generated/prisma/

src/lib/prisma/
```

Generated Prisma code lives under:

```text
src/generated/prisma/
```

Generated files must never be edited manually.

Infrastructure code responsible for exposing the Prisma Client belongs under:

```text
src/lib/prisma/
```

---

# Configuration

Database configuration is managed through:

```text
prisma.config.ts
```

Environment-specific values must be provided through environment variables.

Secrets must never be committed to the repository.

---

# Database

Current database:

```text
PostgreSQL
```

Current Prisma database adapter:

```text
@prisma/adapter-pg
```

Provider-specific configuration must remain isolated from business logic.

---

# Generated Client

The Prisma Client is generated into:

```text
src/generated/prisma/
```

Application code should access Prisma through the infrastructure layer under:

```text
src/lib/prisma/
```

The Prisma Client must be instantiated consistently and reused according to the runtime requirements of the application.

Application features should not import generated Prisma internals unnecessarily.

---

# Persistence Architecture

Database access follows this conceptual flow:

```text
Application
        ↓
Capability Service
        ↓
Prisma Runtime Adapter
        ↓
Prisma Client
        ↓
PostgreSQL
```

Capability services own workflows, business behavior and capability-specific persistence semantics.

Prisma runtime infrastructure under:

```text
src/lib/prisma/
```

owns Prisma Client construction and runtime reuse.

A Repository abstraction is not mandatory.

It may be introduced when it provides demonstrated value, such as:

- isolating complex persistence behavior;
- creating a meaningful testing boundary;
- supporting multiple persistence implementations;
- encapsulating repeated capability-specific query semantics.

Repositories must not be introduced merely because a generic architecture template recommends them.

Direct Prisma use inside an appropriate server-side capability service is acceptable when it preserves ownership and remains simple.

The architecture optimizes for clear boundaries, not abstraction count.

---

# Prisma Access Rule

Prisma must not be accessed directly from:

```text
src/app/
```

or UI components.

Approved access:

```text
Application
    ↓
Capability Service
    ↓
Prisma Runtime Adapter
    ↓
Prisma
```

Capability-specific Repository abstractions remain optional and require demonstrated value.

---

# Installation

Core dependencies:

```bash
npm install @prisma/client @prisma/adapter-pg pg
```

Development dependencies:

```bash
npm install -D prisma tsx @types/pg
```

The repository uses a single package manager consistently.

---

# Validation Workflow

Before creating or reviewing a migration:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

Review:

- Model names
- Field names
- Relations
- Foreign keys
- Constraints
- Referential actions
- Cascades
- Nullable fields
- Indexes
- Unique constraints
- Identifier types

Schema validation does not replace migration review.

---

# Migration Workflow

Typical development workflow:

```bash
npx prisma migrate dev --name <migration-name>
```

Migration names should describe the schema change.

Example:

```text
add_platform_organizations
```

Rules:

- Keep migrations focused.
- Review generated SQL.
- Never modify migrations that have already been applied to shared or production environments.
- Review destructive operations explicitly.
- Test migrations before production deployment.
- Validate rollback and recovery implications.
- Keep schema and migration history synchronized.

---

# Schema Ownership

Every persisted model must have a clear architectural owner.

Models belong to one of two categories:

```text
Platform Core Models

Business Domain Models
```

---

# Platform Core Models

Platform Core owns application models required across SaaS products.

Examples may include:

```text
Profile
Organization
Role
OrganizationMembership
OrganizationInvitation
Permission
RolePermission
Notification
AuditEvent
FeatureFlag
PlatformSetting
```

Current foundational ownership is:

```text
Identity
└── Profile

Organizations
└── Organization

Roles
└── Role

Memberships
├── OrganizationMembership
└── OrganizationInvitation

Permissions
├── Permission
└── RolePermission
```

Additional models belong to their corresponding approved Core capability or Core module.

Platform Core models must remain business agnostic.

---

# Identity Ownership

Authenticated user identities are provided by Supabase Authentication through:

```text
auth.users
```

Platform Core uses the application `Profile` entity to represent application-level profile information associated with an authenticated identity.

Conceptually:

```text
Supabase Auth

auth.users
    ↓
Profile
    ↓
Platform Core relationships
```

Platform Core must not create a duplicate Prisma `User` model while Supabase Auth remains the identity source of truth.

Any future change to this identity architecture requires an ADR and an explicit migration strategy.

---

# Business Domain Models

Business-specific entities belong to their corresponding Domain.

Generic examples:

```text
Domain A

Resource
Category
Collection
```

```text
Domain B

Order
Customer
Product
```

Platform Core must never contain Domain-specific entities merely because multiple screens or workflows use them.

Generated Prisma models do not determine architectural ownership.

Ownership is determined by platform architecture and Domain responsibility.

---

# Cross-Module Relationships

Core modules may reference entities owned by other Core modules when required by the platform model.

Examples include relationships such as:

```text
Profile
        ↓
OrganizationMembership
        ↓
Organization

OrganizationMembership
        ↓
Role

Role
        ↓
RolePermission
        ↓
Permission

OrganizationInvitation
        ├──→ Organization
        └──→ Role
```

Entity ownership remains:

```text
Profile
→ Identity

Organization
→ Organizations

OrganizationMembership
OrganizationInvitation
→ Memberships

Role
→ Roles

Permission
RolePermission
→ Permissions
```

Cross-module relationships must:

- Have one documented owner for every entity.
- Preserve approved architectural dependency rules.
- Avoid duplicating data solely to eliminate legitimate relationships.
- Avoid temporary competing sources of truth.
- Be documented before implementation.

A module may orchestrate another module without becoming the owner of that module's entities.

---

# Identifiers

Platform Core uses UUID identifiers.

Recommended Prisma pattern:

```prisma
id String @id @default(uuid()) @db.Uuid
```

UUID is the current identifier strategy for Platform Core and Domain entities unless a documented exception exists.

New models must follow the identifier strategy already used by the active application schema.

Do not introduce alternative identifier formats such as CUID into new modules.

Identifier strategy must remain consistent across Platform Core.

Foreign keys referencing UUID identifiers should use:

```prisma
@db.Uuid
```

Example:

```prisma
organizationId String @map("organization_id") @db.Uuid
```

Any future platform-wide change to the identifier strategy requires:

- An ADR
- A migration plan
- Compatibility analysis
- Referential-integrity review

---

# Database Naming

Prisma model names use:

```text
PascalCase
```

Application fields use:

```text
camelCase
```

Database tables and columns may use:

```text
snake_case
```

when explicitly mapped.

Example:

```prisma
model OrganizationMembership {
  organizationId String @map("organization_id") @db.Uuid

  @@map("organization_memberships")
}
```

Mapping must remain explicit and predictable.

---

# Timestamps

Persisted application entities should normally provide:

```text
createdAt
updatedAt
```

Recommended PostgreSQL representation:

```prisma
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
```

Additional timestamps should represent explicit lifecycle events.

Examples:

```text
archivedAt
deletedAt
joinedAt
publishedAt
completedAt
```

Do not introduce timestamps with ambiguous meaning.

---

# Soft Deletion

Soft deletion is optional.

When required, a typical field is:

```text
deletedAt
```

Capability-owned persistence queries are responsible for excluding soft-deleted records where required.

Prisma should not introduce hidden application behavior that makes persistence rules difficult to understand.

For lifecycle-oriented entities, an explicit status may be preferable to generic soft deletion.

Example:

```text
ACTIVE
SUSPENDED
ARCHIVED
```

The lifecycle model must be documented by the owning Core module or Domain.

---

# Referential Actions

Relations must define intentional deletion behavior.

Possible strategies include:

```text
Restrict
Cascade
SetNull
NoAction
```

Referential actions must never be chosen solely for convenience.

Before using cascading deletion, review:

- Tenant boundaries
- Audit requirements
- Historical records
- Billing records
- User-generated data
- Domain-owned data
- Recovery requirements

Destructive cascades require particular scrutiny.

---

# Unique Constraints

Unique constraints should enforce real invariants.

Examples:

```text
Organization.slug

organizationId + profileId

externalProvider + externalId
```

Application validation is not a replacement for database uniqueness where the database can enforce the invariant reliably.

---

# Indexes

Indexes should support actual query patterns.

Common candidates include:

- Foreign keys
- Status fields used frequently for filtering
- Tenant identifiers
- Slugs
- External identifiers
- Frequently queried timestamps
- Composite tenant filters

Example:

```prisma
@@index([organizationId])
@@index([status])
@@index([organizationId, status])
```

Do not create indexes speculatively without a known access pattern.

---

# Multi-Tenancy

Tenant-owned entities must be explicitly scoped.

Typical tenant identifier:

```text
organizationId
```

Tenant-aware queries must not rely solely on UI state.

Tenant isolation must be enforced through the appropriate combination of:

- Application authorization
- Capability query scoping
- PostgreSQL constraints
- Supabase Row Level Security where applicable

Example conceptual flow:

```text
Authenticated Identity
       ↓
Profile
       ↓
ACTIVE OrganizationMembership
       ↓
Organization Context
       ↓
Tenant-Scoped Query
```

A valid authentication session alone does not authorize access to tenant-owned data.

---

# Row Level Security

Supabase Row Level Security may be used as an additional database security boundary.

RLS must complement application authorization.

It does not replace:

- Membership validation
- Role validation
- Permission checks
- Service-layer business rules

Policies must be reviewed together with PostgreSQL grants.

Administrative `service_role` access must remain isolated and deliberate.

---

# Transactions

Transactions are used when multiple persistence operations form one atomic business invariant.

Example:

```text
BEGIN

Create parent record

Create required relationship

COMMIT
```

If any required persistence operation fails:

```text
ROLLBACK
```

Transactions should contain database work only.

Never perform the following inside a database transaction:

- External HTTP requests
- Email delivery
- AI processing
- File uploads
- Payment-provider calls
- Long-running external operations

Keep transactions short.

---

# Service and Persistence Responsibilities

## Service

A Service may:

- Apply business rules.
- Own capability-specific persistence semantics.
- Execute Prisma queries through the approved runtime adapter when the persistence behavior remains simple.
- Validate workflows.
- Perform authorization orchestration.
- Open an application transaction where appropriate.
- Coordinate multiple Core capabilities.

A Service must not expose persistence internals unnecessarily.

## Optional Repository

A capability-specific Repository may be introduced when demonstrated complexity justifies it.

When present, a Repository may:

- Execute Prisma queries.
- Select fields.
- Create records.
- Update records.
- Execute persistence-specific operations.
- Participate in transactions.

A Repository must not:

- Decide application authorization.
- Define business policy.
- Send notifications.
- Call external providers.
- Render presentation logic.

Repository introduction is an architectural choice, not a default implementation requirement.

---

# Prisma Types

Generated Prisma types are persistence types.

They should not automatically become public application contracts.

When a stable application contract is required, define an explicit:

```text
DTO
Schema
Application Type
```

Do not expose Prisma internals merely because generated types are convenient.

---

# Validation

Prisma constraints protect persistence integrity.

Application input validation remains the responsibility of the application layer.

Preferred flow:

```text
External Input
      ↓
Zod Validation
      ↓
Capability Service
      ↓
Prisma Runtime Adapter
      ↓
Prisma
```

Do not rely on Prisma errors as the primary input-validation mechanism.

---

# Seed Strategy

Seed and synchronization processes should be:

- Idempotent
- Predictable
- Repeatable
- Environment aware
- Safe to execute intentionally
- Based on stable semantic keys

Platform Core seed or synchronization processes initialize reusable platform reference data only.

Current Foundation reference data includes:

```text
Roles
Permissions
RolePermission policy
```

Roles are synchronized by:

```text
Role.key
```

Permissions are synchronized by:

```text
Permission.key
```

RolePermission policy is synchronized using the canonical semantic Role and Permission keys.

Generated UUID values are persistence identifiers.

They must not be hard-coded as semantic identifiers.

Incorrect:

```text
OWNER_ROLE_ID = "fixed-uuid"
```

Correct:

```text
OWNER
→ resolve Role by key
```

Required reference data must exist after synchronization.

If a required Role or Permission cannot be resolved, synchronization must fail clearly rather than inventing runtime authorization data.

Synchronization must detect unexpected persisted reference data or policy drift.

It must not automatically perform destructive deletion of unknown Roles, Permissions or RolePermission mappings without an explicitly approved migration or policy decision.

Normal application runtime must not auto-create missing Roles or Permissions as a fallback.

Domain-specific reference data belongs to the corresponding Domain.

Seed scripts must not silently create production tenant or business data.

---

# Existing Identities, Profiles and Migration

Schema changes must account for existing authentication identities, Profiles and application data.

When new Core capabilities are introduced, migration strategy must explicitly decide how existing records are handled.

Do not invent tenant ownership automatically unless product requirements explicitly define personal or automatic workspaces.

Migration behavior must be intentional.

---

# Performance

Persistence queries should:

- Select only required fields.
- Avoid N+1 query patterns.
- Prefer explicit projections.
- Use pagination for unbounded collections.
- Use appropriate indexes.
- Keep transactions short.
- Avoid loading large relation graphs unnecessarily.

Performance optimization should be driven by actual query behavior.

---

# Pagination

Collections that may grow without a practical upper bound should support pagination.

The pagination strategy should be selected based on query requirements.

Possible approaches:

```text
Offset Pagination

Cursor Pagination
```

Capability-owned persistence code owns persistence implementation.

The API or application contract owns the externally visible pagination format.

---

# Query Boundaries

Avoid creating generic unrestricted database gateways.

Preferred capability-owned persistence operations communicate intent:

```text
findOrganizationById()
findOrganizationBySlug()
listOrganizationsForProfile()
```

Avoid generic persistence entry points such as:

```text
queryAnything()
```

Persistence APIs should communicate intent.

These operations may live directly in an appropriate server-side capability service or, when demonstrated complexity justifies it, behind a capability-specific Repository.

---

# Error Handling

Raw database errors should not leak directly to users.

Persistence errors should be translated into stable application errors where appropriate.

Examples:

```text
RESOURCE_NOT_FOUND
RESOURCE_CONFLICT
INVALID_RELATION
PERSISTENCE_ERROR
```

Detailed database information may be logged securely for diagnostics.

Never expose:

- SQL details
- Credentials
- Connection strings
- Internal database topology

---

# Logging

Database logging should support diagnostics without leaking sensitive data.

Never log:

- Database credentials
- Access tokens
- Authentication secrets
- Sensitive user data unnecessarily

Slow-query and error monitoring may be introduced as platform observability evolves.

---

# Schema Evolution

Schema changes must remain compatible with the documented architecture.

Before introducing a new model, determine:

```text
Who owns this entity?
```

Possible answers:

```text
Identity

Core Module

Business Domain

Infrastructure
```

If ownership is unclear, architecture must be clarified before implementation.

---

# Extensions

Prisma extensions may be introduced when they:

- Reduce meaningful duplication
- Improve safety
- Preserve explicit behavior
- Remain understandable to engineers and AI agents

Hidden behavior should be avoided.

Extensions must not become a mechanism for hiding business logic inside the persistence layer.

---

# Raw SQL

Raw SQL should be exceptional.

Acceptable cases may include:

- PostgreSQL features Prisma cannot represent
- Partial unique indexes
- Specialized constraints
- RLS policies
- Database grants
- Performance-critical reviewed queries

Raw SQL must:

- Be documented
- Be reviewed
- Use safe parameterization
- Remain part of migration history where applicable

---

# Database Constraints vs Application Rules

Use the database to enforce invariants it can express reliably.

Use application services for rules requiring business context.

Example:

```text
Unique slug
→ Database constraint
```

```text
Actor may archive Organization
→ Application service rule + authorization
```

For critical invariants, use both layers when appropriate.

---

# Migration Safety

Before applying a production migration, review:

- Data loss risk
- Table locking
- Index creation impact
- Nullability changes
- Defaults
- Foreign keys
- Cascades
- Backfill requirements
- Deployment compatibility

Large backfills should not automatically be combined with schema migrations when they require long-running work.

---

# Production Deployment

Production schema changes should run through the controlled deployment workflow.

Typical sequence:

```text
Reviewed Migration
       ↓
Staging Validation
       ↓
Backup / Recovery Check
       ↓
Production Deployment
       ↓
Migration
       ↓
Health Verification
       ↓
Monitoring
```

Production migrations must not depend on manually edited database state.

---

# Testing

Persistence behavior should be tested where it protects important invariants.

Examples:

- Unique constraints
- Tenant isolation
- Transaction rollback
- Referential behavior
- Persistence filtering
- Lifecycle persistence
- Cross-module relationships

High-risk database behavior deserves integration testing against PostgreSQL.

---

# AI-Assisted Development Rules

AI coding agents working with Prisma must:

- Read the relevant architecture documentation first.
- Preserve UUID identifier strategy.
- Preserve Supabase identity ownership.
- Determine model ownership before adding entities.
- Use approved server-side persistence boundaries; introduce Repository abstractions only when demonstrated value justifies them.
- Review relationships and referential actions.
- Avoid speculative models.
- Avoid speculative indexes.
- Avoid duplicate identity models.
- Avoid temporary competing authorization systems.
- Run Prisma validation after schema changes.
- Review generated migrations before considering a task complete.

AI agents must not redesign persistence architecture during implementation.

Architectural uncertainty must be escalated before code generation continues.

---

# Definition of Ready

A Prisma change is ready for implementation when:

- Entity ownership is defined.
- Identifier strategy is compatible.
- Relations are documented.
- Tenant implications are understood.
- Referential actions are intentional.
- Required constraints are defined.
- Migration impact is understood.
- Cross-module dependencies are documented.

---

# Definition of Done

A Prisma change is complete when:

- Schema formats successfully.
- Schema validates successfully.
- Prisma Client generates successfully.
- Migration SQL has been reviewed.
- TypeScript passes.
- Lint passes.
- Persistence boundaries are respected.
- Tenant isolation is implemented and verified where applicable.
- Documentation matches implementation.
- Relevant tests pass.

---

# Final Principle

Prisma represents persistence.

It does not define the business architecture.

Every model must have a clear owner, every relationship must be intentional, and every schema change must preserve the boundaries of Platform Core and its Business Domains.