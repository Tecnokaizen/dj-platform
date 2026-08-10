---
title: Roles Data Model
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../organizations/SPEC.md
  - ../organizations/DATA_MODEL.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../../architecture/SECURITY.md
---

# Roles Data Model

## Purpose

This document defines the data model owned by the Platform Core Roles module.

Roles provides the canonical authorization roles referenced by Organization Memberships.

The initial implementation uses a global catalog of stable system Roles.

Roles owns:

```text
Role
```

Roles does not own:

```text
OrganizationMembership
MembershipStatus
Permission
Permission assignment
Organization
Profile
Invitation
```

---

# Architectural Ownership

The tenancy and authorization model is divided across several Platform Core modules.

```text
Identity
│
└── Profile

Organizations
│
└── Organization

Memberships
│
└── OrganizationMembership

Roles
│
└── Role

Permissions
│
└── Permission
```

Each persisted entity has one architectural owner.

Relationships between entities do not transfer ownership.

---

# Core Entity

The Roles module introduces one primary persisted entity:

```text
Role
```

Initial canonical records:

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

These Roles are global Platform Core reference data.

They are not owned by individual Organizations.

---

# Role

A Role represents a stable authorization position that may be assigned to an Organization Membership.

Conceptually:

```text
Organization
      ↓
OrganizationMembership
      ↓
Role
```

The Role describes the semantic position.

Memberships owns the assignment.

Permissions will later define what capabilities are associated with that Role.

---

# Initial Role Fields

Recommended fields:

```text
Role

id
key
name
description
isSystem
sortOrder
createdAt
updatedAt
```

No Organization foreign key is required in the initial model.

---

# id

Immutable Role persistence identifier.

Platform identifier strategy:

```text
UUID
```

Recommended Prisma representation:

```prisma
id String @id @default(uuid()) @db.Uuid
```

Application logic should not depend on hard-coded Role UUIDs.

The canonical semantic identity of a system Role is its:

```text
key
```

---

# key

Stable machine-readable Role identifier.

Required initial keys:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Requirements:

- Required.
- Unique.
- Stable.
- Machine readable.
- Uppercase for canonical system Roles.
- Independent from translated display names.

Recommended persistence:

```text
String
```

with a database uniqueness constraint.

Do not use localized text as the Role key.

---

# Why key Is Not the UUID

The UUID identifies a database record.

The Role key identifies its semantic meaning.

Example:

```text
UUID
→ 7b7c...

key
→ OWNER
```

Platform workflows should resolve required system Roles by:

```text
key
```

rather than hard-coding environment-specific UUIDs.

Example:

```text
getRoleByKey("OWNER")
```

---

# Why key Is Not Initially a Database Enum

The initial catalog contains five canonical system Roles.

However, storing `key` as a string leaves room for controlled future evolution without forcing the authorization architecture into a database enum.

The database still enforces:

```text
UNIQUE(key)
```

Canonical keys remain governed by Platform Core.

Custom Roles remain deferred.

---

# name

Human-readable Role name.

Initial values may be:

```text
Owner
Admin
Manager
Member
Viewer
```

The display name:

- is not the canonical semantic identifier;
- may eventually be localized;
- must not drive authorization logic.

Application code must use Role identity or Role key rather than comparing localized names.

---

# description

Optional human-readable explanation of the Role.

Example:

```text
Owner

Has ultimate administrative responsibility for the Organization.
```

Description is informational.

Authorization must never depend on description text.

---

# isSystem

Indicates whether a Role is managed by Platform Core.

Initial system Roles use:

```text
true
```

Recommended conceptual field:

```text
isSystem
```

Initial default:

```text
true
```

System Roles:

- are created by Platform Core;
- use canonical keys;
- are required by platform workflows;
- cannot be casually deleted;
- are not Organization-owned.

---

# sortOrder

Optional numeric ordering used for predictable presentation.

Example:

```text
OWNER    → 10

ADMIN    → 20

MANAGER  → 30

MEMBER   → 40

VIEWER   → 50
```

`sortOrder` is presentation metadata.

It must not become a permission engine.

The following is invalid:

```text
if role.sortOrder < 30
    allow operation
```

Authorization must use Roles and Permissions explicitly.

---

# createdAt

Timestamp indicating when the Role record was created.

Required.

---

# updatedAt

Timestamp indicating the most recent persisted Role metadata update.

Required.

---

# Canonical Role Catalog

Initial records:

| Key | Name | Description | System | Suggested Order |
|---|---|---|---:|---:|
| OWNER | Owner | null | Yes | 10 |
| ADMIN | Admin | null | Yes | 20 |
| MANAGER | Manager | null | Yes | 30 |
| MEMBER | Member | null | Yes | 40 |
| VIEWER | Viewer | null | Yes | 50 |

The table defines initial reference data.

It does not define Permission inheritance.

For Roles Foundation, canonical `Role.description` is `null`.

Human-readable description copy is deferred until explicitly approved.

Any description field example elsewhere in this document is illustrative only and is not Foundation seed metadata.

---

# OWNER

Canonical key:

```text
OWNER
```

OWNER is required by Organization ownership workflows.

Responsibilities across modules:

```text
Roles
→ defines OWNER

Memberships
→ assigns OWNER to a Membership

Organizations
→ requires exactly one active OWNER Membership
```

Roles does not store:

```text
ownerOrganizationId
ownerUserId
ownerMembershipId
```

Ownership exists through the Membership relationship.

---

# ADMIN

Canonical key:

```text
ADMIN
```

Represents broad administrative responsibility below OWNER.

ADMIN does not imply Organization ownership.

Exact administrative capabilities belong to Permissions.

---

# MANAGER

Canonical key:

```text
MANAGER
```

Represents operational management responsibility.

Exact capabilities belong to Permissions.

---

# MEMBER

Canonical key:

```text
MEMBER
```

Represents normal Organization participation.

Exact capabilities belong to Permissions.

---

# VIEWER

Canonical key:

```text
VIEWER
```

Represents read-oriented Organization participation.

Exact capabilities belong to Permissions.

---

# Role Hierarchy

The canonical Roles have an intuitive ordering:

```text
OWNER
  ↓
ADMIN
  ↓
MANAGER
  ↓
MEMBER
  ↓
VIEWER
```

This ordering is descriptive.

It must not automatically implement:

```text
permission inheritance
```

or:

```text
numeric authorization
```

Permission behavior belongs to the Permissions module.

---

# No Permission Columns

The Role model must not contain fields such as:

```text
canCreate
canUpdate
canDelete
canManageUsers
canManageBilling
permissionsJson
permissionFlags
```

These would make Roles a competing Permission engine.

Permissions belong to the Permissions module.

---

# No Organization Ownership

The initial Role model must not contain:

```text
organizationId
```

Initial architecture uses:

```text
Global System Roles
```

not:

```text
Organization-Owned Roles
```

The same canonical Role may be referenced from Memberships across many Organizations.

---

# Example

```text
Role
ADMIN

        ┌───────────────────────┐
        │                       │
        ▼                       ▼

Membership A              Membership B

Organization A            Organization B
```

Both Memberships reference the same canonical ADMIN Role.

The Role itself contains no tenant-specific data.

---

# Membership Relationship

Memberships owns:

```text
OrganizationMembership
```

Roles owns:

```text
Role
```

Conceptual relationship:

```text
OrganizationMembership
        ↓
      roleId
        ↓
       Role
```

The Memberships data model will define the foreign key.

Roles does not persist Role assignment independently.

---

# Active Membership Invariant

An active Organization Membership must eventually reference a valid Role.

Conceptually:

```text
MembershipStatus = ACTIVE

+

roleId references valid Role
```

Invalid production state:

```text
ACTIVE Membership
        ↓
No Role
```

The Memberships module owns enforcement of Membership validity.

Roles provides the valid Role reference.

---

# Membership Assignment Ownership

Roles may provide:

```text
getRoleById

getRoleByKey

resolveRequiredRole
```

Roles does not provide persistence operations such as:

```text
assignRoleToMembership

removeRoleFromMembership
```

as Role-owned persistence.

Those mutations change:

```text
OrganizationMembership
```

and therefore belong to Memberships or to a cross-module authorization workflow.

---

# Role Assignment

Conceptually:

```text
Authorized Operation
        ↓
Resolve Membership
        ↓
Resolve Role
        ↓
Validate Assignment
        ↓
Memberships Updates roleId
```

Roles provides the Role definition.

Memberships persists the assignment.

Permissions determines whether the acting user may perform the operation once the Permissions module exists.

---

# Ownership Transfer Relationship

Organization ownership transfer uses the canonical OWNER Role.

Conceptually:

```text
Target Membership
        ↓
Resolve Role key = OWNER
        ↓
Memberships assigns OWNER roleId
```

Roles does not mutate Organization ownership directly.

---

# Permissions Relationship

Future conceptual relationship:

```text
Role
  ↓
Role Permission Mapping
  ↓
Permission
```

The exact persistence model for Role-to-Permission assignment is deferred to the Permissions specification.

Possible physical relations must not be added to Roles until that specification is approved.

---

# Permission Ownership

Permissions owns:

```text
Permission
Permission semantics
Permission evaluation
Role-to-Permission authorization mapping
```

Roles owns only:

```text
Role
```

This boundary prevents authorization logic from being distributed unpredictably.

---

# Domain Permissions

Business Domains may define business-specific Permission requirements.

Example:

```text
Domain A

RESOURCE_VIEW
RESOURCE_CREATE
RESOURCE_UPDATE
```

The Permissions module may map those capabilities to canonical Platform Roles.

Roles remains reusable and business agnostic.

---

# Custom Roles

Custom Roles are not part of the initial data model.

Do not add:

```text
organizationId
createdBy
customPermissions
templateId
parentRoleId
```

preemptively.

A future Organization-specific Role model may require a different structure.

That evolution must be driven by validated product requirements.

---

# Future Custom Role Possibility

A future architecture might support:

```text
Role

id
organizationId?
key
name
isSystem
...
```

or a separate custom-role model.

That design is intentionally not decided now.

Do not prepare the schema for hypothetical custom Roles through nullable fields.

---

# System Role Immutability

Canonical system Role semantics must remain stable.

The following must not be casually changed:

```text
key
isSystem
canonical meaning
```

Particularly:

```text
OWNER
```

is required by the tenancy architecture.

Removing or changing its semantic meaning would affect Organization ownership.

---

# Role Deletion

Initial system Roles must not support normal deletion.

Deleting a Role could invalidate:

```text
OrganizationMembership.roleId
```

and therefore break tenant authorization.

Normal application behavior should treat canonical system Roles as durable reference data.

---

# Role Retirement

Role retirement is deferred.

If required in the future, it must define:

- Existing Membership reassignment.
- Permission migration.
- Historical data behavior.
- Audit behavior.
- API compatibility.
- Seed behavior.

Do not implement generic soft deletion merely because Role retirement might exist someday.

---

# Role Status

The initial Role model does not require:

```text
status
deletedAt
archivedAt
```

Canonical system Roles are stable reference data.

Lifecycle fields should only be introduced when a real lifecycle requirement exists.

---

# Seed Ownership

Roles owns seed initialization for canonical Roles.

Required system data:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Business Domains must not create their own duplicate copies of these Roles.

---

# Seed Strategy

Role seeding must be idempotent.

Preferred semantic lookup:

```text
key
```

Conceptually:

```text
upsert OWNER by key

upsert ADMIN by key

upsert MANAGER by key

upsert MEMBER by key

upsert VIEWER by key
```

Running the seed repeatedly must not create duplicate Roles.

---

# UUID and Seeds

Seed scripts should not require application code to know hard-coded Role UUID values.

Canonical identity is resolved through:

```text
key
```

UUID remains the persistence primary key.

This allows different environments to contain different generated UUID values while preserving identical Role semantics.

---

# Seed Mutation Policy

Seed execution may:

- Create missing canonical Roles.
- Restore approved metadata where explicitly intended.

Seed execution must not silently:

- Delete unknown Roles.
- Change Membership assignments.
- Rewrite authorization policy.
- Remove canonical Roles.

Seed behavior must remain predictable.

---

# Missing Canonical Role

A required canonical Role missing from persistence is a platform configuration error.

Example:

```text
OWNER not found
```

Expected behavior:

```text
Fail safely
```

Not:

```text
Create temporary OWNER string
```

Not:

```text
Use ADMIN instead
```

Not:

```text
Create a Role inside Organizations
```

---

# Data Ownership

The Roles module owns:

```text
Role
```

Memberships owns:

```text
OrganizationMembership
```

Organizations owns:

```text
Organization
```

Permissions owns:

```text
Permission
```

Identity owns application identity behavior around:

```text
Profile
```

Business Domains own their business entities.

---

# Global Data

Initial Roles are global Platform Core reference data.

Therefore Role queries do not require:

```text
organizationId
```

Role assignment is tenant-scoped only through:

```text
OrganizationMembership
```

---

# Tenant Isolation

The Role catalog itself is not private tenant data.

However, a user must never gain tenant authority merely because a global Role exists.

Authorization requires:

```text
Authenticated Profile
        ↓
Valid OrganizationMembership
        ↓
Assigned Role
        ↓
Required Permission
```

The existence of:

```text
ADMIN
```

does not grant any user ADMIN authority by itself.

---

# Security Boundary

Never accept client claims such as:

```text
role = "OWNER"
```

or:

```text
roleId = <uuid>
```

as sufficient authorization.

The server must resolve the actual Membership and persisted Role relationship.

---

# Role Lookup

Typical reads include:

```text
findById
findByKey
listSystemRoles
```

The Role repository owns persistence lookup.

Services may provide higher-level operations such as:

```text
resolveRequiredRole
```

---

# Required Role Resolution

Critical platform workflows may require a canonical Role.

Example:

```text
createOrganization()
        ↓
resolveRequiredRole("OWNER")
```

If the Role does not exist:

```text
fail
```

The workflow must not partially continue.

---

# Constraints

Initial expected constraints:

```text
id
→ UUID primary key

key
→ required + unique

name
→ required

isSystem
→ required

sortOrder
→ required or approved default
```

Description may be nullable.

---

# Role Key Uniqueness

Database uniqueness must enforce:

```text
UNIQUE(key)
```

Application validation alone is insufficient.

The database remains the final concurrency boundary.

---

# Indexes

The unique `key` constraint provides an index suitable for canonical Role resolution.

Additional initial indexes should be minimal.

Possible index:

```text
isSystem
```

only if real query patterns justify it.

Do not create speculative indexes.

---

# Naming

Prisma model:

```text
Role
```

Database table:

```text
roles
```

Application fields use:

```text
camelCase
```

Database fields may use:

```text
snake_case
```

when explicitly mapped.

---

# Timestamps

Recommended:

```text
createdAt
updatedAt
```

These support:

- operational debugging;
- migration analysis;
- future audit correlation.

No additional lifecycle timestamps are required initially.

---

# Referential Behavior

Memberships will reference Role.

The Memberships specification must define the foreign key and referential behavior.

Roles should not be destructively deleted while referenced.

Preferred principle:

```text
Role deletion
→ restricted
```

for canonical system Roles.

Exact Prisma referential action belongs to the Memberships persistence design because Memberships owns the foreign key.

---

# Physical Prisma Schema

The project uses a shared:

```text
prisma/schema.prisma
```

Therefore:

```text
Role
Organization
OrganizationMembership
Permission
```

may eventually appear physically in the same file.

Physical co-location does not change architectural ownership.

---

# Application Contracts

Generated Prisma Role types are persistence types.

When a stable application contract is required, use an explicit application type or DTO.

Example:

```text
RoleDto
```

Potential fields:

```text
id
key
name
description
isSystem
sortOrder
```

Do not expose persistence internals unnecessarily.

---

# Events

The initial Roles Foundation does not require domain events for normal reads.

Possible future events:

```text
role.created
role.updated
role.retired
```

Role assignment changes affect Memberships and should follow the ownership model defined by Memberships and Audit.

---

# Audit

Canonical Role catalog changes may eventually be audited.

Audit persistence belongs to:

```text
Audit
```

The Roles module must not implement its own audit table.

---

# Migration Considerations

Initial Roles migration should introduce only Roles-owned persistence.

Expected:

```text
roles
```

It must not introduce:

```text
organization_memberships
permissions
role_permissions
organization_roles
```

unless the owning modules have approved specifications and are intentionally implemented in the same coordinated milestone.

---

# Existing Data

Introducing Roles does not automatically modify existing users or Domain data.

Existing Profiles may remain:

```text
Profile
↓
No Membership
↓
No Role assignment
```

This is valid before Memberships is implemented.

---

# Existing Organizations

If Organization records already exist before Memberships integration, creating Roles does not automatically assign ownership.

Ownership is established later through the coordinated tenancy integration.

Do not infer Membership relationships from Organization records.

---

# Implementation Dependency

Roles Foundation can be implemented independently from Memberships.

Required dependencies:

```text
Prisma
PostgreSQL
UUID strategy
```

Memberships will then depend on Roles.

---

# Implementation Sequence

```text
Identity
   ✅
    ↓
Organizations Foundation
    ↓
Roles Foundation
    ↓
Memberships Foundation
    ↓
Tenancy Integration
    ↓
Permissions
```

This order ensures Memberships can reference a real canonical Role from its first implementation.

---

# Deferred Data

Explicitly deferred:

```text
Organization-specific Roles
Custom Role creation
Role hierarchy persistence
Role inheritance
Role templates
Role cloning
Role retirement state
Permission mappings
Role administration UI
Domain-owned Role types
```

Do not add schema fields for these capabilities preemptively.

---

# Data Model Validation Checklist

Before implementation verify:

```text
[ ] Role is owned by Roles

[ ] Role uses UUID

[ ] key is stable and unique

[ ] Canonical system roles are defined

[ ] Role is global initially

[ ] No organizationId exists

[ ] No Membership persistence exists

[ ] No Permission persistence exists

[ ] No permission flags exist

[ ] No custom Role fields exist

[ ] Seed strategy uses key

[ ] OWNER can be resolved reliably

[ ] System Roles cannot be casually deleted
```

---

# Definition of Ready

The Roles data model is ready when:

- Role ownership is explicit.
- Canonical system Roles are approved.
- UUID strategy is confirmed.
- Role key strategy is approved.
- Global initial scope is approved.
- `organizationId` is explicitly absent.
- Membership assignment ownership belongs to Memberships.
- Permission ownership belongs to Permissions.
- OWNER semantics are approved.
- Seed strategy is understood.
- Referential implications with Memberships are understood.
- Custom Roles are deferred.

---

# Definition of Done

Roles persistence is complete when:

- Role model exists.
- UUID strategy is preserved.
- `key` uniqueness is enforced.
- Canonical Roles can be persisted.
- System Roles can be resolved by key.
- Seed is idempotent.
- OWNER is available before Memberships integration.
- No Organization-specific Role implementation exists.
- No Membership persistence exists inside Roles.
- No Permission engine exists inside Roles.
- Relevant tests pass.
- Prisma validation passes.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.

---

# Final Principle

Roles owns the canonical definition of authority roles.

Memberships owns who receives a Role.

Organizations owns where that Membership belongs.

Permissions owns what that Role is allowed to do.

The Role model must remain small, stable and business agnostic.