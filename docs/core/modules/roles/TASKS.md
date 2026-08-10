---
title: Roles Tasks
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - ../organizations/TASKS.md
  - ../organizations/API.md
  - ../../../architecture/CORE.md
  - ../../../architecture/DATA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../../architecture/SECURITY.md
---

# Roles Tasks

## Purpose

This document defines the implementation tasks for the Platform Core Roles module.

Roles Foundation provides the canonical global Role catalog required by the tenancy and authorization architecture.

Initial system Roles:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Roles owns:

```text
Role
Role persistence
Canonical Role definitions
Role seed initialization
Role lookup
Required Role resolution
```

Roles does not own:

```text
OrganizationMembership
Membership lifecycle
Role assignment persistence
Organization ownership persistence
Permission
Permission evaluation
Invitation
Organization
Profile
```

---

# Implementation Strategy

Roles is implemented as a small independent Platform Core foundation.

```text
Roles Foundation
        ↓
Canonical Role Catalog
        ↓
Memberships Foundation
        ↓
Tenancy Integration
        ↓
Permissions
```

The first milestone must remain deliberately small.

Do not implement Memberships or Permissions inside Roles to accelerate development.

---

# Current Dependencies

Roles Foundation depends on:

```text
Prisma

PostgreSQL

Platform UUID strategy
```

Existing platform infrastructure may additionally provide:

```text
Next.js

Supabase

TypeScript
```

Roles Foundation does not require Memberships to exist.

---

# Downstream Dependencies

The following capabilities will later depend on Roles:

```text
Memberships

Organization onboarding

Organization ownership

Ownership transfer

Tenant authorization

Permissions
```

This does not make those capabilities part of Roles Foundation.

---

# Phase 1 — Persistence Foundation

## R-001

### Add Role Model

Add the Roles-owned model to the active:

```text
prisma/schema.prisma
```

Required fields:

```text
id
key
name
description
isSystem
sortOrder
createdAt
updatedAt
```

Recommended model:

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

  @@map("roles")
}
```

### Acceptance Criteria

- Role uses UUID.
- `key` is unique.
- Database table is `roles`.
- No Role key database enum is introduced.
- No `organizationId` exists.
- No Membership model is introduced.
- No Permission model is introduced.
- No Role is added directly to Profile.
- No Role is added directly to Organization.

---

## R-002

### Generate Roles Migration

Create the Roles Foundation migration.

Recommended migration name:

```text
add_platform_roles
```

Expected scope:

```text
roles table
unique key constraint
field defaults
timestamps
```

### Acceptance Criteria

Migration does not introduce:

```text
organization_memberships

membership_status

organization_invitations

permissions

role_permissions

organization_roles
```

Generated SQL is reviewed before application.

---

## R-003

### Validate Prisma Changes

Run:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

Then:

```bash
npm run typecheck
npm run lint
```

### Acceptance Criteria

All commands pass.

Generated Prisma files are not manually modified.

---

# Phase 2 — Canonical Role Constants

## R-004

### Define System Role Keys

Create canonical application constants.

Recommended location:

```text
src/core/modules/roles/constants/system-role-keys.ts
```

Conceptual implementation:

```ts
export const SYSTEM_ROLE_KEYS = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const
```

A corresponding TypeScript type may be derived from the constant.

### Acceptance Criteria

- Keys match documentation exactly.
- Keys are not localized.
- No UUID is hard-coded.
- No permission information is embedded.
- Constants represent semantics, not persistence records.

---

# Phase 3 — Seed Foundation

## R-005

### Implement Canonical Role Seed

Add deterministic seed initialization for:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Recommended ordering:

```text
OWNER   → 10
ADMIN   → 20
MANAGER → 30
MEMBER  → 40
VIEWER  → 50
```

### Acceptance Criteria

Seed is:

- idempotent;
- deterministic;
- safe to rerun;
- based on Role key;
- independent from Domain data.

Seed must not use fixed Role UUIDs.

---

## R-006

### Define Canonical Role Metadata

Provide approved initial metadata for every system Role.

Required fields:

```text
key
name
description
isSystem
sortOrder
```

All canonical Roles must use:

```text
isSystem = true
```

### Acceptance Criteria

Metadata agrees with:

```text
SPEC.md
DATA_MODEL.md
PRISMA.md
```

Descriptions remain informational.

No authorization rules are encoded in descriptions.

---

## R-007

### Validate Seed Idempotency

Verify:

```text
Run seed once
→ five canonical Roles

Run seed again
→ still five canonical Roles
```

Specifically:

```text
OWNER   exactly once
ADMIN   exactly once
MANAGER exactly once
MEMBER  exactly once
VIEWER  exactly once
```

### Acceptance Criteria

No duplicate canonical keys are created.

Database uniqueness remains the final constraint.

---

# Phase 4 — Persistence Access

## R-008

### Establish Role Persistence Access

Establish explicitly the Roles-owned Prisma access boundary for Foundation Role lookups.

Preferred Foundation pattern:

```text
Roles-owned services/functions
  ↓
@/lib/prisma
```

Lookup operations that follow in R-009–R-011:

```text
findById

findByKey

findSystemRoles
```

Do not introduce a Repository class, Repository interface, or:

```text
src/core/modules/roles/repositories/role-repository.ts
```

unless demonstrated persistence complexity later justifies it under ADR-007.

Controlled seed/setup persistence already exists separately and must not force a Repository abstraction.

### Acceptance Criteria

- Roles owns direct Prisma access for Role lookups.
- Persistence access contains no Membership logic.
- Persistence access contains no Permission logic.
- Persistence access contains no Organization ownership logic.
- Persistence access contains no HTTP/UI logic.
- No Repository abstraction is introduced without demonstrated need, per ADR-007.
- R-009/R-010/R-011 may implement explicit services/functions using `@/lib/prisma`.

---

## R-009

### Implement Find Role By ID

Implement:

```text
findById(roleId)
```

### Acceptance Criteria

- UUID is handled correctly.
- Missing Role returns `null` (approved persistence/service absence result).
- Query does not unnecessarily load unrelated relations.

---

## R-010

### Implement Find Role By Key

Implement:

```text
findByKey(key)
```

This is a critical canonical lookup.

### Acceptance Criteria

- Uses the unique Role key.
- `OWNER` can be resolved reliably.
- No UUID constants are required.
- Missing Role is handled predictably.

---

## R-011

### Implement List System Roles

Implement:

```text
findSystemRoles()
```

Expected filtering:

```text
isSystem = true
```

Expected ordering:

```text
sortOrder ASC
```

### Acceptance Criteria

Returns canonical Roles predictably.

No pagination is introduced for the five-role initial catalog.

---

# Phase 5 — Application Contracts

## R-012

### Create Role DTO

Create a Roles-owned application contract where required.

Conceptual shape:

```ts
type RoleDto = {
  id: string
  key: string
  name: string
  description: string | null
  isSystem: boolean
  sortOrder: number
}
```

### Acceptance Criteria

- Public consumers do not depend unnecessarily on raw Prisma types.
- DTO contains no Membership fields.
- DTO contains no Permission fields.
- DTO contains no tenant-specific data.

---

## R-013

### Create Role Validation

Implement runtime validation required by Role API inputs.

Possible schemas:

```text
roleIdSchema

roleKeySchema

requiredSystemRoleKeySchema
```

### Acceptance Criteria

- UUID input is validated.
- Role keys are validated.
- Validation does not implement authorization.
- Validation does not trust client Role claims as authority.

---

## R-014

### Create Stable Role Errors

Define only errors owned by Roles.

Recommended initial errors:

```text
ROLE_NOT_FOUND

ROLE_KEY_CONFLICT

ROLE_INVALID

REQUIRED_ROLE_MISSING

SYSTEM_ROLE_PROTECTED

INVALID_ROLE_KEY
```

### Acceptance Criteria

Roles does not define Membership-owned or Permission-owned errors.

Raw Prisma errors do not leak to application consumers.

---

# Phase 6 — Role Services

## R-015

### Implement Get Role Service

Implement:

```text
getRole(roleId)
```

Conceptual flow:

```text
Validate
↓
Persistence / Prisma access (@/lib/prisma)
↓
Map Result
↓
RoleDto
```

### Acceptance Criteria

- Service may use `@/lib/prisma` directly; no Repository is required without demonstrated need (ADR-007).
- Missing Role maps to stable Role error.
- No authorization side effects occur.

---

## R-016

### Implement Get Role By Key Service

Implement:

```text
getRoleByKey(key)
```

### Acceptance Criteria

- Canonical keys resolve correctly.
- No environment-specific UUID dependency exists.
- Missing Role behavior is predictable.

---

## R-017

### Implement List System Roles Service

Implement:

```text
listSystemRoles()
```

### Acceptance Criteria

Returns:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

in approved predictable order after canonical seed initialization.

---

## R-018

### Implement Resolve Required Role Service

Implement:

```text
resolveRequiredRole(key)
```

This service is intended for critical Platform Core workflows.

Example:

```text
resolveRequiredRole("OWNER")
```

### Required Behavior

```text
Role exists
→ return Role

Role missing
→ REQUIRED_ROLE_MISSING
```

### Acceptance Criteria

The service must not:

- create the missing Role;
- fall back to another Role;
- return a free-form Role string;
- continue silently.

---

## R-019

### Implement System Role Catalog Validation

Implement:

```text
validateSystemRoleCatalog()
```

Required checks:

```text
OWNER exists

ADMIN exists

MANAGER exists

MEMBER exists

VIEWER exists

Canonical Roles are system Roles
```

### Acceptance Criteria

Missing required Role produces a clear platform configuration failure.

This capability may be used by deployment validation or tests.

---

# Phase 7 — Security Boundary

## R-020

### Protect Canonical Role Writes

Ensure normal application users cannot arbitrarily:

```text
INSERT Role

UPDATE Role key

DELETE Role

change isSystem
```

### Acceptance Criteria

Canonical Role mutation is limited to trusted server-side initialization or explicitly approved maintenance paths.

No browser-exposed privileged Role mutation exists.

---

## R-021

### Review Role Read Access

Determine the appropriate server/RLS policy for the global Role catalog.

Roles are global reference data rather than tenant-owned data.

### Acceptance Criteria

The chosen design distinguishes:

```text
Role visibility
```

from:

```text
Role possession
```

Being able to read:

```text
ADMIN
```

must never grant ADMIN authority.

---

## R-022

### Verify No Global User Role Shortcut

Audit application persistence for prohibited shortcuts such as:

```text
Profile.role

Profile.roleId

Organization.role

Organization.roleId

auth.users application role
```

for tenant authorization.

### Acceptance Criteria

Tenant Roles remain destined for:

```text
OrganizationMembership.roleId
```

when Memberships is implemented.

---

# Phase 8 — Testing

## R-023

### Role Persistence Tests

Cover:

```text
Role UUID generation

Required fields

key uniqueness

field defaults

timestamps
```

### Acceptance Criteria

Persistence behavior matches PRISMA.md.

---

## R-024

### Role Lookup Tests

Cover:

```text
find by ID

find by key

missing ID

missing key
```

### Acceptance Criteria

Lookup behavior is deterministic.

---

## R-025

### Canonical Catalog Tests

Verify the existence of:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

### Acceptance Criteria

All required Roles can be resolved.

---

## R-026

### Seed Tests

Test:

```text
first seed

repeated seed

missing Role recreation through seed

metadata reconciliation where approved
```

### Acceptance Criteria

Repeated execution remains idempotent.

Runtime service behavior must remain separate from seed behavior.

---

## R-027

### Required Role Resolution Tests

Cover:

```text
OWNER exists
→ returned successfully

OWNER missing
→ REQUIRED_ROLE_MISSING
```

### Acceptance Criteria

No runtime Role auto-creation occurs.

---

## R-028

### System Role Protection Tests

Verify canonical system Roles cannot be casually:

```text
deleted

semantically renamed

converted to non-system Roles
```

through normal application services.

---

## R-029

### Hard-Coded UUID Audit

Search the implementation for hard-coded Role UUID behavior.

### Acceptance Criteria

Canonical Role resolution uses:

```text
key
```

not fixed UUID values.

---

## R-030

### Boundary Tests

Verify Roles Foundation does not require or introduce:

```text
OrganizationMembership

Permission

RolePermission

organizationId
```

### Acceptance Criteria

Roles remains independently testable.

---

# Phase 9 — Documentation and Architecture Validation

## R-031

### Validate Roles Documentation

Review:

```text
SPEC.md

DATA_MODEL.md

FLOWS.md

API.md

PRISMA.md

TASKS.md
```

### Acceptance Criteria

All documents agree on:

```text
global system Roles

UUID identity

unique string key

Membership assignment ownership

Permission separation

custom Role deferral
```

---

## R-032

### Validate Cross-Module Ownership

Confirm:

```text
Organizations
→ Organization

Roles
→ Role

Memberships
→ OrganizationMembership

Permissions
→ Permission
```

### Acceptance Criteria

No cross-module persistence ownership has leaked into Roles.

---

## R-033

### Validate Source Structure

Expected source root:

```text
src/core/modules/roles/
```

Possible implementation directories:

```text
constants/
schemas/
services/
types/
```

`repositories/` is optional and must not be introduced without demonstrated persistence need (ADR-007).

Only create directories actually required.

### Acceptance Criteria

- No speculative empty directories.
- No new root `src/types`.
- No alternate Roles module elsewhere.
- Source structure follows architecture documentation.

---

# Phase 10 — Quality Gate

## R-034

### Run Prisma Validation

Run:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

### Acceptance Criteria

All pass.

---

## R-035

### Run Project Validation

Run:

```bash
npm run typecheck
npm run lint
```

Run the approved automated test suite when available.

### Acceptance Criteria

All required checks pass.

---

## R-036

### Perform Roles Foundation Review

Review:

- Prisma model.
- Migration.
- Seed.
- Constants.
- Persistence access.
- Services.
- DTOs.
- Validation.
- Errors.
- Security boundary.
- Tests.
- Documentation.

### Acceptance Criteria

No unresolved Roles-owned defect blocks Memberships specification or implementation.

---

# Roles Foundation Milestone

Roles Foundation is complete when:

```text
Role model exists

Roles migration exists

UUID strategy preserved

Unique Role key enforced

Canonical Role constants exist

Canonical Role seed exists

Seed is idempotent

OWNER exists

ADMIN exists

MANAGER exists

MEMBER exists

VIEWER exists

Role persistence access is established (ADR-007; no mandatory Repository)

Role lookup by ID exists

Role lookup by key exists

System Role listing exists

Required Role resolution exists

Role catalog validation exists

Stable errors exist

Relevant tests pass

Documentation matches implementation
```

Roles Foundation does not mean tenancy is complete.

---

# Stage 2 — Membership Integration

The following tasks are intentionally blocked until Memberships has an approved specification.

They must not be implemented as part of Roles Foundation.

---

## R-037 — BLOCKED

### OrganizationMembership Role Relation

Future Memberships persistence will reference:

```text
Role.id
```

conceptually through:

```text
OrganizationMembership.roleId
```

### Owner

```text
Memberships
```

Roles may receive an inverse Prisma relation when physically required.

That does not transfer ownership.

---

## R-038 — BLOCKED

### Membership Role Assignment

Future operation:

```text
assign/change Membership Role
```

### Owner

```text
Memberships
```

Roles participates only by resolving/validating the requested Role.

---

## R-039 — BLOCKED

### Membership Activation Role Validation

Future rule:

```text
ACTIVE Membership
→ valid Role required
```

### Owner

```text
Memberships
```

Roles provides Role resolution.

---

## R-040 — BLOCKED

### Organization OWNER Membership

Complete Organization onboarding requires:

```text
Organization
+
OWNER Role
+
OrganizationMembership
```

### Dependencies

```text
Organizations
Roles
Memberships
```

Roles must not create the Membership itself.

---

## R-041 — BLOCKED

### Ownership Transfer Integration

Future flow:

```text
Current OWNER Membership

+

Target Membership

+

OWNER Role
```

Membership mutation and transaction behavior are not part of Roles Foundation.

---

# Stage 3 — Permissions Integration

The following tasks are blocked until Permissions has an approved specification.

---

## R-042 — BLOCKED

### Role Permission Mapping

The future authorization model may relate:

```text
Role
↓
Permission Mapping
↓
Permission
```

Exact persistence ownership is intentionally undecided until Permissions is specified.

Do not create:

```text
RolePermission
```

during Roles Foundation.

---

## R-043 — BLOCKED

### Permission Evaluation

Future authorization may evaluate:

```text
Membership
↓
Role
↓
Permissions
↓
Requested Operation
```

### Owner

```text
Permissions
```

Roles must not implement:

```text
hasPermission()

can()

authorize()
```

as a temporary permission engine.

---

# Explicitly Deferred Work

Roles Foundation must not implement:

```text
OrganizationMembership model

MembershipStatus

OrganizationInvitation

Membership Role assignment persistence

Permission model

RolePermission model

Permission evaluation

Organization-specific Roles

Custom Role CRUD

Role templates

Role cloning

Role inheritance

Role hierarchy persistence

Role retirement workflow

Domain-specific Role types

Organization ownership persistence

Role administration UI
```

---

# No Custom Roles Yet

Do not create:

```text
createRole()
```

as a normal tenant capability.

Do not add:

```text
organizationId
```

to Role preemptively.

Do not add nullable fields intended only for hypothetical future custom Roles.

Custom Roles require validated product demand and a new architectural review.

---

# No Role Hierarchy Engine

The presentation order:

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

does not authorize operations.

Do not implement:

```text
actor.sortOrder < target.sortOrder
```

as authorization logic.

Permissions will define capability.

---

# No Permission Flags

Do not add to Role:

```text
canManageMembers

canManageBilling

canCreate

canDelete

permissionsJson

permissionFlags
```

Those would duplicate Permissions.

---

# No Profile Role

Do not implement:

```text
Profile.roleId
```

Tenant Roles belong to Memberships because a Profile may have different Roles in different Organizations.

Example:

```text
Profile

Organization A
→ ADMIN

Organization B
→ VIEWER
```

---

# No Organization Role

Do not implement:

```text
Organization.roleId
```

A Role represents Membership authority, not Organization state.

---

# No Hard-Coded OWNER UUID

Do not implement:

```text
OWNER_ROLE_ID=<uuid>
```

Canonical lookup must use:

```text
OWNER
```

through Roles-owned persistence/service access (`@/lib/prisma` or an optional Repository if later justified).

---

# Security Risks

## Missing OWNER

Risk:

The platform attempts Organization onboarding while canonical OWNER is missing.

Mitigation:

```text
resolveRequiredRole("OWNER")
→ fail safely
```

Do not partially continue onboarding.

---

## Duplicate Role Catalog

Risk:

Multiple OWNER or ADMIN definitions appear.

Mitigation:

```text
UNIQUE(key)
+
idempotent seeds
```

---

## Global Role Confused With Authority

Risk:

Application interprets the existence of a global Role record as tenant authority.

Mitigation:

Authority requires:

```text
OrganizationMembership
+
Role
```

---

## Role Hierarchy Used as Permission Engine

Risk:

`sortOrder` becomes implicit authorization logic.

Mitigation:

Keep Permissions separate.

---

## Temporary Membership Logic

Risk:

Roles begins storing role assignments while Memberships is missing.

Mitigation:

Blocked tasks remain blocked.

---

## Custom Role Overengineering

Risk:

Architecture becomes complex before any product requires custom Roles.

Mitigation:

Canonical global system Roles only during Foundation.

---

# Cursor Implementation Rules

Cursor may implement only tasks whose dependencies are satisfied.

Cursor must not:

- create OrganizationMembership;
- assign Roles to users directly;
- add `Profile.roleId`;
- add `Organization.roleId`;
- add `Role.organizationId`;
- create Permissions;
- create RolePermission;
- implement authorization from `sortOrder`;
- create custom Roles;
- hard-code Role UUIDs;
- redesign canonical Role keys;
- invent missing Membership behavior.

If implementation encounters an unresolved dependency:

```text
STOP

Report dependency

Do not invent architecture
```

---

# Dependencies

## Required for Roles Foundation

```text
Prisma

PostgreSQL

UUID strategy
```

## Consumed Later By

```text
Memberships

Organizations tenancy integration

Permissions
```

## Optional Later Integrations

```text
Audit

Caching

Administration UI
```

---

# Implementation Order

Approved current sequence:

```text
Identity
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

Roles Foundation must be stable before Memberships relies on canonical Role records.

---

# Definition of Ready

Roles Foundation is ready to enter implementation when:

- SPEC is approved for implementation.
- DATA_MODEL is consistent.
- FLOWS is consistent.
- API is consistent.
- PRISMA is consistent.
- TASKS is consistent.
- UUID strategy is confirmed.
- Canonical Role keys are approved.
- Global initial Role architecture is approved.
- Seed strategy is approved.
- OWNER semantics are approved.
- Membership assignment ownership belongs to Memberships.
- Permission ownership belongs to Permissions.
- Custom Roles remain deferred.
- Existing Prisma schema has been reviewed for conflicts.

---

# Definition of Done

Roles Foundation is complete when:

- Role model exists.
- Migration has been reviewed.
- UUID strategy is preserved.
- Role key uniqueness is enforced.
- Canonical constants exist.
- OWNER is seeded.
- ADMIN is seeded.
- MANAGER is seeded.
- MEMBER is seeded.
- VIEWER is seeded.
- Seed is idempotent.
- Role persistence access is established (ADR-007; no mandatory Repository).
- Role lookup by ID works.
- Role lookup by key works.
- System Role listing works.
- Required Role resolution works.
- Missing required Roles fail safely.
- System Role catalog validation works.
- Stable errors exist.
- Relevant tests pass.
- Prisma format passes.
- Prisma validation passes.
- Prisma generation passes.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.
- No Membership persistence exists inside Roles.
- No Permission persistence exists inside Roles.
- No custom tenant Role architecture exists.
- No hard-coded Role UUID dependency exists.

Membership assignment and tenant authorization remain outside this milestone.

---

# Final Principle

Implement only what Roles owns.

Roles defines the canonical authority catalog.

Roles does not assign authority.

Memberships assigns Roles.

Organizations defines the tenant and ownership invariant.

Permissions determines what those Roles may do.

Missing downstream capabilities are blockers, not reasons to invent temporary architecture.