---
title: Permissions Tasks
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-09
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - ../organizations/TASKS.md
  - ../roles/TASKS.md
  - ../memberships/TASKS.md
  - ../../../architecture/TENANCY.md
  - ../../../architecture/SECURITY.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
---

# Permissions Tasks

## Purpose

This document converts the approved Permissions architecture into implementation tasks.

Permissions owns:

```text
Permission

RolePermission

Permission catalog

system RolePermission policy

effective Permission resolution

authorization evaluation

authorization guards
```

Permissions does not own:

```text
Authentication

Profile

Organization

OrganizationMembership

Role definitions

Membership Role assignment

Organization ownership invariants

Domain business rules
```

---

# Current Implementation Position

Permissions documentation may be completed before Permissions source implementation begins.

Actual implementation must respect the approved dependency order:

```text
Identity
   ↓
Organizations
   ↓
Roles
   ↓
Memberships
   ↓
Tenancy Integration
   ↓
Permissions
```

Therefore:

```text
Permissions specification
→ may be completed now

Permissions source implementation
→ must wait for required foundations
```

---

# Dependency Rule

If a task depends on architecture or source code that does not yet exist:

```text
STOP

Report dependency

Do not invent replacement architecture
```

This rule applies especially to:

```text
Role

OrganizationMembership

Tenant Context

ownership transfer

RLS integration
```

---

# Task Status Vocabulary

Use:

```text
TODO

IN PROGRESS

BLOCKED

DONE
```

A task marked BLOCKED must identify the dependency.

Do not mark a blocked task DONE because documentation exists.

---

# Stage 0 — Documentation Readiness

These tasks establish the canonical implementation contract.

## P-001 — Permissions SPEC

Status:

```text
DONE
```

Deliverable:

```text
docs/core/modules/permissions/SPEC.md
```

Must define:

```text
Permission ownership

RolePermission ownership

RBAC Foundation

explicit positive grants

deny-by-default

no Role hierarchy authorization

no OWNER bypass

no wildcard Permissions

tenant-context boundary

Domain extension boundary
```

---

## P-002 — Permissions DATA_MODEL

Status:

```text
DONE
```

Deliverable:

```text
docs/core/modules/permissions/DATA_MODEL.md
```

Must define:

```text
Permission

RolePermission

UUID identity

Permission.key uniqueness

RolePermission uniqueness

canonical Core Permission catalog

canonical system Role policy
```

---

## P-003 — Permissions FLOWS

Status:

```text
DONE
```

Deliverable:

```text
docs/core/modules/permissions/FLOWS.md
```

Must define:

```text
catalog synchronization

policy synchronization

authorization evaluation

hasPermission

requirePermission

Core protected-operation integration

Domain integration

cache invalidation principles
```

---

## P-004 — Permissions API

Status:

```text
DONE
```

Deliverable:

```text
docs/core/modules/permissions/API.md
```

Must define stable application capabilities for:

```text
Permission reads

Permission resolution

Role Permission reads

authorization evaluation

authorization guards

catalog synchronization

policy validation
```

---

## P-005 — Permissions PRISMA

Status:

```text
DONE
```

Deliverable:

```text
docs/core/modules/permissions/PRISMA.md
```

Must define:

```text
Permission Prisma model

RolePermission Prisma model

UUID strategy

foreign keys

unique constraints

indexes

Restrict deletion

seed/synchronization principles
```

---

## P-006 — Permissions TASKS

Status:

```text
DONE
```

Deliverable:

```text
docs/core/modules/permissions/TASKS.md
```

Purpose:

```text
translate architecture into implementation sequence
```

---

# Stage 1 — Dependency Verification

Permissions implementation must not begin by assuming dependencies exist.

## P-010 — Inspect Active Prisma Schema

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions implementation phase started
```

Inspect:

```text
prisma/schema.prisma
```

Verify actual presence and shape of:

```text
Profile

Organization

Role

OrganizationMembership
```

Do not rely only on documentation.

---

## P-011 — Verify Role Foundation Exists in Source

Status:

```text
BLOCKED
```

Dependency:

```text
Roles Foundation implementation
```

Required:

```text
canonical Role model exists

Role uses UUID

Role.key exists and is unique

OWNER exists as semantic Role key

ADMIN exists

MANAGER exists

MEMBER exists

VIEWER exists
```

If absent:

```text
STOP
```

Permissions must not create temporary Roles.

---

## P-012 — Verify Memberships Foundation Exists in Source

Status:

```text
BLOCKED
```

Dependency:

```text
Memberships Foundation implementation
```

Required:

```text
OrganizationMembership exists

membership.roleId is required

Membership references canonical Role

Membership status exists

ACTIVE status is canonical
```

Permissions must not create another Membership model.

---

## P-013 — Verify Tenancy Context Contract

Status:

```text
BLOCKED
```

Dependency:

```text
Tenancy Integration
```

Verify an approved trusted runtime context can establish:

```text
profileId

organizationId

membershipId

roleId

roleKey
```

and that:

```text
Membership is ACTIVE

Organization is accessible
```

Permissions must consume this contract rather than invent another tenant-context architecture.

---

## P-014 — Verify Identity Mapping Used by Tenancy

Status:

```text
BLOCKED
```

Dependency:

```text
Tenancy Integration
```

Inspect actual Identity/Profile source and Prisma model.

Confirm how:

```text
Supabase auth.users

auth.uid()

Profile.id
```

relate in the running system.

Do not assume undocumented identity mapping for authorization or RLS.

---

## P-015 — Verify Prisma Migration State

Status:

```text
BLOCKED
```

Dependency:

```text
database connectivity available
```

Verify:

```text
migration history consistent

active schema matches expected database state

no unresolved schema drift
```

If Prisma proposes unrelated destructive changes:

```text
STOP
```

---

# Stage 2 — Permission Persistence Foundation

These tasks introduce only Permissions-owned persistence.

## P-020 — Add Permission Model

Status:

```text
BLOCKED
```

Dependencies:

```text
P-010
P-011
```

Implement:

```text
Permission
```

with:

```text
id UUID

key unique String

name

description nullable

createdAt

updatedAt
```

Table:

```text
permissions
```

---

## P-021 — Add RolePermission Model

Status:

```text
BLOCKED
```

Dependencies:

```text
P-020
P-011
```

Implement:

```text
RolePermission
```

with:

```text
id UUID

roleId UUID

permissionId UUID

createdAt
```

Table:

```text
role_permissions
```

---

## P-022 — Add Role Foreign Key

Status:

```text
BLOCKED
```

Dependency:

```text
P-021
```

Required relation:

```text
RolePermission.roleId
→ Role.id
```

Delete policy:

```text
Restrict
```

---

## P-023 — Add Permission Foreign Key

Status:

```text
BLOCKED
```

Dependency:

```text
P-021
```

Required relation:

```text
RolePermission.permissionId
→ Permission.id
```

Delete policy:

```text
Restrict
```

---

## P-024 — Add RolePermission Composite Uniqueness

Status:

```text
BLOCKED
```

Dependency:

```text
P-021
```

Required invariant:

```text
UNIQUE(roleId, permissionId)
```

Named consistently with project conventions.

---

## P-025 — Add Permission Reverse Index

Status:

```text
BLOCKED
```

Dependency:

```text
P-021
```

Recommended:

```text
INDEX(permissionId)
```

Do not add redundant standalone `roleId` index unless actual query analysis requires it.

---

## P-026 — Add Prisma Inverse Relations

Status:

```text
BLOCKED
```

Dependency:

```text
P-021
```

Add only the inverse relation fields Prisma actually requires.

Conceptually:

```text
Role.permissionMappings

Permission.roleMappings
```

Do not redesign Role.

---

## P-027 — Format Prisma Schema

Status:

```text
BLOCKED
```

Dependency:

```text
P-020 through P-026
```

Run:

```bash
npx prisma format
```

---

## P-028 — Validate Prisma Schema

Status:

```text
BLOCKED
```

Dependency:

```text
P-027
```

Run:

```bash
npx prisma validate
```

Must pass before migration.

---

## P-029 — Review Prisma Diff Before Migration

Status:

```text
BLOCKED
```

Dependency:

```text
P-028
```

Verify proposed changes affect only expected Permissions persistence plus required inverse relations.

Stop if migration attempts to modify unexpectedly:

```text
Profile

Organization

Membership lifecycle

Role semantics

Domain tables
```

---

# Stage 3 — Permissions Migration

## P-030 — Generate Permissions Foundation Migration

Status:

```text
BLOCKED
```

Dependencies:

```text
P-015
P-029
```

Suggested semantic migration name:

```text
add_permissions_foundation
```

Use the project's approved Prisma migration workflow.

---

## P-031 — Inspect Generated SQL

Status:

```text
BLOCKED
```

Dependency:

```text
P-030
```

Verify:

```text
permissions table

role_permissions table

UUID columns

Permission key uniqueness

Role foreign key

Permission foreign key

RolePermission composite uniqueness

permissionId index

conservative delete behavior
```

---

## P-032 — Verify No Unauthorized Schema Additions

Status:

```text
BLOCKED
```

Dependency:

```text
P-031
```

Migration must not introduce:

```text
Profile.roleId

Profile.permissions

Organization.roleId

Organization.permissions

Organization.ownerId

Organization.ownerUserId

OrganizationMembership.permissions

Role.permissionsJson

Permission.organizationId

RolePermission.organizationId

MembershipPermission

OrganizationPermission

ProfilePermission
```

---

## P-033 — Apply Development Migration

Status:

```text
BLOCKED
```

Dependencies:

```text
P-031
P-032
```

Apply only after SQL review passes.

---

## P-034 — Generate Prisma Client

Status:

```text
BLOCKED
```

Dependency:

```text
P-033
```

Run:

```bash
npx prisma generate
```

---

# Stage 4 — Canonical Permission Registry

## P-040 — Create Permission Key Constants

Status:

```text
BLOCKED
```

Dependency:

```text
P-034
```

Create typed canonical constants under:

```text
src/core/modules/permissions/
```

Exact structure should follow actual source conventions.

Canonical Foundation keys:

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

---

## P-041 — Do Not Create memberships.invite

Status:

```text
BLOCKED
```

Dependency:

```text
P-040
```

Canonical invitation creation Permission is:

```text
invitations.create
```

Do not also create:

```text
memberships.invite
```

for the same operation.

---

## P-042 — Create Permission Definition Registry

Status:

```text
BLOCKED
```

Dependency:

```text
P-040
```

Each definition should contain conceptually:

```text
key

name

description

owner
```

`owner` may remain source-only metadata.

---

## P-043 — Validate Permission Registry

Status:

```text
BLOCKED
```

Dependency:

```text
P-042
```

Validate:

```text
keys unique

keys lowercase

key format valid

no wildcards

names present

no semantic duplicates
```

Invalid registry:

```text
STOP
```

---

## P-044 — Add Permission Repository

Status:

```text
BLOCKED
```

Dependency:

```text
P-034
```

Required persistence capabilities may include:

```text
findById

findByKey

findManyByKeys

list

create

updateMetadata
```

Mutation methods remain for trusted synchronization paths.

---

## P-045 — Implement Permission Catalog Synchronization

Status:

```text
BLOCKED
```

Dependencies:

```text
P-042
P-044
```

Synchronize by:

```text
Permission.key
```

Behavior:

```text
missing
→ create

existing
→ reconcile approved metadata
```

Do not hard-code Permission UUIDs.

---

## P-046 — Make Permission Sync Idempotent

Status:

```text
BLOCKED
```

Dependency:

```text
P-045
```

Repeated execution must not create:

```text
duplicate Permissions

new semantic copies
```

---

## P-047 — Detect Unknown Persisted Permissions

Status:

```text
BLOCKED
```

Dependency:

```text
P-045
```

If persistence contains a Permission absent from registry:

```text
report drift
```

Do not automatically delete it.

---

# Stage 5 — Canonical System Role Policy

## P-050 — Define Explicit RolePermission Policy

Status:

```text
BLOCKED
```

Dependencies:

```text
P-011
P-042
```

Canonical initial matrix:

| Permission | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|---|---:|---:|---:|---:|---:|
| organizations.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| organizations.update | ✓ | ✓ |  |  |  |
| organizations.transfer_ownership | ✓ |  |  |  |  |
| memberships.read | ✓ | ✓ | ✓ |  |  |
| memberships.suspend | ✓ | ✓ |  |  |  |
| memberships.restore | ✓ | ✓ |  |  |  |
| memberships.remove | ✓ | ✓ |  |  |  |
| memberships.change_role | ✓ | ✓ |  |  |  |
| invitations.read | ✓ | ✓ |  |  |  |
| invitations.create | ✓ | ✓ |  |  |  |
| invitations.revoke | ✓ | ✓ |  |  |  |
| invitations.resend | ✓ | ✓ |  |  |  |

This policy is explicit.

It must not be calculated from Role hierarchy.

---

## P-051 — No OWNER Wildcard

Status:

```text
BLOCKED
```

Dependency:

```text
P-050
```

Do not implement:

```text
OWNER
→ every Permission automatically
```

Every OWNER grant must be explicit.

---

## P-052 — No ADMIN Ownership Transfer

Status:

```text
BLOCKED
```

Dependency:

```text
P-050
```

Initial policy must not grant:

```text
ADMIN
→ organizations.transfer_ownership
```

unless architecture is explicitly revised.

---

## P-053 — Add RolePermission Repository

Status:

```text
BLOCKED
```

Dependency:

```text
P-034
```

Possible persistence capabilities:

```text
exists

findByRoleAndPermission

listPermissionsForRole

listMappings

createMapping

removeMapping
```

Mutation operations remain internal to policy synchronization.

---

## P-054 — Implement System Role Policy Synchronization

Status:

```text
BLOCKED
```

Dependencies:

```text
P-045
P-050
P-053
```

Resolve:

```text
Role.key
→ Role.id

Permission.key
→ Permission.id
```

Then ensure approved RolePermission mappings exist.

---

## P-055 — Missing Role Must Fail

Status:

```text
BLOCKED
```

Dependency:

```text
P-054
```

If:

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

required by policy is missing:

```text
FAIL
```

Permissions must not auto-create Roles.

---

## P-056 — Missing Permission Must Fail

Status:

```text
BLOCKED
```

Dependency:

```text
P-054
```

If policy references a missing canonical Permission:

```text
FAIL
```

No incomplete mapping should be created.

---

## P-057 — Make Policy Sync Idempotent

Status:

```text
BLOCKED
```

Dependency:

```text
P-054
```

Repeated synchronization must converge without duplicate grants.

---

## P-058 — Detect Unexpected RolePermission Grants

Status:

```text
BLOCKED
```

Dependency:

```text
P-054
```

Example security drift:

```text
VIEWER
→ memberships.remove
```

must be detected.

Do not silently accept it as intended policy.

---

## P-059 — Define Explicit Reconciliation Behavior

Status:

```text
BLOCKED
```

Dependency:

```text
P-058
```

Initial safe behavior:

```text
detect

report

require approved reconciliation
```

Do not automatically delete every unexpected mapping unless that behavior has been explicitly reviewed.

---

# Stage 6 — Permission Read Services

## P-060 — Implement getPermission

Status:

```text
BLOCKED
```

Dependency:

```text
P-044
```

Input:

```text
Permission UUID
```

Expected failure:

```text
PERMISSION_NOT_FOUND
```

---

## P-061 — Implement getPermissionByKey

Status:

```text
BLOCKED
```

Dependency:

```text
P-044
```

Optional lookup by semantic Permission key.

---

## P-062 — Implement listPermissions

Status:

```text
BLOCKED
```

Dependency:

```text
P-044
```

Return canonical persisted Permission definitions.

---

## P-063 — Implement resolveRequiredPermission

Status:

```text
BLOCKED
```

Dependency:

```text
P-061
```

Missing expected canonical Permission:

```text
REQUIRED_PERMISSION_MISSING
```

No runtime creation.

---

## P-064 — Implement resolvePermissionsByKeys

Status:

```text
BLOCKED
```

Dependency:

```text
P-044
```

Useful for:

```text
policy synchronization

validation

Domain registry integration
```

---

## P-065 — Implement getPermissionsForRole

Status:

```text
BLOCKED
```

Dependency:

```text
P-053
```

Return explicit mapped Permissions only.

No:

```text
hierarchy

inheritance

wildcard expansion
```

---

## P-066 — Implement getPermissionKeysForRole

Status:

```text
BLOCKED
```

Dependency:

```text
P-065
```

Return canonical Permission keys.

---

## P-067 — Implement roleHasPermission

Status:

```text
BLOCKED
```

Dependency:

```text
P-053
```

This proves only:

```text
Role
→ Permission mapping
```

It does not establish tenant authorization.

---

# Stage 7 — Catalog and Policy Validation

## P-070 — Implement validatePermissionCatalog

Status:

```text
BLOCKED
```

Dependencies:

```text
P-045
P-047
```

Detect:

```text
missing canonical Permissions

unexpected persisted Permissions

invalid metadata

registry drift
```

---

## P-071 — Implement validateSystemRolePermissionPolicy

Status:

```text
BLOCKED
```

Dependencies:

```text
P-054
P-058
```

Detect:

```text
missing mappings

unexpected mappings

missing Roles

missing Permissions
```

---

## P-072 — Stable Catalog Drift Error

Status:

```text
BLOCKED
```

Dependency:

```text
P-070
```

Use stable application diagnostic such as:

```text
PERMISSION_CATALOG_DRIFT
```

without leaking unnecessary database detail.

---

## P-073 — Stable Policy Drift Error

Status:

```text
BLOCKED
```

Dependency:

```text
P-071
```

Use stable diagnostic such as:

```text
ROLE_PERMISSION_POLICY_DRIFT
```

---

# Stage 8 — Tenant Authorization Foundation

This stage cannot begin until Tenancy Integration exists.

## P-080 — Consume Canonical Tenant Context

Status:

```text
BLOCKED
```

Dependency:

```text
P-013
```

Permissions must consume the approved trusted tenancy context.

Do not create:

```text
PermissionTenant

PermissionMembership

PermissionContext persistence
```

---

## P-081 — Validate Authorization Context

Status:

```text
BLOCKED
```

Dependency:

```text
P-080
```

Ensure context represents:

```text
authenticated Profile

target Organization

ACTIVE Membership

actual Membership Role
```

Failure must deny.

---

## P-082 — Implement hasPermission

Status:

```text
BLOCKED
```

Dependencies:

```text
P-066
P-081
```

Canonical result:

```text
explicit mapping exists
→ true

mapping absent
→ false
```

Unknown Permission:

```text
false
```

---

## P-083 — Implement requirePermission

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Failure:

```text
PERMISSION_DENIED
```

Use as canonical protected-operation guard.

---

## P-084 — Prohibit OWNER Authorization Bypass

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Tests and source review must confirm absence of:

```text
if OWNER
→ allow all
```

---

## P-085 — Prohibit Role Hierarchy Authorization

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

No authorization may use:

```text
Role.sortOrder

Role rank

Role name comparison
```

---

## P-086 — Prohibit Wildcard Authorization

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Do not recognize:

```text
*

organizations.*

memberships.*
```

as grants.

---

## P-087 — Deny Inactive Membership

Status:

```text
BLOCKED
```

Dependency:

```text
P-081
```

Verify:

```text
SUSPENDED
→ deny

REMOVED
→ deny
```

even where RolePermission exists.

---

## P-088 — Deny Cross-Tenant Authorization

Status:

```text
BLOCKED
```

Dependency:

```text
P-081
```

A Role in Organization A must not authorize Organization B.

---

# Stage 9 — Organizations Integration

## P-090 — Protect Organization Read

Status:

```text
BLOCKED
```

Dependencies:

```text
Organizations implementation

P-083
```

Use:

```text
organizations.read
```

for protected tenant Organization reads.

Public Organization access remains a separate path where approved.

---

## P-091 — Protect Organization Update

Status:

```text
BLOCKED
```

Dependencies:

```text
Organizations implementation

P-083
```

Use:

```text
organizations.update
```

before invoking Organizations update behavior.

---

## P-092 — Protect Ownership Transfer

Status:

```text
BLOCKED
```

Dependencies:

```text
ownership transfer workflow approved and implemented

previous-owner destination Role policy approved

P-083
```

Use:

```text
organizations.transfer_ownership
```

Permission success must not bypass:

```text
current OWNER validation

target ACTIVE Membership

same Organization

exactly-one-active-OWNER invariant

atomicity
```

---

## P-093 — Ownership Transfer Policy Stop Rule

Status:

```text
BLOCKED
```

Dependency:

```text
previous-owner Role decision
```

The Role assigned to the previous OWNER after transfer is not yet approved.

Do not assume:

```text
ADMIN

MANAGER

MEMBER

VIEWER
```

until the policy is approved.

Cursor must stop until this policy is explicitly decided.

---

# Stage 10 — Memberships Integration

## P-100 — Protect Membership Listing

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships implementation

P-083
```

Use:

```text
memberships.read
```

---

## P-101 — Protect Membership Suspension

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships implementation

P-083
```

Use:

```text
memberships.suspend
```

Memberships preserves OWNER safety.

---

## P-102 — Protect Membership Restoration

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships implementation

P-083
```

Use:

```text
memberships.restore
```

---

## P-103 — Protect Membership Removal

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships implementation

P-083
```

Use:

```text
memberships.remove
```

Permission must not allow removal of the sole active OWNER.

---

## P-104 — Protect Membership Role Change

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships implementation

P-083
```

Use:

```text
memberships.change_role
```

Memberships still validates:

```text
Role

Membership state

Organization

OWNER invariant
```

---

# Stage 11 — Invitation Integration

## P-110 — Protect Invitation Listing

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships Invitation implementation

P-083
```

Use:

```text
invitations.read
```

Never expose:

```text
tokenHash

raw token
```

---

## P-111 — Protect Invitation Creation

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships Invitation implementation

P-083
```

Use:

```text
invitations.create
```

Do not use duplicate:

```text
memberships.invite
```

Permission.

---

## P-112 — Protect Invitation Revocation

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships Invitation implementation

P-083
```

Use:

```text
invitations.revoke
```

---

## P-113 — Protect Invitation Resend

Status:

```text
BLOCKED
```

Dependencies:

```text
Memberships Invitation implementation

P-083
```

Use:

```text
invitations.resend
```

Token rotation remains Memberships-owned.

---

## P-114 — Invitation Acceptance Remains Bootstrap Flow

Status:

```text
BLOCKED
```

Dependency:

```text
Memberships Invitation implementation
```

Do not require the recipient to possess a tenant Permission before accepting an invitation.

Authorization remains based on:

```text
valid Invitation

matching authenticated identity

Membership lifecycle rules
```

---

# Stage 12 — Domain Extension Contract

## P-120 — Define Domain Permission Registry Composition

Status:

```text
BLOCKED
```

Dependency:

```text
first real Domain Permission requirement
```

Support future composition of:

```text
Core Permissions

DJ Domain Permissions

Copy Domain Permissions
```

without moving Domain business logic into Core.

---

## P-121 — Detect Permission Key Collisions

Status:

```text
BLOCKED
```

Dependency:

```text
P-120
```

Two registries declaring the same key incompatibly must:

```text
FAIL
```

---

## P-122 — Support Explicit Domain Default Grants

Status:

```text
BLOCKED
```

Dependency:

```text
P-120
```

Domain grant policy must be:

```text
explicit

version-controlled

reviewed
```

No wildcard Domain Role mappings.

---

## P-123 — No Domain Authorization Engine Duplication

Status:

```text
BLOCKED
```

Dependency:

```text
first Domain Permissions integration
```

Domains must consume:

```text
Permissions.hasPermission

Permissions.requirePermission
```

rather than creating competing tenant authorization systems.

---

# Stage 13 — Authorization Cache

Caching is optional and must not be implemented before a demonstrated need.

## P-130 — Measure Permission Query Cost

Status:

```text
BLOCKED
```

Dependency:

```text
working Permissions implementation
```

Determine whether caching is actually required.

Do not introduce cache only because architecture permits it.

---

## P-131 — Implement Role Permission Cache If Needed

Status:

```text
BLOCKED
```

Dependency:

```text
P-130 proves value
```

Potential cache projection:

```text
roleId
→ Permission.key[]
```

---

## P-132 — Invalidate Cache on Policy Change

Status:

```text
BLOCKED
```

Dependency:

```text
P-131
```

Invalidate after:

```text
RolePermission grant

RolePermission revoke

material Permission catalog change
```

---

## P-133 — Invalidate Tenant Authorization Context

Status:

```text
BLOCKED
```

Dependency:

```text
tenant context caching exists
```

Invalidate after:

```text
Membership Role change

Membership suspension

Membership removal

Organization suspension
```

---

## P-134 — No Persisted Permission Snapshot

Status:

```text
BLOCKED
```

Dependency:

```text
any cache implementation
```

Do not cache by adding persistence such as:

```text
Profile.permissions

OrganizationMembership.permissions

Role.permissionKeys
```

---

# Stage 14 — RLS Integration

This is separate from Permissions Foundation.

## P-140 — Verify Membership-Based Tenant RLS

Status:

```text
BLOCKED
```

Dependency:

```text
Tenancy RLS implementation
```

RLS should first establish:

```text
tenant row isolation
```

through Membership.

---

## P-141 — Evaluate Need for Permission-Aware RLS

Status:

```text
BLOCKED
```

Dependency:

```text
actual direct Supabase client write requirement
```

If all sensitive writes are server-mediated:

```text
do not duplicate Permissions into RLS unnecessarily
```

---

## P-142 — Design PostgreSQL Permission Helper Only If Needed

Status:

```text
BLOCKED
```

Dependency:

```text
P-141 confirms need
```

Possible future concept:

```text
has_permission(
  organization_id,
  permission_key
)
```

Requires separate security review.

Do not invent it during Foundation.

---

# Stage 15 — Testing

## P-150 — Permission Persistence Tests

Status:

```text
BLOCKED
```

Dependencies:

```text
Stage 2
Stage 3
```

Test:

```text
Permission creation

Permission key uniqueness

Permission lookup

RolePermission creation

RolePermission uniqueness

foreign-key integrity
```

---

## P-151 — Permission Catalog Sync Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-045
```

Verify:

```text
first run creates canonical Permissions

second run idempotent

metadata updates reconcile

unknown persisted Permission detected
```

---

## P-152 — System Policy Sync Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-054
```

Verify:

```text
expected mappings created

second run idempotent

missing Role fails

missing Permission fails

unexpected mapping detected
```

---

## P-153 — OWNER Explicit Grant Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Verify:

```text
OWNER receives mapped capability

OWNER without mapping is denied

new Permission is not automatically granted
```

---

## P-154 — ADMIN Policy Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Verify:

```text
organizations.update
→ allowed

memberships.remove
→ allowed

organizations.transfer_ownership
→ denied
```

---

## P-155 — MANAGER Policy Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Foundation expectation:

```text
organizations.read
→ allowed

memberships.read
→ allowed

memberships.remove
→ denied

invitations.create
→ denied
```

---

## P-156 — MEMBER Policy Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Foundation expectation:

```text
organizations.read
→ allowed

memberships.read
→ denied
```

---

## P-157 — VIEWER Policy Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Foundation expectation:

```text
organizations.read
→ allowed

all Foundation tenant mutation Permissions
→ denied
```

---

## P-158 — Membership State Authorization Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-087
```

Verify:

```text
ACTIVE + grant
→ allowed

SUSPENDED + grant
→ denied

REMOVED + grant
→ denied
```

---

## P-159 — Cross-Tenant Authorization Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-088
```

Example:

```text
ADMIN in Organization A

VIEWER in Organization B
```

Expected:

```text
memberships.remove in A
→ allowed

memberships.remove in B
→ denied
```

---

## P-160 — Unknown Permission Tests

Status:

```text
BLOCKED
```

Dependency:

```text
P-082
```

Verify:

```text
hasPermission(unknown)
→ false

requirePermission(unknown)
→ denied
```

No runtime Permission creation.

---

## P-161 — No Role Hierarchy Regression Test

Status:

```text
BLOCKED
```

Dependency:

```text
P-085
```

Verify authorization does not depend on:

```text
Role.sortOrder

Role name comparison
```

---

## P-162 — No Wildcard Regression Test

Status:

```text
BLOCKED
```

Dependency:

```text
P-086
```

Verify:

```text
memberships.*
```

does not authorize:

```text
memberships.remove
```

---

## P-163 — Protected Operations Integration Tests

Status:

```text
BLOCKED
```

Dependencies:

```text
Stages 9
10
11
```

Test real authorization boundaries for:

```text
Organizations

Memberships

Invitations
```

---

# Stage 16 — Static Validation

## P-170 — Prisma Format

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions schema implemented
```

Run:

```bash
npx prisma format
```

---

## P-171 — Prisma Validate

Status:

```text
BLOCKED
```

Dependency:

```text
P-170
```

Run:

```bash
npx prisma validate
```

---

## P-172 — Prisma Generate

Status:

```text
BLOCKED
```

Dependency:

```text
P-171
```

Run:

```bash
npx prisma generate
```

---

## P-173 — TypeScript Validation

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions source implementation
```

Run:

```bash
npm run typecheck
```

---

## P-174 — Lint Validation

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions source implementation
```

Run:

```bash
npm run lint
```

---

## P-175 — Permissions Test Suite

Status:

```text
BLOCKED
```

Dependency:

```text
Stage 15
```

Run the project's approved test command.

Do not invent a test runner if the project has not yet adopted one.

---

# Stage 17 — Architecture Verification

## P-180 — Audit Forbidden Persistence

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions implementation complete
```

Verify source/schema contain no unauthorized architecture such as:

```text
Permission.organizationId

RolePermission.organizationId

MembershipPermission

OrganizationPermission

ProfilePermission

permissionsJson

permissionFlags
```

---

## P-181 — Audit OWNER Bypass

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions implementation complete
```

Search for logic equivalent to:

```text
OWNER
→ allow all
```

There must be none.

---

## P-182 — Audit Role Hierarchy Authorization

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions implementation complete
```

Verify:

```text
Role.sortOrder
```

is not used for authorization.

---

## P-183 — Audit Permission Wildcards

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions implementation complete
```

Verify no wildcard authorization semantics exist.

---

## P-184 — Audit Client Trust

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions integration complete
```

Verify server authorization never trusts client-supplied:

```text
roleId

roleKey

membershipId

Permission list

canManage flags
```

without server validation.

---

## P-185 — Audit Cross-Tenant Safety

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions integration complete
```

Verify authorization always resolves the Membership for the target Organization.

---

# Stage 18 — Documentation Verification

## P-190 — Compare Implementation With SPEC

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions implementation complete
```

Confirm source implements approved architecture rather than an inferred alternative.

---

## P-191 — Compare Prisma With PRISMA.md

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions persistence complete
```

Verify required invariants rather than exact whitespace or file ordering.

---

## P-192 — Compare Services With API.md

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions services complete
```

Check stable service behavior and errors.

---

## P-193 — Compare Workflows With FLOWS.md

Status:

```text
BLOCKED
```

Dependency:

```text
Permissions integration complete
```

Verify protected operations preserve their owning-module invariants.

---

## P-194 — Update Permissions Documentation Status

Status:

```text
BLOCKED
```

Dependency:

```text
implementation reviewed and accepted
```

Follow the project's documentation lifecycle.

Do not mark implementation docs Living before reality matches them.

---

# Cursor Implementation Rules

Cursor may implement approved tasks.

Cursor must not make new architectural decisions.

If a missing requirement would require deciding:

```text
new entity ownership

new Role model

new Membership model

new Permission semantics

new RLS model

custom Role architecture

platform admin architecture

ownership transfer previous-owner Role
```

Cursor must:

```text
STOP

report finding

request architecture decision
```

---

# Cursor Must Not Create

```text
Profile.roleId

Profile.permissions

Organization.permissions

Organization.roleId

Organization.ownerId

Organization.ownerUserId

Permission.organizationId

RolePermission.organizationId

MembershipPermission

OrganizationPermission

ProfilePermission

Role.permissionsJson

Membership.permissionsJson

permissionFlags

wildcard Permissions

DENY mappings

Role inheritance

Permission inheritance

temporary authorization systems

SUPER_ADMIN shortcuts
```

---

# Cursor Must Not Authorize By

```text
Role.sortOrder

Role display name

Role hierarchy

Permission namespace prefix

client-provided Permission list

client-provided Role

OWNER special-case bypass

hard-coded Role UUID

hard-coded Permission UUID
```

---

# Cursor Must Preserve

```text
Identity
→ canonical user identity

Organizations
→ tenant ownership

Memberships
→ belonging and Membership Role assignment

Roles
→ Role definitions

Permissions
→ Permission definitions and RolePermission grants

Tenancy
→ secure coordination/context

Domains
→ business-specific invariants
```

---

# Permissions Foundation Completion Gate

Permissions Foundation must not be considered complete until all applicable tasks in these areas are DONE:

```text
Persistence

Migration

Permission Registry

System Role Policy

Permission Services

Authorization Guards

Catalog Validation

Policy Validation

Tenant Context Integration

Core Protected Operation Integration

Testing

Static Validation

Architecture Audit
```

---

# Production Readiness Gate

Do not expose Membership or Organization administrative operations as production-ready merely because the persistence model exists.

Production authorization requires:

```text
valid Identity

valid Organization

ACTIVE Membership

canonical Role

explicit Permission

server-side enforcement

resource invariants

cross-tenant denial
```

---

# Known Blocker — Ownership Transfer Destination Role

Ownership transfer architecture still requires one explicit policy decision:

```text
Which Role does the previous OWNER receive after a successful ownership transfer?
```

Do not assume:

```text
ADMIN

MANAGER

MEMBER

VIEWER
```

until the policy is approved.

This blocks only the final ownership-transfer implementation.

It does not block Permissions Foundation documentation or generic Permission persistence.

---

# Initial Implementation Milestone

When prerequisites exist, the first Permissions coding milestone should stop after proving:

```text
Permission model

RolePermission model

migration

canonical Permission registry

canonical system Role policy

idempotent synchronization

policy validation

hasPermission

requirePermission

core authorization tests
```

Do not expand automatically into:

```text
custom Roles

tenant policy editor

ABAC

platform administration

permission-aware RLS

Domain-wide authorization redesign
```

---

# Definition of Ready

Permissions implementation may begin when:

```text
[ ] Organizations Foundation exists in source

[ ] Roles Foundation exists in source

[ ] Memberships Foundation exists in source

[ ] Tenancy Integration exists

[ ] actual Prisma schema inspected

[ ] active migration state inspected

[ ] Permission catalog approved

[ ] RolePermission policy approved

[ ] Permission key strategy approved

[ ] UUID strategy confirmed

[ ] tenant-context contract confirmed

[ ] no competing authorization model exists
```

---

# Definition of Done

Permissions Foundation is DONE when:

```text
[ ] Permission persistence implemented

[ ] RolePermission persistence implemented

[ ] migration reviewed and applied

[ ] Permission registry implemented

[ ] Permission sync idempotent

[ ] system Role policy implemented

[ ] RolePermission sync idempotent

[ ] catalog drift detected

[ ] policy drift detected

[ ] Permission reads implemented

[ ] effective Permissions implemented

[ ] hasPermission implemented

[ ] requirePermission implemented

[ ] missing mapping denies

[ ] unknown Permission denies

[ ] OWNER has no bypass

[ ] Role hierarchy not used

[ ] wildcards absent

[ ] inactive Membership denied

[ ] cross-tenant access denied

[ ] Organization protected operations integrated

[ ] Membership protected operations integrated

[ ] Invitation protected operations integrated

[ ] persistence tests pass

[ ] authorization tests pass

[ ] Prisma format passes

[ ] Prisma validation passes

[ ] Prisma generation passes

[ ] TypeScript passes

[ ] lint passes

[ ] architecture audit passes

[ ] documentation matches implementation
```

---

# Final Principle

Permissions implementation must follow the approved dependency chain.

Do not use Permissions to repair missing tenancy architecture.

Do not use Roles as a permission engine.

Do not use OWNER as a bypass.

Do not use client state as authority.

Do not invent temporary security models.

Every capability is explicit.

Every Role grant is explicit.

Every tenant authorization decision requires a valid Membership context.

Missing authorization denies access.

If implementation requires a new architectural decision:

```text
STOP

report

decide architecture first

then implement
```