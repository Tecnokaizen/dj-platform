---
title: Permissions API
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-09
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - PRISMA.md
  - TASKS.md
  - ../roles/API.md
  - ../roles/SPEC.md
  - ../memberships/API.md
  - ../memberships/FLOWS.md
  - ../organizations/API.md
  - ../../../architecture/API.md
  - ../../../architecture/TENANCY.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/SECURITY.md
---

# Permissions API

## Purpose

This document defines the application interfaces exposed by the Platform Core Permissions module.

Permissions provides stable capabilities for:

```text
Permission lookup

Permission catalog resolution

effective Permission resolution

RolePermission policy inspection

authorization checks

authorization guards

catalog synchronization

system RolePermission synchronization

policy validation
```

The term API refers to application capabilities.

These capabilities may be consumed through:

```text
server services

Server Actions

Server Components

Route Handlers

other Platform Core modules

Business Domains

trusted internal jobs
```

Not every capability requires an HTTP endpoint.

---

# Architectural Ownership

Permissions owns:

```text
Permission

RolePermission

Permission catalog

Role-to-Permission mapping persistence

effective Permission resolution

authorization evaluation

authorization guards
```

Permissions does not own:

```text
Profile

Authentication

Organization

OrganizationMembership

Membership lifecycle

Role definition

Membership Role assignment

Organization ownership invariant

Domain business logic
```

Relevant ownership:

```text
Identity
→ Profile

Organizations
→ Organization

Memberships
→ OrganizationMembership
→ OrganizationInvitation

Roles
→ Role

Permissions
→ Permission
→ RolePermission
```

---

# Core Authorization Contract

Canonical authorization path:

```text
Authenticated Identity
        ↓
Profile
        ↓
Valid Tenant Context
        ↓
ACTIVE OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
        ↓
Requested Operation
```

Permissions evaluates the capability step.

It does not recreate the preceding tenancy layers.

---

# API Design Principles

Permissions API must be:

```text
server-first

deny-by-default

explicit

tenant-aware

stable

typed where practical

independent from client claims

independent from Role hierarchy

independent from wildcard semantics
```

---

# Public Capability Groups

Permissions API is divided into:

```text
Permission Reads

Permission Resolution

Role Permission Reads

Authorization Evaluation

Authorization Guards

Catalog Management

Policy Synchronization

Policy Validation
```

Catalog-management and synchronization capabilities are trusted internal operations.

They are not tenant-user APIs.

---

# Permission DTO

Recommended application representation:

```ts
type PermissionDto = {
  id: string
  key: string
  name: string
  description: string | null
}
```

Persistence timestamps may be included in internal administrative projections where needed.

The semantic authorization identity remains:

```text
key
```

---

# Role Permission DTO

Normal application consumers usually do not need RolePermission row details.

Where required:

```ts
type RolePermissionDto = {
  id: string
  roleId: string
  permissionId: string
  createdAt: string
}
```

Authorization consumers should normally prefer:

```text
Permission keys
```

rather than raw RolePermission persistence records.

---

# Effective Permissions DTO

Recommended representation:

```ts
type EffectivePermissionsDto = {
  roleId: string
  permissions: string[]
}
```

A richer internal representation may use:

```ts
type EffectivePermissionDto = {
  key: string
  name: string
  description: string | null
}
```

depending on caller needs.

---

# Trusted Authorization Context

Permission evaluation requires a trusted server-side tenant context.

Conceptually:

```ts
type AuthorizationContext = {
  profileId: string
  organizationId: string
  membershipId: string
  roleId: string
  roleKey: string
}
```

This is a runtime projection.

It is not persisted by Permissions.

---

# Authorization Context Requirements

The context must represent:

```text
authenticated Profile

target Organization

ACTIVE Membership

Role actually assigned to that Membership
```

Permissions must not accept a context assembled solely from untrusted client input.

---

# No Client-Provided Authority

Do not treat these as authoritative:

```text
organizationId from form

membershipId from browser

roleId from browser

roleKey from browser

permission array from browser

canManage = true
```

The server resolves or validates the persisted tenancy relationship.

---

# Permission Read Operations

Recommended initial capabilities:

```text
getPermission

getPermissionByKey

listPermissions
```

---

# Permission Resolution Operations

Recommended:

```text
resolveRequiredPermission

resolvePermissionsByKeys
```

---

# Role Permission Operations

Recommended read capabilities:

```text
getPermissionsForRole

getPermissionKeysForRole

roleHasPermission
```

System policy mutation remains internal.

---

# Authorization Operations

Canonical application capabilities:

```text
hasPermission

requirePermission
```

These are the primary protected-operation interfaces.

---

# Catalog Internal Operations

Trusted internal capabilities:

```text
syncPermissionCatalog

validatePermissionCatalog
```

---

# Policy Internal Operations

Trusted internal capabilities:

```text
syncSystemRolePermissionPolicy

validateSystemRolePermissionPolicy
```

---

# Get Permission

## Description

Returns a Permission by UUID.

---

## Input

```ts
type GetPermissionInput = {
  permissionId: string
}
```

---

## Output

```text
PermissionDto
```

---

## Validation

Validate:

```text
permissionId
→ UUID
```

---

## Failure

Recommended:

```text
PERMISSION_NOT_FOUND
```

---

# Get Permission By Key

## Description

Returns the canonical Permission matching a semantic key.

---

## Input

```ts
type GetPermissionByKeyInput = {
  permissionKey: string
}
```

---

## Output

```text
PermissionDto
```

or:

```text
null
```

depending on the selected service contract.

The API should distinguish optional lookup from required canonical resolution.

---

# Optional Lookup vs Required Resolution

Recommended separation:

```text
getPermissionByKey()
→ PermissionDto | null
```

and:

```text
resolveRequiredPermission()
→ PermissionDto
→ throws/returns REQUIRED_PERMISSION_MISSING when absent
```

This avoids treating missing canonical configuration as an ordinary nullable case everywhere.

---

# List Permissions

## Description

Returns the canonical persisted Permission catalog.

---

## Output

```text
PermissionDto[]
```

---

## Usage

Useful for:

```text
internal policy review

platform administration

debugging

future Role management UI
```

This is not automatically a tenant-user capability.

---

# Pagination

The canonical Permission catalog is expected to remain relatively small compared with transactional data.

Pagination is not required initially unless actual catalog scale justifies it.

---

# Resolve Required Permission

## Description

Resolves a Permission that application code expects to exist.

---

## Input

```ts
type ResolveRequiredPermissionInput = {
  permissionKey: string
}
```

---

## Output

```text
PermissionDto
```

---

## Failure

If the key is missing:

```text
REQUIRED_PERMISSION_MISSING
```

Authorization must fail safely.

---

# No Runtime Auto-Creation

`resolveRequiredPermission()` must never:

```text
find missing Permission
        ↓
create it automatically
```

Canonical catalog synchronization is a separate trusted operation.

---

# Resolve Permissions By Keys

## Description

Resolves several canonical Permission definitions efficiently.

---

## Input

```ts
type ResolvePermissionsByKeysInput = {
  permissionKeys: string[]
}
```

---

## Output

Conceptually:

```ts
type ResolvePermissionsByKeysResult = {
  permissions: PermissionDto[]
  missingKeys: string[]
}
```

---

## Usage

Useful for:

```text
policy synchronization

catalog validation

Domain registry integration
```

---

# Get Permissions For Role

## Description

Returns the explicit Permissions mapped to one Role.

---

## Input

```ts
type GetPermissionsForRoleInput = {
  roleId: string
}
```

---

## Output

```text
PermissionDto[]
```

---

## Semantics

Returns only explicit RolePermission mappings.

Do not add:

```text
inherited Permissions

wildcard expansion

Role hierarchy expansion
```

---

# Get Permission Keys For Role

## Description

Returns the effective explicit Permission keys for a Role.

---

## Input

```text
roleId
```

---

## Output

```ts
string[]
```

Example:

```text
[
  "organizations.read",
  "memberships.read"
]
```

---

# Role Has Permission

## Description

Checks whether a Role has a direct RolePermission mapping to a canonical Permission.

This is a lower-level Role-policy query.

It does not establish tenant authorization by itself.

---

## Input

```ts
type RoleHasPermissionInput = {
  roleId: string
  permissionKey: string
}
```

---

## Output

```text
boolean
```

---

# Important Boundary

This:

```text
roleHasPermission()
```

does not verify:

```text
Membership

Organization

tenant scope

Membership state
```

Therefore protected tenant operations should normally use:

```text
hasPermission()
```

or:

```text
requirePermission()
```

with trusted tenant context.

---

# Has Permission

## Description

Returns whether a trusted tenant context grants a requested capability.

---

## Input

```ts
type HasPermissionInput = {
  context: AuthorizationContext
  permissionKey: string
}
```

---

## Output

```text
boolean
```

---

# Has Permission Flow

Conceptually:

```text
Trusted Authorization Context
        ↓
Validate Context
        ↓
Permission Key
        ↓
Resolve Permission
        ↓
Resolve RolePermission
        ↓
Mapping exists?
        ├── YES → true
        └── NO  → false
```

---

# Has Permission — Missing Mapping

If:

```text
Role exists

Permission exists

RolePermission does not
```

result:

```text
false
```

This is ordinary deny-by-default authorization.

---

# Has Permission — Unknown Permission

If the requested Permission cannot be resolved:

```text
false
```

No unknown capability may be treated as granted.

---

# Has Permission — OWNER

If:

```text
context.roleKey = OWNER
```

the implementation must still evaluate explicit RolePermission mappings.

Invalid:

```ts
if (roleKey === "OWNER") {
  return true
}
```

---

# Has Permission — Inactive Membership

If context validation proves that Membership is no longer:

```text
ACTIVE
```

result:

```text
false
```

even if the Role itself has the requested Permission.

---

# Has Permission — Cross-Tenant Context

A Role assigned in one Organization does not grant authority in another.

Example:

```text
Profile A
→ ADMIN in Organization A
```

does not mean:

```text
Profile A
→ ADMIN in Organization B
```

The context must correspond to the target Organization.

---

# Require Permission

## Description

Guard-style authorization capability for protected server operations.

---

## Input

```ts
type RequirePermissionInput = {
  context: AuthorizationContext
  permissionKey: string
}
```

---

## Success

If granted:

```text
continue
```

The function may return:

```text
void
```

or the validated authorization context.

---

## Failure

If not granted:

```text
PERMISSION_DENIED
```

---

# Recommended Usage

```text
resolveTenantContext()
        ↓
requirePermission(
  context,
  "invitations.create"
)
        ↓
Memberships.createInvitation()
```

---

# Require Permission Does Not Execute Business Logic

`requirePermission()` must not:

```text
create Invitation

change Role

remove Membership

update Organization

transfer ownership
```

It only authorizes the attempt.

The owning service executes and validates the operation.

---

# Permission Is Necessary, Not Sufficient

Example:

```text
requirePermission(
  "memberships.remove"
)
→ success
```

Memberships still validates:

```text
target Membership exists

same Organization

valid lifecycle state

OWNER safety

transaction rules
```

---

# Authorization Context Validation

Permissions must receive a trusted context or validate one through an approved tenancy service.

A valid context must establish:

```text
Profile

Organization

Membership

Role
```

with:

```text
Membership = ACTIVE
```

and Organization lifecycle permitting the operation.

---

# Invalid Context

Recommended error:

```text
INVALID_AUTHORIZATION_CONTEXT
```

or an upstream Tenancy/Membership error.

Externally, protected operations may normalize this to:

```text
PERMISSION_DENIED
```

where exposing details would be unsafe.

---

# Authorization Context Source

Preferred:

```text
Tenant Context Service
```

or equivalent approved tenancy integration.

Permissions should not create a second competing tenant-context system.

---

# Get Effective Permissions

## Description

Returns the explicit effective Permission set for a trusted context or Role.

Two internal forms may exist.

---

## Role Form

```ts
getEffectivePermissionsForRole(roleId)
```

Returns:

```text
Permission keys or Permission DTOs
```

---

## Tenant Context Form

```ts
getEffectivePermissions(context)
```

First validates tenant context, then resolves the Role's explicit Permission set.

---

# UI Use

A trusted server may use effective Permission keys to drive presentation.

Example:

```text
"invitations.create" absent
→ hide Invite button
```

This improves UX.

It does not replace server enforcement.

---

# No UI Authority

Client-side Permission state must not become authorization truth.

Invalid:

```text
browser says canInvite = true
→ perform operation
```

Correct:

```text
browser requests operation
        ↓
server requirePermission()
```

---

# Canonical Foundation Permission Keys

Initial Platform Core tenancy catalog:

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

These are canonical Foundation capabilities.

---

# Canonical Invitation Naming

Use:

```text
invitations.create
```

for invitation creation.

Do not also create:

```text
memberships.invite
```

for the same protected operation.

One operation should have one canonical capability identity.

---

# Permission Key Constants

Application code should use typed canonical constants where practical.

Conceptually:

```ts
PERMISSIONS.ORGANIZATIONS.READ

PERMISSIONS.ORGANIZATIONS.UPDATE

PERMISSIONS.ORGANIZATIONS.TRANSFER_OWNERSHIP

PERMISSIONS.MEMBERSHIPS.READ

PERMISSIONS.MEMBERSHIPS.SUSPEND

PERMISSIONS.MEMBERSHIPS.RESTORE

PERMISSIONS.MEMBERSHIPS.REMOVE

PERMISSIONS.MEMBERSHIPS.CHANGE_ROLE

PERMISSIONS.INVITATIONS.READ

PERMISSIONS.INVITATIONS.CREATE

PERMISSIONS.INVITATIONS.REVOKE

PERMISSIONS.INVITATIONS.RESEND
```

Runtime values remain canonical string keys.

---

# No UUID Constants

Do not expose application constants such as:

```text
MEMBERSHIPS_REMOVE_PERMISSION_ID
```

Permission UUIDs are persistence identifiers and may differ between environments.

---

# Permission Registry Contract

Permissions Foundation should maintain a version-controlled registry.

Conceptually:

```ts
type PermissionDefinition = {
  key: string
  name: string
  description: string
  owner: string
}
```

---

# Registry Owner Metadata

Example:

```text
key
→ memberships.remove

owner
→ Memberships
```

The owner documents semantic operation ownership.

Permissions still owns authorization persistence.

---

# Sync Permission Catalog

## Description

Trusted internal operation that reconciles declared canonical Permission definitions with persistence.

---

## Input

Conceptually:

```ts
type SyncPermissionCatalogInput = {
  permissions: PermissionDefinition[]
}
```

In normal implementation the canonical registry may be imported directly rather than accepted from arbitrary runtime input.

---

## Output

Conceptually:

```ts
type SyncPermissionCatalogResult = {
  created: string[]
  updated: string[]
  unchanged: string[]
  unknownPersisted: string[]
}
```

---

# Synchronization Rules

For each declared key:

```text
missing
→ create

exists
→ update approved metadata if needed
```

Do not:

```text
rename key implicitly

delete unknown Permission automatically

create wildcard capability

assign Roles automatically outside approved policy
```

---

# Validate Permission Catalog

## Description

Checks persisted Permission state against canonical source definitions.

---

## Result

Conceptually:

```ts
type PermissionCatalogValidationResult = {
  valid: boolean
  missing: string[]
  unexpected: string[]
  metadataDrift: string[]
}
```

---

# Validation Does Not Repair Automatically

Catalog validation reports drift.

It does not silently:

```text
delete

rename

invent
```

authorization records.

---

# System Role Permission Policy Contract

The canonical Role policy maps:

```text
Role.key
→ Permission.key[]
```

Conceptually:

```ts
type SystemRolePermissionPolicy = Record<string, string[]>
```

In implementation, Role and Permission key types should be constrained where practical.

---

# Foundation System Policy

Canonical Foundation policy:

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

# No Policy Inference

The policy must not be generated from:

```text
Role name

Role sortOrder

Role hierarchy

Permission namespace
```

The explicit mapping is authoritative.

---

# Sync System Role Permission Policy

## Description

Trusted internal capability that ensures approved RolePermission mappings exist.

---

## Preconditions

Required:

```text
canonical Roles exist

canonical Permissions exist

policy registry is valid
```

---

## Conceptual Flow

```text
Role key
+
Permission key
        ↓
Resolve Role.id
        ↓
Resolve Permission.id
        ↓
Ensure RolePermission exists
```

---

# Sync Result

Conceptually:

```ts
type SyncRolePermissionPolicyResult = {
  createdMappings: number
  existingMappings: number
  unexpectedMappings: RolePermissionPolicyDrift[]
}
```

Destructive reconciliation should remain explicit.

---

# Missing Role During Sync

If:

```text
ADMIN
```

cannot be resolved:

```text
ROLE_NOT_FOUND
```

or:

```text
REQUIRED_ROLE_MISSING
```

Synchronization fails.

Permissions does not create Role definitions.

---

# Missing Permission During Sync

If the policy references a canonical Permission that does not exist:

```text
REQUIRED_PERMISSION_MISSING
```

Synchronization fails.

---

# Unexpected RolePermission

If persistence contains a grant absent from canonical policy:

```text
detect
```

and:

```text
report
```

Do not silently accept policy expansion.

---

# Validate System Role Permission Policy

## Description

Compares persisted RolePermission mappings with the approved system policy.

---

## Output

Conceptually:

```ts
type RolePermissionPolicyValidationResult = {
  valid: boolean
  missingMappings: PolicyMapping[]
  unexpectedMappings: PolicyMapping[]
  missingRoles: string[]
  missingPermissions: string[]
}
```

---

# Policy Mapping Type

Conceptually:

```ts
type PolicyMapping = {
  roleKey: string
  permissionKey: string
}
```

---

# No Tenant Policy Mutation API

Permissions Foundation must not expose tenant-user capabilities such as:

```text
grantPermissionToRole

revokePermissionFromRole

replaceRolePermissions

createPermission

deletePermission
```

for system authorization policy.

System policy is platform-controlled.

---

# Internal RolePermission Grant

A repository/internal synchronization primitive may create a RolePermission.

This is not equivalent to exposing:

```text
grantPermissionToRole()
```

as a normal application capability.

---

# Internal RolePermission Removal

Approved migrations/synchronization may remove mappings.

This is trusted platform policy maintenance.

It is security-sensitive and should not be exposed to ordinary tenant users.

---

# Permission Errors

Recommended stable errors:

```text
PERMISSION_NOT_FOUND

REQUIRED_PERMISSION_MISSING

PERMISSION_DENIED

INVALID_PERMISSION_KEY

DUPLICATE_PERMISSION_KEY

INVALID_AUTHORIZATION_CONTEXT
```

---

# Role/Policy Errors

May include:

```text
ROLE_NOT_FOUND

REQUIRED_ROLE_MISSING

ROLE_PERMISSION_POLICY_DRIFT

PERMISSION_CATALOG_DRIFT
```

Reuse canonical Roles errors where appropriate rather than duplicating incompatible contracts.

---

# Unknown Permission Authorization Error

For external protected operations:

```text
PERMISSION_DENIED
```

is normally sufficient.

Internal platform diagnostics may additionally distinguish:

```text
REQUIRED_PERMISSION_MISSING
```

when canonical configuration is broken.

---

# Error Security

Do not expose unnecessary authorization details such as:

```text
all Permissions held by another Role

hidden Membership details

cross-tenant Role policy

database mapping IDs
```

Stable denial is safer than verbose security leakage.

---

# Repository Boundary

Recommended architecture:

```text
Consumer
        ↓
Permissions Service
        ↓
Permission Repository
        +
RolePermission Repository
        ↓
Prisma
```

---

# Permission Repository

Possible operations:

```text
findById

findByKey

findManyByKeys

list

create

updateMetadata
```

Creation/update methods are used through trusted catalog synchronization.

---

# RolePermission Repository

Possible operations:

```text
exists

findByRoleAndPermission

listPermissionsForRole

listMappingsForRoles

createMapping

removeMapping
```

Mutation operations remain internal to policy synchronization/migration.

---

# Repository Responsibilities

Repositories may:

```text
query Prisma

persist Permissions-owned entities

apply explicit projections

translate expected persistence conflicts
```

Repositories must not:

```text
authenticate users

resolve client tenant claims

implement HTTP

execute Domain logic

invent Role hierarchy authorization
```

---

# Service Boundary

Permissions services own:

```text
Permission catalog behavior

RolePermission policy behavior

effective Permission resolution

authorization checks
```

Application services consume these capabilities.

---

# Server Action Boundary

A protected Server Action may:

```text
resolve authenticated identity

validate request input

resolve tenant context

require Permission

call owning service

revalidate UI
```

It must not:

```text
query RolePermission directly

hard-code Role checks

trust client Permission state
```

---

# Route Handler Boundary

Protected Route Handlers follow the same authorization contract.

```text
Request
        ↓
Authentication
        ↓
Validation
        ↓
Tenant Context
        ↓
requirePermission()
        ↓
Owning Service
```

HTTP transport does not own authorization policy.

---

# Server Component Boundary

A Server Component may call:

```text
getEffectivePermissions()
```

to render secure server-side UI.

Mutation operations still require server-side authorization independently.

---

# Memberships Integration

Production Membership administration should use:

```text
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

Memberships remains owner of the corresponding workflows.

---

# List Memberships

Example:

```text
resolveTenantContext()
        ↓
requirePermission(
  "memberships.read"
)
        ↓
Memberships.listMembershipsForOrganization()
```

---

# Suspend Membership

```text
requirePermission(
  "memberships.suspend"
)
        ↓
Memberships.suspendMembership()
```

Memberships still enforces OWNER safety.

---

# Restore Membership

```text
requirePermission(
  "memberships.restore"
)
        ↓
Memberships.restoreMembership()
```

---

# Remove Membership

```text
requirePermission(
  "memberships.remove"
)
        ↓
Memberships.removeMembership()
```

Permission does not bypass the ownership invariant.

---

# Change Membership Role

```text
requirePermission(
  "memberships.change_role"
)
        ↓
Memberships.changeMembershipRole()
```

Memberships resolves and validates the target Role.

---

# Invitation Read

```text
requirePermission(
  "invitations.read"
)
        ↓
Memberships.listInvitationsForOrganization()
```

No secret token information is exposed.

---

# Invitation Creation

```text
requirePermission(
  "invitations.create"
)
        ↓
Memberships.createInvitation()
```

Memberships still enforces:

```text
recipient validation

duplicate protection

Role validity

OWNER restriction

token security
```

---

# Invitation Revocation

```text
requirePermission(
  "invitations.revoke"
)
        ↓
Memberships.revokeInvitation()
```

---

# Invitation Resend

```text
requirePermission(
  "invitations.resend"
)
        ↓
Memberships.resendInvitation()
```

---

# Organizations Integration

Protected Organization operations use:

```text
organizations.read

organizations.update

organizations.transfer_ownership
```

Organizations remains owner of Organization behavior.

---

# Organization Read

```text
requirePermission(
  "organizations.read"
)
        ↓
Organizations read operation
```

Public Organization data may use separate approved public-access paths.

---

# Organization Update

```text
requirePermission(
  "organizations.update"
)
        ↓
Organizations.update()
```

---

# Ownership Transfer

```text
requirePermission(
  "organizations.transfer_ownership"
)
        ↓
Ownership Transfer Workflow
```

The workflow still validates:

```text
current OWNER

target ACTIVE Membership

same Organization

previous-owner Role

exactly-one-OWNER invariant

atomic transaction
```

---

# Initial Organization Creation

Initial Organization onboarding occurs before tenant Permissions can exist for the creator.

Therefore normal tenant Permission evaluation does not authorize:

```text
create first Organization
```

This remains a tenancy bootstrap capability.

---

# Invitation Acceptance

Invitation acceptance does not require a pre-existing tenant Permission because the recipient may not yet have Membership.

Acceptance is authorized through:

```text
valid Invitation

matching authenticated identity

Memberships rules
```

---

# Domain Permission Integration

Domains may protect operations through canonical Permission keys.

Example:

```text
requirePermission(
  "copy.orders.update"
)
        ↓
Copy Domain update service
```

---

# Domain Permission Registration

A Domain may contribute Permission definitions through an approved registry extension.

Conceptually:

```ts
registerDomainPermissions([
  {
    key: "copy.orders.update",
    name: "Update orders",
    description: "...",
    owner: "Copy Domain"
  }
])
```

The actual implementation should prefer static composition over arbitrary runtime registration where practical.

---

# Domain Default Policy

A Domain may also declare approved default grants for canonical system Roles.

Example:

```text
MEMBER
→ copy.orders.read
```

Such grants must be explicit and version-controlled.

---

# Registry Collision

If Core and a Domain declare the same:

```text
Permission.key
```

with conflicting semantic definitions:

```text
FAIL
```

Permission keys are globally unique within the installation.

---

# No Namespace Wildcards

Domain permission declarations must remain explicit.

Do not support:

```text
ADMIN
→ copy.*
```

or:

```text
OWNER
→ *
```

---

# Caching API

Permissions may internally cache effective Permission sets.

Caching is an implementation optimization.

It is not part of the semantic authorization contract.

---

# Cache Key

For global system Role policy, effective Permission cache may be keyed by:

```text
roleId
```

or another stable Role identity.

Tenant authority still requires valid Membership context.

---

# Cache Invalidation

Invalidate affected authorization cache when:

```text
RolePermission mapping changes

Permission catalog changes materially
```

Tenant-context authorization must also be invalidated when:

```text
Membership Role changes

Membership becomes SUSPENDED

Membership becomes REMOVED

Organization becomes inaccessible
```

---

# No Permission Snapshot API

Do not persist or expose canonical authorization through:

```text
Membership.permissionsJson

Profile.permissionsJson

Role.permissionKeys[]
```

as competing sources of truth.

---

# RLS Boundary

Permissions API initially governs server-side operation authorization.

Membership-based RLS primarily governs tenant row isolation.

Do not duplicate the entire API as a second PostgreSQL permission engine during Foundation.

---

# Direct Client Writes

If future architecture allows direct Supabase client mutation of protected tenant data, server-only `requirePermission()` is insufficient for those paths.

Permission-aware RLS then requires a separate approved design.

---

# Audit Boundary

Permissions may request Audit events for policy changes such as:

```text
permission.created

permission.updated

role_permission.granted

role_permission.revoked
```

Routine `hasPermission()` checks should not automatically create audit records.

---

# Observability Boundary

Repeated denied security-sensitive operations may be logged or monitored through approved observability/security tooling.

Permissions persistence is not an authorization-decision log.

---

# Internal Trusted Operations

The following may bypass tenant-user Permission checks because they are explicitly trusted platform operations:

```text
Permission catalog synchronization

RolePermission policy synchronization

database migration

seed

maintenance validation
```

Do not create a fake OWNER or fake Membership to execute these tasks.

---

# Source Structure

Recommended implementation location:

```text
src/core/modules/permissions/
```

Possible real directories:

```text
constants/

repositories/

services/

schemas/

types/
```

Only create directories required by implementation.

---

# Suggested Services

Possible services:

```text
get-permission.ts

get-permission-by-key.ts

list-permissions.ts

resolve-required-permission.ts

get-permissions-for-role.ts

has-permission.ts

require-permission.ts

sync-permission-catalog.ts

validate-permission-catalog.ts

sync-system-role-permission-policy.ts

validate-system-role-permission-policy.ts
```

Exact file naming should follow project conventions.

---

# No Permissions Logic in app

`src/app` may invoke Permission services.

It must not implement canonical authorization policy directly.

---

# No Permissions Logic in shared

`src/shared` must not own:

```text
RolePermission policy

Permission evaluation

authorization rules
```

Permissions is a Platform Core capability.

---

# No Permissions Logic in lib

`src/lib` may provide technical persistence/cache adapters.

It must not own authorization semantics.

---

# No Domain Permission Engine

Domains may consume Permissions.

They must not create competing tenant authorization engines that bypass Platform Core.

---

# Input Validation

Permission-key input should be validated.

Canonical Foundation format:

```text
lowercase dot-separated key
```

Application code should prefer typed constants over arbitrary strings.

---

# Permission Key Schema

Conceptually:

```ts
permissionKeySchema
```

validates the approved key format.

Validation does not prove that the key exists.

Persistence/catalog lookup still determines canonical existence.

---

# Stable Errors

Recommended Permissions API errors:

```text
PERMISSION_NOT_FOUND

REQUIRED_PERMISSION_MISSING

PERMISSION_DENIED

INVALID_PERMISSION_KEY

INVALID_AUTHORIZATION_CONTEXT

PERMISSION_CATALOG_DRIFT

ROLE_PERMISSION_POLICY_DRIFT
```

---

# Upstream Errors

Permissions may also encounter canonical errors from:

```text
Roles

Memberships

Tenancy
```

such as:

```text
ROLE_NOT_FOUND

MEMBERSHIP_NOT_FOUND

MEMBERSHIP_NOT_ACTIVE
```

Avoid redefining the same semantic error inconsistently.

---

# Authorization Failure Exposure

External protected operations should normally expose:

```text
PERMISSION_DENIED
```

rather than detailed internal RolePermission diagnostics.

---

# Performance

Permission evaluation is expected to be frequent.

Use:

```text
indexed Permission key lookup

indexed RolePermission lookup

explicit projections

optional trusted cache
```

Do not sacrifice authorization correctness for fewer queries.

---

# Avoid N+1 Authorization

When a server page needs multiple capability checks for one Role, prefer:

```text
getEffectivePermissions()
```

once rather than querying RolePermission separately for every button.

---

# Batch Permission Checks

A future helper may support:

```ts
hasPermissions(context, permissionKeys)
```

or:

```ts
requireAllPermissions(...)
```

only if real use cases justify it.

Do not introduce complicated boolean policy combinators during Foundation.

---

# No ANY/ALL Policy DSL Initially

Do not build:

```text
ANY(permissionA, permissionB)

ALL(permissionA, permissionB)

NOT(permissionC)
```

as a generic authorization language during Foundation.

Owning application services may make explicit multiple checks where required.

---

# Security Invariants

The Permissions API must preserve:

```text
No Membership
→ no tenant authorization

Inactive Membership
→ no tenant authorization

Missing Permission
→ deny

Missing RolePermission
→ deny

Unknown Permission
→ deny

OWNER without mapping
→ deny

Role hierarchy
→ no authority

Permission namespace
→ no inheritance

client Permission data
→ no authority

Role in Organization A
→ no automatic authority in Organization B
```

---

# Explicitly Excluded APIs

Permissions Foundation must not expose:

```text
createCustomRole

assignRoleToMembership

grantPermissionToMembership

denyPermissionToMembership

grantPermissionToOrganization

setPermissionOverride

createWildcardPermission

createDenyRule

createPermissionHierarchy

createRoleHierarchy

setPlatformSuperAdmin
```

---

# Explicitly Excluded Persistence Concepts

Permissions API must not require:

```text
Permission.organizationId

RolePermission.organizationId

MembershipPermission

OrganizationPermission

ProfilePermission

permissionsJson

permissionFlags

wildcard grants

DENY mappings
```

---

# Future API Possibilities

Possible future capabilities include:

```text
custom tenant Role Permission editing

Permission-aware RLS helpers

effective Permission diagnostics

policy versioning

enterprise policy administration

ABAC integration

permission deprecation tooling
```

These require explicit architectural approval.

---

# Foundation Implementation Boundary

Permissions Foundation API includes:

```text
getPermission

getPermissionByKey

listPermissions

resolveRequiredPermission

resolvePermissionsByKeys

getPermissionsForRole

getPermissionKeysForRole

roleHasPermission

getEffectivePermissions

hasPermission

requirePermission

syncPermissionCatalog

validatePermissionCatalog

syncSystemRolePermissionPolicy

validateSystemRolePermissionPolicy
```

---

# Production Integration Boundary

Once Permissions Foundation exists, protected tenant operations can use:

```text
requirePermission()
```

before invoking their owning services.

This completes fine-grained authorization for the initial Platform Core tenancy administration surface.

---

# Definition of Ready

Permissions API is ready when:

- Permission ownership is explicit.
- RolePermission ownership is explicit.
- canonical Permission catalog is approved.
- Foundation system Role policy is approved.
- Permission-key format is approved.
- invitation Permission naming is canonical.
- no duplicate `memberships.invite` capability exists.
- deny-by-default behavior is approved.
- OWNER bypass is prohibited.
- Role hierarchy authorization is prohibited.
- wildcard authorization is prohibited.
- tenant context contract is understood.
- synchronization behavior is defined.
- policy drift behavior is defined.
- protected Core operation mappings are explicit.
- Domain extension boundary is understood.
- SPEC, DATA_MODEL and FLOWS agree with this API.

---

# Definition of Done

Permissions API implementation is complete when:

- Permission lookup by ID works.
- Permission lookup by key works.
- required Permission resolution works.
- Permission listing works.
- multi-key resolution works where required.
- Permissions for Role resolve explicitly.
- RolePermission lookup works.
- effective Permission resolution works.
- hasPermission denies by default.
- requirePermission returns stable denial.
- unknown Permission denies.
- missing RolePermission denies.
- OWNER has no magic bypass.
- Role hierarchy is not used as authorization.
- wildcard authorization is absent.
- canonical Permission registry exists.
- catalog synchronization is idempotent.
- catalog validation detects drift.
- system Role policy synchronization is idempotent.
- policy validation detects missing and unexpected mappings.
- no hard-coded Role UUIDs exist.
- no hard-coded Permission UUIDs exist.
- tenant context is server trusted.
- SUSPENDED Membership cannot authorize.
- REMOVED Membership cannot authorize.
- cross-tenant authority is denied.
- Membership administration integrates with Permissions.
- Organization administration integrates with Permissions.
- ownership transfer uses its explicit Permission.
- invitation administration uses canonical `invitations.*` Permissions.
- UI capability state is not authoritative.
- repository boundaries are preserved.
- Prisma errors do not leak through application contracts.
- relevant tests pass.
- TypeScript passes.
- Lint passes.
- documentation matches implementation.

---

# Final Principle

Permissions exposes the canonical authorization interface.

A Permission represents a capability.

A RolePermission explicitly grants that capability to a Role.

A Membership places that Role inside one Organization.

Tenant context must be valid before Permission evaluation.

Missing mappings deny access.

Unknown capabilities deny access.

OWNER does not bypass policy.

Role hierarchy does not grant capabilities.

Permission namespaces do not imply capabilities.

The Permissions API authorizes the attempt.

The owning Core module or Domain still validates and executes the operation.