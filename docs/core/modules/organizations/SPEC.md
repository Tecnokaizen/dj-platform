---
title: Organizations Specification
version: 1.1.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../../../architecture/CORE.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
---

# Organizations Specification

## Purpose

The Organizations module provides the reusable tenant boundary used by Platform Core and its Business Domains.

An Organization represents an isolated operational context within the platform.

Organizations allows multiple SaaS products to reuse the same multi-tenant foundation without embedding business-specific concepts into Platform Core.

---

# Core Principle

Platform Core understands:

```text
Organization
```

It does not understand:

```text
DJ Company
Copy Shop
Agency
Store
Festival
Customer Business
```

Those meanings belong to Business Domains.

An Organization is a reusable platform abstraction.

---

# Architectural Ownership

Platform tenancy is composed of cooperating Core modules.

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

Settings
│
└── OrganizationSettings

Audit
│
└── AuditEvent

Billing
│
└── BillingAccount
```

Each entity has one architectural owner.

Cross-module workflows do not transfer ownership.

---

# Organizations Owns

The Organizations module owns:

```text
Organization
Organization lifecycle
Organization identity
Organization slug
Organization status
Organization locale
Organization timezone
Tenant boundary
```

Organizations may coordinate other Core modules when required by an Organization workflow.

---

# Organizations Does Not Own

Organizations does not own:

```text
OrganizationMembership
Membership lifecycle
Invitations
Roles
Permissions
Billing records
Audit records
Storage
Domain business data
```

These capabilities belong to their respective Core modules or Business Domains.

---

# Organization Definition

An Organization is the primary tenant boundary within Platform Core.

It groups platform and Domain data under a common organizational context.

An Organization may represent, depending on the Business Domain:

```text
Company
Team
Workspace
Business
Department
Client Account
Operating Unit
```

Platform Core does not assign business meaning to the Organization.

---

# Examples

A DJ-oriented Domain might use an Organization to represent:

```text
DJ Platform Workspace
```

A copy-shop Domain might use an Organization to represent:

```text
Sur4Colores
```

A CRM Domain might use an Organization to represent:

```text
Acme Corporation
```

The meaning belongs to the Domain.

The tenant abstraction belongs to Platform Core.

---

# Responsibilities

Organizations is responsible for:

- Creating Organizations.
- Reading Organizations.
- Updating Organization identity and configuration fields owned by Organizations.
- Managing Organization lifecycle.
- Providing Organization tenant context.
- Providing stable Organization identifiers.
- Enforcing Organization-level lifecycle rules.
- Coordinating required Core capabilities during cross-module Organization workflows.

Organizations is not responsible for implementing Membership, Role, Permission, Billing or Audit persistence.

---

# Organization Lifecycle

An Organization follows this lifecycle:

```text
Create
  ↓
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

Permanent deletion is exceptional.

Archiving is preferred whenever possible.

---

# ACTIVE

An active Organization may participate in normal platform workflows.

Normal operation still requires:

```text
Valid Identity
Valid Membership
Valid authorization
```

Organization status alone never grants access.

---

# SUSPENDED

A suspended Organization remains persisted.

Typical effects:

- Normal mutations are restricted.
- Tenant data remains intact.
- Membership data remains intact.
- Historical records remain available where authorized.

Suspension may result from administrative, security, billing or compliance workflows.

The reason for suspension may belong to another Core module.

---

# ARCHIVED

An archived Organization is inactive but retained.

Archival:

- Preserves data.
- Preserves relationships.
- Prevents normal mutations.
- Allows historical access where authorized.
- May support future restoration.

Archival is not deletion.

---

# Permanent Deletion

Permanent deletion is exceptional.

Deletion must not be implemented until the consequences for the following are known:

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
Retention requirements
```

Deletion requires explicit confirmation and authorization.

---

# Organization Ownership

Every operational Organization must have exactly one active Owner.

Ownership is represented through:

```text
OrganizationMembership
        +
OWNER Role
```

Ownership is not represented directly on Organization through fields such as:

```text
ownerId
ownerUserId
ownerProfileId
```

This avoids multiple sources of truth.

---

# Ownership Boundary

Organizations defines the Organization-level invariant:

```text
Exactly one active OWNER
per operational Organization
```

The persisted relationship is provided by:

```text
Memberships
+
Roles
```

Therefore ownership is a cross-module capability.

Organizations does not own the Membership or Role entities required to represent it.

---

# Memberships

Users access Organizations through Memberships.

Conceptually:

```text
Profile
   ↓
OrganizationMembership
   ↓
Organization
```

The Memberships module owns:

- OrganizationMembership.
- Membership lifecycle.
- Membership status.
- Invitation lifecycle.
- Joining an Organization.
- Leaving an Organization.
- Removing members.
- Suspending memberships.

Organizations may expose Organization-oriented entry points into these workflows.

That does not make Organizations their owner.

---

# Roles

Authorization roles are owned by the Roles module.

Typical platform roles may include:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Organizations may require particular Roles for Organization operations.

Organizations does not define Role persistence or Role permissions.

---

# Permissions

Permissions are owned by the Permissions module.

Conceptual authorization:

```text
Authenticated Profile
        ↓
OrganizationMembership
        ↓
Role
        ↓
Permission
        ↓
Organization Operation
```

Organizations must not maintain a duplicate permission system.

---

# Settings

Organization-level settings may eventually be represented through the Settings module.

The Organization entity may directly own stable foundational attributes such as:

```text
locale
timezone
```

More extensible configuration should belong to:

```text
OrganizationSettings
```

owned by the Settings module.

Organizations must not become a generic key/value settings store.

---

# Billing

Billing may be associated with an Organization.

Conceptually:

```text
Organization
    ↓
BillingAccount
```

The Billing module owns:

- BillingAccount.
- Subscription lifecycle.
- Payment-provider integration.
- Billing state.
- Invoices.
- Usage billing.

Organizations may expose Organization-level billing context.

Organizations does not own billing persistence or billing logic.

---

# Audit

Important Organization operations should generate audit events.

Examples:

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

The Audit module owns:

```text
AuditEvent
```

Organizations may request audit recording.

It does not own audit persistence.

---

# Organization Creation

Creating an Organization is a cross-module workflow.

Final conceptual flow:

```text
Authenticated Profile
        ↓
Create Organization
        ↓
Resolve OWNER Role
        ↓
Create OWNER Membership
        ↓
Establish Organization Context
        ↓
Organization Ready
```

Persistence requiring atomicity should use a transaction.

Conceptually:

```text
BEGIN

Create Organization

Create required OWNER relationship

COMMIT
```

If the ownership relationship cannot be created:

```text
ROLLBACK
```

An operational Organization must not exist without its required owner.

---

# Implementation Dependency

The Organization entity can be implemented independently.

However, complete Organization onboarding requires:

```text
Identity
Organizations
Memberships
Roles
```

Permissions may be integrated after the foundational tenancy relationship exists.

Therefore:

```text
Organization persistence
```

and:

```text
complete tenancy onboarding
```

are different implementation milestones.

---

# Ownership Transfer

Ownership transfer is a cross-module operation.

Conceptually:

```text
Current OWNER
      ↓
Select Target Member
      ↓
Validate Membership
      ↓
Resolve OWNER Role
      ↓
Atomic Ownership Transfer
      ↓
Previous Owner Downgraded
      ↓
Audit Event
```

Organizations may expose:

```text
transferOwnership()
```

as an Organization-level capability.

Membership and Role mutations remain owned by their respective modules.

---

# Tenant Context

A user may belong to multiple Organizations.

Authentication identity and Organization context are separate.

```text
Authenticated Profile
        ↓
Available Memberships
        ↓
Selected Organization
```

Changing Organization context must not alter authenticated identity.

---

# Multiple Organizations

A single Profile may belong to:

```text
Organization A
Organization B
Organization C
```

Each relationship is independent.

Authorization must always be evaluated against the selected Organization.

---

# Tenant Isolation

Organization is the primary tenant boundary.

Tenant-owned resources should normally reference:

```text
organizationId
```

A request for tenant-owned data must validate:

```text
Authenticated Identity
        ↓
Organization Membership
        ↓
Authorization
        ↓
Requested Tenant Resource
```

Authentication alone is insufficient.

---

# Business Domains

Business Domains may associate their entities with an Organization.

Conceptually:

```text
Organization
   │
   ├── Domain Entity A
   ├── Domain Entity B
   └── Domain Entity C
```

Organizations provides tenant scope.

The Domain continues to own:

- Business entities.
- Business workflows.
- Business validation.
- Business permissions.
- Business UI.

Platform Core never absorbs business entities merely because they are tenant-scoped.

---

# Public Capabilities

The Organizations module may expose capabilities such as:

```text
createOrganization
getOrganization
getOrganizationBySlug
listOrganizationsForCurrentUser
updateOrganization
suspendOrganization
reactivateOrganization
archiveOrganization
restoreOrganization
deleteOrganization
getActiveOrganization
switchActiveOrganization
transferOwnership
```

Some capabilities require cooperation with other Core modules.

Implementation contracts are defined in:

```text
API.md
```

---

# Cross-Module Entry Points

The product experience may expose Organization-oriented operations such as:

```text
Invite Member
Remove Member
Transfer Ownership
Manage Billing
Manage Settings
```

Their placement in Organization UI or Organization workflows does not imply Organizations owns their business logic.

Examples:

```text
Invite Member
→ Memberships

Remove Member
→ Memberships

Assign Role
→ Roles / Memberships

Manage Permissions
→ Permissions

Billing
→ Billing

Advanced Settings
→ Settings
```

---

# Organization Configuration

Organizations directly owns stable foundational attributes such as:

```text
name
slug
status
logoUrl
locale
timezone
```

Configuration that evolves independently from the Organization entity should be delegated to the Settings module.

Avoid continuously adding unrelated configuration columns to Organization.

---

# Slug

Every Organization has a stable slug.

Requirements:

- URL safe.
- Predictable.
- Normalized.
- Unique under the current platform namespace.

The UUID remains the canonical internal identifier.

---

# Locale

Organization locale represents an Organization-level preference.

Example:

```text
es
en
it
fr
```

Individual users may eventually have independent locale preferences.

---

# Timezone

Organization timezone represents the default timezone for tenant-level operations.

Use standard IANA timezone identifiers.

Examples:

```text
Europe/Madrid
Europe/London
America/New_York
```

---

# Public vs Private Data

Organization existence does not automatically imply public visibility.

Organization data may be:

```text
Public
Authenticated
Membership-only
Administrative
```

Visibility rules must be explicitly defined by application requirements.

---

# Security

Organization operations require server-side authorization.

Client-side visibility is not authorization.

Sensitive Organization mutations must validate:

```text
Identity
Membership
Role
Permission
Organization status
Input
```

where applicable.

---

# Row Level Security

Supabase RLS may provide an additional tenant security boundary.

Conceptually:

```text
auth.uid()
    ↓
Profile
    ↓
OrganizationMembership
    ↓
Organization
```

Final Organization RLS depends on Memberships persistence.

Temporary permissive RLS must not be introduced merely because Memberships has not yet been implemented.

---

# Error Conditions

Stable Organization errors may include:

```text
ORGANIZATION_NOT_FOUND
ORGANIZATION_SLUG_CONFLICT
ORGANIZATION_SUSPENDED
ORGANIZATION_ARCHIVED
ORGANIZATION_ACCESS_DENIED
OWNER_REQUIRED
OWNERSHIP_TRANSFER_REQUIRED
INVALID_ORGANIZATION_STATE
```

Membership-specific errors belong to Memberships.

Role-specific errors belong to Roles.

Permission-specific errors belong to Permissions.

---

# Events

Organizations owns Organization events.

Examples:

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

Memberships owns Membership events.

Roles owns Role events.

Permissions owns Permission events.

Event ownership follows entity ownership.

---

# Business Rules

Organizations enforces the following Organization-level rules:

- Organization UUID is immutable.
- Organization slug is unique.
- Organization lifecycle transitions must be valid.
- Archived Organizations cannot perform normal mutations.
- Suspended Organizations cannot perform normal tenant mutations.
- Permanent deletion requires explicit confirmation.
- An operational Organization must have exactly one active Owner.
- Tenant-owned data cannot cross Organization boundaries.

Cross-module rules are enforced cooperatively by their owning modules.

---

# Non-Goals

Organizations does not aim to become:

```text
User Management
CRM
Billing Engine
Permission Engine
Generic Settings Store
Business Workflow Engine
Domain Model
```

Those capabilities belong elsewhere.

---

# Future Capabilities

Possible future Organization-related capabilities include:

- Organization hierarchy.
- Parent/child Organizations.
- Organization branding.
- Organization custom domains.
- Organization plan limits.
- Organization feature availability.
- Organization metadata.
- Organization deletion policy.
- Organization export.
- Organization transfer between platform accounts.

These capabilities must be validated before implementation.

Do not implement speculative features.

---

# Dependencies

Organizations currently depends on:

```text
Identity
Prisma
PostgreSQL
Supabase
```

Complete tenancy onboarding additionally depends on:

```text
Memberships
Roles
```

Full authorization additionally depends on:

```text
Permissions
```

Optional later integrations include:

```text
Settings
Audit
Billing
Storage
Notifications
```

---

# Definition of Ready

The Organizations module is ready for implementation when:

- Organization responsibility is approved.
- Entity ownership is unambiguous.
- Organization lifecycle is approved.
- Tenant boundary is approved.
- UUID strategy is approved.
- Identity integration is approved.
- Membership ownership belongs to Memberships.
- Role ownership belongs to Roles.
- Permission ownership belongs to Permissions.
- Ownership invariant is understood.
- Cross-module dependencies are documented.
- Prisma implementation matches this specification.
- API and flows match this specification.

---

# Definition of Done

Organizations is complete when:

- Organization persistence exists.
- Organization lifecycle works.
- Organization persistence access exists (services → Prisma).
- Organization services exist.
- Organization actions exist where required.
- Tenant scope is enforced.
- Security rules are implemented.
- Tests cover Organization behavior.
- Documentation matches implementation.
- No Membership, Role or Permission ownership has leaked into Organizations.

Complete tenancy onboarding additionally requires Memberships and Roles.

---

# Final Principle

Organizations owns the tenant.

Memberships owns belonging.

Roles owns role definitions.

Permissions owns authorization capabilities.

Settings owns extensible configuration.

Billing owns billing.

Audit owns audit history.

Organizations may coordinate these capabilities, but orchestration never changes ownership.