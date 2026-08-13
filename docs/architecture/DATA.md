---
title: Data Architecture
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - CORE.md
  - IDENTITY.md
  - TENANCY.md
  - API.md
  - SECURITY.md
  - PRISMA_IMPLEMENTATION.md
  - PROJECT_STRUCTURE.md
  - ../core/README.md
---

# Data Architecture

## Purpose

This document defines the platform-wide principles for data ownership, persistence, access, relationships, identifiers, transactions, migrations and multi-tenant isolation.

It does not define every entity in the system.

Detailed data models belong to their architectural owner.

Platform Core module data models belong under:

```text
docs/core/modules/<module>/
```

Business-specific data models belong under:

```text
docs/domains/<domain>/
```

---

# Data Architecture Principle

Every persisted concept must have one canonical owner.

Conceptually:

```text
Identity data
→ Identity

Organization data
→ Organizations

Membership and invitation data
→ Memberships

Role definitions
→ Roles

Permission definitions and mappings
→ Permissions

Business-specific data
→ owning Domain
```

Data ownership must not be duplicated merely because several modules need to read the same entity.

---

# Core and Domain Data

Platform Core owns reusable SaaS data.

Domains own business-specific data.

Examples:

```text
Platform Core
├── Profile
├── Organization
├── OrganizationMembership
├── OrganizationInvitation
├── Role
├── Permission
└── RolePermission
```

Examples:

```text
DJ Domain
├── Artist
├── Track
├── Playlist
└── Festival
```

```text
Copy Domain
├── Order
├── Production Job
└── Delivery
```

The Core must not absorb Domain entities merely because they are persisted in the same PostgreSQL database.

---

# Identity Data

The canonical authentication identity source is:

```text
Supabase auth.users
```

Platform Core does not create a second Prisma:

```text
User
```

entity representing the same identity.

Application identity is represented through:

```text
Profile
```

under:

```text
src/core/identity/profile/
```

Profile belongs to Identity.

It is not an independent Platform Core module.

---

# No Duplicate User Model

Do not introduce:

```text
User
AppUser
PlatformUser
CoreUser
```

as parallel representations of the authenticated identity unless a future architectural decision explicitly changes the identity model.

The approved conceptual chain remains:

```text
Supabase auth.users
        ↓
Profile
```

Any persistence relationship between authentication identity and Profile must follow the approved Identity architecture and schema.

---

# Tenant Data

The canonical tenant entity is:

```text
Organization
```

Do not introduce parallel persisted tenant entities such as:

```text
Tenant
TenantAccount
Workspace
```

to represent the same architectural concept without an explicit architectural decision.

The canonical tenant identifier is:

```text
Organization.id
```

---

# Membership Data

Tenant belonging is represented through:

```text
OrganizationMembership
```

Conceptually:

```text
Profile
        ↓
OrganizationMembership
        ↓
Organization
```

Role assignment belongs to the Membership relationship.

Do not store the tenant Role directly on:

```text
Profile
```

or:

```text
Organization
```

---

# Role Data

Roles owns:

```text
Role
```

Initial canonical system Role definitions are global reference data.

The initial role model includes:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

A Role does not contain tenant membership by itself.

The tenant-specific assignment occurs through:

```text
OrganizationMembership.roleId
```

---

# Permission Data

Permissions owns:

```text
Permission
RolePermission
```

The initial authorization relationship is:

```text
OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

Permissions are explicit positive grants.

The absence of a RolePermission mapping means denial.

Do not persist competing authorization representations such as:

```text
Profile.permissionsJson

Membership.permissionsJson

Role.permissionsJson

Permission.organizationId

RolePermission.organizationId
```

in the Foundation model.

---

# Platform Data Ownership

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

Additional Core modules own their own reusable data when they are formally specified.

---

# Domain Data Ownership

Each business Domain owns its business entities and their lifecycle.

Examples:

```text
DJ Domain
→ music and editorial entities
```

```text
Copy Domain
→ copy-shop operational entities
```

A Domain may reference Platform Core entities when required.

This does not transfer ownership of the referenced Core entity to the Domain.

---

# Data Stack

Current persistence stack:

```text
PostgreSQL

Prisma ORM

Supabase

PostgreSQL Row Level Security where applicable
```

These technologies implement the architecture.

They do not define architectural ownership.

---

# Replaceability

Infrastructure should remain isolated behind deliberate boundaries where practical.

This does not mean every persistence technology is expected to be a drop-in replacement.

Database-specific capabilities may be intentionally used when they provide meaningful correctness or security benefits.

Examples may include:

```text
PostgreSQL partial indexes

RLS

database constraints

transactions
```

Any durable technology-specific dependency should remain documented.

---

# Data Access

There is no single universal runtime path for every operation.

Common application persistence flow:

```text
Application / Transport
        ↓
Application Service
        ↓
Repository
        ↓
Prisma
        ↓
PostgreSQL
```

Possible entry points include:

```text
Server Component

Server Action

Route Handler

trusted internal workflow

background process when introduced
```

The transport does not own persistence behavior.

---

# Repository Boundary

Repositories are the normal application persistence boundary.

Responsibilities may include:

```text
queries

persistence projections

persistence mapping

query composition

transaction participation
```

Repositories do not own business policy.

---

# Service Boundary

Services own reusable application behavior.

A Core or Domain service may:

```text
validate lifecycle state

coordinate repositories

enforce business invariants

coordinate transactions

call approved infrastructure adapters
```

The service decides why persistence occurs.

The repository decides how the owned data is persisted.

---

# Prisma Boundary

Prisma is a persistence implementation.

Application behavior should normally follow:

```text
Service
        ↓
Repository
        ↓
Prisma
```

Do not spread raw Prisma operations through:

```text
src/app

React components

React hooks
```

or unrelated business code.

---

# Generated Prisma Types

Generated Prisma models are persistence representations.

They are not automatically:

```text
public API contracts

Domain contracts

Server Action contracts

UI contracts
```

Use deliberate projections or DTOs when crossing architectural boundaries.

---

# Direct Database Access

Client-side code must not gain direct database authority merely for convenience.

Server-side persistence must follow the approved authentication, tenancy and authorization architecture.

Supabase or PostgreSQL capabilities do not bypass Core or Domain invariants.

---

# Identifiers

New Platform Core persisted entities use UUID identifiers unless an approved architectural decision specifies otherwise.

Canonical Prisma form:

```prisma
id String @id @default(uuid()) @db.Uuid
```

Do not introduce CUID as the default identifier strategy for new Platform Core modules.

---

# Semantic Identifiers

Database IDs and semantic identifiers solve different problems.

An entity may additionally expose:

```text
slug

key

external provider ID

business reference

public reference
```

when required by the owning capability.

Examples:

```text
Role.key

Permission.key

Article.slug

providerExternalId
```

---

# Internal IDs

Internal UUIDs are not business meaning.

Do not require users or integrations to understand internal database identifiers when a stable semantic identifier is more appropriate.

However, internal IDs are not categorically forbidden from appearing in server or API contracts.

Exposure depends on the purpose and security requirements of the contract.

---

# Stable Keys

Reference data may use stable semantic keys.

Examples:

```text
OWNER

ADMIN

invitations.create

organizations.update
```

Code should use approved semantic keys when behavior depends on semantic meaning.

Do not hard-code generated UUID values such as:

```text
OWNER_ROLE_ID = "..."
```

as semantic application constants.

---

# Timestamps

Persisted mutable entities should normally include:

```text
createdAt
updatedAt
```

when lifecycle and auditing needs justify them.

Additional timestamps may include:

```text
acceptedAt

revokedAt

publishedAt

archivedAt

deletedAt
```

according to the owning entity's lifecycle.

Do not add timestamps mechanically when they have no semantic use.

---

# Timestamp Type

Platform Core PostgreSQL timestamps should use timezone-aware persistence where defined by the module schema.

Canonical Prisma pattern:

```prisma
DateTime @db.Timestamptz(6)
```

Module-specific Prisma documents remain the source of truth for exact fields.

---

# Relationships

Relationships should represent actual semantic ownership and lifecycle.

Use explicit relation entities when the relationship itself has data or behavior.

Examples:

```text
OrganizationMembership

OrganizationInvitation

RolePermission

PlaylistTrack

OrderItem
```

Do not use hidden many-to-many relationships when the relationship requires:

```text
metadata

lifecycle

authorization

timestamps

ordering

auditability
```

---

# Relationship Ownership

A relationship entity must also have one canonical owner.

Examples:

```text
OrganizationMembership
→ Memberships

RolePermission
→ Permissions
```

The fact that a relation references two modules does not mean it has two owners.

---

# Foreign Keys

Foreign keys should preserve structural integrity.

Deletion behavior must be deliberate.

Possible strategies include:

```text
Restrict

Cascade

SetNull
```

Do not select deletion behavior merely for convenience.

Core module Prisma specifications define the approved behavior for their entities.

---

# Lifecycle Instead of Hard Delete

Entities with meaningful operational history should generally use explicit lifecycle state when deletion would destroy important information.

Example:

```text
OrganizationMembership

ACTIVE
SUSPENDED
REMOVED
```

A normal Membership removal does not require deleting the row.

Entity-specific lifecycle rules belong to the owning module.

---

# Transactions

Use database transactions when multiple persistence operations must succeed or fail atomically.

Example:

```text
Create Organization
+
Create initial OWNER Membership
```

must be atomic.

Canonical onboarding concept:

```text
BEGIN
        ↓
Create Organization
        ↓
Create OWNER Membership
        ↓
COMMIT
```

If the Membership cannot be created:

```text
ROLLBACK
```

---

# Transaction Scope

Transactions should remain:

```text
purposeful

bounded

predictable
```

Avoid unnecessary long-running transactions.

Do not perform slow or unreliable external network operations inside a database transaction unless the architecture explicitly requires and handles that behavior.

Examples to avoid inside normal database transactions:

```text
email provider calls

AI requests

remote HTTP APIs

large file transfers
```

---

# Cross-Module Transactions

A transaction may coordinate multiple Platform Core modules when an invariant requires it.

This does not transfer entity ownership.

Example:

```text
Organizations
→ owns Organization

Memberships
→ owns OrganizationMembership
```

The onboarding transaction may coordinate both.

---

# Constraints

Critical invariants should be enforced at the strongest appropriate layer.

Possible mechanisms include:

```text
application service validation

database foreign keys

unique constraints

partial unique indexes

database checks

PostgreSQL triggers or constraint triggers when justified
```

Do not rely solely on UI validation for data correctness.

---

# Database Constraints and Application Rules

Database constraints and application services are complementary.

Example:

```text
unique Membership per Organization + Profile
```

may be supported by a database unique constraint.

Example:

```text
sole OWNER cannot be removed
```

may require service-level coordination and potentially stronger PostgreSQL enforcement after architectural review.

Not every business invariant belongs in a simple database constraint.

---

# PostgreSQL-Specific Migrations

Some approved constraints may require PostgreSQL capabilities not represented directly by the active Prisma schema language.

When required:

```text
Prisma migration
+
reviewed raw PostgreSQL migration SQL
```

is acceptable.

Do not avoid a required invariant merely to remain ORM-pure.

---

# Search

Default search strategy should favor PostgreSQL capabilities before introducing dedicated search infrastructure.

Potential progression:

```text
normal indexed queries
        ↓
PostgreSQL Full Text Search
        ↓
PostgreSQL Trigram
        ↓
external search infrastructure when justified
```

The exact strategy depends on the Domain and workload.

---

# Search Ownership

Search behavior belongs to the owner of the searchable data.

Examples:

```text
DJ catalog search
→ DJ Domain

Organization member search
→ Memberships
```

Generic search infrastructure may be shared where appropriate.

Do not move search semantics into Shared solely because several features have search boxes.

---

# Indexes

Indexes should support actual access patterns.

Create indexes for:

```text
foreign-key traversal

frequent filters

stable sorting

unique invariants

tenant-scoped lookups

high-volume queries
```

where measurements or predictable query patterns justify them.

Avoid speculative indexing of every column.

---

# Query Performance

Prefer:

```text
explicit projections

bounded queries

appropriate indexes

pagination

batching where appropriate
```

Avoid:

```text
unbounded collections

accidental N+1 queries

unnecessary relation loading

returning entire records when only a projection is needed
```

Performance optimization should preserve ownership and correctness.

---

# Pagination

Collections that can grow materially must be deliberately bounded.

Possible strategies:

```text
offset pagination

cursor pagination

explicit maximum result limits
```

Pagination strategy belongs to the query use case.

Do not choose pagination solely from whether a view is public or administrative.

---

# Imports

Imports are untrusted data-ingestion workflows.

A typical import may include:

```text
Upload
        ↓
Validation
        ↓
Parsing
        ↓
Normalization
        ↓
Application Validation
        ↓
Persistence
        ↓
Result / Report
```

The exact workflow depends on the Domain and risk profile.

---

# Import Preview

Preview is useful when:

```text
users need to inspect changes

imports are destructive

mapping is ambiguous

large batches require confirmation
```

Preview is not mandatory for every import.

Simple trusted or automated imports may use a different approved workflow.

---

# Import Transactions

Do not assume an entire large import should execute inside one database transaction.

Transaction strategy should consider:

```text
dataset size

failure recovery

idempotency

partial progress

resource usage

business requirements
```

Large imports may later require background Jobs or Queue infrastructure.

---

# External Data

External provider data is untrusted.

Validate and normalize external data before allowing it to affect canonical application state.

This includes:

```text
external APIs

webhooks

CSV imports

provider SDK responses

AI-generated structured data
```

---

# Canonical Data

External data must not silently redefine canonical Platform Core entities.

Example:

```text
external CRM organization
```

does not automatically become a second canonical tenant identity.

Integrations map external concepts into approved internal ownership.

---

# AI-Generated Data

AI output is untrusted input.

If AI output affects:

```text
database state

publication

automation

authorization-sensitive data

external actions
```

it must pass runtime validation and the owning Core or Domain invariants.

---

# Multi-Tenancy

Platform Core is multi-tenant by design.

Canonical tenant:

```text
Organization
```

Tenant belonging:

```text
OrganizationMembership
```

Normal tenant authorization:

```text
Authenticated Identity
        ↓
Profile
        ↓
Organization
        ↓
ACTIVE OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

---

# Tenant Scope

Tenant-owned operational data must have an unambiguous path to its Organization.

The exact relation may differ by entity.

Examples:

```text
direct organizationId

or

relationship through a parent entity
```

Do not duplicate `organizationId` mechanically on every table if ownership is already explicit and safe through another required relationship.

---

# Cross-Tenant Isolation

A tenant-scoped query must not rely on client-provided tenant values as authority.

Tenant scope must be resolved server-side from trusted context.

Cross-tenant access must be denied unless an explicitly approved platform-level capability exists.

---

# RLS

Row Level Security may provide database-level tenant row isolation.

RLS does not replace application Permissions.

Conceptually:

```text
RLS
→ which tenant rows may be accessed
```

```text
Permissions
→ which application capabilities may be performed
```

```text
Core / Domain service
→ whether this operation is valid for the resource state
```

These mechanisms form defense in depth.

---

# RLS Ownership

Platform-wide tenancy architecture defines the general RLS model.

Domain-specific RLS policies belong with the Domain data model when they protect Domain tables.

RLS should follow the same canonical tenant model:

```text
Organization
+
Membership
```

rather than inventing a parallel authorization model.

---

# Platform Administration

Platform-level administration, if introduced, must remain separate from ordinary tenant Membership authorization.

Do not create cross-tenant access simply by assigning a powerful tenant Role.

Any future platform-administration data model requires explicit architecture.

---

# Migrations

Database schema changes are version-controlled migrations.

Rules:

```text
review schema changes

review generated SQL

test migrations

preserve production data

document destructive changes

prepare migration strategy for incompatible changes
```

Do not modify an already-applied production migration merely to make history look cleaner.

---

# Destructive Migrations

Destructive changes require deliberate planning.

Examples:

```text
drop column

change identifier strategy

collapse entities

change ownership model

change tenant key

change authentication mapping
```

Such changes may require:

```text
backup

data migration

compatibility phase

verification

rollback or recovery strategy
```

---

# Schema Evolution

Schema evolution must preserve architectural ownership.

A migration is not allowed to silently introduce:

```text
Profile.roleId

Organization.ownerId

Permission.organizationId

duplicate User model

duplicate Tenant model
```

when those concepts contradict approved architecture.

---

# Seed Data

Stable system reference data may be synchronized through idempotent seed or synchronization processes.

Examples:

```text
Roles

Permissions

RolePermission policy
```

Semantic keys are canonical for synchronization.

Generated UUID values must not be hard-coded as semantic identifiers.

---

# Seed Safety

Seed and synchronization processes must distinguish:

```text
required reference data

application-created tenant data

business data
```

Do not use seed scripts as uncontrolled production mutation tools.

---

# Backups

Production backup requirements belong primarily to operational architecture.

At the data architecture level, backups must support recovery of canonical application data.

Production strategy should include:

```text
automated backups

off-site or independent recovery copies where appropriate

encryption

retention policy

restore verification
```

A backup strategy is incomplete if restoration has never been validated.

Detailed procedures belong under:

```text
docs/operations/
```

---

# Data Security

Data architecture must protect:

```text
tenant isolation

authentication relationships

authorization data

personal data

provider credentials

sensitive operational data
```

Sensitive values should not be persisted unless the application genuinely requires them.

---

# Secrets

Secrets do not belong in normal application tables merely because persistence is convenient.

Examples:

```text
provider API keys

session secrets

raw invitation tokens

database credentials
```

Secret storage follows the approved security architecture.

---

# Invitation Tokens

Raw invitation tokens are transient secrets.

Memberships persists only the approved secure representation, such as:

```text
tokenHash
```

Raw tokens must not be persisted or logged.

---

# Auditability

Data changes with meaningful security or operational impact may require audit records.

Audit requirements should be introduced through the future Audit Core capability or other approved mechanism.

Do not duplicate ad hoc audit systems independently in every Domain.

---

# Data Retention

Retention is entity-specific.

Do not assume every row must exist forever or that every entity should be hard-deleted.

Retention decisions must consider:

```text
business requirements

legal requirements

security

auditability

storage cost

recovery needs
```

---

# Soft Delete

Soft deletion is not a universal default.

Use explicit lifecycle states or deletion timestamps when the entity semantics justify them.

Do not automatically add:

```text
deletedAt
```

to every table.

---

# Domain Data Documentation

Business-specific schemas belong with their Domain.

For example:

```text
docs/domains/dj/database/
```

may document DJ-specific data.

The Domain documentation must not redefine Platform Core entities.

---

# Core Module Data Documentation

Every substantial Core module should document its persisted entities in:

```text
DATA_MODEL.md
```

and Prisma implementation in:

```text
PRISMA.md
```

These documents define the module-specific schema details.

This architecture document defines platform-wide principles.

---

# Data Ownership Checklist

Before adding a persisted field or entity, answer:

```text
1. Who owns this data?

2. Is it Platform Core or Domain data?

3. Does an existing canonical entity already represent it?

4. Is it tenant scoped?

5. How is tenant scope established?

6. Does it require a new relationship?

7. Does the relationship itself have lifecycle or metadata?

8. Which invariants require database enforcement?

9. Which invariants belong to application services?

10. Does the change alter identity, tenancy or authorization?
```

If ownership is unclear, resolve architecture before modifying the schema.

---

# Forbidden Data Practices

Do not:

```text
create a duplicate Prisma User for Supabase identity

create a separate Profiles module

store Role directly on Profile

store Organization ownership through ownerId

create a parallel Tenant model

create TenantMembership beside OrganizationMembership

create tenant-specific Role copies in the Foundation model

store authorization in permissionsJson

use Role.sortOrder for authorization

special-case OWNER as allow-all

trust client organizationId as tenant authority

duplicate Core entities inside Domains

let generated Prisma models define application ownership

expose entire persistence models by default

run unbounded queries without deliberate limits

introduce schema changes without migrations

edit applied migrations casually

persist raw invitation tokens

use AI output as trusted canonical data
```

---

# Future Data Capabilities

Potential future infrastructure may include:

```text
read replicas

background processing

analytics pipelines

warehouse integration

specialized search infrastructure

event-driven data processing
```

These capabilities should be introduced when actual workload or product requirements justify them.

---

# Event Sourcing

Event sourcing is not the default persistence model.

It should only be considered if a future Domain or Platform capability demonstrates a concrete requirement that justifies the operational and conceptual complexity.

Do not design current entities around speculative future event sourcing.

---

# Analytics

Operational application data and analytics data have different concerns.

Future analytics infrastructure may derive data from canonical application state.

Analytics requirements must not distort transactional schemas prematurely.

---

# Final Principle

Data follows architectural ownership.

Supabase authentication establishes the external authentication identity.

Profile represents application identity.

Organization establishes the tenant.

OrganizationMembership establishes tenant belonging.

Role establishes the authorization position.

RolePermission and Permission establish explicit capability grants.

Domains own their business data.

Repositories own application persistence access.

Prisma implements persistence but does not define architecture.

PostgreSQL constraints strengthen correctness.

RLS strengthens tenant isolation.

Application services enforce lifecycle and business invariants.

Every persisted concept must have one canonical meaning and one clear owner.