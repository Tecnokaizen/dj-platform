---
title: Permissions Prisma Implementation
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-09
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - TASKS.md
  - ../roles/PRISMA.md
  - ../roles/DATA_MODEL.md
  - ../memberships/PRISMA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../../architecture/TENANCY.md
  - ../../../architecture/DATA.md
  - ../../../architecture/SECURITY.md
---

# Permissions Prisma Implementation

## Purpose

This document defines the intended Prisma and PostgreSQL implementation for the Platform Core Permissions module.

Permissions Foundation introduces:

```text
Permission

RolePermission
```

Canonical relationship:

```text
Role
        ↓
RolePermission
        ↓
Permission
```

Within tenant authorization:

```text
Profile
        ↓
OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

This document defines persistence implementation.

Authorization behavior remains defined by:

```text
SPEC.md

FLOWS.md

API.md
```

---

# Architectural Ownership

Permissions owns:

```text
Permission

RolePermission
```

Roles owns:

```text
Role
```

Memberships owns:

```text
OrganizationMembership
```

Permissions may require inverse Prisma relation fields on Role.

Those fields are physical schema requirements.

They do not transfer architectural ownership.

---

# Identifier Strategy

All new persisted Permissions entities use:

```text
UUID
```

Canonical pattern:

```prisma
id String @id @default(uuid()) @db.Uuid
```

Do not introduce:

```text
cuid()

autoincrement()

hard-coded UUID
```

for Permissions Foundation identifiers.

---

# Permission Model

Recommended Prisma model:

```prisma
model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique @db.VarChar(150)
  name        String   @db.VarChar(150)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  roleMappings RolePermission[]

  @@map("permissions")
}
```

---

# Permission.id

Canonical:

```prisma
id String @id @default(uuid()) @db.Uuid
```

Purpose:

```text
database identity
```

Application authorization should normally resolve Permissions through:

```text
Permission.key
```

rather than environment-specific UUID constants.

---

# Permission.key

Canonical:

```prisma
key String @unique @db.VarChar(150)
```

Examples:

```text
organizations.read

organizations.update

organizations.transfer_ownership

memberships.read

memberships.remove

invitations.create
```

The key is:

```text
required

globally unique

stable

semantic
```

---

# Permission Key Length

Recommended initial database limit:

```text
150 characters
```

This supports:

```text
Core namespaces

Domain namespaces

future nested resource names
```

without requiring unrestricted text.

Example future Domain key:

```text
copy.production.orders.update
```

The exact application validation remains stricter than the database length alone.

---

# Permission Key Validation

Prisma does not replace application-level semantic validation.

The application boundary should enforce:

```text
lowercase

dot-separated namespace

approved characters

no wildcard
```

Recommended conceptual pattern:

```text
^[a-z0-9_]+(\.[a-z0-9_]+)+$
```

Database uniqueness remains the final persistence guarantee.

---

# Permission.name

Canonical:

```prisma
name String @db.VarChar(150)
```

Human-readable label.

Example:

```text
Remove members
```

It does not participate in authorization decisions.

---

# Permission.description

Canonical:

```prisma
description String? @db.Text
```

Human-readable explanation of the capability.

Optional.

It must not contain executable policy.

---

# Permission.createdAt

Canonical:

```prisma
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
```

---

# Permission.updatedAt

Canonical:

```prisma
updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
```

Used for metadata/persistence updates.

A Permission key rename remains a migration operation.

---

# Permission Inverse Relation

Canonical:

```prisma
roleMappings RolePermission[]
```

This supports:

```text
Permission
→ RolePermission[]
```

Permissions owns both entities.

---

# Permission Table

PostgreSQL table:

```text
permissions
```

through:

```prisma
@@map("permissions")
```

---

# Permission Unique Constraint

Canonical:

```prisma
key String @unique
```

This creates the required uniqueness invariant:

```text
UNIQUE(key)
```

No duplicate semantic Permission may exist.

---

# Permission Additional Indexes

Do not add an additional normal index on:

```text
key
```

because the unique constraint already supports lookup.

Do not initially index:

```text
name

description

createdAt

updatedAt
```

without demonstrated query need.

---

# Permission Does Not Include organizationId

Do not implement:

```prisma
organizationId String @db.Uuid
```

inside Permission.

Initial Permissions are global platform capability definitions.

Tenant scope comes from:

```text
OrganizationMembership
```

---

# Permission Does Not Include roleId

Do not implement:

```prisma
roleId String @db.Uuid
```

inside Permission.

The many-to-many relationship is represented explicitly through:

```text
RolePermission
```

---

# Permission Does Not Include effect

Do not implement:

```prisma
effect PermissionEffect
```

Initial Permissions uses positive grants only.

---

# Permission Does Not Include status

Do not introduce:

```prisma
status PermissionStatus
```

during Foundation.

Permission lifecycle is controlled through explicit source-policy migrations.

---

# Permission Does Not Include hierarchy

Do not add:

```prisma
parentId String?
```

or equivalent inheritance structures.

Initial Permission grants are explicit.

---

# No Permission Enum

Do not model canonical Permission keys as:

```prisma
enum PermissionKey {
  ORGANIZATIONS_READ
  MEMBERSHIPS_REMOVE
}
```

Permission keys remain:

```text
String
```

because the catalog must support reusable Core and future Domain extensions without turning every capability addition into an enum architecture.

---

# RolePermission Model

Recommended Prisma model:

```prisma
model RolePermission {
  id           String   @id @default(uuid()) @db.Uuid
  roleId       String   @map("role_id") @db.Uuid
  permissionId String   @map("permission_id") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Restrict)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Restrict)

  @@unique(
    [roleId, permissionId],
    map: "role_permissions_role_permission_unique"
  )

  @@index(
    [permissionId],
    map: "role_permissions_permission_idx"
  )

  @@map("role_permissions")
}
```

---

# RolePermission.id

Canonical:

```prisma
id String @id @default(uuid()) @db.Uuid
```

RolePermission has its own persistence identity.

Its semantic uniqueness remains:

```text
roleId + permissionId
```

---

# RolePermission.roleId

Canonical:

```prisma
roleId String @map("role_id") @db.Uuid
```

Required relation:

```prisma
role Role @relation(
  fields: [roleId],
  references: [id],
  onDelete: Restrict
)
```

Roles owns:

```text
Role
```

Permissions owns:

```text
RolePermission
```

---

# RolePermission.permissionId

Canonical:

```prisma
permissionId String @map("permission_id") @db.Uuid
```

Required relation:

```prisma
permission Permission @relation(
  fields: [permissionId],
  references: [id],
  onDelete: Restrict
)
```

---

# RolePermission.createdAt

Canonical:

```prisma
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
```

This records creation of the current grant.

It is not a policy-change history.

Audit owns historical security events.

---

# No RolePermission.updatedAt Initially

Do not add:

```prisma
updatedAt DateTime @updatedAt
```

during Foundation unless the mapping acquires mutable fields.

A grant currently has two states:

```text
exists

does not exist
```

---

# RolePermission Unique Constraint

Canonical:

```prisma
@@unique(
  [roleId, permissionId],
  map: "role_permissions_role_permission_unique"
)
```

Required invariant:

```text
one Role
+
one Permission
=
at most one RolePermission
```

---

# Why Composite Uniqueness Is Required

Without it, persistence could contain:

```text
ADMIN → memberships.read

ADMIN → memberships.read
```

multiple times.

Authorization semantics require a set of grants, not duplicate rows.

---

# RolePermission Index Strategy

The composite unique constraint:

```text
(roleId, permissionId)
```

supports Role-first queries such as:

```text
get Permissions for this Role
```

Recommended additional index:

```prisma
@@index(
  [permissionId],
  map: "role_permissions_permission_idx"
)
```

This supports reverse lookups such as:

```text
which Roles hold this Permission?
```

---

# No Separate roleId Index Initially

Do not add:

```prisma
@@index([roleId])
```

unless query analysis proves it necessary.

The composite unique index beginning with:

```text
roleId
```

already supports normal Role-first lookup.

---

# RolePermission Table

PostgreSQL table:

```text
role_permissions
```

through:

```prisma
@@map("role_permissions")
```

---

# Role Inverse Relation

The existing Role model will require an inverse relation.

Conceptually:

```prisma
model Role {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique @db.VarChar(50)
  name        String   @db.VarChar(100)
  description String?  @db.Text
  isSystem    Boolean  @default(true) @map("is_system")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  permissionMappings RolePermission[]

  @@map("roles")
}
```

Do not replace the approved Role definition.

Only add the required inverse relation if not already present.

---

# Role Ownership Remains Unchanged

Adding:

```prisma
permissionMappings RolePermission[]
```

to Role does not mean Permissions owns Role.

Architecture remains:

```text
Roles
→ owns Role

Permissions
→ owns RolePermission
```

---

# RolePermission Does Not Include organizationId

Do not implement:

```prisma
organizationId String @db.Uuid
```

inside RolePermission during Foundation.

Canonical system:

```text
Role

Permission

RolePermission
```

are global policy.

Tenant scope is introduced through Membership.

---

# RolePermission Does Not Include membershipId

Do not implement:

```prisma
membershipId String @db.Uuid
```

This would create per-Membership Permission assignment.

Initial authorization must remain:

```text
OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

---

# RolePermission Does Not Include effect

Do not create:

```prisma
effect PermissionEffect
```

with:

```text
ALLOW

DENY
```

RolePermission existence is the positive grant.

Absence means deny.

---

# RolePermission Does Not Include Priority

Do not introduce:

```prisma
priority Int

weight Int

precedence Int
```

There is no initial conflict-resolution engine.

---

# RolePermission Does Not Include Inheritance

Do not add:

```prisma
inheritedFromRoleId String?
```

or:

```prisma
isInherited Boolean
```

Role inheritance is not part of Foundation.

---

# Referential Delete Policy

Recommended:

```text
RolePermission → Role
onDelete: Restrict

RolePermission → Permission
onDelete: Restrict
```

This prevents silent destruction of authorization policy when a referenced Role or Permission is deleted.

---

# Why Restrict

Authorization reference data is security-sensitive.

Avoid:

```text
delete Role
→ silently delete grants

delete Permission
→ silently delete grants
```

without explicit policy migration.

---

# No Cascading Authorization Cleanup

Do not use broad:

```prisma
onDelete: Cascade
```

for RolePermission relations during Foundation.

Capability retirement must be deliberate.

---

# Complete Prisma Foundation

The resulting relevant schema is conceptually:

```prisma
model Role {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique @db.VarChar(50)
  name        String   @db.VarChar(100)
  description String?  @db.Text
  isSystem    Boolean  @default(true) @map("is_system")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  permissionMappings RolePermission[]

  @@map("roles")
}

model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique @db.VarChar(150)
  name        String   @db.VarChar(150)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  roleMappings RolePermission[]

  @@map("permissions")
}

model RolePermission {
  id           String   @id @default(uuid()) @db.Uuid
  roleId       String   @map("role_id") @db.Uuid
  permissionId String   @map("permission_id") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Restrict)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Restrict)

  @@unique(
    [roleId, permissionId],
    map: "role_permissions_role_permission_unique"
  )

  @@index(
    [permissionId],
    map: "role_permissions_permission_idx"
  )

  @@map("role_permissions")
}
```

---

# Existing Schema Is Canonical

Before implementation, Cursor must inspect the actual current:

```text
prisma/schema.prisma
```

Do not overwrite existing approved fields merely because an example in this document differs in formatting or relation-field naming.

Required invariants matter more than mechanical copying.

---

# Required Invariants

The implementation must preserve:

```text
Permission.id
→ UUID

Permission.key
→ unique stable String

RolePermission.id
→ UUID

RolePermission.roleId
→ real Role foreign key

RolePermission.permissionId
→ real Permission foreign key

RolePermission
→ unique roleId + permissionId

Role delete
→ restricted while mappings exist

Permission delete
→ restricted while mappings exist
```

---

# Migration Scope

Permissions Foundation migration should introduce only the required authorization persistence.

Expected database changes:

```text
CREATE permissions

CREATE role_permissions

ADD Permission unique key

ADD RolePermission foreign keys

ADD RolePermission composite uniqueness

ADD RolePermission permissionId index
```

Potential Prisma-only schema change:

```text
add Role.permissionMappings inverse relation
```

---

# Migration Must Not Add

Do not introduce:

```text
Profile.roleId

Profile.permissions

Organization.roleId

Organization.permissions

Organization.ownerId

Organization.ownerUserId

OrganizationMembership.permissions

OrganizationMembership.permissionIds

Role.permissionsJson

Role.permissionFlags

Permission.organizationId

RolePermission.organizationId

MembershipPermission

OrganizationPermission

ProfilePermission
```

---

# No Role Redesign

Permissions implementation must not alter:

```text
Role.key semantics

Role global scope

Role system-role strategy

Role sortOrder semantics
```

Roles architecture is already defined.

---

# No Membership Redesign

Permissions migration must not change Membership ownership or lifecycle.

Do not alter:

```text
OrganizationMembership.roleId ownership

Membership status model

Invitation lifecycle
```

except where a separately approved integration migration requires it.

---

# Migration Naming

Use a clear migration name such as:

```text
add_permissions_foundation
```

or the project's approved migration naming convention.

Do not use ambiguous names such as:

```text
update_schema

changes

fix_permissions
```

---

# Migration Review

Before applying a Permissions migration, inspect generated SQL.

Verify:

```text
correct table names

UUID columns

foreign keys

unique constraints

Restrict behavior

no unrelated destructive operations

no accidental Role reconstruction

no Membership modification
```

---

# Migration Safety

If Prisma proposes destructive changes to existing:

```text
Role

Profile

Organization

OrganizationMembership
```

unexpectedly:

```text
STOP
```

Do not accept the migration automatically.

Investigate schema drift first.

---

# Development Migration

In development, use the project's approved Prisma migration workflow.

Do not:

```text
manually edit production schema

use db push as substitute for reviewed migrations

reset production data
```

---

# Prisma Validation

After schema modification run the project's actual Prisma validation commands.

At minimum:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

If package scripts provide canonical wrappers, prefer those.

---

# TypeScript Validation

After generated client changes:

```bash
npm run typecheck
```

must pass.

---

# Lint Validation

Run:

```bash
npm run lint
```

and resolve real issues.

Do not suppress authorization-related TypeScript errors with:

```text
any

ts-ignore

unsafe casting
```

without an explicit reason.

---

# Permission Seed Strategy

Canonical Permission rows are reference data.

They should be synchronized by:

```text
Permission.key
```

Do not seed using fixed UUID identity.

Conceptually:

```ts
await prisma.permission.upsert({
  where: {
    key: definition.key,
  },
  update: {
    name: definition.name,
    description: definition.description,
  },
  create: {
    key: definition.key,
    name: definition.name,
    description: definition.description,
  },
})
```

The exact implementation may use repositories/services rather than direct Prisma.

---

# Permission Seed UUID

Do not specify:

```ts
id: "hard-coded-uuid"
```

for canonical Permission records.

Let:

```prisma
@default(uuid())
```

generate persistence identity.

---

# Canonical Foundation Permission Catalog

Initial Core tenancy definitions:

```text
organizations.read

organizations.update

organizations.transfer_ownership

memberships.read

memberships.suspend

memberships.restore

memberships.remove

memberships.change_role

invitations.read

invitations.create

invitations.revoke

invitations.resend
```

Do not additionally create:

```text
memberships.invite
```

for invitation creation.

Canonical capability:

```text
invitations.create
```

---

# RolePermission Seed Strategy

The source policy uses semantic keys.

Conceptually:

```text
OWNER
→ organizations.read
→ organizations.update
→ ...
```

Synchronization resolves:

```text
Role.key
→ Role.id

Permission.key
→ Permission.id
```

then persists RolePermission.

---

# No Hard-Coded Role UUID

Do not implement:

```ts
const OWNER_ROLE_ID = "..."
```

for policy synchronization.

Use:

```text
Role.key = OWNER
```

to resolve the real Role row.

---

# No Hard-Coded Permission UUID

Do not implement:

```ts
const INVITATIONS_CREATE_PERMISSION_ID = "..."
```

Use:

```text
Permission.key = invitations.create
```

---

# RolePermission Upsert

A system-policy synchronization operation may conceptually use:

```text
roleId_permissionId
```

compound uniqueness.

Example shape:

```ts
await prisma.rolePermission.upsert({
  where: {
    roleId_permissionId: {
      roleId,
      permissionId,
    },
  },
  update: {},
  create: {
    roleId,
    permissionId,
  },
})
```

The exact generated Prisma compound key name must be verified from the actual schema/client.

Do not assume a generated property name without checking.

---

# Synchronization Is Not Authorization

Seed/sync code establishes policy.

Normal runtime authorization must not:

```text
create Permission

create RolePermission

repair policy
```

while evaluating access.

---

# Runtime Read Query

A Role's explicit Permissions may conceptually be loaded through:

```ts
await prisma.rolePermission.findMany({
  where: {
    roleId,
  },
  select: {
    permission: {
      select: {
        key: true,
      },
    },
  },
})
```

Repository/service implementation should determine final projections.

---

# Direct Permission Check Query

A lower-level mapping check may conceptually query:

```text
roleId

permission.key
```

through RolePermission.

Example concept:

```ts
await prisma.rolePermission.findFirst({
  where: {
    roleId,
    permission: {
      key: permissionKey,
    },
  },
  select: {
    id: true,
  },
})
```

This proves a Role mapping only.

It does not prove valid tenant Membership by itself.

---

# Tenant Context Still Required

Do not implement protected authorization as:

```text
roleId
+
permissionKey
→ allow
```

when `roleId` came from the client.

Correct protected flow:

```text
server resolves Membership
        ↓
server resolves Role
        ↓
Permissions checks mapping
```

---

# No Authorization From Role.key Alone

Do not query:

```text
Role.key = ADMIN
```

and infer capability.

Authorization depends on:

```text
RolePermission
```

---

# No Authorization From sortOrder

Do not query or compare:

```text
Role.sortOrder
```

to determine access.

`sortOrder` remains display/human ordering only.

---

# OWNER Prisma Behavior

Do not encode:

```text
OWNER
```

as a Prisma bypass.

No schema field should mean:

```text
allow all Permissions
```

OWNER gets explicit RolePermission rows like every other Role.

---

# No Permission Wildcards

Do not seed:

```text
*

organizations.*

memberships.*

invitations.*
```

RolePermission maps explicit Permission UUIDs only.

---

# No DENY Rows

Do not create:

```text
PermissionGrant

PermissionDeny

RolePermissionEffect
```

or equivalent models during Foundation.

---

# No Permission JSON

Do not place authorization blobs on Role.

Prohibited:

```prisma
permissions Json
```

or:

```prisma
permissionKeys String[]
```

Canonical persistence remains relational.

---

# No MembershipPermission Model

Do not introduce:

```prisma
model MembershipPermission {
  ...
}
```

during Foundation.

Per-Membership overrides are not approved architecture.

---

# No OrganizationPermission Model

Do not introduce:

```prisma
model OrganizationPermission {
  ...
}
```

during Foundation.

Tenant-specific Permission overrides are deferred.

---

# No ProfilePermission Model

Do not introduce:

```prisma
model ProfilePermission {
  ...
}
```

for tenant authorization.

Profile may hold different Roles across Organizations.

---

# No Role Inheritance Model

Do not introduce:

```text
Role.parentRoleId

RoleInheritance

RoleHierarchy
```

during Permissions Foundation.

---

# No Permission Inheritance Model

Do not introduce:

```text
Permission.parentPermissionId

PermissionInheritance
```

during Foundation.

---

# Domain Permissions

Future Domain Permissions use the same:

```text
permissions
```

table.

Example:

```text
dj.playlists.create

copy.orders.update
```

No separate:

```text
dj_permissions

copy_permissions
```

table is required.

---

# Domain RolePermission

Approved Domain default grants use the same:

```text
role_permissions
```

mapping table.

The Domain contributes semantic capability definitions/policy.

Permissions remains owner of persistence infrastructure.

---

# Domain Removal Safety

If a Domain capability is retired:

```text
do not blindly cascade-delete Permission
```

Use explicit migration/policy cleanup.

---

# Database Constraint Responsibilities

Database must enforce:

```text
Permission key uniqueness

RolePermission Role FK

RolePermission Permission FK

RolePermission pair uniqueness
```

Application layer additionally enforces:

```text
Permission key format

catalog ownership

canonical policy

tenant context

Membership state

Organization state

resource invariants
```

---

# Database Does Not Enforce Full Authorization

The existence of:

```text
RolePermission
```

does not itself verify:

```text
actor Membership ACTIVE

target Organization

resource tenant

business state
```

Those belong to application/Tenancy/Domain layers unless later explicitly added to RLS.

---

# RLS Boundary

Permissions Foundation schema provides relational data that future PostgreSQL policies could consult.

Initial architecture does not require a second Permission-specific authorization data model.

Membership-based RLS remains the first tenant-isolation layer.

---

# Permission-Aware RLS

If future direct client access requires it, PostgreSQL may query:

```text
OrganizationMembership

Role

RolePermission

Permission
```

through carefully reviewed helpers.

Do not introduce database helper functions during Permissions Foundation unless required by the approved access architecture.

---

# Prisma Repository Boundary

Recommended source ownership:

```text
src/core/modules/permissions/
├── repositories/
├── services/
├── constants/
├── schemas/
└── types/
```

Prisma-specific persistence should remain behind repository/service boundaries rather than spreading throughout:

```text
src/app

Domains

shared
```

---

# Generated Prisma Client

Generated Prisma types remain infrastructure-generated artifacts.

Do not move authorization business ownership into:

```text
src/generated/
```

Application code may consume generated types through controlled persistence boundaries.

---

# Transaction Boundary

Catalog and system policy synchronization may require transactions.

Conceptually:

```text
BEGIN

synchronize Permission catalog

resolve Roles

create approved RolePermission mappings

apply explicitly approved removals

validate critical state

COMMIT
```

If a required Role or Permission cannot be resolved:

```text
ROLLBACK
```

---

# Avoid Partial Authorization Policy

A deployment should not leave:

```text
half-created Permission catalog

partially created system Role policy
```

when synchronization was intended to be atomic.

Exact transaction strategy should match the implementation workflow.

---

# Unexpected Mappings

Persistence validation must detect mappings that are not in approved source policy.

Example:

```text
VIEWER
→ memberships.remove
```

This is security-sensitive drift.

Do not silently accept it.

---

# Automatic Removal Policy

Do not implement destructive:

```text
delete every RolePermission not in registry
```

without explicit reviewed synchronization behavior.

A missing mapping and an unexpected mapping are both security-relevant.

Detection comes first.

---

# Permission Removal Migration

Recommended controlled sequence:

```text
remove application use

update canonical policy

remove affected RolePermission rows

update Permission registry

apply explicit database/data migration

remove/deprecate Permission

validate

test
```

---

# Permission Rename Migration

Recommended sequence:

```text
approve new semantic key

update source constants

update policy registry

migrate persisted Permission key

update callers

invalidate caches

run tests
```

Do not create two permanent semantic aliases unless explicitly designed.

---

# RolePermission Removal

Removing one RolePermission row immediately revokes that Role's explicit grant.

Authorization cache must be invalidated if present.

---

# RolePermission Addition

Adding a RolePermission expands authorization.

Treat it as a security-relevant policy change.

---

# Seed Ordering

Recommended reference-data sequence:

```text
Roles synchronization
        ↓
Permissions synchronization
        ↓
RolePermission policy synchronization
```

Permissions policy synchronization must not assume canonical Roles exist without checking.

---

# Missing Role Dependency

If canonical Role data does not exist:

```text
STOP
```

Permissions must not invent:

```text
temporary OWNER

temporary ADMIN
```

Roles owns that dependency.

---

# Missing Membership Dependency

Permission catalog and RolePermission policy can exist without Membership rows.

However, tenant authorization is not operational until Membership/Tenancy integration exists.

Do not simulate Memberships inside Permissions.

---

# Testing Persistence

Required persistence tests should cover:

```text
Permission creation

Permission key uniqueness

Permission lookup by key

RolePermission creation

RolePermission pair uniqueness

foreign-key integrity

Role restriction

Permission restriction

catalog sync idempotency

policy sync idempotency
```

---

# Permission Key Uniqueness Test

Attempt:

```text
create memberships.read

create memberships.read again
```

Expected:

```text
database uniqueness prevents duplicate
```

Repository/service should translate expected persistence conflicts where appropriate.

---

# RolePermission Uniqueness Test

Attempt:

```text
ADMIN
+
memberships.read
```

twice.

Expected:

```text
only one mapping
```

---

# Invalid Role Foreign Key Test

Attempt RolePermission with nonexistent:

```text
roleId
```

Expected:

```text
database rejection
```

---

# Invalid Permission Foreign Key Test

Attempt RolePermission with nonexistent:

```text
permissionId
```

Expected:

```text
database rejection
```

---

# Delete Restricted Role Test

Given:

```text
Role
→ existing RolePermission
```

attempt Role deletion.

Expected:

```text
restricted
```

unless explicit policy cleanup occurs first.

---

# Delete Restricted Permission Test

Given:

```text
Permission
→ existing RolePermission
```

attempt Permission deletion.

Expected:

```text
restricted
```

---

# OWNER Persistence Test

Verify OWNER authorization exists through:

```text
RolePermission rows
```

not through:

```text
special Prisma field

special enum

special query bypass
```

---

# No Role Hierarchy Persistence Test

Verify authorization code does not depend on:

```text
Role.sortOrder
```

---

# Foundation Policy Test Data

Expected Core policy:

```text
OWNER
→ organizations.read
→ organizations.update
→ organizations.transfer_ownership
→ memberships.read
→ memberships.suspend
→ memberships.restore
→ memberships.remove
→ memberships.change_role
→ invitations.read
→ invitations.create
→ invitations.revoke
→ invitations.resend
```

```text
ADMIN
→ organizations.read
→ organizations.update
→ memberships.read
→ memberships.suspend
→ memberships.restore
→ memberships.remove
→ memberships.change_role
→ invitations.read
→ invitations.create
→ invitations.revoke
→ invitations.resend
```

```text
MANAGER
→ organizations.read
→ memberships.read
```

```text
MEMBER
→ organizations.read
```

```text
VIEWER
→ organizations.read
```

---

# Security Regression Test

Ensure persistence does not accidentally contain:

```text
ADMIN
→ organizations.transfer_ownership
```

unless the approved policy changes explicitly.

---

# New Permission Safety Test

Add a new Permission definition without RolePermission mappings.

Expected:

```text
all Roles deny it
```

including OWNER.

---

# No Automatic OWNER Grant

Policy synchronization must not contain logic such as:

```ts
if (role.key === "OWNER") {
  grantAllPermissions()
}
```

All OWNER mappings must appear explicitly in source policy.

---

# Prisma Error Translation

Raw Prisma/database errors should not leak through Permissions application interfaces.

Repositories/services should translate expected failures into stable application behavior where necessary.

Examples:

```text
duplicate Permission key

duplicate RolePermission mapping

missing foreign key
```

---

# Prisma Client Usage

Do not instantiate arbitrary Prisma clients inside individual authorization checks.

Use the project's approved Prisma infrastructure.

---

# Query Projection

Select only fields required by the operation.

For authorization checks, it may be sufficient to select:

```text
RolePermission.id
```

or:

```text
Permission.key
```

rather than hydrating full entities.

---

# Performance Principle

Expected hot query:

```text
Role
→ RolePermission
→ Permission
```

must be supported by:

```text
RolePermission composite unique index

Permission key unique index
```

Avoid premature indexing beyond actual query patterns.

---

# Cache Is Not Prisma Persistence

If effective Permission sets are cached:

```text
cache
```

is an optimization.

Do not add snapshot columns to Prisma models solely for cache convenience.

---

# Schema Formatting

Use project conventions:

```text
camelCase Prisma fields

snake_case PostgreSQL columns

plural snake_case tables
```

Examples:

```text
permissionId
→ permission_id

role_permissions
```

---

# Timestamp Convention

Use:

```prisma
@db.Timestamptz(6)
```

consistent with the existing Core persistence conventions.

---

# UUID Convention

Use:

```prisma
@db.Uuid
```

for all UUID foreign keys and IDs.

---

# Prisma Schema Ownership Comment

Optional schema comments may explain critical security invariants.

Do not duplicate the full architecture inside Prisma comments.

Documentation remains canonical for rationale.

---

# Implementation Preconditions

Before Cursor implements Permissions Prisma changes, confirm:

```text
Role model exists

Role UUID strategy matches approved architecture

Prisma schema location is confirmed

current migration history is clean

database connectivity works

Membership/Tenancy dependencies are understood
```

---

# Implementation Stop Conditions

Cursor must stop and report if it discovers:

```text
Role model does not match approved Roles docs

identifier strategy conflict

existing Permission model with different semantics

existing RolePermission model with conflicting ownership

migration proposes unrelated destructive changes

database state does not match migration history

required dependency is absent and would require new architecture
```

Do not improvise around these findings.

---

# AI Agent Rules

AI coding agents must not:

```text
use cuid()

create a duplicate Role model

create a duplicate User model

add Permission.organizationId

add RolePermission.organizationId

add Profile.permissions

add Profile.roleId

add Organization.permissions

add MembershipPermission

add OrganizationPermission

add ProfilePermission

add Role.permissionsJson

add permissionFlags

add wildcard Permission rows

add DENY effect

add Role inheritance

add Permission inheritance

use Role.sortOrder for authorization

hard-code OWNER UUID

hard-code Permission UUID

create temporary authorization architecture

use Cascade deletion casually
```

---

# Validation Commands

After implementation, run:

```bash
npx prisma format
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
```

Then run the relevant Permissions persistence tests.

Do not mark the task complete while validation fails.

---

# Migration Inspection Checklist

Before approving the generated migration:

```text
[ ] permissions table created

[ ] role_permissions table created

[ ] Permission id is UUID

[ ] RolePermission id is UUID

[ ] Permission key unique

[ ] role_id UUID

[ ] permission_id UUID

[ ] Role foreign key present

[ ] Permission foreign key present

[ ] RolePermission composite uniqueness present

[ ] permission_id reverse index present

[ ] delete behavior is conservative

[ ] no unrelated table dropped

[ ] no Profile.roleId added

[ ] no Organization owner field added

[ ] no Membership Permission column added

[ ] no Role hierarchy added
```

---

# Definition of Ready

Permissions Prisma implementation is ready when:

- Permission model is approved.
- RolePermission model is approved.
- UUID strategy is approved.
- Permission key uniqueness is approved.
- table and column mappings are approved.
- Role relation is approved.
- Permission relation is approved.
- composite uniqueness is approved.
- delete behavior is approved.
- canonical Permission catalog is approved.
- canonical system Role policy is approved.
- Roles Foundation exists in source before policy integration.
- migration history can be inspected safely.
- no competing authorization model exists.

---

# Definition of Done

Permissions Prisma Foundation is complete when:

- `Permission` exists in the active Prisma schema.
- `RolePermission` exists in the active Prisma schema.
- Permission IDs use UUID.
- RolePermission IDs use UUID.
- Permission key is unique.
- Permission key uses String persistence.
- Permission name is required.
- Permission description is nullable.
- Permission timestamps use project conventions.
- RolePermission references the canonical Role model.
- RolePermission references Permission.
- RolePermission pair uniqueness exists.
- reverse Permission lookup index exists.
- Role deletion is conservative.
- Permission deletion is conservative.
- Role inverse relation exists where Prisma requires it.
- no Permission organizationId exists.
- no RolePermission organizationId exists.
- no Membership Permission persistence exists.
- no Profile Permission persistence exists.
- no JSON Permission source of truth exists.
- no DENY persistence exists.
- no wildcard persistence exists.
- no Role inheritance persistence exists.
- no Permission inheritance persistence exists.
- no hard-coded Role UUID exists.
- no hard-coded Permission UUID exists.
- canonical Permission synchronization works.
- system RolePermission synchronization works.
- synchronization is idempotent.
- migration SQL has been reviewed.
- Prisma format passes.
- Prisma validation passes.
- Prisma generation passes.
- persistence tests pass.
- TypeScript passes.
- Lint passes.
- documentation matches implementation.

---

# Final Principle

Permissions persistence must remain relational and explicit.

```text
Role
        ↓
RolePermission
        ↓
Permission
```

Permission keys provide stable semantic identity.

UUIDs provide persistence identity.

Membership provides tenant scope.

RolePermission provides the explicit grant.

No wildcard exists.

No inheritance exists.

No DENY override exists.

OWNER receives Permissions through the same explicit mapping as every other Role.

The database protects structural integrity.

The application protects tenant context, lifecycle and authorization semantics.