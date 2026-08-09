---
title: Roles API
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - PRISMA.md
  - TASKS.md
  - ../organizations/API.md
  - ../organizations/FLOWS.md
  - ../../../architecture/API.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/SECURITY.md
---

# Roles API

## Purpose

This document defines the public application interface exposed by the Platform Core Roles module.

The term API refers to stable application capabilities.

These capabilities may be consumed through:

```text
Services
Server Actions
Server Components
Route Handlers
Other Platform Core modules
Business Domains
```

Not every operation requires an HTTP endpoint.

Roles provides canonical Role definitions and Role resolution.

Roles does not own Role assignment to Memberships or Permission evaluation.

---

# Architectural Ownership

Roles owns:

```text
Role
Role identity
Role key
Role metadata
Canonical system Role definitions
Role lookup
Required Role resolution
```

Roles does not own:

```text
OrganizationMembership
Membership lifecycle
Membership Role persistence
Permission
Permission evaluation
Organization ownership persistence
Invitations
Organization
Profile
```

Related ownership:

```text
Identity
→ Profile

Organizations
→ Organization

Memberships
→ OrganizationMembership

Roles
→ Role

Permissions
→ Permission
```

Cross-module workflows may consume the Roles API.

That does not transfer ownership to Roles.

---

# Initial Role Catalog

The initial canonical Roles are:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

These are global system Roles.

They are not Organization-specific.

---

# API Design Principles

The Roles API must be:

```text
Server-first
Stable
Business agnostic
Persistence-independent where practical
Explicit
Minimal
Safe for authorization workflows
```

The API should expose application concepts rather than Prisma implementation details.

---

# Initial Public Capabilities

Recommended Roles application interface:

```text
getRole

getRoleByKey

listRoles

listSystemRoles

resolveRequiredRole
```

Internal initialization may additionally provide:

```text
seedSystemRoles

validateSystemRoleCatalog
```

Normal application users do not require generic Role CRUD.

---

# Explicitly Excluded Capabilities

The initial Roles API must not expose Role-owned operations such as:

```text
assignRoleToMembership

removeRoleFromMembership

inviteMemberWithRole

changeMembershipRole

transferOwnership

grantPermission

revokePermission

createCustomRole

deleteSystemRole
```

Role assignment belongs to Memberships.

Permission management belongs to Permissions.

Ownership transfer is a cross-module tenancy workflow.

---

# Role DTO

Public application consumers should preferably receive a stable Role contract.

Conceptual DTO:

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

Timestamp fields may be omitted from normal consumers unless required.

Generated Prisma types should not automatically become the permanent public API contract.

---

# Get Role

## Description

Returns a Role by canonical UUID.

---

## Input

```text
roleId
```

Conceptual contract:

```ts
type GetRoleInput = {
  roleId: string
}
```

---

## Output

```text
RoleDto
```

---

## Validation

Validate:

```text
roleId
→ valid UUID
```

---

## Authorization

Reading canonical system Role definitions does not require tenant-specific Membership authorization.

Roles are global Platform Core reference data.

However, application exposure remains server-controlled.

---

## Flow

```text
Input
  ↓
Validate UUID
  ↓
Roles Service
  ↓
Role Repository
  ↓
Role Found?
  ├── YES → RoleDto
  └── NO  → ROLE_NOT_FOUND
```

---

# Get Role By Key

## Description

Returns a Role using its stable semantic key.

This is the preferred lookup for canonical Platform Core workflows.

---

## Input

```text
key
```

Examples:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Conceptual contract:

```ts
type GetRoleByKeyInput = {
  key: string
}
```

---

## Output

```text
RoleDto
```

---

## Validation

Role key must be:

```text
non-empty
machine readable
normalized as required
```

Canonical system Role keys are uppercase.

---

## Flow

```text
Role Key
   ↓
Validate
   ↓
Repository.findByKey()
   ↓
Found?
   ├── YES → RoleDto
   └── NO  → ROLE_NOT_FOUND
```

---

# Canonical Key Resolution

Required platform workflows should use:

```text
key
```

rather than hard-coded UUIDs.

Correct:

```text
getRoleByKey("OWNER")
```

Incorrect:

```text
getRole("hard-coded-production-uuid")
```

UUID values may differ across environments.

Semantic Role keys remain stable.

---

# List Roles

## Description

Returns Roles available from the canonical Platform Core Role catalog.

Initial implementation may return the same catalog as:

```text
listSystemRoles
```

because custom Roles do not yet exist.

---

## Input

Usually none.

Possible future options:

```text
systemOnly?
pagination?
```

Do not add speculative filtering without a real requirement.

---

## Output

```text
RoleDto[]
```

---

## Ordering

Recommended predictable ordering:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

using:

```text
sortOrder
```

---

# List System Roles

## Description

Returns canonical Roles managed by Platform Core.

---

## Input

None.

---

## Output

```text
RoleDto[]
```

where:

```text
isSystem = true
```

---

## Authorization

System Role definitions may be safely consumed by authenticated application workflows.

Whether they are exposed publicly through HTTP is a separate transport decision.

---

# Resolve Required Role

## Description

Resolves a canonical Role required by a critical Platform Core workflow.

Examples:

```text
OWNER
MEMBER
```

Unlike a normal optional lookup, failure indicates a platform configuration problem.

---

## Input

```text
key
```

Conceptual contract:

```ts
type ResolveRequiredRoleInput = {
  key: string
}
```

---

## Output

```text
RoleDto
```

or an internal Role application object suitable for cross-module orchestration.

---

## Expected Behavior

```text
Requested Role
      ↓
Validate Canonical Key
      ↓
Find Role
      ↓
Role Exists?
      ├── YES
      │    ↓
      │ Validate Required Properties
      │    ↓
      │ Return Role
      │
      └── NO
           ↓
         REQUIRED_ROLE_MISSING
```

---

## Runtime Creation Prohibited

`resolveRequiredRole()` must not create missing Roles.

Invalid:

```text
OWNER missing
      ↓
Create OWNER automatically
```

Correct:

```text
OWNER missing
      ↓
Fail workflow safely
```

Canonical Role initialization belongs to deployment/seed processes.

---

# Resolve OWNER

A complete Organization onboarding workflow may consume:

```text
resolveRequiredRole("OWNER")
```

Conceptually:

```text
Organizations onboarding
        ↓
Roles.resolveRequiredRole("OWNER")
        ↓
Memberships creates OWNER Membership
```

Roles only returns the canonical Role.

It does not create the Membership.

---

# Role Assignment Boundary

Role assignment is not a Roles-owned persistence capability.

Conceptually:

```text
Roles
→ resolve target Role

Memberships
→ persist roleId on OrganizationMembership
```

Therefore this API does not provide:

```text
roles.assign(...)
```

as a Role persistence operation.

---

# Cross-Module Role Change

A future Memberships API might conceptually perform:

```text
changeMembershipRole(
  organizationId,
  membershipId,
  targetRoleId
)
```

Its internal workflow may call Roles:

```text
Memberships
    ↓
Roles.getRole(targetRoleId)
    ↓
Validate target Role
    ↓
Memberships updates roleId
```

The mutation remains owned by Memberships.

---

# OWNER Assignment

OWNER is a canonical Role but assigning it requires special tenancy rules.

Roles API may resolve:

```text
OWNER
```

Roles API must not independently expose:

```text
assignOwner
```

Ownership transfer requires:

```text
Organizations
Memberships
Roles
```

and appropriate authorization.

---

# Membership Creation Integration

Future Membership creation may consume Roles.

Example:

```text
Create Membership
       ↓
Resolve Requested Role
       ↓
Validate Role
       ↓
Memberships Persists Membership
```

Roles validates the Role definition.

Memberships owns the record.

---

# Invitations Integration

A future invitation workflow may allow selection of an intended Role.

Roles API may provide:

```text
listSystemRoles()
```

and:

```text
getRole(roleId)
```

Memberships owns:

```text
Invitation
Membership creation
Role assignment persistence
```

---

# Permissions Integration

The Roles API does not answer:

```text
Can this actor perform this operation?
```

That decision eventually belongs to Permissions.

Conceptually:

```text
Membership
   ↓
Role
   ↓
Permissions
   ↓
Authorization Decision
```

Roles API provides only the Role identity/definition part of that chain.

---

# No Permission API

Roles must not expose:

```text
getPermissionsForRole

hasPermission

can

authorize

grantPermission

revokePermission
```

until the Permissions module defines the canonical interface and ownership model.

If such convenience capabilities are eventually exposed through a higher-level authorization facade, they must still use Permissions as the source of truth.

---

# Role Hierarchy

Roles may expose ordering metadata through:

```text
sortOrder
```

The API must not treat ordering as authorization.

Invalid API semantics:

```text
isRoleHigherThan()

canManageLowerRole()
```

unless explicitly specified later by authorization architecture.

Permission rules must remain explicit.

---

# System Role Protection

Canonical system Roles are protected platform reference data.

Normal application APIs must not support:

```text
deleteRole

renameRoleKey

changeSystemStatus
```

for:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Controlled internal migration may evolve metadata when intentionally approved.

---

# Seed System Roles

## Description

Creates or reconciles the canonical system Role catalog.

This is an initialization capability.

It is not a normal user-facing API.

---

## Required Catalog

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

---

## Behavior

Seed must be idempotent.

Conceptually:

```text
for each canonical Role
        ↓
find by key
        ↓
exists?
   ├── YES → validate / reconcile approved metadata
   └── NO  → create
```

---

## Output

Possible internal result:

```ts
type SeedSystemRolesResult = {
  created: number
  updated: number
  unchanged: number
}
```

Exact shape may be implementation-specific.

---

## Forbidden Seed Behavior

Seed must not:

```text
delete arbitrary Roles

change Membership assignments

create Permissions

create Memberships

rewrite Organization ownership

silently change canonical Role semantics
```

---

# Validate System Role Catalog

## Description

Checks whether all required canonical Roles exist and satisfy required invariants.

---

## Required Checks

```text
OWNER exists

ADMIN exists

MANAGER exists

MEMBER exists

VIEWER exists

All canonical keys are unique

All canonical Roles are system Roles
```

---

## Output

Possible conceptual result:

```text
valid
```

or a structured validation result.

For deployment/readiness checks, missing required Roles must produce failure.

---

# Validation Rules

Roles operations validate only the inputs relevant to their responsibility.

Possible validation dimensions:

```text
UUID

Role key

Required canonical key

System Role state
```

Membership and Permission validation do not belong to Roles.

---

# Role Key Validation

Canonical system Role keys are stable.

Expected values:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Generic lookup may eventually support additional Role keys if the architecture evolves.

Critical system workflows should validate that the requested Role is a canonical required Role where appropriate.

---

# Stable Role Constants

Application code may define constants for canonical Role keys.

Example:

```ts
const SYSTEM_ROLE_KEYS = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const
```

Constants represent semantic keys.

They do not replace persisted Role records.

---

# Do Not Use Role Names for Logic

Invalid:

```ts
if (role.name === "Owner") {
  // ...
}
```

Correct semantic comparison:

```text
role.key = OWNER
```

Human-readable names may change or be localized.

---

# Errors

Recommended Role-level application errors:

```text
ROLE_NOT_FOUND

ROLE_KEY_CONFLICT

ROLE_INVALID

REQUIRED_ROLE_MISSING

SYSTEM_ROLE_PROTECTED

INVALID_ROLE_KEY
```

Platform-generic errors may include:

```text
VALIDATION_ERROR

PERSISTENCE_ERROR
```

---

# ROLE_NOT_FOUND

Used when a normal Role lookup fails.

Example:

```text
getRole(unknownId)
```

---

# REQUIRED_ROLE_MISSING

Used when a critical platform workflow requires a canonical Role that is not available.

Example:

```text
resolveRequiredRole("OWNER")
```

and OWNER is missing.

This represents a platform configuration problem rather than a normal resource lookup failure.

---

# SYSTEM_ROLE_PROTECTED

Used if an unsupported operation attempts to mutate protected canonical Role semantics.

Examples:

```text
Delete OWNER

Change OWNER key
```

---

# Error Boundary

Roles API must not expose:

```text
Prisma error codes

SQL errors

database topology

internal stack traces
```

Stable application errors should be returned instead.

---

# Repository Boundary

Preferred architecture:

```text
Consumer
   ↓
Roles Service
   ↓
Role Repository
   ↓
Prisma
```

The repository owns Role persistence access.

Application consumers should not access Prisma directly to resolve Roles.

---

# Repository Interface

Possible initial repository operations:

```text
findById

findByKey

findSystemRoles

create

updateApprovedMetadata
```

Only persistence operations actually required by Roles Foundation should be implemented.

---

# Service Interface

Possible application services:

```text
getRole

getRoleByKey

listSystemRoles

resolveRequiredRole

validateSystemRoleCatalog
```

Seed behavior may remain in a controlled initialization service/script.

---

# Server Actions

The initial Roles Foundation does not require normal user-facing Server Actions.

Role lookup may be consumed directly by server-side application services.

Do not create Server Actions merely because other modules use them.

---

# Route Handlers

The initial Roles Foundation does not require REST endpoints.

Route Handlers should be introduced only if Roles must be consumed by:

```text
External API clients
External administrative systems
Public integrations
```

Internal Platform Core usage should prefer direct server-side application interfaces.

---

# Client Consumption

A client UI may need Role options.

Preferred flow:

```text
Server Component / Server Action
        ↓
Roles Service
        ↓
Role DTOs
        ↓
Client UI
```

The client receives presentation data.

It does not become an authorization authority.

---

# Security

Role definitions are security-relevant reference data.

Never trust client claims such as:

```text
I am OWNER
```

or:

```text
roleId = ADMIN UUID
```

Authority must be resolved through persisted Membership data.

---

# Global Role Data

Initial Roles are global.

Therefore:

```text
getRoleByKey("ADMIN")
```

does not require:

```text
organizationId
```

This lookup only returns the Role definition.

It does not determine whether any Profile holds ADMIN authority in any Organization.

---

# Tenant Authority

Tenant authority requires:

```text
Profile
   ↓
OrganizationMembership
   ↓
Role
```

Example:

```text
Profile X

Organization A
→ ADMIN

Organization B
→ VIEWER
```

The global Role records remain the same.

Memberships establish tenant-specific authority.

---

# RLS

The initial global Roles catalog is not tenant-owned data.

RLS requirements therefore differ from tenant-owned resources.

Role lookup policy must not imply that Role possession or Role existence grants tenant access.

Membership-based tenant authorization belongs elsewhere.

---

# Caching

Canonical Role definitions are strong candidates for caching because they change rarely.

Possible conceptual cache keys:

```text
role:id:{roleId}

role:key:{roleKey}

roles:system
```

Caching is optional during the initial implementation.

Correctness comes before optimization.

---

# Cache Invalidation

If Role metadata is changed through controlled maintenance:

```text
Persist Change
      ↓
Invalidate Role Cache
```

Canonical key semantics must remain stable.

---

# Performance

The Role catalog is intentionally small.

Initial implementation should avoid unnecessary complexity.

Do not introduce:

```text
complex pagination

distributed caching

search infrastructure

role hierarchy graph queries
```

without demonstrated need.

---

# Pagination

The five-role canonical system catalog does not require pagination.

If custom Roles are introduced later, pagination requirements may be reconsidered.

---

# Events

Roles may eventually emit definition-level events such as:

```text
role.created

role.updated

role.retired
```

The initial Roles Foundation does not require an event-heavy implementation.

---

# Role Assignment Events

Changes such as:

```text
membership.role_changed
```

belong to Memberships because the mutated persisted entity is:

```text
OrganizationMembership
```

Roles must not claim ownership of Membership events.

---

# Audit

Changes to security-relevant Role definitions may eventually request Audit recording.

Audit persistence belongs to:

```text
Audit
```

Role lookup does not require an Audit event.

Membership assignment Audit belongs to the Membership/authorization workflow.

---

# Transaction Requirements

Normal Role lookup does not require a transaction.

Role seed initialization may use transactions where useful for consistency.

Cross-module workflows may resolve a Role before a transaction.

Example:

```text
Resolve OWNER
        ↓
BEGIN
        ↓
Create Organization
        ↓
Create Membership using OWNER.id
        ↓
COMMIT
```

Roles does not own the Organization/Membership transaction.

---

# Cross-Module Consumption

## Organizations

Organizations may consume:

```text
resolveRequiredRole("OWNER")
```

during complete Organization onboarding.

---

## Memberships

Memberships may consume:

```text
getRole

getRoleByKey

listSystemRoles
```

for Membership creation and Role assignment.

---

## Permissions

Permissions will consume Role identity when defining authorization mappings.

The exact interface will be defined by Permissions documentation.

---

## Business Domains

Business Domains may read Role context indirectly through authorization services.

Domains should not duplicate the canonical Role catalog.

---

# Custom Roles

Custom Role APIs are explicitly deferred.

Do not implement:

```text
createRole

updateCustomRole

deleteCustomRole

cloneRole

createOrganizationRole
```

until custom Role architecture is approved.

---

# Future API Possibilities

Possible future capabilities include:

```text
listAssignableRoles

createCustomRole

updateCustomRole

retireCustomRole

cloneRole

getRolePermissions
```

These are not part of Roles Foundation.

Some may ultimately belong partly or entirely to other modules.

Do not implement speculative APIs.

---

# Initial Implementation Boundary

Roles Foundation may implement:

```text
getRole

getRoleByKey

listSystemRoles

resolveRequiredRole

seedSystemRoles

validateSystemRoleCatalog
```

It must not implement:

```text
Membership Role mutation

Permission evaluation

Organization-specific Roles

Custom Role CRUD

Ownership transfer

Invitation management
```

---

# Definition of Ready

Roles API is ready for implementation when:

- Canonical Roles are approved.
- Role keys are approved.
- Role ownership is explicit.
- Global initial Role scope is approved.
- Role DTO is understood.
- Required Role resolution behavior is defined.
- Missing Role behavior is defined.
- Membership assignment remains outside Roles.
- Permission evaluation remains outside Roles.
- Seed behavior is understood.
- System Role protection is understood.
- SPEC, DATA_MODEL and FLOWS agree with this API.

---

# Definition of Done

Roles API implementation is complete when:

- Roles can be retrieved by UUID.
- Roles can be retrieved by key.
- Canonical system Roles can be listed.
- Required Roles can be resolved.
- Missing required Roles fail safely.
- Stable Role errors are used.
- Prisma access remains behind repository boundaries.
- Raw persistence errors do not leak.
- Role assignment remains outside Roles.
- Permission evaluation remains outside Roles.
- No custom Role API is introduced.
- Relevant tests pass.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.

---

# Final Principle

Roles exposes the canonical Role catalog and reliable Role resolution.

It defines Roles.

It does not assign them.

Memberships assigns Roles.

Organizations defines the tenant.

Permissions determines what those Roles may do.