---
title: Organizations Tasks
version: 1.1.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - ../../../architecture/CORE.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../../architecture/SECURITY.md
---

# Organizations Tasks

## Purpose

This document defines the implementation tasks for the Platform Core Organizations module.

The scope of this task plan is deliberately limited to functionality owned by Organizations.

Organizations owns:

```text
Organization
OrganizationStatus
Organization lifecycle
Organization persistence
Organization tenant identity
```

Organizations does not own:

```text
OrganizationMembership
MembershipStatus
Invitations
Role
Permission
AuditEvent
BillingAccount
OrganizationSettings
```

Those capabilities belong to their respective Platform Core modules.

---

# Implementation Strategy

Organizations will be implemented in two distinct stages.

```text
Stage 1

Organizations Foundation
```

and later:

```text
Stage 2

Tenancy Foundation Integration
```

Stage 1 can be implemented independently.

Stage 2 requires:

```text
Memberships
Roles
```

Full authorization additionally requires:

```text
Permissions
```

This separation prevents temporary or duplicated tenancy architecture.

---

# Current Dependencies

Available foundation:

```text
Identity
├── Supabase Authentication
└── Profile

Prisma

PostgreSQL

Supabase
```

Organizations may begin implementation against this existing foundation.

---

# Blocked Dependencies

The following modules are not yet available:

```text
Memberships

Roles

Permissions
```

Therefore Organizations must not implement temporary replacements for them.

---

# Phase 1 — Persistence Foundation

## O-001

### Add OrganizationStatus

Add the Organization lifecycle enum to the active Prisma schema.

Required values:

```text
ACTIVE
SUSPENDED
ARCHIVED
```

### Acceptance Criteria

- Enum follows the Organizations specification.
- No Membership enum is introduced.
- Prisma format passes.
- Prisma validate passes.

---

## O-002

### Add Organization Model

Add the Organizations-owned Prisma model.

Fields:

```text
id
name
slug
status
logoUrl
locale
timezone
createdAt
updatedAt
archivedAt
```

Identifier:

```text
UUID
```

Database table:

```text
organizations
```

### Acceptance Criteria

- UUID strategy matches the active schema.
- `slug` is unique.
- `status` defaults to ACTIVE.
- `locale` has the approved default.
- `timezone` has the approved default.
- Timestamp mappings are correct.
- `OrganizationMembership` is not introduced by this task.
- No owner field is introduced.

Forbidden fields include:

```text
ownerId
ownerUserId
ownerProfileId
```

---

## O-003

### Generate Organizations Migration

Create the migration for:

```text
OrganizationStatus
organizations
```

Recommended migration name:

```text
add_platform_organizations
```

### Acceptance Criteria

Review generated SQL for:

- UUID types
- enum creation
- table name
- unique slug constraint
- status index
- timestamp types
- nullable fields
- defaults
- destructive operations

The migration must not introduce:

```text
organization_memberships
roles
permissions
```

---

## O-004

### Validate Prisma Schema

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

# Phase 2 — Persistence Foundation

## O-005

### Establish Prisma Runtime Access

Materialize the approved application Prisma infrastructure boundary under:

```text
src/lib/prisma/
```

The implementation must expose a consistent server-side Prisma Client for capability services.

This task does not introduce an Organization Repository.

### Acceptance Criteria

Prisma runtime infrastructure:

- is implemented under `src/lib/prisma/`;
- owns Prisma Client construction and runtime reuse;
- contains infrastructure behavior only;
- contains no Organizations business logic;
- contains no authorization logic;
- contains no Membership, Role or Permission logic;
- is not imported by browser-side code;
- does not introduce a Repository abstraction without demonstrated need.

---

## O-006

### Implement Organization Lookup Service

Implement Organizations-owned server-side lookup behavior for:

```text
findById

findBySlug
```

The capability service may access Prisma through the approved runtime adapter under:

```text
src/lib/prisma/
```

A Repository layer is not required unless demonstrated complexity justifies one.

### Acceptance Criteria

- Queries are owned by the Organizations capability.
- Queries use explicit projections where practical.
- Missing resources are handled predictably.
- Prisma internals are not leaked unnecessarily.
- `src/app` and UI code do not access Prisma directly.
- No authorization, Membership, Role or Permission behavior is introduced.
- Query behavior is covered by relevant tests when test infrastructure exists.

---

## O-007

### Implement Organization Creation Persistence Primitive

Implement the Organizations-owned server-side persistence primitive for creating an Organization record.

This is not yet the complete public:

```text
createOrganization()
```

tenancy workflow.

The complete workflow requires Memberships and Roles.

The primitive may access Prisma through the approved runtime adapter under:

```text
src/lib/prisma/
```

A Repository layer is not required unless demonstrated complexity justifies one.

### Acceptance Criteria

- Organization record can be created correctly.
- Slug conflict is handled.
- UUID is generated correctly.
- No OWNER Membership is created.
- No temporary Role is created.
- No incomplete public onboarding flow is exposed as production-ready.
- No Repository abstraction is introduced without demonstrated need.

---

# Phase 3 — Organization Services

## O-008

### Superseded — Organization Read Service

The former O-008 duplicated the Organization read service introduced by O-006.

Its responsibilities are now owned by O-006.

No separate implementation is required for O-008.

### Acceptance Criteria

- O-006 provides the approved Organization lookup service.
- No duplicate read service is introduced.
- No Repository layer is created merely to preserve the historical task split.

---

## O-009

### Create Update Organization Service

Implement Organization-owned field updates.

Editable initial fields:

```text
name
slug
logoUrl
locale
timezone
```

### Acceptance Criteria

- Input is validated.
- Only Organization-owned fields can be changed.
- Slug conflicts are handled.
- Memberships, Roles, Permissions and Billing cannot be mutated through this service.

---

## O-010

### Create Suspend Organization Service

Implement:

```text
ACTIVE
→
SUSPENDED
```

Expected persistence:

```text
status = SUSPENDED
archivedAt = null
```

### Acceptance Criteria

- Valid transition works.
- Invalid transition fails predictably.
- No Membership data is modified.
- No Domain data is deleted.

---

## O-011

### Create Reactivate Organization Service

Implement:

```text
SUSPENDED
→
ACTIVE
```

Expected persistence:

```text
status = ACTIVE
archivedAt = null
```

### Acceptance Criteria

- Valid transition works.
- Invalid transitions fail.
- Organization data remains preserved.

---

## O-012

### Create Archive Organization Service

Implement:

```text
ACTIVE
→
ARCHIVED
```

Expected persistence:

```text
status = ARCHIVED
archivedAt = current timestamp
```

### Acceptance Criteria

- Organization is preserved.
- `archivedAt` is populated.
- Membership or Domain persistence is not modified.
- Hard deletion is not performed.

---

## O-013

### Create Restore Organization Service

Implement:

```text
ARCHIVED
→
ACTIVE
```

Expected persistence:

```text
status = ACTIVE
archivedAt = null
```

### Acceptance Criteria

- Valid restoration works.
- `archivedAt` is cleared.
- Invalid transitions fail predictably.

---

# Phase 4 — Validation and Contracts

## O-014

### Create Organization Schemas

Create runtime validation schemas required by the implemented Organization operations.

Possible schemas:

```text
createOrganizationRecordSchema

updateOrganizationSchema

organizationIdSchema

organizationSlugSchema
```

Naming should reflect the actual implementation contract.

### Acceptance Criteria

- External input is validated before services mutate persistence.
- Prisma errors are not used as the primary input-validation mechanism.
- Schemas contain no Membership, Role or Permission validation.

---

## O-015

### Create Organization Application Types

Define application types or DTOs where required.

Possible contracts include:

```text
OrganizationDto

CreateOrganizationInput

UpdateOrganizationInput
```

### Acceptance Criteria

- Public application contracts do not depend unnecessarily on raw Prisma models.
- Type ownership remains inside Organizations.
- Globally reusable technical types are not duplicated.

---

## O-016

### Create Stable Organization Errors

Define stable Organization-level errors as required.

Possible errors:

```text
ORGANIZATION_NOT_FOUND

ORGANIZATION_SLUG_CONFLICT

ORGANIZATION_SUSPENDED

ORGANIZATION_ARCHIVED

INVALID_ORGANIZATION_STATE
```

Do not define Membership-, Role- or Permission-specific errors here.

### Acceptance Criteria

- Raw Prisma/database errors do not leak to consumers.
- Error names represent Organizations responsibilities only.

---

# Phase 5 — Server Integration

## O-017

### Implement Read Integration

Connect approved Organization read services to the application where required.

Possible consumers:

```text
Server Components

Server Actions

Internal application services
```

### Acceptance Criteria

- Application layer calls Organizations services.
- Prisma is not accessed from `src/app`.
- No HTTP API is introduced without a real requirement.

---

## O-018

### Implement Organization Update Action

Create a Server Action for Organization-owned updates if required by current product scope.

Conceptual flow:

```text
Input
  ↓
Validation
  ↓
Authentication
  ↓
Authorized Service
  ↓
Persistence
  ↓
Revalidation
```

### Blocker

Production authorization depends on Memberships, Roles and Permissions.

Until those capabilities exist, this action must not be exposed as a fully authorized multi-tenant production operation.

### Acceptance Criteria

- No client-only authorization.
- No direct Prisma access.
- Missing authorization capability is not replaced with temporary flags.

---

# Phase 6 — Lifecycle Testing

## O-019

### Organization Persistence Tests

Cover:

```text
Create

Find by ID

Find by Slug

Update

Slug uniqueness
```

### Acceptance Criteria

Organizations persistence behavior matches Prisma and Organizations documentation.

---

## O-020

### Organization Lifecycle Tests

Cover:

```text
ACTIVE → SUSPENDED

SUSPENDED → ACTIVE

ACTIVE → ARCHIVED

ARCHIVED → ACTIVE
```

Also cover invalid transitions.

### Acceptance Criteria

- Lifecycle rules are deterministic.
- `archivedAt` remains consistent with status.
- Invalid transitions do not partially mutate state.

---

## O-021

### Slug Tests

Cover:

```text
Generation

Normalization

Uniqueness conflict

Invalid input
```

### Acceptance Criteria

Database uniqueness remains authoritative.

Race conditions are handled through the persistence constraint.

---

## O-022

### Persistence Integrity Tests

Verify:

```text
UUID generation

Required fields

Defaults

Timestamp behavior

Status default

Unique slug
```

### Acceptance Criteria

Persistence matches Organizations Prisma specification.

---

# Phase 7 — Security Preparation

## O-023

### Review Organizations RLS Requirements

Do not implement Membership-based RLS yet.

Document and verify the required future relationship:

```text
auth.uid()
    ↓
Profile
    ↓
OrganizationMembership
    ↓
Organization
```

### Acceptance Criteria

- No permissive temporary tenant RLS policy is introduced.
- Authentication is not treated as Organization authorization.
- Final policy is explicitly marked as dependent on Memberships.
- Security documentation remains aligned.

---

## O-024

### Review Server-Only Access During Foundation Phase

Determine how Organizations persistence is accessed safely before final Membership-based RLS exists.

### Acceptance Criteria

The temporary development architecture must not:

- expose all Organizations through client Supabase access;
- bypass application authorization silently;
- become the permanent security model accidentally.

Any temporary restriction must be explicit and removable.

---

# Phase 8 — Documentation Validation

## O-025

### Validate Documentation Against Implementation

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

Documentation and implementation agree.

No obsolete ownership assumptions remain.

---

## O-026

### Validate Architecture Boundaries

Confirm:

```text
Organizations
→ Organization

Memberships
→ OrganizationMembership

Roles
→ Role

Permissions
→ Permission
```

### Acceptance Criteria

No Membership, Role or Permission persistence exists inside Organizations.

---

## O-027

### Validate Source Structure

Expected implementation location:

```text
src/core/modules/organizations/
```

Possible directories:

```text
actions/
schemas/
services/
types/
validators/
```

Only directories required by real implementation should exist.

### Acceptance Criteria

- No speculative empty folders.
- Source location matches architecture documentation.
- No duplicate `src/types` architecture is introduced.

---

# Phase 9 — Quality Gate

## O-028

### Run Technical Validation

Run:

```bash
npx prisma format
npx prisma validate
npx prisma generate

npm run typecheck
npm run lint
```

Run the approved test suite once available.

### Acceptance Criteria

All required validation commands pass.

---

## O-029

### Perform Organizations Implementation Review

Review:

- Persistence
- Persistence boundaries
- Services
- Validation
- Errors
- Lifecycle behavior
- Source structure
- Documentation consistency

### Acceptance Criteria

No unresolved Organizations-owned defect blocks the module foundation.

Cross-module blockers must remain documented rather than hidden.

---

# Stage 1 Milestone

The Organizations Foundation milestone is complete when:

```text
OrganizationStatus implemented

Organization model implemented

Migration reviewed

Prisma runtime access implemented

Organization reads implemented

Organization updates implemented

Organization lifecycle implemented

Validation implemented

Persistence tests implemented

Lifecycle tests implemented

UUID strategy preserved

Source boundaries preserved

Documentation synchronized
```

This milestone does not mean tenancy is complete.

---

# Stage 2 — Tenancy Foundation Integration

The following tasks are intentionally blocked until Memberships and Roles have approved specifications.

They must not be implemented inside Organizations during Stage 1.

---

## O-030 — BLOCKED

### Complete Organization Creation

Final operation:

```text
createOrganization()
```

Required flow:

```text
Authenticated Profile
        ↓
Create Organization
        ↓
Resolve OWNER Role
        ↓
Create OWNER Membership
        ↓
Commit Atomically
```

### Dependencies

```text
Memberships

Roles
```

---

## O-031 — BLOCKED

### List User Organizations

Requires:

```text
Profile
↓
Memberships
↓
Organizations
```

### Dependency

```text
Memberships
```

Organizations must not implement duplicate Membership lookup logic.

---

## O-032 — BLOCKED

### Organization Context Selection

Implement:

```text
getActiveOrganization

switchActiveOrganization
```

### Dependencies

```text
Memberships

Organization context strategy
```

Target Organization Membership must be validated.

---

## O-033 — BLOCKED

### Ownership Enforcement

Implement final invariant:

```text
Exactly one active OWNER
per operational Organization
```

### Dependencies

```text
Memberships

Roles
```

Do not introduce an Organization owner column.

---

## O-034 — BLOCKED

### Ownership Transfer

Implement atomic ownership transfer.

### Dependencies

```text
Memberships

Roles
```

Required transaction:

```text
Assign OWNER to target Membership

+

Downgrade previous OWNER
```

---

## O-035 — BLOCKED

### Membership-Based Organization Authorization

Implement tenant access checks based on:

```text
Profile
↓
Membership
↓
Organization
↓
Role
```

### Dependencies

```text
Memberships

Roles
```

---

## O-036 — BLOCKED

### Membership-Based RLS

Implement final tenant-aware Organization RLS.

### Dependency

```text
Memberships
```

Policies must use the real Membership persistence model.

No temporary Membership representation is permitted.

---

# Stage 3 — Authorization Integration

The following work is deferred until Permissions exists.

---

## O-037 — DEFERRED

### Permission-Based Organization Authorization

Integrate Organization operations with canonical Permissions.

### Dependencies

```text
Memberships

Roles

Permissions
```

---

# Explicitly Deferred Work

The Organizations module must not implement the following tasks:

```text
OrganizationMembership model

MembershipStatus

OrganizationInvitation

Invite Member

Accept Invitation

Remove Member

Suspend Member

Restore Membership

Role model

Role seeding

Permission model

Permission assignment

AuditEvent model

BillingAccount

OrganizationSettings
```

These belong to other Platform Core modules.

---

# Permanent Deletion

Organization hard deletion remains deferred.

Before implementation it requires approved behavior for:

```text
Memberships
Roles
Permissions
Settings
Billing
Audit
Storage
Business Domains
Backups
Retention policy
```

Archive remains the default deactivation mechanism.

---

# Dependencies

## Required for Organizations Foundation

```text
Identity

Profile

Prisma

PostgreSQL

Supabase
```

## Required for Complete Tenancy

```text
Memberships

Roles
```

## Required for Full Authorization

```text
Permissions
```

## Optional Later Integrations

```text
Audit

Billing

Settings

Storage

Notifications
```

---

# Risks

## Tenant Isolation

Risk:

```text
Organizations exposed without Membership-based authorization.
```

Mitigation:

- No permissive temporary RLS.
- Server-side access only where required.
- Membership integration before production tenancy release.

---

## Ownership Duplication

Risk:

```text
ownerUserId
```

or temporary Role fields added to Organization.

Mitigation:

- Ownership remains Membership + Role.
- Architecture review rejects competing sources of truth.

---

## Cross-Module Leakage

Risk:

Organizations starts implementing Memberships or Roles for convenience.

Mitigation:

- Explicit module boundaries.
- Blocked tasks remain blocked.
- AI agents must stop rather than invent missing dependencies.

---

## Partial Tenancy Implementation

Risk:

A bare Organization record is mistaken for a production-ready tenant.

Mitigation:

Distinguish:

```text
Organizations Foundation
```

from:

```text
Complete Tenancy Foundation
```

in tasks, reviews and maturity documentation.

---

## RLS Misconfiguration

Risk:

Authentication is incorrectly treated as Organization authorization.

Mitigation:

Final Organization RLS must depend on the actual Membership model.

---

# Cursor Implementation Rules

Cursor may implement only tasks whose dependencies are satisfied.

Cursor must not:

- implement blocked tasks;
- create temporary Memberships;
- create temporary Roles;
- create temporary Permissions;
- add `ownerUserId`;
- add `ownerId`;
- create permissive RLS to bypass missing Memberships;
- redesign tenancy architecture;
- move architectural responsibilities between modules.

If a task requires an unavailable dependency:

```text
STOP

Report dependency

Do not invent architecture
```

---

# Milestone

Current implementation milestone:

```text
Platform Core

↓

Organizations Foundation
```

Not:

```text
Complete Tenancy
```

The next architectural milestone after Organizations Foundation is:

```text
Memberships + Roles
```

followed by:

```text
Tenancy Integration
```

and later:

```text
Permissions
```

---

# Definition of Ready

Organizations Foundation is ready to enter implementation when:

- SPEC is approved for implementation.
- DATA_MODEL is consistent.
- FLOWS is consistent.
- API is consistent.
- PRISMA is consistent.
- TASKS is consistent.
- UUID strategy is confirmed.
- Identity integration is confirmed.
- Organization ownership is unambiguous.
- Membership ownership belongs to Memberships.
- Role ownership belongs to Roles.
- Permission ownership belongs to Permissions.
- Blocked tenancy tasks are explicitly identified.

---

# Definition of Done

Organizations Foundation is complete when:

- OrganizationStatus exists.
- Organization model exists.
- Migration is reviewed.
- Prisma runtime adapter exists.
- Organization read services exist.
- Organization update service exists.
- Lifecycle services exist.
- Validation exists.
- Stable errors exist where required.
- Persistence tests pass.
- Lifecycle tests pass.
- Prisma validation passes.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.
- Organizations contains no Membership persistence.
- Organizations contains no Role persistence.
- Organizations contains no Permission persistence.
- No temporary tenancy architecture has been introduced.

Complete tenant onboarding is explicitly outside this milestone.

---

# Final Principle

Implement only what Organizations owns.

Missing dependencies are blockers, not invitations to invent temporary architecture.

Organizations Foundation comes first.

Memberships and Roles complete tenancy.

Permissions completes authorization.