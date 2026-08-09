---
title: Organizations Data Model
version: 1.1.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
---

# Organizations Data Model

## Purpose

This document defines the data model owned by the Platform Core Organizations module.

Organizations establishes the tenant boundary used by Platform Core and Business Domains.

This document defines:

- Organization ownership
- Organization lifecycle data
- Tenant identity
- Organization configuration
- Relationships with other Core modules
- Data isolation rules
- Persistence invariants

The Organizations module owns the `Organization` entity.

It does not own Membership, Role or Permission entities.

---

# Architectural Ownership

Platform Core tenancy is composed of several cooperating modules.

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

Each entity has exactly one architectural owner.

Cross-module relationships do not transfer entity ownership.

---

# Core Entity

The Organizations module introduces one primary persisted entity:

```text
Organization
```

Related Core modules provide:

```text
OrganizationMembership  → Memberships
Role                    → Roles
Permission              → Permissions
OrganizationInvitation  → Memberships
OrganizationSettings    → Settings
AuditEvent              → Audit
BillingAccount          → Billing
```

These entities must not be reimplemented inside Organizations.

---

# Organization

An Organization represents a tenant boundary within Platform Core.

It groups users, permissions, configuration and Domain-owned data under a common organizational context.

An Organization is not necessarily:

- A legal company
- A customer
- A billing account
- A Business Domain
- A product
- A user account

Those concepts may relate to an Organization but remain separate concerns.

---

# Organization Fields

Initial fields:

```text
Organization

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

---

## id

Immutable Organization identifier.

Platform identifier strategy:

```text
UUID
```

Recommended Prisma representation:

```prisma
id String @id @default(uuid()) @db.Uuid
```

---

## name

Human-readable Organization name.

Examples:

```text
Acme Studio
Example Workspace
North Region Team
```

Required.

The name does not need to be globally unique.

---

## slug

Stable human-readable Organization identifier used where appropriate in URLs or application context.

Example:

```text
acme-studio
```

Requirements:

- Globally unique within the platform unless a future architecture decision changes the namespace.
- Normalized.
- URL safe.
- Generated predictably.
- Validated before persistence.

The Organization `id` remains the canonical internal identifier.

---

## status

Represents the Organization lifecycle.

Initial values:

```text
ACTIVE
SUSPENDED
ARCHIVED
```

Recommended enum:

```prisma
enum OrganizationStatus {
  ACTIVE
  SUSPENDED
  ARCHIVED
}
```

---

## logoUrl

Optional Organization branding asset reference.

The Organizations module stores the reference.

Binary storage belongs to the Storage capability.

Organizations must not implement storage-provider logic.

---

## locale

Preferred Organization locale.

Example:

```text
es
en
it
```

Recommended initial default:

```text
es
```

Locale is organizational configuration.

User-specific locale preferences may exist independently.

---

## timezone

Preferred Organization timezone.

Recommended initial default:

```text
UTC
```

Applications may later derive a more appropriate timezone during onboarding.

Timezone values should use standard IANA timezone identifiers where possible.

Examples:

```text
Europe/Madrid
Europe/London
America/New_York
```

---

## createdAt

Timestamp indicating when the Organization was created.

Required.

---

## updatedAt

Timestamp indicating the most recent persisted modification.

Required.

---

## archivedAt

Timestamp indicating when the Organization entered the archived state.

Nullable.

Expected behavior:

```text
status = ARCHIVED
        ↓
archivedAt != null
```

Restoring an Organization should clear `archivedAt`.

---

# Organization Lifecycle

Supported lifecycle:

```text
ACTIVE
   │
   ├──→ SUSPENDED
   │        │
   │        └──→ ACTIVE
   │
   └──→ ARCHIVED
            │
            └──→ ACTIVE
```

Permanent deletion is exceptional and is not part of normal lifecycle management.

---

# ACTIVE

An active Organization may:

- Be selected as the active tenant.
- Receive normal platform operations.
- Contain active memberships.
- Own Domain data.
- Use enabled platform capabilities.

Authorization still depends on Membership, Role and Permission evaluation.

---

# SUSPENDED

A suspended Organization remains persisted but normal tenant operations are restricted.

Typical reasons may include:

- Administrative intervention
- Billing state
- Security review
- Compliance requirements

Suspension must not destroy tenant data.

---

# ARCHIVED

An archived Organization is inactive but retained.

Archival:

- Preserves historical data.
- Preserves memberships.
- Preserves Domain relationships.
- Prevents normal mutations.
- Supports future restoration when permitted.

Archival is not deletion.

---

# Relationships

Organizations participates in relationships owned by other Core modules.

Conceptually:

```text
Profile
   │
   ▼
OrganizationMembership
   │
   ▼
Organization
```

`OrganizationMembership` is owned by the Memberships module.

The Organizations module must not define a competing membership model.

---

# Membership Relationship

Users do not belong directly to Organizations.

Access is represented through:

```text
OrganizationMembership
```

owned by:

```text
Memberships
```

Conceptual relationship:

```text
Profile
   │
   │  Memberships
   ▼
OrganizationMembership
   │
   ▼
Organization
```

This supports:

- One user belonging to multiple Organizations.
- Multiple users belonging to one Organization.
- Independent membership lifecycle.
- Independent role assignment.
- Tenant-specific authorization.

---

# Membership Ownership Boundary

Organizations may:

- Determine whether an Organization exists.
- Request membership information.
- Coordinate Organization creation with initial membership creation.
- Require membership validation for Organization operations.
- Expose Organization-level entry points for membership workflows.

Organizations must not:

- Own the `OrganizationMembership` model.
- Define membership lifecycle rules.
- Define membership status values.
- Implement invitation persistence.
- Own role assignment persistence.
- Duplicate Memberships functionality.

Those responsibilities belong to the Memberships module.

---

# Roles Relationship

Roles are owned by the Roles module.

Organizations may require role information for authorization.

Conceptually:

```text
OrganizationMembership
        │
        ▼
       Role
```

Organizations does not define role permissions.

Default roles may include:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

The canonical definition of those roles belongs to the Roles module.

---

# Permissions Relationship

Permissions are owned by the Permissions module.

Authorization may conceptually follow:

```text
Authenticated Profile
        ↓
OrganizationMembership
        ↓
Role
        ↓
Permission
```

Organizations must not embed permission definitions into the Organization entity.

---

# Organization Ownership

Every Organization must have exactly one active owner.

Ownership is represented through:

```text
OrganizationMembership
        +
OWNER Role
```

Do not add:

```text
ownerUserId
```

or:

```text
ownerId
```

to `Organization` while Membership + Role remains the approved ownership model.

This avoids multiple competing sources of truth.

---

# Ownership Invariant

The platform must maintain:

```text
Exactly one active OWNER membership
per active Organization
```

Invalid states include:

```text
Organization
└── zero active owners
```

and:

```text
Organization
├── OWNER
└── OWNER
```

Ownership enforcement requires cooperation between:

```text
Organizations
Memberships
Roles
```

The Organizations module defines the Organization-level invariant.

Memberships and Roles provide the persisted relationships required to enforce it.

---

# Organization Creation

Creating an Organization is a cross-module operation.

Required conceptual flow:

```text
Authenticated Profile
        ↓
BEGIN TRANSACTION
        ↓
Create Organization
        ↓
Resolve Required OWNER Role
        ↓
Create OWNER Membership
        ↓
COMMIT
```

The result must never be:

```text
Organization
without owner membership
```

If owner membership creation fails:

```text
ROLLBACK
```

The Organization must not persist independently.

---

# Cross-Module Orchestration

Organizations may expose:

```text
createOrganization()
```

as the high-level application capability.

That operation may coordinate:

```text
Organizations
Memberships
Roles
```

Orchestration does not change entity ownership.

Conceptually:

```text
Organizations Service
        │
        ├── Organization persistence
        │
        ├── Roles lookup
        │
        └── Membership creation
```

The exact implementation mechanism must preserve module boundaries.

---

# Ownership Transfer

Ownership transfer is also a cross-module transaction.

Conceptual flow:

```text
Current OWNER
      ↓
Validate Target Membership
      ↓
Resolve OWNER Role
      ↓
BEGIN TRANSACTION
      ↓
Assign OWNER to Target Membership
      ↓
Downgrade Previous OWNER
      ↓
COMMIT
```

At no point may the persisted Organization end in an invalid ownership state.

Ownership transfer logic must be atomic.

---

# Tenant Boundary

Organization is the primary tenant boundary.

Tenant-owned Platform Core or Domain entities should normally reference:

```text
organizationId
```

Example:

```text
Organization
   │
   ├── Domain Resource A
   ├── Domain Resource B
   └── Domain Resource C
```

Each tenant-owned entity must belong to exactly one Organization unless explicitly designed as global data.

---

# Global vs Tenant Data

Not all application data belongs to an Organization.

Two categories exist:

```text
Global Data

Tenant-Owned Data
```

---

## Global Data

Examples may include:

- Platform reference data
- Global configuration
- Provider metadata
- Public catalog data
- Shared taxonomy where explicitly designed

Global data must be explicitly identified.

---

## Tenant-Owned Data

Tenant-owned data references:

```text
organizationId
```

Examples may include:

- Organization settings
- Organization-specific resources
- Private collections
- Operational records
- Business Domain data

Tenant ownership must never be inferred only from UI context.

---

# Domain Data

Business Domains own their business entities.

Example:

```text
Organization
   │
   ▼
Domain Entity
```

The Domain entity owns its business behavior.

The Organization relationship provides tenant scope.

Organizations must never absorb Domain models.

---

# Tenant Isolation

Tenant isolation requires explicit Organization scope.

Application queries must not rely solely on:

```text
currentOrganization
```

from client state.

Authorization should conceptually validate:

```text
Authenticated Profile
        ↓
Membership
        ↓
Organization
        ↓
Role / Permission
        ↓
Requested Resource
```

A valid authenticated session alone is insufficient to access Organization-owned data.

---

# Row Level Security

Supabase RLS may provide an additional tenant isolation boundary.

Typical relationship:

```text
auth.uid()
    ↓
Profile
    ↓
OrganizationMembership
    ↓
organizationId
```

RLS must complement application authorization.

RLS does not replace:

- Membership validation
- Role checks
- Permission checks
- Service-layer rules

---

# Organization Queries

Typical Organization queries include:

```text
findById
findBySlug
listForCurrentUser
getActiveOrganization
```

Where user-specific Organization access is required, the query may depend on Memberships.

Organizations should not directly recreate Membership business rules inside its repository.

---

# Persistence Ownership

The Organizations repository owns persistence operations for:

```text
Organization
```

It does not own persistence operations for:

```text
OrganizationMembership
Role
Permission
Invitation
BillingAccount
AuditEvent
```

Those entities belong to their respective modules.

---

# Organization Indexes

Recommended initial indexes include:

```text
status
slug
```

`slug` should also have an appropriate uniqueness constraint.

Additional indexes must be driven by actual query patterns.

---

# Organization Constraints

Expected database constraints include:

```text
id is UUID

slug is unique

name is required

status is required
```

Cross-module invariants such as ownership may require application logic and additional database constraints after Memberships and Roles are implemented.

---

# Referential Behavior

Relations from tenant-owned entities to Organization must use deliberate referential actions.

Permanent Organization deletion may affect large amounts of data.

Therefore destructive cascading behavior should not be introduced casually.

Normal lifecycle management uses:

```text
SUSPENDED
ARCHIVED
```

rather than deletion.

---

# Permanent Deletion

Permanent deletion is exceptional.

Preconditions may include:

- Organization is already archived.
- Request is explicitly confirmed.
- Ownership is verified.
- Domain data implications are known.
- Backup and recovery policy permits deletion.
- Audit requirements permit deletion.
- Billing requirements permit deletion.

Deletion behavior must be defined before implementation.

---

# Existing Users

Existing authenticated users may have no Organization.

That is a valid state.

Conceptually:

```text
Authenticated Profile
        ↓
No Memberships
        ↓
No Active Organization
```

The application may present Organization onboarding.

Do not silently create Organizations for existing users unless product requirements explicitly require personal workspaces.

---

# Organization Onboarding

Typical onboarding:

```text
Authenticated Profile
        ↓
No Active Membership
        ↓
Create Organization
        ↓
Create OWNER Membership
        ↓
Set Organization Context
        ↓
Continue
```

The operation must preserve the ownership invariant.

---

# Organization Context

A user may belong to multiple Organizations.

Therefore Organization context is separate from authentication identity.

```text
Authenticated User
        ↓
Available Memberships
        ↓
Selected Organization
```

Changing active Organization must not modify the user's identity.

---

# Data Ownership Summary

The Organizations module owns:

```text
Organization
```

The Memberships module owns:

```text
OrganizationMembership
OrganizationInvitation
```

The Roles module owns:

```text
Role
```

The Permissions module owns:

```text
Permission
```

The Settings module may own:

```text
OrganizationSettings
```

The Audit module owns:

```text
AuditEvent
```

The Billing module may own:

```text
BillingAccount
```

Business Domains own their own tenant-scoped entities.

---

# Events

Organizations may eventually emit platform events such as:

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

Examples:

```text
membership.created
membership.activated
membership.suspended
membership.removed
```

Role events belong to Roles.

Event ownership should follow entity ownership.

---

# Audit Requirements

Important Organization operations should eventually generate audit records.

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

Organizations may request that an Audit event be recorded.

---

# Migration Considerations

The initial Organizations migration should introduce only persistence that belongs to Organizations unless required dependencies are implemented in the same approved tenancy milestone.

At minimum:

```text
Organization
OrganizationStatus
```

`OrganizationMembership` must not be introduced as Organizations-owned persistence.

If Organizations, Memberships and Roles are implemented together as a coordinated tenancy foundation, their models may appear in the same physical Prisma schema or migration sequence while retaining separate architectural ownership.

Physical schema location does not determine module ownership.

---

# Implementation Dependency

A fully operational Organizations module requires:

```text
Identity
Organizations
Memberships
Roles
```

Identity already provides authenticated profiles.

Organizations can define its own entity independently.

However, Organization creation with guaranteed ownership cannot be considered complete until Memberships and Roles are available.

Permissions may be integrated in a later authorization phase.

---

# Deferred Data

The following are explicitly deferred to their owning modules:

```text
OrganizationMembership
MembershipStatus
OrganizationInvitation
Role
Permission
OrganizationSettings
BillingAccount
AuditEvent
```

Do not introduce temporary competing versions of these entities inside Organizations.

---

# Definition of Ready

The Organizations data model is ready for implementation when:

- Organization ownership is unambiguous.
- UUID strategy is confirmed.
- Organization lifecycle is approved.
- Tenant boundary is approved.
- Membership ownership belongs to Memberships.
- Role ownership belongs to Roles.
- Permission ownership belongs to Permissions.
- Organization creation dependencies are understood.
- Ownership invariant is defined.
- Referential behavior is reviewed.
- RLS implications are understood.

---

# Definition of Done

Organizations persistence is complete when:

- Organization model is implemented.
- Organization status is implemented.
- UUID conventions match the active schema.
- Slug uniqueness is enforced.
- Organization repository exists.
- Lifecycle persistence is tested.
- Tenant isolation implications are implemented.
- Cross-module ownership remains respected.
- Organization creation cannot leave an ownerless tenant once tenancy foundation is complete.
- Documentation matches implementation.

---

# Final Principle

Organizations owns the tenant.

Memberships owns belonging.

Roles owns authority roles.

Permissions owns authorization capabilities.

Cross-module workflows may coordinate them, but no module should duplicate another module's source of truth.