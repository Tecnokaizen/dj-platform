---
title: Memberships Flows
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-12
related:
  - SPEC.md
  - DATA_MODEL.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../organizations/FLOWS.md
  - ../organizations/SPEC.md
  - ../roles/FLOWS.md
  - ../roles/SPEC.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/SECURITY.md
  - ../../../architecture/DATA.md
---

# Memberships Flows

## Purpose

This document defines the workflows owned by or coordinated through the Platform Core Memberships module.

Memberships owns the lifecycle of:

```text
OrganizationMembership

OrganizationInvitation
```

Memberships establishes tenant belonging.

It does not own:

```text
Authentication

Organization lifecycle

Role definitions

Permission definitions

Permission evaluation
```

---

# Flow Ownership

The tenancy and authorization flow is divided across Platform Core.

```text
Identity
│
└── Profile

Organizations
│
└── Organization

Memberships
├── OrganizationMembership
└── OrganizationInvitation

Roles
│
└── Role

Permissions
│
└── Permission
```

Ownership:

```text
Authentication / Profile resolution
→ Identity

Organization creation and lifecycle
→ Organizations

Membership creation and lifecycle
→ Memberships

Invitation lifecycle
→ Memberships

Role definition and lookup
→ Roles

Role assignment persistence
→ Memberships

Permission evaluation
→ Permissions
```

Cross-module workflows may coordinate several owners.

Orchestration does not transfer ownership.

---

# Memberships Foundation Flow

Memberships Foundation depends on existing:

```text
Profile

Organization

Role
```

Conceptual implementation sequence:

```text
Identity Foundation
        ↓
Organizations Foundation
        ↓
Roles Foundation
        ↓
Memberships Migration
        ↓
Membership Repositories
        ↓
Membership Services
        ↓
Invitation Services
        ↓
Security Validation
        ↓
Memberships Foundation Ready
```

Memberships adopts the Membership Repository and Invitation Repository under
ADR-007. ADR-007 makes repositories optional globally; Memberships requires
them for complex queries, secret `tokenHash` projections, and transactional
operations.

```text
Consumer
        ↓
Memberships Service
        ↓
Membership or Invitation Repository
        ↓
Prisma
```

The Service owns the transaction. The Repository receives the Prisma Client or
the transaction client supplied by that Service.

---

# Effective Tenant Access

An authenticated user is not automatically an Organization member.

Conceptually:

```text
Authenticated User
        ↓
Resolve Profile
        ↓
Resolve Organization
        ↓
Organization state allows access?
        ↓
Find OrganizationMembership
        ↓
Membership ACTIVE?
        ↓
Role valid?
        ↓
Permission evaluation
        ↓
Operation
```

Memberships owns only the Membership part of this chain.

---

# Membership Lookup

## Get Membership By ID

```text
membershipId
        ↓
Validate UUID
        ↓
Membership Repository
        ↓
Membership Found?
        ├── YES → Return Membership
        └── NO  → MEMBERSHIP_NOT_FOUND
```

---

# Get Membership For Profile

Used to determine whether a Profile belongs to an Organization.

```text
organizationId
+
profileId
        ↓
Membership Repository
        ↓
Find Unique Relationship
        ↓
Return Membership or null
```

The database uniqueness constraint guarantees at most one durable Membership for the pair.

---

# Has Active Membership

Conceptual flow:

```text
organizationId
+
profileId
        ↓
Find Membership
        ↓
status = ACTIVE?
        ├── YES → true
        └── NO  → false
```

This establishes belonging.

It does not establish full authorization.

---

# List Memberships For Organization

Conceptual flow:

```text
Organization
        ↓
Validate Organization Context
        ↓
Membership Repository
        ↓
List Organization Memberships
        ↓
Optional Status Filter
        ↓
Return Memberships
```

Authorization to call this operation is separate from the query itself.

---

# List Active Memberships

Common tenant-management flow:

```text
Organization
        ↓
Memberships
        ↓
status = ACTIVE
        ↓
Return Current Members
```

This may later support pagination.

---

# List Memberships For Profile

Used by tenant-selection workflows.

```text
Authenticated Profile
        ↓
Membership Repository
        ↓
Find Memberships by profileId
        ↓
Filter ACTIVE
        ↓
Resolve Organizations
        ↓
Return Accessible Organizations
```

Memberships is the source of truth for belonging.

---

# Initial Organization Owner Flow

The first Organization Membership is created during complete Organization onboarding.

This is a cross-module transaction exclusively implemented by M-084.

Normal Membership creation, invitation, and Role-change flows reject OWNER.
OWNER promotion or transfer is exclusively implemented by M-088. Controlled
internal test fixtures may insert OWNER through a dedicated internal test path.

## Flow

```text
Authenticated Profile
        ↓
Validate Organization Input
        ↓
Roles.resolveRequiredRole("OWNER")
        ↓
BEGIN TRANSACTION
        ↓
Organizations Creates Organization
        ↓
Memberships Creates OrganizationMembership
        ↓
profileId = authenticated Profile
organizationId = new Organization
roleId = OWNER.id
status = ACTIVE
        ↓
COMMIT
        ↓
Establish Tenant Context
        ↓
Request Audit
```

---

# Initial Owner Atomicity

Invalid state:

```text
Organization created
+
no OWNER Membership
```

If Membership creation fails:

```text
ROLLBACK Organization Creation
```

Complete Organization onboarding must be atomic.

---

# OWNER Invariant

Operational Organization requirement:

```text
Exactly one ACTIVE OrganizationMembership
whose Role key = OWNER
```

Organizations owns this invariant.

Memberships must respect it during every Membership mutation.

---

# Create Membership

Generic unrestricted Membership creation is not a normal public operation.

Approved initial creation sources:

```text
Organization onboarding

Invitation acceptance

Explicit restoration/rejoin
```

Memberships must not expose arbitrary Membership creation without an approved workflow.

---

# Membership Creation Validation

Before creating a Membership:

```text
Organization exists?
        ↓
Profile exists?
        ↓
Role exists?
        ↓
Existing Membership?
        ↓
Organization/Profile pair unique?
        ↓
Approved workflow?
```

If any required invariant fails:

```text
Do Not Persist
```

---

# Membership ACTIVE Creation

Expected persisted state:

```text
status = ACTIVE

roleId = valid Role

suspendedAt = null

removedAt = null
```

---

# Suspend Membership

Suspension temporarily revokes active tenant participation.

## Flow

```text
Actor Requests Suspension
        ↓
Resolve Organization
        ↓
Resolve Target Membership
        ↓
Validate Membership ACTIVE
        ↓
Check OWNER Safety
        ↓
Authorize Actor
        ↓
Update Membership
        ↓
status = SUSPENDED
suspendedAt = now()
removedAt = null
        ↓
Commit
        ↓
Invalidate Tenant Context / Cache
        ↓
Request Audit
```

---

# Suspend OWNER

Direct suspension of the sole active OWNER is prohibited.

```text
Target Role = OWNER
        ↓
Would suspension leave zero active OWNER?
        ├── YES → OWNER_TRANSFER_REQUIRED
        └── NO  → continue only if invariant remains valid
```

Under the initial model, exactly one active OWNER is expected, so normal OWNER suspension should route through ownership transfer first.

---

# Restore Suspended Membership

## Flow

```text
Actor Requests Restore
        ↓
Resolve Membership
        ↓
status = SUSPENDED?
        ↓
Resolve Organization
        ↓
Organization.status = ACTIVE?
        ↓
Keep existing roleId and validate its Role
        ↓
Authorize Actor
        ↓
Update
        ↓
status = ACTIVE
suspendedAt = null
removedAt = null
        ↓
Commit
        ↓
Request Audit
```

---

# Remove Membership

Removal ends normal Organization participation but preserves the durable relationship.

## Flow

```text
Actor Requests Removal
        ↓
Resolve Target Membership
        ↓
Membership ACTIVE or SUSPENDED?
        ↓
Check OWNER Safety
        ↓
Authorize Actor
        ↓
Update Membership
        ↓
status = REMOVED
removedAt = now()
suspendedAt = null
        ↓
Commit
        ↓
Invalidate Tenant Context
        ↓
Request Audit
```

---

# Remove OWNER

Direct removal of the sole OWNER is prohibited.

```text
OWNER Membership
        ↓
Removal Requested
        ↓
Ownership Transfer Completed?
        ├── NO → OWNER_TRANSFER_REQUIRED
        └── YES → removal may proceed if invariant remains valid
```

---

# Restore Removed Membership

A removed Membership may be restored only through an explicit rejoin/restoration workflow.

## Flow

```text
Resolve REMOVED Membership
        ↓
Validate Organization
        ↓
Organization.status = ACTIVE?
        ↓
Require explicit targetRoleId
        ↓
Resolve and validate target Role (non-OWNER)
        ↓
Authorize Restore
        ↓
Update Membership
        ↓
status = ACTIVE
roleId = explicit targetRoleId
removedAt = null
suspendedAt = null
        ↓
Commit
        ↓
Request Audit
```

Restoration must not blindly revive stale authority.

---

# Membership Rejoin Through Invitation

A future invitation may target a Profile with an existing REMOVED Membership.

Preferred flow:

```text
Valid Invitation
        ↓
Resolve Matching Profile
        ↓
Find Existing Membership
        ↓
status = REMOVED
        ↓
Validate Rejoin Policy
        ↓
Resolve Invitation Role
        ↓
BEGIN TRANSACTION
        ↓
Restore Existing Membership
        ↓
roleId = invitation.roleId
status = ACTIVE
        ↓
Mark Invitation ACCEPTED
        ↓
COMMIT
```

Do not create a second Membership row.

---

# Change Membership Role

Memberships owns `roleId` persistence.

## Flow

```text
Actor Requests Role Change
        ↓
Resolve Target Membership
        ↓
Resolve Target Role
        ↓
Validate Target Role
        ↓
Check OWNER Rules
        ↓
Authorize Actor
        ↓
Update Membership.roleId
        ↓
Commit
        ↓
Invalidate Authorization Context
        ↓
Request Audit
```

---

# Promote Membership

Example:

```text
MEMBER
→ MANAGER
```

Flow:

```text
Resolve Membership
        ↓
Resolve MANAGER
        ↓
Authorize Role Change
        ↓
Update roleId
        ↓
Audit
```

---

# Demote Membership

Example:

```text
ADMIN
→ MEMBER
```

Flow:

```text
Resolve Membership
        ↓
Resolve MEMBER
        ↓
Validate OWNER Safety
        ↓
Authorize
        ↓
Update roleId
        ↓
Audit
```

---

# OWNER Role Change

Normal:

```text
OWNER
→ ADMIN
```

is not an ordinary Role-change operation.

It must occur as part of ownership transfer.

---

# Ownership Transfer

Ownership transfer is cross-module and atomic.

Memberships owns the Role assignment mutations.

Organizations owns the ownership invariant.

Roles owns the canonical Role definitions.

## Flow

```text
Current OWNER Membership
        ↓
Target ACTIVE Membership
        ↓
Resolve OWNER Role
        ↓
Resolve Approved Previous-Owner Role
        ↓
Validate Same Organization
        ↓
Validate Target Not Current Owner
        ↓
Authorize Current Owner
        ↓
BEGIN TRANSACTION
        ↓
Target Membership.roleId = OWNER
        ↓
Previous Owner.roleId = approved non-owner Role
        ↓
Validate Exactly One Active OWNER
        ↓
COMMIT
        ↓
Invalidate Authorization Context
        ↓
Request Membership Audit
        ↓
Request organization.ownership_transferred Event
```

---

# Ownership Transfer Rollback

If either Role update fails:

```text
ROLLBACK
```

Invalid intermediate persistence:

```text
Two OWNERs
```

or:

```text
Zero OWNERs
```

must never commit.

---

# Previous Owner Role

The transfer workflow must explicitly determine the previous owner's new Role.

Do not silently assume a Role without an approved tenancy policy.

If the platform adopts:

```text
ADMIN
```

as the default previous-owner Role, that policy must be documented consistently before implementation.

---

# OWNER Invitation

Normal invitation flow must not invite another OWNER.

Invalid:

```text
Invite Member
role = OWNER
```

Expected:

```text
OWNER_TRANSFER_REQUIRED
```

or equivalent protected-operation result.

Ownership must use the transfer flow.

---

# Create Invitation

Invitation creation is a Memberships-owned workflow.

## Input Concept

```text
organizationId

recipientEmail

roleId
```

The authenticated actor is resolved server side.

---

# Create Invitation Flow

```text
Authenticated Actor
        ↓
Resolve Actor Profile
        ↓
Resolve Actor ACTIVE Membership
        ↓
Resolve Organization
        ↓
Organization.status = ACTIVE?
        ↓
Authorize Invitation Creation
        ↓
Normalize Recipient Email
        ↓
Resolve Intended Role
        ↓
Validate Role Assignability
        ↓
Reject OWNER Through Normal Invitation
        ↓
Check Existing Membership
        ↓
Check Existing PENDING Invitation
        ↓
Expire Stale PENDING Invitation if needed
        ↓
crypto.randomBytes(32)
        ↓
base64url transport encoding
        ↓
SHA-256 lowercase hexadecimal hash
        ↓
Persist OrganizationInvitation
        ↓
status = PENDING
        ↓
Commit
        ↓
Request Notification Delivery
        ↓
Request Audit
```

The recipient Profile lookup uses Identity's derived normalized Auth-email
projection. That lookup, the recipient Membership check, actor Membership
revalidation and duplicate-PENDING handling execute through dependencies bound
to the same database transaction. No Supabase network request runs inside it.

---

# Invitation Creation Output

The raw invitation token may be returned only to the trusted layer responsible for constructing the invitation delivery.

It must not become part of normal administrative DTOs.

Conceptually:

```text
Invitation persisted
+
raw token transiently available
```

The database stores:

```text
SHA-256 lowercase hexadecimal tokenHash
```

only.

---

# Recipient Email Normalization

Before invitation lookup or creation:

```text
recipientEmail
        ↓
trim
        ↓
lowercase
        ↓
normalizedEmail
```

The same normalization rule must be used during acceptance.

---

# Existing ACTIVE Membership During Invite

If recipient identity can be safely resolved and already has:

```text
ACTIVE Membership
```

the workflow must not create another path to Membership.

Possible result:

```text
ALREADY_MEMBER
```

Avoid exposing unnecessary account-existence information in public-facing responses.

---

# Existing SUSPENDED Membership During Invite

Suspension must not be bypassed through invitation.

If the intended recipient already has:

```text
SUSPENDED Membership
```

expected behavior:

```text
Do not create an invitation that silently restores access.
```

Require explicit restore workflow.

---

# Existing REMOVED Membership During Invite

A new invitation may be used as an approved rejoin path.

The invitation remains separate.

Acceptance may later restore the existing Membership.

---

# Duplicate Pending Invitation

Only one persisted PENDING invitation should exist for:

```text
Organization
+
normalizedEmail
```

Flow:

```text
Create Invitation
        ↓
Find PENDING Invitation
        ↓
Exists?
        ├── NO → create
        └── YES
             ↓
           Is expired?
             ├── YES
             │    ↓
             │  Mark EXPIRED
             │    ↓
             │  Create New Invitation
             │
             └── NO
                  ↓
                Return INVITATION_ALREADY_PENDING
```

---

# Invitation Expiration

An invitation must never be accepted solely because:

```text
status = PENDING
```

Acceptance must also verify:

```text
expiresAt > now
```

---

# Lazy Expiration

When a PENDING invitation is loaded and:

```text
expiresAt <= now
```

the workflow may transition it to:

```text
EXPIRED
```

before returning the final result.

Security does not depend on the persistence update completing first.

---

# Resend Invitation

Initial resend policy should avoid duplicate PENDING invitations.

Implemented flow for a non-expired PENDING invitation:

```text
Resolve Existing PENDING Invitation
        ↓
Validate Not Accepted / Revoked
        ↓
Generate New Raw Token
        ↓
Hash New Token
        ↓
Update tokenHash
        ↓
Preserve expiresAt
        ↓
Commit
        ↓
Send New Invitation
```

Old token becomes invalid because its hash is replaced.

If the row is already `EXPIRED` or `expiresAt <= now`, resend follows the
reinvitation flow instead: close any stale PENDING row and create a new
invitation with a fresh 72-hour lifetime.

---

# Resend Security

Do not:

```text
reuse an indefinitely valid raw token
```

or:

```text
create multiple active token hashes for one invitation
```

unless a future specification explicitly requires it.

---

# Revoke Invitation

## Flow

```text
Actor Requests Revoke
        ↓
Resolve Invitation
        ↓
Validate Organization Context
        ↓
status = PENDING?
        ↓
Authorize Actor
        ↓
Update Invitation
        ↓
status = REVOKED
revokedAt = now()
        ↓
Commit
        ↓
Request Audit
```

No Membership is modified.

---

# Revoke Accepted Invitation

Invalid:

```text
ACCEPTED
→ REVOKED
```

Revoking an accepted invitation does not revoke the Membership.

Membership removal is a separate workflow.

---

# Accept Invitation

Invitation acceptance is security-critical and transactional.

## Flow

```text
Raw Invitation Token
        ↓
Hash Token
        ↓
Find Invitation by tokenHash
        ↓
Invitation Found?
        ↓
status = PENDING?
        ↓
expiresAt > now?
        ↓
Authenticate User
        ↓
Resolve Profile
        ↓
Resolve Canonical Identity Email
        ↓
Normalize Email
        ↓
Matches Invitation.normalizedEmail?
        ↓
Resolve Organization
        ↓
Organization.status = ACTIVE?
        ↓
Resolve Invitation Role
        ↓
Role valid?
        ↓
Check Existing Membership
        ↓
BEGIN TRANSACTION
        ↓
Create or Restore Membership
        ↓
Mark Invitation ACCEPTED
        ↓
acceptedByProfileId = Profile.id
acceptedAt = now()
        ↓
COMMIT
        ↓
Request Audit
        ↓
Establish / Offer Tenant Context
```

---

# Invitation Acceptance Requires Authentication

Possession of a valid invitation token alone is insufficient.

Required:

```text
Valid Invitation
+
Authenticated Matching Identity
```

This prevents token possession alone from becoming Membership authority.

---

# Invitation Recipient Mismatch

If authenticated identity does not match:

```text
invitation.normalizedEmail
```

expected:

```text
INVITATION_RECIPIENT_MISMATCH
```

No Membership is created.

Invitation remains unused unless policy explicitly revokes suspicious attempts.

---

# Accept Invitation With No Membership

```text
No Existing Membership
        ↓
Create OrganizationMembership
        ↓
organizationId = invitation.organizationId
profileId = authenticated Profile
roleId = invitation.roleId
status = ACTIVE
        ↓
Mark Invitation ACCEPTED
```

All within one transaction.

---

# Accept Invitation With ACTIVE Membership

```text
Existing Membership = ACTIVE
        ↓
Do Not Create Duplicate
        ↓
Do Not Change Role Silently
        ↓
Return ALREADY_MEMBER
```

The implemented behavior fails explicitly with `ALREADY_MEMBER`, leaves the
invitation PENDING, and does not mutate the existing Membership or its Role.

---

# Accept Invitation With SUSPENDED Membership

```text
Existing Membership = SUSPENDED
        ↓
Reject Normal Acceptance
        ↓
Require Explicit Restore
```

Invitation token must not bypass an administrative suspension.

---

# Accept Invitation With REMOVED Membership

```text
Existing Membership = REMOVED
        ↓
Validate Rejoin Policy
        ↓
BEGIN
        ↓
Restore Existing Membership
        ↓
Assign Invitation Role
        ↓
Mark Invitation ACCEPTED
        ↓
COMMIT
```

The durable Membership record is reused.

---

# Invitation Acceptance Concurrency

Two requests may attempt to accept the same invitation.

The workflow must guarantee:

```text
at most one successful acceptance
```

Preferred persistence principle:

```text
Conditional update / row lock / transaction
```

on the PENDING Invitation combined with Membership uniqueness.

Exact implementation belongs in PRISMA.md.

---

# Invitation Acceptance Partial Failure

Invalid persisted state:

```text
Membership ACTIVE
+
Invitation still PENDING
```

after acceptance.

The Membership mutation and Invitation status change must commit atomically.

---

# Expire Invitation

Formal expiration may occur through:

```text
lazy access

reinvitation

scheduled job

maintenance task
```

Flow:

```text
Invitation PENDING
        ↓
expiresAt <= now
        ↓
status = EXPIRED
        ↓
Commit
```

No Membership mutation occurs.

---

# Invitation Status Transitions

Allowed:

```text
PENDING → ACCEPTED

PENDING → REVOKED

PENDING → EXPIRED
```

Terminal initial states:

```text
ACCEPTED

REVOKED

EXPIRED
```

Normal transitions such as:

```text
ACCEPTED → PENDING
REVOKED → PENDING
EXPIRED → PENDING
```

are prohibited.

A new invitation record is used for reinvitation.

---

# Invitation State Diagram

```text
             ┌──────────► ACCEPTED
             │
PENDING ─────┼──────────► REVOKED
             │
             └──────────► EXPIRED
```

---

# Invitation Role Validation

Before invitation creation and acceptance:

```text
roleId
        ↓
Roles.getRole()
        ↓
Role exists?
        ↓
Role allowed for this workflow?
```

Roles provides the definition.

Memberships uses the result.

---

# Role Deleted or Missing Before Acceptance

If an invitation references a Role that can no longer be resolved:

```text
Accept Invitation
        ↓
Role Invalid
        ↓
Reject Acceptance
```

Do not substitute another Role silently.

---

# Invite Existing Platform User

The invitation flow should remain structurally identical whether the email belongs to an existing Profile or not.

```text
Invitation
→ email-based recipient intent
```

before acceptance.

This avoids bifurcated persistence models.

---

# Invite New Platform User

```text
Invitation Created
        ↓
Recipient Receives Link
        ↓
Recipient Registers / Authenticates
        ↓
Profile Exists
        ↓
Accept Invitation
```

Membership creation occurs only after authenticated acceptance.

---

# First Login With Invitation

Possible flow:

```text
Open Invitation Link
        ↓
Not Authenticated
        ↓
Login / Register
        ↓
Profile Available
        ↓
Return to Invitation Acceptance
        ↓
Validate Recipient
        ↓
Create Membership
```

Identity owns authentication.

Memberships owns invitation acceptance.

---

# List Invitations

Administrative Organization workflows may list invitations.

Conceptually:

```text
Organization
        ↓
Authorize Actor
        ↓
Invitation Repository
        ↓
Return Invitations
```

Normal DTOs may include:

```text
recipientEmail

Role summary

status

expiresAt

createdAt
```

They must not expose:

```text
tokenHash
```

---

# Invitation Lookup By Token

Token lookup is server-only.

```text
raw token
        ↓
hash
        ↓
findByTokenHash
```

Never:

```text
SELECT by raw token
```

because raw tokens are not persisted.

---

# Token Generation

Invitation tokens must use this exact trusted server-side procedure:

```text
crypto.randomBytes(32)
        ↓
base64url transport encoding
        ↓
raw token
```

Then:

```text
raw token
        ↓
SHA-256 lowercase hexadecimal hash
        ↓
tokenHash
```

Persist only `tokenHash`; return the raw token once only to the trusted
server-side delivery consumer.

---

# Token Logging

Invitation token values must not appear in:

```text
application logs

analytics events

audit payloads

error monitoring metadata
```

unless securely redacted.

---

# Membership Context Switching

Active Organization switching depends on Memberships.

Flow:

```text
Authenticated Profile
        ↓
Target Organization
        ↓
Find Membership
        ↓
status = ACTIVE?
        ├── NO → deny
        └── YES
             ↓
           Validate Organization state
             ↓
           Set Active Organization Context
```

Memberships validates belonging.

It does not necessarily own context storage.

---

# Membership Context Invalidated By Suspension

If the currently selected Organization Membership becomes:

```text
SUSPENDED
```

or:

```text
REMOVED
```

the active Organization context must no longer provide normal tenant access.

Possible side effects:

```text
invalidate session context

redirect to Organization selection

invalidate tenant cache
```

Implementation ownership may be shared with application context infrastructure.

---

# Organization Suspension

If:

```text
Organization = SUSPENDED
```

ACTIVE Memberships remain stored.

Memberships does not automatically suspend all Membership rows.

Organization lifecycle is separate.

Effective tenant access is denied through Organization state.

---

# Organization Archive

If Organization becomes:

```text
ARCHIVED
```

Memberships remain persisted.

Do not bulk-remove Memberships merely because Organization lifecycle changed.

---

# Organization Restore

Restoring an Organization does not automatically alter Membership status.

Example:

```text
Organization restored to ACTIVE

Membership A = ACTIVE
Membership B = SUSPENDED
Membership C = REMOVED
```

Each Membership retains its own lifecycle state.

---

# Tenant Authorization Bootstrap

Permissions is not yet implemented.

Memberships Foundation may still implement persistence and structural invariants.

It must not invent a general permission engine.

---

# Foundation-Only Operations

Before Permissions exists, safe implementation may include:

```text
Membership repository

Membership lifecycle business rules

Invitation repository

Secure token mechanics

Invitation lifecycle business rules

Role resolution

Ownership invariant checks

transaction primitives
```

Production exposure of administrative actions may remain blocked.

---

# Bootstrap Workflows

Certain workflows require limited explicit authorization semantics before Permissions.

Examples:

```text
Initial OWNER Membership during Organization creation

Authenticated recipient accepting their own valid invitation
```

These are workflow-specific invariants.

They are not a substitute for Permissions.

---

# Administrative Membership Management

Production operations such as:

```text
Invite Member

Suspend Member

Restore Member

Remove Member

Change Role
```

should eventually require canonical Permission checks.

Until Permissions exists:

```text
do not invent canManageMembers Boolean
```

or numeric Role hierarchy authorization.

---

# Role Hierarchy Prohibition

Do not authorize Membership management using:

```text
OWNER > ADMIN > MANAGER
```

or:

```text
sortOrder
```

as a general permission engine.

Roles ordering is not Permissions.

---

# RLS Membership Flow

Memberships is the canonical tenant relationship for RLS.

Foundation / Phase 11 adds no tenant RLS policies. First audit effective
database grants; if `anon` or `authenticated` can access these tables, enable
RLS deny-by-default with no permissive policies. M-087 later adds
Memberships-based tenant policies.

Conceptual read check:

```text
auth.uid()
        ↓
Resolve Profile
        ↓
Find OrganizationMembership
        ↓
organizationId = target tenant
        ↓
status = ACTIVE
        ↓
Allow tenant relationship
```

Fine-grained operation authorization remains separate.

---

# Suspended Membership and RLS

```text
Membership = SUSPENDED
```

must not satisfy normal tenant Membership RLS checks.

---

# Removed Membership and RLS

```text
Membership = REMOVED
```

must not satisfy normal tenant Membership RLS checks.

---

# Invitation RLS

Invitation persistence contains security-sensitive fields.

Foundation / Phase 11 adds no Invitation tenant policy. Apply the same grant
audit and deny-by-default RLS rule; M-087 is the later policy milestone.

Preferred architecture:

```text
Invitation writes
→ server only

Token lookup
→ server only

Administrative reads
→ Organization-authorized server flow
```

Do not make `tokenHash` broadly client-readable.

---

# Membership Events

Memberships owns events related to Membership mutation.

Potential events:

```text
membership.created

membership.suspended

membership.restored

membership.removed

membership.role_changed
```

---

# Invitation Events

Memberships owns:

```text
invitation.created

invitation.accepted

invitation.revoked

invitation.expired
```

Notification systems may consume these events.

---

# Ownership Transfer Events

Cross-module ownership transfer may produce:

```text
membership.role_changed
```

for Membership-level changes and:

```text
organization.ownership_transferred
```

for the Organization-level semantic event.

Each event remains owned by the relevant module.

---

# Audit Flow

Security-relevant Membership changes should request Audit persistence after successful commit.

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
Audit
        ↓
Notification / External Effects
```

Audit persistence belongs to Audit.

---

# Invitation Notification Flow

```text
Create Invitation
        ↓
Commit Invitation
        ↓
Generate Delivery Payload
        ↓
Notifications
        ↓
Email Provider
```

If notification delivery fails after persistence:

```text
Invitation remains PENDING
```

The user may later request resend.

Do not roll back database creation merely because an external email provider failed after commit.

---

# External Side Effects

External effects must not run inside database transactions.

Examples:

```text
email sending

webhooks

analytics

external notifications
```

Transaction scope should remain focused on data invariants.

---

# Membership Transaction Requirements

Transactions are required when multiple writes form one logical invariant.

Examples:

```text
Organization creation
+
Initial OWNER Membership
```

```text
Invitation acceptance
+
Membership creation/restoration
+
Invitation ACCEPTED
```

```text
Ownership transfer
+
Target Role change
+
Previous Owner Role change
```

---

# Simple Membership Mutations

A single-row lifecycle transition such as:

```text
ACTIVE → SUSPENDED
```

may not require a multi-row transaction if the operation is safely atomic.

However, OWNER safety may require additional reads/locking or transaction handling.

---

# Concurrency — Duplicate Membership

Two simultaneous Membership creation flows may target the same:

```text
organizationId
+
profileId
```

Final protection:

```text
UNIQUE(organizationId, profileId)
```

Application pre-checks alone are insufficient.

---

# Concurrency — Duplicate Invitation

Two simultaneous invitation requests may target:

```text
organizationId
+
normalizedEmail
+
PENDING
```

Final protection should include the approved database uniqueness strategy.

---

# Concurrency — Ownership Transfer

Ownership transfer must serialize or otherwise prevent:

```text
two simultaneous new OWNER assignments
```

Exact database locking/constraint strategy belongs in PRISMA.md.

---

# Concurrency — Suspension and Role Change

Concurrent administrative mutations on the same Membership must not silently overwrite security-relevant state.

Where needed, transactions or conditional updates should ensure the caller acts on a valid current state.

---

# Error Scenarios

Recommended Membership-level errors include:

```text
MEMBERSHIP_NOT_FOUND

MEMBERSHIP_ALREADY_EXISTS

MEMBERSHIP_NOT_ACTIVE

MEMBERSHIP_SUSPENDED

MEMBERSHIP_REMOVED

INVALID_MEMBERSHIP_STATE

ROLE_REQUIRED

ROLE_INVALID

OWNER_TRANSFER_REQUIRED

OWNER_INVARIANT_VIOLATION
```

---

# Invitation Errors

Recommended Invitation-level errors include:

```text
INVITATION_NOT_FOUND

INVITATION_ALREADY_PENDING

INVITATION_NOT_PENDING

INVITATION_EXPIRED

INVITATION_REVOKED

INVITATION_ALREADY_ACCEPTED

INVITATION_RECIPIENT_MISMATCH

INVITATION_TOKEN_INVALID

ALREADY_MEMBER
```

Exact stable error contracts belong in API.md.

---

# Error Security

Invitation token lookup should avoid exposing unnecessary distinctions to unauthenticated callers.

Externally visible errors may be intentionally less specific than internal diagnostics.

Do not create account-enumeration leaks.

---

# Platform Administrator Boundary

Platform-wide administration must not be modeled as a special OrganizationMembership.

A future platform administrator capability is separate from tenant Membership.

---

# Domain Boundary

Membership flows remain business agnostic.

Domains may consume Membership context.

Domains must not mutate Core Membership persistence directly.

---

# Domain Example

Allowed conceptual flow:

```text
Domain Operation
        ↓
Resolve Tenant Context
        ↓
Membership ACTIVE?
        ↓
Permissions
        ↓
Domain Service
```

Domain does not create its own Membership table.

---

# Memberships Foundation Implementation Boundary

Memberships Foundation may implement:

```text
OrganizationMembership persistence

OrganizationInvitation persistence

Membership lookup

Membership lifecycle

Role assignment persistence

Invitation creation

Invitation token hashing

Invitation acceptance

Invitation revocation

Invitation expiration handling

Membership uniqueness

Invitation uniqueness

OWNER safety primitives

cross-module transaction primitives
```

---

# Blocked Until Permissions

Production authorization for administrative flows may remain blocked:

```text
Invite arbitrary Member

Suspend Member

Restore Member

Remove Member

Change Membership Role

List sensitive Membership administration data
```

Membership logic can exist internally before final authorization exposure.

---

# Tenancy Integration Enabled By Memberships

Once Memberships and Roles exist, the platform can complete:

```text
Organization onboarding

Initial OWNER creation

User Organization listing

Active Organization switching

Membership-based RLS

Ownership transfer
```

This is the Tenancy Integration milestone.

---

# Definition of Ready

Memberships flows are ready when:

- Membership lifecycle is approved.
- Invitation lifecycle is approved.
- Membership and Invitation remain separate.
- Organization/Profile Membership uniqueness is approved.
- Role is required on Membership.
- OWNER protection is explicit.
- Ownership transfer is atomic.
- Invitation token handling is secure.
- Invitation acceptance requires authenticated matching identity.
- Duplicate invitation handling is defined.
- Existing ACTIVE/SUSPENDED/REMOVED Membership behavior is defined.
- RLS relies on the real Membership model.
- Permissions remain separate.
- Cross-module transaction boundaries are understood.

---

# Definition of Done

Memberships workflow implementation is complete when:

- Membership lookup works.
- Membership creation uses approved workflows.
- Membership uniqueness is protected.
- Suspension works.
- Restoration works.
- Removal works.
- Role replacement works.
- OWNER cannot be invalidated accidentally.
- Ownership transfer primitives are safe.
- Invitation creation works.
- Invitation tokens are generated securely.
- Only token hashes are persisted.
- Invitation expiration is enforced.
- Invitation revocation works.
- Invitation acceptance requires matching authenticated identity.
- Invitation acceptance is atomic.
- ACTIVE Membership duplication is prevented.
- SUSPENDED Membership cannot be bypassed through invitation.
- REMOVED Membership can use the approved rejoin flow.
- Concurrent acceptance cannot create duplicate Memberships.
- Relevant events are emitted/requested appropriately.
- Audit integration boundaries are respected.
- External effects occur after commit.
- Permissions are not duplicated.
- Relevant tests pass.
- Prisma validation passes.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.

---

# Final Principle

Memberships controls tenant belonging.

Membership lifecycle changes must preserve tenant integrity.

Invitations create a secure path toward Membership.

OWNER changes must preserve Organization ownership.

Roles provides Role definitions.

Permissions provides authorization capability.

Identity provides the person.

Organizations provides the tenant.

Memberships connects them without absorbing their responsibilities.
