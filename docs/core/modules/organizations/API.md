---
title: Organizations API
version: 1.1.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - PRISMA.md
  - TASKS.md
  - ../../../architecture/API.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
---

# Organizations API

## Purpose

This document defines the public application interface exposed by the Platform Core Organizations module.

The term API in this document refers to the stable application capabilities provided by Organizations.

These capabilities may be implemented through:

- Services
- Server Actions
- Server Components
- Route Handlers
- Internal application interfaces

This document does not require every operation to be exposed as an HTTP endpoint.

---

# Architectural Ownership

Organizations owns:

```text
Organization
Organization lifecycle
Organization identity
Organization tenant boundary
```

Organizations does not own:

```text
OrganizationMembership
Membership lifecycle
Invitations
Roles
Permissions
Billing
Audit persistence
Settings persistence
Domain data
```

Related ownership:

```text
Organizations
→ Organization

Memberships
→ OrganizationMembership

Roles
→ Role

Permissions
→ Permission

Audit
→ AuditEvent

Billing
→ BillingAccount

Settings
→ OrganizationSettings
```

Cross-module operations may still be exposed through the Organizations application interface when they represent an Organization-oriented user workflow.

Orchestration does not transfer ownership.

---

# Design Principles

The Organizations API must be:

- Server-first
- Explicit
- Tenant-aware
- Authorization-aware
- Stable
- Framework-independent where practical
- Independent from Prisma persistence types
- Safe for AI-assisted implementation

Public contracts should represent application concepts rather than database implementation details.

---

# Operation Categories

Organizations exposes two categories of operations.

## Organization-Owned Operations

These mutate or retrieve data owned directly by Organizations.

```text
createOrganizationRecord
getOrganization
getOrganizationBySlug
updateOrganization
suspendOrganization
reactivateOrganization
archiveOrganization
restoreOrganization
```

The exact internal service naming may differ.

---

## Cross-Module Organization Operations

These are exposed from Organization context but require other Core modules.

```text
createOrganization
listUserOrganizations
transferOwnership
getActiveOrganization
switchActiveOrganization
deleteOrganization
```

Depending on implementation, these may act as application-level facades coordinating several capabilities.

They must not duplicate the persistence owned by those capabilities.

---

# Public Operations

Recommended application interface:

```text
createOrganization

getOrganization

getOrganizationBySlug

listUserOrganizations

updateOrganization

suspendOrganization

reactivateOrganization

archiveOrganization

restoreOrganization

deleteOrganization

transferOwnership

getActiveOrganization

switchActiveOrganization
```

Membership-specific operations such as:

```text
inviteMember

removeMember

suspendMember

restoreMembership

acceptInvitation
```

belong to the Memberships module and are not part of the Organizations API.

---

# Create Organization

## Description

Creates a new Organization and, when the complete tenancy foundation is available, establishes its required ownership relationship.

This is a cross-module operation.

---

## Ownership

```text
Organization creation
→ Organizations

OWNER Membership creation
→ Memberships

OWNER Role resolution
→ Roles
```

---

## Input

```text
name

slug?

locale?

timezone?

logoUrl?
```

Application contract example:

```ts
type CreateOrganizationInput = {
  name: string
  slug?: string
  locale?: string
  timezone?: string
  logoUrl?: string | null
}
```

---

## Output

```text
Organization
```

The public response should use an application DTO rather than expose the raw Prisma model unnecessarily.

---

## Authorization

Requires:

```text
Authenticated Profile
```

A user does not need an existing Organization Membership to create their first Organization unless product policy explicitly requires otherwise.

---

## Validation

Validate:

- Name
- Optional slug
- Locale
- Timezone
- Logo reference where applicable

Slug uniqueness must ultimately be enforced by the database.

---

## Complete Flow

When Memberships and Roles are available:

```text
Authenticated Profile
        ↓
Validate Input
        ↓
Resolve OWNER Role
        ↓
BEGIN TRANSACTION
        ↓
Create Organization
        ↓
Create OWNER Membership
        ↓
COMMIT
        ↓
Establish Organization Context
        ↓
Request Audit Event
        ↓
Return Organization
```

---

## Atomicity

The production-complete operation must not persist an operational Organization without its required owner relationship.

If OWNER Membership creation fails:

```text
ROLLBACK
```

---

## Current Implementation Boundary

Before Memberships and Roles exist, Organizations may implement and test its own persistence primitives.

However:

```text
createOrganization()
```

must not be considered production-complete tenancy onboarding until the required OWNER relationship can be created correctly.

Do not fake Roles or Memberships.

---

# Get Organization

## Description

Returns an Organization by its canonical UUID.

---

## Input

```text
organizationId
```

Example:

```ts
type GetOrganizationInput = {
  organizationId: string
}
```

---

## Output

```text
Organization
```

---

## Authorization

Authorization depends on usage context.

For tenant-private access, the operation typically requires:

```text
Authenticated Profile
        ↓
Active Membership
        ↓
Authorization
```

Platform administrative operations may follow separate policies.

Public Organization discovery, if ever supported, must use an explicitly defined public projection.

---

# Get Organization By Slug

## Description

Returns an Organization by its unique slug.

---

## Input

```text
slug
```

---

## Output

```text
Organization
```

or an appropriate public projection where public access is permitted.

---

## Authorization

Slug lookup does not automatically imply public access.

Authorization requirements depend on the requested projection and use case.

---

# List User Organizations

## Description

Returns Organizations accessible to the authenticated Profile.

This is a cross-module read operation.

---

## Ownership

```text
Organizations
→ Organization data

Memberships
→ relationship between Profile and Organizations
```

Organizations must not duplicate Membership query logic.

---

## Input

Usually none beyond authenticated identity.

Possible future filters:

```text
status
membershipStatus
pagination
```

---

## Output

```text
Organization[]
```

or:

```text
UserOrganization[]
```

where the application contract may combine Organization information with Membership context.

Example conceptual result:

```text
Organization
Membership status
Role summary
```

A combined DTO does not transfer ownership of Membership data to Organizations.

---

## Authorization

Requires:

```text
Authenticated Profile
```

Only Organizations reachable through valid Membership relationships may be returned.

---

# Update Organization

## Description

Updates fields owned directly by Organizations.

---

## Input

```text
organizationId

name?

slug?

logoUrl?

locale?

timezone?
```

---

## Editable Fields

Initial Organization-owned editable fields:

```text
name
slug
logoUrl
locale
timezone
```

Do not use this API to mutate:

```text
Memberships
Roles
Permissions
Billing
Audit
Domain data
```

---

## Authorization

Requires appropriate Organization authorization.

Conceptually:

```text
Authenticated Profile
        ↓
Active Membership
        ↓
Required Role / Permission
        ↓
Organization ACTIVE or allowed state
```

The canonical permission policy belongs to Roles and Permissions once implemented.

---

## Side Effects

Possible side effects after successful persistence:

- Cache invalidation
- Audit request
- UI revalidation
- Search/index refresh where applicable

External effects should occur after persistence succeeds.

---

# Suspend Organization

## Description

Moves an Organization into:

```text
SUSPENDED
```

---

## Input

```text
organizationId
```

Optional future administrative reason:

```text
reason?
```

The reason model must be specified before persistence is introduced.

---

## Authorization

Requires privileged Organization or platform authorization.

Exact permission ownership belongs to Roles and Permissions.

---

## Result

```text
status = SUSPENDED

archivedAt = null
```

---

## Side Effects

May include:

- Tenant mutation restriction
- Cache invalidation
- Audit request
- Session/context revalidation

Membership records are not deleted.

---

# Reactivate Organization

## Description

Restores a suspended Organization to:

```text
ACTIVE
```

---

## Input

```text
organizationId
```

---

## Authorization

Requires privileged authorization.

---

## Result

```text
status = ACTIVE

archivedAt = null
```

---

## Side Effects

May include:

- Tenant availability restored
- Cache invalidation
- Audit request

---

# Archive Organization

## Description

Moves an Organization into:

```text
ARCHIVED
```

without deleting its data.

---

## Input

```text
organizationId
```

---

## Authorization

Requires privileged Organization authorization.

Exact required Role or Permission must be provided by the authorization modules.

---

## Result

```text
status = ARCHIVED

archivedAt = current timestamp
```

---

## Side Effects

May include:

- Tenant mutations disabled
- Cache invalidation
- Audit request
- Active context invalidation

Archiving does not remove Memberships.

---

# Restore Organization

## Description

Restores an archived Organization.

---

## Input

```text
organizationId
```

---

## Authorization

Requires privileged authorization.

---

## Result

```text
status = ACTIVE

archivedAt = null
```

---

## Side Effects

May include:

- Tenant availability restored
- Cache invalidation
- Audit request

---

# Delete Organization

## Description

Permanently removes an Organization where platform policy explicitly permits deletion.

Permanent deletion is not part of normal Organization lifecycle.

This operation should remain deferred during the initial implementation.

---

## Input

```text
organizationId

confirmation
```

Future contracts may require stronger confirmation data.

---

## Preconditions

Possible required preconditions:

- Organization is ARCHIVED.
- Ownership is verified.
- Explicit confirmation is provided.
- Membership implications are resolved.
- Domain data implications are resolved.
- Billing requirements are satisfied.
- Audit requirements permit deletion.
- Retention policy permits deletion.
- Backup policy permits deletion.

---

## Authorization

Requires the strongest applicable Organization or platform authorization.

The exact policy must be specified before implementation.

---

## Side Effects

Deletion may require coordination with:

```text
Memberships
Settings
Billing
Audit
Storage
Business Domains
Backups
```

Therefore permanent deletion is a cross-module operation.

Do not implement destructive cascading behavior without approved policy.

---

# Transfer Ownership

## Description

Transfers Organization ownership to another active Organization member.

This is a cross-module operation.

Organizations defines the invariant.

Memberships and Roles provide the persisted relationship.

---

## Input

```text
organizationId

targetMembershipId
```

Example:

```ts
type TransferOwnershipInput = {
  organizationId: string
  targetMembershipId: string
}
```

---

## Authorization

Requires:

```text
Current active OWNER
```

The OWNER relationship must come from canonical Membership + Role data.

Do not use a duplicate Organization owner field.

---

## Preconditions

- Organization exists.
- Organization state permits transfer.
- Current Profile is the active Owner.
- Target Membership exists.
- Target Membership belongs to the same Organization.
- Target Membership is active.
- OWNER Role exists.
- Explicit confirmation requirements are satisfied.

---

## Result

Exactly one active OWNER remains.

Conceptually:

```text
Previous Owner
→ downgraded to an approved non-owner Role

Target Member
→ OWNER
```

The exact previous-owner Role policy belongs to the Roles specification.

---

## Transaction

Ownership transfer must be atomic.

```text
BEGIN

Assign OWNER to target

Downgrade previous OWNER

COMMIT
```

If any step fails:

```text
ROLLBACK
```

---

## Side Effects

After successful commit:

- Audit request
- Cache invalidation
- Authorization context refresh
- Optional notification

External providers must not execute inside the database transaction.

---

# Get Active Organization

## Description

Returns the Organization currently selected for the authenticated Profile.

Active Organization is application context.

It is different from:

```text
Organization.status = ACTIVE
```

---

## Input

Usually none beyond authentication/session context.

---

## Output

```text
Organization | null
```

A user with no active Organization context is valid.

---

## Dependencies

Resolving active Organization may depend on:

- Authentication
- Memberships
- Organization context persistence
- Session or application state

The exact persistence mechanism for active Organization context remains a separate implementation decision.

---

# Switch Active Organization

## Description

Changes the Organization context for an authenticated Profile.

This operation does not modify identity.

---

## Input

```text
organizationId
```

---

## Authorization

Requires:

```text
Authenticated Profile

+

Valid active Membership
in target Organization
```

The target Organization must also be in a state that permits selection.

---

## Result

```text
Active Organization Context
→ target Organization
```

---

## Side Effects

May include:

- Tenant context update
- Tenant cache invalidation
- Server state revalidation
- Tenant-scoped data reload

The implementation must not trust an arbitrary client-provided Organization ID without Membership validation.

---

# Organization Context Contract

Organization context should expose only the information required by application consumers.

Conceptually:

```ts
type OrganizationContext = {
  organizationId: string
}
```

Additional Membership, Role or Permission information may be resolved separately or through an approved authorization context.

Avoid turning Organization context into an uncontrolled global session object.

---

# Validation Rules

Every operation validates only the requirements relevant to that operation.

Possible validation dimensions include:

```text
Authentication

Organization existence

Organization state

Membership

Role

Permission

Input data
```

Not every operation requires every dimension.

Example:

```text
Create first Organization
→ authentication + input

Update Organization
→ authentication + membership + authorization + input

Public lookup
→ lookup rules + projection policy
```

Validation should occur before mutation.

---

# Input Validation

External input should be validated with the platform validation standard.

Preferred flow:

```text
Input
  ↓
Zod
  ↓
Server Action / Route Handler
  ↓
Service
```

Prisma errors are not the primary input-validation mechanism.

---

# Authorization Rules

Organization-scoped mutation authorization conceptually follows:

```text
Authenticated Profile
        ↓
Organization
        ↓
Active Membership
        ↓
Role
        ↓
Permission
        ↓
Operation
```

Organizations is responsible for Organization state.

Membership validity belongs to Memberships.

Role semantics belong to Roles.

Permission semantics belong to Permissions.

---

# Authorization Boundary

Organizations must not implement temporary local authorization constructs such as:

```text
organization.isAdmin

organization.ownerUserId

organization.permissionFlags
```

to compensate for missing Roles or Permissions.

If an operation depends on an unavailable authorization capability, implementation should remain blocked or deliberately scoped until the dependency exists.

---

# Tenant Isolation

Tenant-owned resource access must include Organization scope.

Conceptually:

```text
organizationId
+
resourceId
```

where the resource belongs to an Organization.

A valid resource ID alone must never bypass tenant isolation.

---

# Public DTOs

Organizations API should expose stable application contracts.

Example:

```ts
type OrganizationDto = {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  logoUrl: string | null
  locale: string
  timezone: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}
```

Exact serialization rules may vary.

Do not make generated Prisma models the permanent public API contract by default.

---

# Error Codes

Recommended Organization-level application errors:

```text
ORGANIZATION_NOT_FOUND

ORGANIZATION_SLUG_CONFLICT

ORGANIZATION_SUSPENDED

ORGANIZATION_ARCHIVED

ORGANIZATION_ACCESS_DENIED

INVALID_ORGANIZATION_STATE

OWNER_REQUIRED

OWNERSHIP_TRANSFER_REQUIRED
```

Generic platform errors may include:

```text
UNAUTHENTICATED

PERMISSION_DENIED

VALIDATION_ERROR

RESOURCE_CONFLICT

PERSISTENCE_ERROR
```

Membership-specific errors belong to Memberships.

Role-specific errors belong to Roles.

Permission-specific errors belong to Permissions.

---

# Error Response Principle

Application consumers should receive stable errors.

Do not leak:

- Prisma internals
- SQL errors
- Database topology
- Security policy implementation
- Service-role details

Server logs may retain safe diagnostic information.

---

# Events

Organizations owns Organization events.

Possible events:

```text
organization.created

organization.updated

organization.suspended

organization.reactivated

organization.archived

organization.restored

organization.deleted

organization.ownership_transferred
```

Membership events belong to Memberships.

Role events belong to Roles.

Permission events belong to Permissions.

---

# Event Principle

Event ownership follows entity ownership.

Organizations must not emit events pretending to own Membership lifecycle.

Example:

```text
membership.invited
```

belongs to Memberships even if invitation originated from an Organization screen.

---

# Audit

Organizations may request audit recording after significant operations.

Examples:

```text
Organization created

Organization updated

Organization suspended

Organization reactivated

Organization archived

Organization restored

Organization deleted

Ownership transferred
```

Audit persistence belongs to the Audit module.

Organizations must not create its own `AuditEvent` persistence implementation.

---

# Side Effect Ordering

Preferred ordering:

```text
Validate

↓

Authorize

↓

Persist

↓

Commit

↓

Audit / Notification / Webhook / External Effects
```

External effects should not execute inside long-running database transactions.

---

# Transaction Requirements

Transactions are required where multiple persistence operations form one invariant.

Examples:

```text
Create Organization
+
Create OWNER Membership
```

```text
Assign OWNER to Target
+
Downgrade Previous OWNER
```

A transaction may coordinate repositories belonging to multiple Core modules.

That does not transfer ownership between those modules.

---

# Repository Boundary

Organizations API must access Organization persistence through the Organizations service/repository boundary.

Preferred:

```text
Action
 ↓
Organizations Service
 ↓
Organization Repository
 ↓
Prisma
```

Cross-module flow:

```text
Application Service
       ↓
Organizations capability
Memberships capability
Roles capability
```

Exact orchestration placement may evolve, but direct persistence leakage is prohibited.

---

# Internal vs HTTP API

Most internal Platform Core operations do not require HTTP endpoints.

Preferred internal patterns:

```text
Server Components
Server Actions
Services
```

Route Handlers should be introduced when a stable HTTP interface is actually required.

Examples:

- External integrations
- Webhooks
- Public API consumers
- Provider callbacks

Do not create REST endpoints merely to call the application from itself.

---

# Server Actions

Server Actions may:

- Validate input.
- Resolve authentication.
- Call Organizations services.
- Revalidate application state.
- Redirect where appropriate.

Server Actions must not:

- Contain business rules.
- Access Prisma directly.
- Duplicate repository logic.
- Implement authorization by UI assumptions.

---

# Route Handlers

If an Organization capability is exposed through HTTP:

```text
Request
  ↓
Authentication
  ↓
Authorization
  ↓
Validation
  ↓
Service
  ↓
Stable Response
```

Route Handlers remain transport adapters.

They do not own Organizations business logic.

---

# Performance

Organizations API should avoid unnecessary relation loading.

Prefer explicit projections.

Example:

```text
Organization list
```

should not automatically load:

```text
All Memberships
All Roles
All Permissions
All Domain Resources
All Billing Data
```

Cross-module data should be retrieved only when required by the application contract.

---

# Pagination

`listUserOrganizations` may initially return a small set.

If Organization counts can become unbounded, pagination must be introduced.

Pagination contract should follow the platform API standard.

---

# Caching

Organization reads may eventually be cached.

Tenant-aware cache keys must preserve Organization isolation.

Example:

```text
organization:{organizationId}
```

Mutation operations must invalidate affected cache entries.

Active Organization context must never cause one tenant's cached private data to be served in another tenant context.

---

# Security

Sensitive Organization operations must run server side.

Never trust the client for:

```text
Organization ownership

Membership validity

Role

Permission

Tenant access
```

Client-side route hiding is presentation behavior, not authorization.

---

# RLS

Final tenant-aware Organization RLS depends on Memberships.

Organizations API must not assume:

```text
Authenticated
=
Authorized Organization Member
```

Supabase RLS complements application authorization.

It does not replace the Core authorization model.

---

# Initial Implementation Boundary

Organizations can initially expose or implement:

```text
getOrganization

getOrganizationBySlug

updateOrganization

suspendOrganization

reactivateOrganization

archiveOrganization

restoreOrganization
```

subject to an approved temporary access strategy during development.

Production-complete implementations of the following require Memberships and Roles:

```text
createOrganization

listUserOrganizations

transferOwnership

switchActiveOrganization

Membership-based Organization authorization

Membership-based RLS
```

Permanent deletion remains deferred unless explicitly approved.

---

# Deferred Operations

The following operations belong primarily to other modules and must not be added to Organizations merely for convenience:

```text
inviteMember
acceptInvitation
removeMember
suspendMember
restoreMembership
assignRole
removeRole
grantPermission
revokePermission
createBillingAccount
writeAuditEvent
```

Organization UI may link to or invoke those capabilities through their owning modules.

---

# Future Operations

Possible future Organization capabilities may include:

```text
transferOrganization

exportOrganization

customOrganizationDomain

organizationBranding

organizationHierarchy

organizationFeatureAvailability
```

These are not part of the initial scope.

Do not implement speculative API operations.

---

# API Stability

Once consumed broadly, Organizations contracts should evolve deliberately.

Breaking changes should consider:

- Core consumers
- Business Domains
- Server Actions
- Route Handlers
- External APIs
- Tests
- AI coding context

Do not expose unstable persistence details that make future schema evolution unnecessarily difficult.

---

# Definition of Ready

Organizations API is ready for implementation when:

- Organization ownership is clear.
- Membership ownership belongs to Memberships.
- Role ownership belongs to Roles.
- Permission ownership belongs to Permissions.
- Organization lifecycle is approved.
- Public operation contracts are defined.
- Cross-module operations are identified.
- Authorization dependencies are explicit.
- Transaction requirements are explicit.
- Error contracts are stable enough for implementation.
- Prisma and Flow documentation agree with this API.

---

# Definition of Done

Organizations API implementation is complete when:

- Organization-owned operations follow the documented contracts.
- Inputs are validated.
- Organization persistence is accessed through repositories.
- Business logic remains in services.
- Authorization occurs server side.
- Tenant isolation is preserved.
- Stable errors are returned.
- Raw Prisma models are not exposed unnecessarily.
- Relevant tests pass.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.
- Memberships, Roles and Permissions are not duplicated inside Organizations.

Complete tenancy API behavior additionally requires Memberships and Roles integration.

---

# Final Principle

Organizations exposes the tenant-facing application interface.

It owns Organization operations.

It may orchestrate Memberships, Roles and Permissions when an Organization workflow requires them.

The API may coordinate multiple capabilities, but coordination never changes architectural ownership.