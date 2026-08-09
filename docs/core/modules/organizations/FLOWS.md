---
title: Organizations Flows
version: 1.1.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - DATA_MODEL.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
---

# Organizations Flows

## Purpose

This document defines the workflows involving the Platform Core Organizations module.

Organizations owns the lifecycle and tenant identity of:

```text
Organization
```

Some Organization-oriented workflows require cooperation with other Platform Core modules.

Those workflows may be exposed from an Organization context without transferring architectural ownership.

---

# Flow Ownership

Platform tenancy is composed of several cooperating Core modules.

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

Audit
│
└── AuditEvent
```

The following ownership rules apply throughout this document:

```text
Organization lifecycle
→ Organizations

Membership lifecycle
→ Memberships

Invitations
→ Memberships

Role definitions
→ Roles

Permission evaluation
→ Permissions

Audit persistence
→ Audit
```

Organizations may coordinate cross-module workflows.

Orchestration does not transfer entity ownership.

---

# Organization Creation

Organization creation begins from an authenticated Profile.

The complete production workflow requires:

```text
Identity
Organizations
Memberships
Roles
```

## Flow

```text
Authenticated Profile
        ↓
Request Organization Creation
        ↓
Validate Input
        ↓
Generate / Validate Slug
        ↓
Resolve Required OWNER Role
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
Organization Ready
```

Organizations owns creation of the Organization.

Memberships owns creation of the `OrganizationMembership`.

Roles owns the canonical `OWNER` role.

Audit owns persistence of the audit event.

---

## Requirements

Before complete Organization creation can be considered production-ready:

- The user must be authenticated.
- Input must be valid.
- Organization slug must be unique.
- The OWNER Role must exist.
- The initial Membership must be created.
- The Organization and owner relationship must persist atomically.
- The final Organization must have exactly one active Owner.

If owner Membership creation fails:

```text
ROLLBACK
```

The Organization must not become an operational tenant without its required owner.

---

# Organization-Only Creation Phase

The Organization persistence model may be implemented before Memberships and Roles.

During that phase it is acceptable to implement and test:

```text
Organization model
Organization repository
Slug behavior
Organization lifecycle
Organization lookups
```

It is not acceptable to fake:

```text
OWNER
Membership
Role assignment
Permissions
Ownership transfer
```

Complete onboarding remains blocked until Memberships and Roles exist.

---

# Initial Organization Setup

After successful Organization creation, foundational configuration may be established.

## Flow

```text
Organization Created
        ↓
Apply Default Locale
        ↓
Apply Default Timezone
        ↓
Optional Branding Reference
        ↓
Optional Settings Initialization
        ↓
Organization Setup Complete
```

Organizations directly owns stable attributes such as:

```text
name
slug
locale
timezone
logoUrl
status
```

Extensible configuration belongs to the Settings module.

---

# Organization Selection

A user may belong to zero, one or multiple Organizations.

Organization selection depends on Memberships.

---

## No Organizations

```text
Authenticated Profile
        ↓
No Active Memberships
        ↓
No Active Organization Context
        ↓
Organization Onboarding
```

Having no Organization is a valid state.

---

## Single Organization

```text
Login
  ↓
Resolve Active Memberships
  ↓
One Active Membership
  ↓
Resolve Organization
  ↓
Establish Organization Context
```

Automatic selection may be allowed when only one valid Organization is available.

---

## Multiple Organizations

```text
Login
  ↓
Resolve Active Memberships
  ↓
Multiple Active Memberships
  ↓
Organization Selector
  ↓
User Selects Organization
  ↓
Validate Membership
  ↓
Establish Organization Context
```

Organization selection must never rely exclusively on client state.

---

# Organization Context Switching

Users with multiple active Memberships may switch Organizations.

## Flow

```text
Authenticated Profile
        ↓
Current Organization
        ↓
Request Context Switch
        ↓
Select Target Organization
        ↓
Validate Active Membership
        ↓
Validate Organization State
        ↓
Update Active Organization Context
        ↓
Reload Tenant-Scoped Data
```

Changing Organization context must not change authentication identity.

The same Profile remains authenticated.

---

# Active Organization Context

Active Organization context and Organization lifecycle status are different concepts.

```text
Organization.status
→ persisted Organization lifecycle

Active Organization Context
→ Organization currently selected by a user
```

An Organization with:

```text
status = ACTIVE
```

is not automatically the user's active Organization.

---

# Organization Update

Organizations owns updates to its own stable fields.

Examples:

```text
name
slug
logoUrl
locale
timezone
```

## Flow

```text
Authenticated Profile
        ↓
Organization Context
        ↓
Authorization Check
        ↓
Validate Organization State
        ↓
Validate Input
        ↓
Update Organization
        ↓
Persist
        ↓
Request Audit Event
        ↓
Return Updated Organization
```

Authorization may depend on Memberships, Roles and Permissions.

Organizations owns the actual Organization mutation.

---

# Organization Suspension

Suspension restricts normal tenant operation without deleting data.

## Flow

```text
Authorized Request
        ↓
Load Organization
        ↓
Validate Current State
        ↓
Validate Suspension Authorization
        ↓
Set status = SUSPENDED
        ↓
Ensure archivedAt = null
        ↓
Persist
        ↓
Invalidate / Restrict Tenant Operations
        ↓
Request Audit Event
```

Suspension does not:

- Delete Memberships.
- Delete Domain data.
- Archive the Organization.
- Remove ownership.

---

# Organization Reactivation

A suspended Organization may return to ACTIVE.

## Flow

```text
Authorized Request
        ↓
Load SUSPENDED Organization
        ↓
Validate Reactivation
        ↓
Set status = ACTIVE
        ↓
Ensure archivedAt = null
        ↓
Persist
        ↓
Restore Permitted Tenant Operations
        ↓
Request Audit Event
```

Membership and authorization checks remain independently required.

---

# Organization Archive

Archival preserves the Organization while disabling normal mutation.

## Flow

```text
Authorized Request
        ↓
Load Organization
        ↓
Validate Archive Preconditions
        ↓
Set status = ARCHIVED
        ↓
Set archivedAt = current timestamp
        ↓
Persist
        ↓
Restrict Normal Operations
        ↓
Request Audit Event
```

Archiving must not automatically remove Memberships or Domain data.

---

# Organization Restore

An archived Organization may be restored when policy permits it.

## Flow

```text
Authorized Request
        ↓
Load ARCHIVED Organization
        ↓
Validate Restore Authorization
        ↓
Validate Restore Preconditions
        ↓
Set status = ACTIVE
        ↓
Set archivedAt = null
        ↓
Persist
        ↓
Restore Tenant Availability
        ↓
Request Audit Event
```

Restoration does not automatically recreate deleted external resources.

---

# Organization Deletion

Permanent deletion is exceptional.

It should not be part of the initial implementation unless explicitly required.

## Preconditions

Before permanent deletion:

- Organization must normally be archived.
- Explicit confirmation is required.
- Ownership must be verified.
- Membership implications must be known.
- Domain data implications must be known.
- Billing implications must be known.
- Audit and retention requirements must permit deletion.
- Backup and recovery policy must permit deletion.
- Referential actions must be reviewed.

---

## Flow

```text
ARCHIVED Organization
        ↓
Owner Requests Deletion
        ↓
Strong Confirmation
        ↓
Authorization Check
        ↓
Validate Membership / Ownership
        ↓
Validate Billing Requirements
        ↓
Validate Domain Dependencies
        ↓
Validate Retention Requirements
        ↓
Delete / Anonymize Related Data
        ↓
Create Final Audit Record
        ↓
Permanent Deletion
```

Organizations must not implement permanent deletion until dependent module behavior is defined.

---

# Membership Workflows

The following flows are Organization-oriented from the user's perspective but are owned primarily by Memberships.

Organizations may expose entry points to these workflows.

Organizations does not own their persistence.

---

# Invite Member

Architectural owner:

```text
Memberships
```

Organizations provides the tenant context.

## Flow

```text
Authorized Member
        ↓
Organization Context
        ↓
Request Invitation
        ↓
Validate Permission
        ↓
Validate Recipient
        ↓
Resolve Intended Role
        ↓
Memberships Creates Invitation
        ↓
Notification Requested
        ↓
Audit Event Requested
```

Responsibilities:

```text
Organizations
→ provides Organization context

Memberships
→ invitation lifecycle and persistence

Roles
→ intended Role definition

Permissions
→ invitation authorization

Notifications
→ notification delivery

Audit
→ audit persistence
```

Organizations must not create its own invitation model.

---

# Accept Invitation

Architectural owner:

```text
Memberships
```

## Flow

```text
Invitation
    ↓
Recipient Opens Invitation
    ↓
Authenticate / Register
    ↓
Validate Invitation
    ↓
Validate Organization State
    ↓
Memberships Activates Membership
    ↓
Apply Assigned Role
    ↓
Set joinedAt
    ↓
Request Audit Event
    ↓
Organization Becomes Available
```

Expired, revoked or invalid invitations must not create active Memberships.

Organizations participates only by providing the target Organization context and validating Organization availability.

---

# Remove Member

Architectural owner:

```text
Memberships
```

## Flow

```text
Authorized Member
        ↓
Organization Context
        ↓
Select Membership
        ↓
Authorization Check
        ↓
Ownership Safety Check
        ↓
Memberships Sets Membership = REMOVED
        ↓
Invalidate Tenant Access
        ↓
Request Audit Event
```

The active OWNER Membership cannot be removed without transferring ownership first.

Organizations defines the Organization-level safety invariant.

Memberships owns the Membership mutation.

---

# Suspend Member

Architectural owner:

```text
Memberships
```

## Flow

```text
Authorized Member
        ↓
Organization Context
        ↓
Select Membership
        ↓
Authorization Check
        ↓
Ownership Safety Check
        ↓
Memberships Sets Membership = SUSPENDED
        ↓
Invalidate Tenant Access
        ↓
Request Audit Event
```

Suspending the only active Owner is prohibited.

---

# Restore Membership

Architectural owner:

```text
Memberships
```

## Flow

```text
Authorized Member
        ↓
Organization Context
        ↓
Select SUSPENDED Membership
        ↓
Authorization Check
        ↓
Validate Assigned Role
        ↓
Memberships Sets Membership = ACTIVE
        ↓
Restore Tenant Access
        ↓
Request Audit Event
```

Membership restoration must not bypass Role or Permission requirements.

---

# Transfer Ownership

Ownership transfer is a cross-module workflow.

Organizations defines the invariant:

```text
Exactly one active OWNER
per operational Organization
```

Memberships owns Membership state.

Roles owns the canonical OWNER Role.

## Preconditions

- Current Owner is authenticated.
- Current Owner has an active Membership.
- Target user has an active Membership in the same Organization.
- Target Membership is eligible for ownership.
- OWNER Role exists.
- Explicit confirmation is required.
- Organization is in a state that permits ownership transfer.

---

## Flow

```text
Current Owner
      ↓
Organization Context
      ↓
Select New Owner
      ↓
Validate Target Membership
      ↓
Resolve OWNER Role
      ↓
Confirm Transfer
      ↓
BEGIN TRANSACTION
      ↓
Assign OWNER to Target Membership
      ↓
Downgrade Previous Owner
      ↓
COMMIT
      ↓
Request Audit Event
```

The operation must be atomic.

At no point may the Organization end in a persisted state with:

```text
zero active Owners
```

or:

```text
more than one active Owner
```

---

# Ownership Transfer Failure

If any persistence step fails:

```text
ROLLBACK
```

The original ownership state must remain valid.

Do not perform notification delivery or other external operations inside the database transaction.

---

# Authorization Flow

Organization-scoped operations require more than authentication.

Conceptual flow:

```text
Request
  ↓
Authenticated Profile
  ↓
Organization Context
  ↓
Active Membership
  ↓
Role
  ↓
Permission
  ↓
Organization State
  ↓
Requested Operation
```

Failure at any required stage denies the operation.

Ownership:

```text
Identity
→ authentication

Organizations
→ Organization state and tenant boundary

Memberships
→ Membership validity

Roles
→ Role definition

Permissions
→ Permission evaluation
```

Organizations must not duplicate these authorization layers.

---

# Owner-Only Operation

Some Organization operations may require OWNER authority.

Conceptually:

```text
Authenticated Profile
        ↓
Organization Context
        ↓
Active Membership
        ↓
OWNER Role
        ↓
Operation Allowed
```

OWNER validation must be based on the canonical Membership + Role relationship.

Do not use a duplicate Organization owner field.

---

# Tenant Isolation Flow

Every tenant-owned resource request must resolve through Organization context.

```text
Authenticated Profile
        ↓
Organization Membership
        ↓
organizationId
        ↓
Authorization
        ↓
Tenant-Scoped Resource Query
```

Resource lookup must never rely only on:

```text
resourceId
```

Preferred conceptual pattern:

```text
organizationId
+
resourceId
```

where the resource is tenant-owned.

---

# Cross-Tenant Access

Invalid flow:

```text
User belongs to Organization A
        ↓
Requests Resource from Organization B
        ↓
Resource ID Exists
        ↓
ACCESS DENIED
```

A valid resource identifier never overrides tenant isolation.

---

# Organization State Authorization

Organization lifecycle state participates in authorization.

Examples:

```text
ACTIVE
→ normal authorized operations allowed

SUSPENDED
→ normal tenant mutations denied

ARCHIVED
→ normal mutations denied
```

Read behavior for SUSPENDED or ARCHIVED Organizations must be defined per operation.

---

# First Login Flow

A newly authenticated user may have no Memberships.

## No Memberships

```text
Authenticated Profile
        ↓
Resolve Memberships
        ↓
No Active Memberships
        ↓
No Organization Context
        ↓
Present Organization Onboarding
```

No Organization should be created silently unless product requirements explicitly require personal workspaces.

---

# First Login With One Membership

```text
Authenticated Profile
        ↓
Resolve Memberships
        ↓
One Active Membership
        ↓
Resolve Organization
        ↓
Validate Organization State
        ↓
Establish Organization Context
```

---

# First Login With Multiple Memberships

```text
Authenticated Profile
        ↓
Resolve Memberships
        ↓
Multiple Active Memberships
        ↓
Present Organization Selector
        ↓
User Selects Organization
        ↓
Validate Membership
        ↓
Establish Organization Context
```

---

# Domain Onboarding

Business Domain onboarding occurs after tenant context is established.

Conceptually:

```text
Authenticated Profile
        ↓
Organization Context
        ↓
Domain Available
        ↓
Domain Onboarding
        ↓
Create Domain-Owned Data
```

Organizations must not own Domain onboarding data.

Example:

```text
Organization
        ↓
Copy Domain Setup
```

or:

```text
Organization
        ↓
DJ Domain Setup
```

The specific workflow belongs to that Domain.

---

# Domain Resource Creation

Tenant-owned Domain resources should be created within validated Organization context.

```text
Authenticated Profile
        ↓
Organization Membership
        ↓
Authorization
        ↓
Domain Service
        ↓
Create Resource with organizationId
```

The Domain owns the resource.

Organizations provides the tenant boundary.

---

# Organization Settings Flow

Stable Organization fields may be updated directly by Organizations.

Example:

```text
Organization Context
        ↓
Authorized Update
        ↓
name / locale / timezone / logoUrl
        ↓
Persist Organization
```

Extensible settings should be delegated to the Settings module.

Conceptually:

```text
Organization
    ↓
Settings capability
    ↓
OrganizationSettings
```

---

# Billing Flow

Billing may be Organization-scoped.

Conceptually:

```text
Organization
    ↓
Billing Capability
    ↓
BillingAccount
```

Billing workflow ownership belongs to Billing.

Organizations supplies tenant context only.

A billing state may influence Organization suspension, but billing persistence remains external to Organizations.

---

# Audit Flow

Organizations may request audit recording for important Organization operations.

Conceptually:

```text
Organization Operation
        ↓
Operation Succeeds
        ↓
Create Audit Request
        ↓
Audit Module
        ↓
Persist AuditEvent
```

Organizations does not persist `AuditEvent`.

---

# Organization Audit Events

Possible Organization-owned event names:

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
membership.invited
membership.activated
membership.suspended
membership.removed
```

Role events belong to Roles.

---

# External Side Effects

External side effects must occur after successful persistence where possible.

Examples:

```text
Email
Notification
Webhook
Analytics
External API
```

Preferred flow:

```text
Persist Core Operation
        ↓
Commit
        ↓
Trigger External Effects
```

Do not keep database transactions open while waiting for external providers.

---

# Error Scenarios

Possible Organization-level errors include:

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

Membership-specific errors belong to Memberships.

Examples may include:

```text
MEMBERSHIP_NOT_FOUND
MEMBERSHIP_SUSPENDED
MEMBERSHIP_REMOVED
INVITATION_INVALID
INVITATION_EXPIRED
```

Role errors belong to Roles.

Permission errors belong to Permissions.

---

# Failure Principle

A workflow must fail before mutation whenever required authorization or validation is missing.

Preferred:

```text
Validate
   ↓
Authorize
   ↓
Mutate
```

Avoid:

```text
Mutate
   ↓
Discover Authorization Failure
```

---

# Transaction Principle

Use transactions only for persistence operations that form a single invariant.

Examples:

```text
Create Organization
+
Create OWNER Membership
```

or:

```text
Assign New OWNER
+
Downgrade Previous OWNER
```

Do not include external services inside those transactions.

---

# Cross-Module Transaction Principle

A transaction may contain persistence owned by more than one Core module when the business invariant requires atomicity.

Architectural ownership remains unchanged.

Example:

```text
Organizations Repository
        +
Memberships Repository
        +
Roles Lookup
        ↓
Single Coordinated Transaction
```

The orchestrating service coordinates the workflow.

It does not absorb the other modules.

---

# Initial Implementation Boundary

Organizations may initially implement independently:

```text
Organization persistence
Organization lookup
Organization update
Organization suspension
Organization reactivation
Organization archive
Organization restore
```

The following complete flows require Memberships and Roles:

```text
Production Organization creation
Organization selection for a user
Organization context switching
Ownership enforcement
Ownership transfer
Membership-based RLS
User Organization listing
```

This distinction must remain visible in implementation tasks.

---

# Dependencies

Organization lifecycle flows depend on:

```text
Identity
Organizations
Prisma
PostgreSQL
```

Complete tenancy flows additionally depend on:

```text
Memberships
Roles
```

Full authorization additionally depends on:

```text
Permissions
```

Optional cross-module flows may depend on:

```text
Settings
Audit
Billing
Notifications
Storage
```

---

# Definition of Ready

Organizations flows are ready when:

- Organization lifecycle is approved.
- Organization creation flow is understood.
- Membership ownership belongs to Memberships.
- Role ownership belongs to Roles.
- Permission ownership belongs to Permissions.
- Ownership invariant is defined.
- Organization selection behavior is defined.
- Context switching is defined.
- Suspension semantics are defined.
- Archive semantics are defined.
- Cross-module workflows identify their owner.
- Tenant isolation flow is approved.
- Transaction boundaries are understood.
- External side effects remain outside database transactions.

---

# Definition of Done

Organizations workflow implementation is complete when:

- Organization lifecycle flows work.
- Invalid lifecycle transitions fail safely.
- Organization updates are authorized.
- Tenant scope is preserved.
- Archive and restore are implemented correctly.
- Organization-level tests pass.
- Cross-module boundaries are preserved.
- Documentation matches implementation.

Complete tenancy workflows are done only when:

- Memberships exists.
- Roles exists.
- Owner Membership is created atomically.
- Organization selection uses Memberships.
- Context switching validates Memberships.
- Ownership transfer is atomic.
- Tenant isolation is enforced.
- Integration tests cover cross-module behavior.

---

# Final Principle

Organizations owns Organization workflows.

Memberships owns Membership workflows.

Roles owns Role semantics.

Permissions owns permission evaluation.

Organizations may coordinate the tenant experience across these modules, but coordination never changes architectural ownership.