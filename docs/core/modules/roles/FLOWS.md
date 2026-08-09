---
title: Roles Flows
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - DATA_MODEL.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../organizations/FLOWS.md
  - ../organizations/SPEC.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/SECURITY.md
  - ../../../architecture/DATA.md
---

# Roles Flows

## Purpose

This document defines the workflows involving the Platform Core Roles module.

Roles owns the canonical definition and resolution of Platform Core roles.

The initial Roles implementation provides a global catalog of system Roles:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Roles does not own Membership assignment or Permission evaluation.

---

# Flow Ownership

Authorization-related workflows are divided across several Platform Core modules.

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

Ownership rules:

```text
Role definition
→ Roles

Role lookup
→ Roles

Canonical Role resolution
→ Roles

Role seed initialization
→ Roles

Membership assignment
→ Memberships

Organization ownership invariant
→ Organizations

Permission definition and evaluation
→ Permissions
```

Cross-module workflows may use Roles.

That does not transfer ownership.

---

# Roles Foundation Flow

The initial Roles implementation establishes the canonical Role catalog.

```text
Platform Deployment
        ↓
Roles Migration Applied
        ↓
Roles Seed Executed
        ↓
Canonical Roles Created / Updated Safely
        ↓
Role Catalog Validated
        ↓
Roles Foundation Ready
```

Required canonical Roles:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Memberships must not become operational until required Roles can be resolved reliably.

---

# Canonical Role Seed

Roles owns initialization of required system Role records.

## Flow

```text
Seed Starts
   ↓
Resolve Role by key
   ↓
Role Exists?
   ├── YES
   │    ↓
   │  Validate / Update Approved Metadata
   │
   └── NO
        ↓
      Create Role
   ↓
Repeat for Every Canonical Role
   ↓
Validate Required Catalog
   ↓
Seed Complete
```

Seed execution must be idempotent.

Running the seed multiple times must not create duplicate Roles.

---

# Seed Role Resolution

Canonical Roles are resolved by:

```text
key
```

not by hard-coded UUID.

Example:

```text
OWNER
```

Conceptual seed behavior:

```text
findByKey("OWNER")
        ↓
Exists?
        ├── YES → preserve canonical identity
        └── NO  → create OWNER
```

Different environments may generate different UUIDs.

Role semantics remain identical because the canonical key is stable.

---

# Required Role Validation

After seeding, Platform Core should be able to validate that every required Role exists.

## Flow

```text
Validate Role Catalog
        ↓
Resolve OWNER
        ↓
Resolve ADMIN
        ↓
Resolve MANAGER
        ↓
Resolve MEMBER
        ↓
Resolve VIEWER
        ↓
All Found?
        ├── YES → Role Catalog Valid
        └── NO  → Platform Configuration Error
```

Missing required Roles must fail safely.

---

# Missing Canonical Role

Example:

```text
OWNER missing
```

Invalid fallback behavior:

```text
Use ADMIN instead
```

or:

```text
Create temporary OWNER string
```

or:

```text
Store role name directly in Membership
```

Correct behavior:

```text
Required Role Missing
        ↓
Stop Workflow
        ↓
Return Platform Configuration Error
        ↓
Do Not Persist Dependent Operation
```

---

# Get Role By ID

Roles may resolve a Role by UUID.

## Flow

```text
Role ID
   ↓
Validate UUID
   ↓
Role Repository
   ↓
Find Role
   ↓
Found?
   ├── YES → Return Role
   └── NO  → ROLE_NOT_FOUND
```

This is primarily useful when another persisted entity already stores `roleId`.

---

# Get Role By Key

Canonical platform workflows should normally resolve required system Roles by stable key.

## Flow

```text
Role Key
   ↓
Normalize / Validate
   ↓
Role Repository
   ↓
Find Role by key
   ↓
Found?
   ├── YES → Return Role
   └── NO  → ROLE_NOT_FOUND
```

Example:

```text
OWNER
```

---

# Resolve Required Role

Critical workflows may require a Role to exist.

Example:

```text
Create Organization
        ↓
Resolve Required Role: OWNER
```

## Flow

```text
Requested Canonical Key
        ↓
Validate Allowed System Role
        ↓
Find Role by Key
        ↓
Role Found?
        ├── YES
        │    ↓
        │  Validate System Role
        │    ↓
        │  Return Role
        │
        └── NO
             ↓
           Fail Safely
```

`resolveRequiredRole()` must never silently create missing Roles during normal application workflows.

Seed initialization and normal runtime resolution are separate concerns.

---

# List Roles

Roles may expose the canonical system Role catalog.

## Flow

```text
Request Roles
    ↓
Role Repository
    ↓
Load System Roles
    ↓
Order Predictably
    ↓
Return Role List
```

Recommended ordering:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

or by approved `sortOrder`.

---

# List Roles for Assignment

A UI may require available Roles when assigning a Membership Role.

The Role catalog comes from Roles.

The authorization to perform the assignment does not.

## Flow

```text
Authorized Membership Management UI
        ↓
Request Available Roles
        ↓
Roles Returns Canonical Catalog
        ↓
Membership Workflow Selects Role
```

Responsibilities:

```text
Roles
→ available Role definitions

Memberships
→ Membership mutation

Permissions
→ whether actor may assign Role
```

---

# Role Assignment Flow

Role assignment changes an OrganizationMembership.

Therefore assignment persistence belongs to Memberships.

Roles participates only by resolving and validating the target Role.

## Flow

```text
Actor Requests Role Change
        ↓
Validate Organization Context
        ↓
Validate Acting Membership
        ↓
Validate Authorization
        ↓
Resolve Target Membership
        ↓
Resolve Target Role
        ↓
Validate Assignment Rules
        ↓
Memberships Updates roleId
        ↓
Persist
        ↓
Request Audit Event
```

Roles does not persist the Membership mutation.

---

# Role Assignment Ownership

```text
Roles
→ resolve Role

Memberships
→ assign Role to Membership

Permissions
→ authorize assignment

Organizations
→ provide tenant context

Audit
→ record security-relevant change
```

No module should duplicate another module's responsibility.

---

# Assign OWNER

Assigning OWNER is not a normal Role change.

It represents Organization ownership transfer.

## Flow

```text
Current OWNER
      ↓
Select Target Membership
      ↓
Validate Target Membership
      ↓
Resolve OWNER Role
      ↓
Confirm Ownership Transfer
      ↓
BEGIN TRANSACTION
      ↓
Memberships Assigns OWNER to Target
      ↓
Memberships Downgrades Previous OWNER
      ↓
COMMIT
      ↓
Request Audit Event
```

Roles only resolves the canonical OWNER Role.

Organizations defines the exactly-one-owner invariant.

Memberships persists the assignments.

---

# OWNER Safety

Invalid workflow:

```text
Assign OWNER to second Membership
        ↓
Leave previous OWNER unchanged
```

Result:

```text
Two active OWNER Memberships
```

This is prohibited.

Also prohibited:

```text
Remove OWNER from current owner
        ↓
No replacement OWNER
```

The Organization-level ownership invariant must remain valid.

---

# Previous Owner Role

During ownership transfer, the previous OWNER must receive an approved non-owner Role.

The exact fallback Role policy must be defined by tenancy requirements.

Possible future policy:

```text
ADMIN
```

However, Roles must not assume this policy silently.

The ownership transfer workflow must explicitly specify the desired target Role for the previous owner.

---

# Membership Activation Flow

An ACTIVE Membership must have a valid Role.

Conceptually:

```text
Membership Pending / Invited
        ↓
Resolve Assigned Role
        ↓
Role Valid?
        ├── NO → Activation Fails
        └── YES
             ↓
           Memberships Activates Membership
```

Roles provides validation.

Memberships owns activation.

---

# Membership Without Role

Invalid production state:

```text
Membership = ACTIVE

roleId = null
```

or:

```text
roleId references missing Role
```

Expected behavior:

```text
Membership Activation
        ↓
Role Validation Fails
        ↓
Do Not Activate
```

---

# Role Removal From Membership

The initial architecture does not support an active Membership without a Role.

Therefore:

```text
removeRoleFromMembership()
```

must not leave:

```text
ACTIVE Membership
+
No Role
```

Possible valid operations may include:

- Replace Role.
- Suspend Membership.
- Remove Membership.

Exact behavior belongs to Memberships.

---

# Role Change Flow

Changing a Membership from one Role to another:

```text
Current Membership
        ↓
Current Role
        ↓
Requested New Role
        ↓
Authorization Check
        ↓
Resolve New Role
        ↓
Validate Special Rules
        ↓
Memberships Updates roleId
        ↓
Persist
        ↓
Request Audit Event
```

Special rules may apply when either Role is:

```text
OWNER
```

---

# Promote Membership

Example:

```text
MEMBER
↓
MANAGER
```

Conceptual flow:

```text
Authorized Actor
        ↓
Target Membership
        ↓
Resolve MANAGER Role
        ↓
Validate Assignment Permission
        ↓
Memberships Updates Role
        ↓
Audit
```

Roles does not determine whether the actor is authorized.

---

# Demote Membership

Example:

```text
ADMIN
↓
MEMBER
```

Conceptual flow:

```text
Authorized Actor
        ↓
Target Membership
        ↓
Resolve MEMBER Role
        ↓
Validate Assignment
        ↓
Ownership Safety Check
        ↓
Memberships Updates Role
        ↓
Audit
```

If the target is the current OWNER, normal demotion is prohibited.

Ownership transfer must be used instead.

---

# Role Hierarchy Flow

The initial role hierarchy:

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

may be used for:

- Display ordering.
- Human understanding.
- UI grouping.

It must not be used alone as the authorization algorithm.

Invalid shortcut:

```text
if actor.sortOrder < target.sortOrder:
    allow
```

Authorization belongs to Permissions.

---

# Permission Resolution Flow

Permissions is not part of Roles Foundation.

Future conceptual flow:

```text
Membership
   ↓
Role
   ↓
Permissions
   ↓
Requested Operation
```

Roles supplies:

```text
Role identity
```

Permissions supplies:

```text
Permission set
Permission evaluation
```

Roles must not embed permission evaluation while waiting for Permissions.

---

# Role Lookup During Authorization

Future authorization may use:

```text
Authenticated Profile
        ↓
Membership
        ↓
roleId
        ↓
Role
        ↓
Permission Mapping
        ↓
Permission Check
```

Roles lookup is one step.

It is not the complete authorization decision.

---

# Global Role Access

The canonical Role catalog is global Platform Core reference data.

Therefore a normal Role lookup does not require Organization scoping.

Example:

```text
getRoleByKey("ADMIN")
```

returns the global ADMIN definition.

That does not grant ADMIN authority to anyone.

---

# Tenant Authority Flow

Authority exists only through Membership assignment.

```text
Global ADMIN Role
        ↓
Organization A Membership
        ↓
User has ADMIN authority in Organization A
```

The same user may simultaneously have:

```text
VIEWER
```

in Organization B.

Example:

```text
Profile
├── Organization A Membership → ADMIN
└── Organization B Membership → VIEWER
```

Roles remain global.

Authority remains tenant-specific through Memberships.

---

# Role Creation

Normal user-created Roles are not part of Roles Foundation.

Therefore the initial application does not expose:

```text
createRole
```

to normal users.

Canonical Roles are created through controlled seed initialization.

---

# Role Update

The initial system Roles are stable reference data.

Normal application workflows should not allow arbitrary mutation of:

```text
key
isSystem
canonical meaning
```

Human-readable metadata may evolve through controlled maintenance if necessary.

---

# Role Deletion

Canonical system Roles must not be deleted through normal application flows.

Invalid:

```text
Delete OWNER
```

or:

```text
Delete ADMIN
```

Expected behavior:

```text
Deletion Request
        ↓
Role is System Role
        ↓
Reject
```

---

# Role Retirement

Role retirement is deferred.

If future custom Roles exist, retirement may require:

```text
Find Memberships using Role
        ↓
Require Reassignment
        ↓
Retire Role
        ↓
Preserve Historical Meaning
```

This flow is not part of the initial implementation.

---

# Seed Failure

If the Roles seed fails:

```text
Seed Starts
    ↓
Database Error
    ↓
Seed Aborts
    ↓
Deployment / Setup Fails
```

Do not continue as though the catalog were complete.

Required canonical Role availability is a platform prerequisite.

---

# Duplicate Role Key

Database uniqueness protects canonical Role identity.

Flow:

```text
Attempt Duplicate key = OWNER
        ↓
Database Unique Constraint
        ↓
Conflict
        ↓
Fail Predictably
```

Application code must not create multiple records with the same canonical key.

---

# Role Metadata Update During Seed

Seed behavior must be conservative.

Possible approved behavior:

```text
Role exists
    ↓
Compare approved metadata
    ↓
Update name / description / sortOrder if intentionally configured
```

Seed must not silently modify security semantics.

---

# Runtime Auto-Creation

Normal runtime operations must not automatically create missing canonical Roles.

Invalid:

```text
Create Organization
        ↓
OWNER missing
        ↓
Automatically create OWNER
```

Correct:

```text
Create Organization
        ↓
OWNER missing
        ↓
Platform Configuration Error
        ↓
Transaction Aborted
```

Infrastructure initialization belongs to deployment/seed workflow.

---

# Organization Creation Integration

Complete Organization creation depends on Roles.

Conceptually:

```text
Authenticated Profile
        ↓
Validate Organization Input
        ↓
Resolve Required Role: OWNER
        ↓
BEGIN TRANSACTION
        ↓
Organizations Creates Organization
        ↓
Memberships Creates Membership with OWNER roleId
        ↓
COMMIT
```

Roles does not create Organization or Membership records.

---

# Organization Creation Failure

If OWNER cannot be resolved:

```text
Resolve OWNER
        ↓
Not Found
        ↓
Do Not Begin / Complete Organization Creation
```

No ownerless operational Organization should result.

---

# First Membership Flow

When a new Organization receives its first Membership:

```text
Organization
        ↓
OWNER Role
        ↓
Initial OrganizationMembership
```

The initial Membership must use the canonical OWNER Role.

Memberships owns the record.

Roles owns OWNER.

---

# Invitation Role Flow

A Membership invitation may include an intended Role.

Conceptually:

```text
Invite Member
        ↓
Select Intended Role
        ↓
Resolve Role
        ↓
Validate Assignment Permission
        ↓
Memberships Stores Invitation Intent
        ↓
Recipient Accepts
        ↓
Membership Created / Activated with Role
```

Invitation persistence belongs to Memberships.

Role resolution belongs to Roles.

---

# Invalid Invitation Role

If the Role referenced by an invitation is invalid or unavailable:

```text
Accept Invitation
        ↓
Resolve Intended Role
        ↓
Role Invalid
        ↓
Do Not Activate Membership
```

Memberships must fail safely.

---

# Default Membership Role

A future Membership policy may define a default Role such as:

```text
MEMBER
```

That policy belongs to Memberships or tenancy onboarding requirements.

Roles provides the canonical `MEMBER` Role.

Roles must not silently choose a default assignment for every workflow.

---

# Roles in UI

User interfaces may display:

```text
Owner
Admin
Manager
Member
Viewer
```

UI flow:

```text
Request Role Catalog
        ↓
Roles Service
        ↓
Role DTOs
        ↓
Render Human-Readable Labels
```

UI must use stable IDs/keys for submitted values.

Display text must not be treated as authorization data.

---

# Client Input Validation

Example request:

```text
roleId = <uuid>
```

Server flow:

```text
Receive roleId
        ↓
Validate UUID
        ↓
Resolve Role
        ↓
Validate Assignment Rules
        ↓
Validate Authorization
        ↓
Membership Mutation
```

Never trust client-provided Role identity without server lookup.

---

# Error Scenarios

Recommended Role-level errors may include:

```text
ROLE_NOT_FOUND
ROLE_KEY_CONFLICT
REQUIRED_ROLE_MISSING
ROLE_INVALID
SYSTEM_ROLE_PROTECTED
```

Assignment-related errors belong primarily to Memberships or Permissions.

Examples:

```text
MEMBERSHIP_NOT_FOUND
ROLE_ASSIGNMENT_DENIED
OWNER_TRANSFER_REQUIRED
```

---

# Audit Flow

Security-relevant Role assignment changes should eventually be audited.

Conceptually:

```text
Membership Role Changed
        ↓
Persistence Succeeds
        ↓
Audit Request
        ↓
Audit Module
        ↓
Persist AuditEvent
```

Role definition changes may also be audited in future.

Audit persistence does not belong to Roles.

---

# Role Events

The initial Roles Foundation requires minimal event behavior.

Possible future Role-definition events:

```text
role.created
role.updated
role.retired
```

Membership Role assignment events may belong to Memberships.

Example:

```text
membership.role_changed
```

Event ownership follows the mutated entity.

---

# Transaction Boundaries

Role lookup does not normally require a transaction.

Cross-module workflows may include Role resolution before or during a transaction.

Example:

```text
Resolve OWNER
        ↓
BEGIN TRANSACTION
        ↓
Create Organization
        ↓
Create Membership using OWNER.id
        ↓
COMMIT
```

Do not perform external effects inside the transaction.

---

# Role Assignment Transaction

A simple Membership Role replacement may require one Membership update.

Ownership transfer requires an atomic multi-update transaction.

Roles itself should not open transactions merely for read-only Role resolution.

---

# Cross-Module Flow Principle

Roles is frequently used by other modules.

Example:

```text
Organizations
        ↓
Roles
        ↓
Memberships
```

or:

```text
Memberships
        ↓
Roles
        ↓
Permissions
```

This does not make Roles an orchestration layer.

Roles remains focused on canonical Role definitions and resolution.

---

# Permissions Integration

Permissions is explicitly deferred from Roles Foundation.

Future flow:

```text
Resolve Role
        ↓
Load Permission Assignments
        ↓
Evaluate Permission
```

Until Permissions exists:

```text
Do not create permission flags inside Role.
```

---

# Custom Roles

Custom Organization-specific Role flows are deferred.

Future possible flow:

```text
Organization Admin
        ↓
Create Custom Role
        ↓
Choose Permissions
        ↓
Persist Organization Role
        ↓
Assign to Memberships
```

This requires a future architecture review.

It is not part of the initial Roles module.

---

# Custom Role Migration

If custom Roles are introduced later, global system Roles must remain stable.

Migration must not break existing Membership references.

Potential future architecture must distinguish clearly between:

```text
System Role
```

and:

```text
Organization Custom Role
```

No preparatory implementation is required now.

---

# Domain Integration

Business Domains may request authorization using Permissions.

Domains should not mutate canonical Platform Roles.

Invalid:

```text
DJ Domain creates DJ_ADMIN Role
```

without approved architecture.

Preferred future pattern:

```text
Domain Permission
        ↓
Permissions Module
        ↓
Mapped to Existing / Approved Role
```

---

# Security Flow

Role-related authorization data must be resolved server side.

Conceptual security flow:

```text
Request
  ↓
Authenticated Profile
  ↓
OrganizationMembership
  ↓
Persisted Role
  ↓
Permissions
  ↓
Operation
```

Client-supplied Role claims never replace persisted authorization data.

---

# Platform Startup Validation

The application may eventually validate required system Roles during startup or deployment health checks.

Conceptually:

```text
Application Starts
        ↓
Validate Required Role Catalog
        ↓
Catalog Complete?
        ├── YES → Healthy
        └── NO  → Configuration Failure
```

Whether this belongs in runtime health checks or deployment verification should be decided during implementation.

---

# Implementation Boundary

Roles Foundation may implement:

```text
Role persistence
Canonical Role seed
Role lookup by ID
Role lookup by key
Role listing
Required Role resolution
System Role protection
```

It must not implement:

```text
Membership persistence
Role assignment persistence
Permission mapping
Permission evaluation
Organization-specific Roles
Custom Role CRUD
Ownership transfer persistence
```

---

# Dependencies

Roles Foundation depends on:

```text
Prisma
PostgreSQL
UUID strategy
```

Memberships depends on Roles.

Organizations complete onboarding depends on:

```text
Roles
Memberships
```

Permissions will later integrate with Roles.

---

# Definition of Ready

Roles flows are ready when:

- Canonical system Role catalog is approved.
- Seed flow is approved.
- Role lookup flow is approved.
- Required Role failure behavior is approved.
- Membership assignment ownership belongs to Memberships.
- Organization ownership invariant remains owned by Organizations.
- Permissions remain separate.
- OWNER special handling is understood.
- Role deletion protection is defined.
- Custom Roles remain deferred.

---

# Definition of Done

Roles workflow implementation is complete when:

- Canonical Roles seed successfully.
- Seed is idempotent.
- Required Roles can be resolved by key.
- Missing required Roles fail safely.
- Roles can be retrieved by ID and key.
- System Roles cannot be casually deleted.
- Runtime flows do not auto-create missing Roles.
- Membership assignment remains outside Roles.
- Permission evaluation remains outside Roles.
- OWNER can support Organization onboarding.
- Relevant tests pass.
- Documentation matches implementation.

---

# Final Principle

Roles defines canonical authority positions.

Roles resolves them reliably.

Memberships assigns them.

Organizations defines the tenant and ownership invariant.

Permissions determines what those Roles may do.

Roles must remain a small, stable foundation for the rest of the authorization system.