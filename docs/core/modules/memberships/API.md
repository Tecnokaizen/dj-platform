---
title: Memberships API
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-12
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - PRISMA.md
  - TASKS.md
  - ../organizations/API.md
  - ../organizations/FLOWS.md
  - ../roles/API.md
  - ../roles/FLOWS.md
  - ../../../architecture/API.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/SECURITY.md
---

# Memberships API

## Purpose

This document defines the public application interface exposed by the Platform Core Memberships module.

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

Memberships provides the canonical interface for:

```text
Organization Memberships

Membership lifecycle

Membership Role assignment

Organization Invitations

Invitation lifecycle
```

---

# Architectural Ownership

Memberships owns:

```text
OrganizationMembership

OrganizationInvitation

Membership lifecycle

Invitation lifecycle

Membership Role assignment persistence

Membership lookup

Invitation lookup

Membership tenant relationship
```

Memberships does not own:

```text
Authentication

Profile

Organization

Organization lifecycle

Role definition

Permission definition

Permission evaluation

Audit persistence

Notification delivery
```

Related ownership:

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
```

Cross-module workflows may use the Memberships API.

That does not transfer ownership.

---

# Core Interface Principle

Memberships answers:

```text
Does this Profile belong to this Organization?

What state is that relationship in?

Which Role is assigned?

Is there a valid invitation toward Membership?
```

Memberships does not answer:

```text
Is the user authenticated?
```

or:

```text
Does this Role have permission X?
```

---

# API Design Principles

Memberships API must be:

```text
Server-first

Tenant-aware

Security-conscious

Explicit

Stable

Transactional where required

Independent from Prisma types where practical

Safe for AI-assisted implementation
```

Security-sensitive Membership and Invitation operations must not rely on client assumptions.

---

# Public Capability Groups

The API is divided into:

```text
Membership Reads

Membership Lifecycle

Membership Role Assignment

Invitation Reads

Invitation Lifecycle

Cross-Module Tenancy Operations
```

---

# Membership Read Operations

Recommended initial capabilities:

```text
getMembership

getMembershipForProfile

hasActiveMembership

listMembershipsForOrganization

listActiveMembershipsForOrganization

listMembershipsForProfile

listActiveMembershipsForProfile
```

---

# Membership Mutation Operations

Recommended internal/application capabilities:

```text
createMembership

suspendMembership

restoreMembership

removeMembership

restoreRemovedMembership

changeMembershipRole
```

`createMembership` is not an unrestricted public user capability.

It is used only by approved workflows.

---

# Invitation Operations

Recommended capabilities:

```text
createInvitation

getInvitation

listInvitationsForOrganization

revokeInvitation

resendInvitation

acceptInvitation

expireInvitation
```

Some operations may remain internal or blocked from production exposure until Permissions is implemented.

---

# Membership DTO

Recommended application contract:

```ts
type MembershipDto = {
  id: string
  organizationId: string
  profileId: string
  roleId: string
  status: MembershipStatus
  suspendedAt: string | null
  removedAt: string | null
  createdAt: string
  updatedAt: string
}
```

Consumers may use richer projections when required.

Example:

```ts
type MembershipWithRoleDto = {
  id: string
  organizationId: string
  profileId: string
  status: MembershipStatus
  role: {
    id: string
    key: string
    name: string
  }
}
```

Do not expose unrelated private Profile data automatically.

---

# Invitation DTO

Normal administrative Invitation responses may expose:

```ts
type InvitationDto = {
  id: string
  organizationId: string
  recipientEmail: string
  roleId: string
  status: InvitationStatus
  expiresAt: string
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}
```

The public DTO must not expose:

```text
tokenHash
```

---

# Security-Sensitive Invitation Result

Invitation creation may require a trusted internal result containing the raw token once.

Conceptually:

```ts
type CreatedInvitationSecret = {
  invitation: InvitationDto
  rawToken: string
}
```

This result is only for the trusted server-side delivery workflow.

It must not become a general administrative API response.

---

# Get Membership

## Description

Returns an OrganizationMembership by UUID.

---

## Input

```text
membershipId
```

Conceptual contract:

```ts
type GetMembershipInput = {
  membershipId: string
}
```

---

## Output

```text
MembershipDto
```

or an approved richer projection.

---

## Validation

Validate:

```text
membershipId
→ UUID
```

---

## Authorization

Membership lookup is tenant-sensitive.

Production access requires appropriate tenant authorization.

Internal Core services may consume lower-level repository/service operations where explicitly allowed.

---

# Get Membership For Profile

## Description

Returns the durable Membership relationship for one:

```text
Organization
+
Profile
```

---

## Input

```text
organizationId

profileId
```

Conceptual contract:

```ts
type GetMembershipForProfileInput = {
  organizationId: string
  profileId: string
}
```

---

## Output

```text
MembershipDto | null
```

---

# Has Active Membership

## Description

Checks whether a Profile currently belongs actively to an Organization.

---

## Input

```text
organizationId

profileId
```

---

## Output

```text
boolean
```

---

## Semantics

Returns:

```text
true
```

only when:

```text
Membership exists

+

status = ACTIVE
```

This does not mean the Profile is authorized for every Organization operation.

---

# List Memberships For Organization

## Description

Returns Memberships belonging to an Organization.

---

## Input

```text
organizationId
```

Possible approved filters:

```text
status?

pagination?
```

---

## Output

```text
MembershipDto[]
```

or a paginated equivalent when required.

---

## Authorization

Production usage requires Organization member-management authorization.

Until Permissions exists, this operation may remain internal or limited to explicitly approved bootstrap contexts.

---

# List Active Memberships For Organization

## Description

Returns only:

```text
status = ACTIVE
```

Memberships for an Organization.

---

## Input

```text
organizationId
```

---

## Output

```text
MembershipDto[]
```

---

# List Memberships For Profile

## Description

Returns Membership relationships for a Profile.

This is useful for tenant selection and account context.

---

## Input

Typically:

```text
profileId
```

For self-service application flows the Profile should normally be resolved from authenticated identity rather than accepted blindly from the client.

---

## Output

```text
MembershipDto[]
```

---

# List Active Memberships For Profile

## Description

Returns only active tenant relationships for a Profile.

This capability supports:

```text
listUserOrganizations
```

and active Organization selection.

---

## Output

```text
MembershipDto[]
```

---

# Create Membership

## Description

Creates a new durable OrganizationMembership.

This is a restricted internal capability.

It must only be used through an approved workflow.

---

## Valid Initial Sources

```text
Organization onboarding

Invitation acceptance
```

Potential future source:

```text
Administrative provisioning
```

only after explicitly approved authorization.

---

## Input

Conceptual internal contract:

```ts
type CreateMembershipInput = {
  organizationId: string
  profileId: string
  roleId: string
}
```

Initial created state:

```text
ACTIVE
```

---

## Preconditions

Required:

```text
Organization exists

Organization.status = ACTIVE

Profile exists

Role exists

Role != OWNER for normal creation

No Membership already exists for Organization + Profile

Workflow is approved
```

---

## Output

```text
MembershipDto
```

---

## Restrictions

Do not expose unrestricted:

```text
createMembership(
  arbitraryOrganization,
  arbitraryProfile,
  arbitraryRole
)
```

to client callers.

---

# Create Initial OWNER Membership

## Description

Creates the first OWNER Membership during complete Organization onboarding.

This is a cross-module tenancy operation, exclusively implemented by M-084.

Normal Membership creation, invitation, and Role-change flows must reject OWNER.
OWNER promotion or transfer is exclusively implemented by M-088. Controlled
internal test fixtures may insert OWNER only through a dedicated internal test
path; that exception is not an application capability.

---

## Dependencies

```text
Identity

Organizations

Roles

Memberships
```

---

## Required Flow

```text
Authenticated Profile
        ↓
Roles.resolveRequiredRole("OWNER")
        ↓
BEGIN
        ↓
Organizations.create Organization
        ↓
Memberships.create OWNER Membership
        ↓
COMMIT
```

---

## Atomicity

The Organization and initial OWNER Membership must either both persist or neither persist.

---

# Suspend Membership

## Description

Transitions:

```text
ACTIVE
→
SUSPENDED
```

---

## Input

```ts
type SuspendMembershipInput = {
  membershipId: string
}
```

Optional future administrative reason may be added only through an approved reusable design.

---

## Authorization

Production operation requires canonical member-management authorization.

---

## Preconditions

```text
Membership exists

status = ACTIVE

OWNER invariant remains valid
```

---

## Result

```text
status = SUSPENDED

suspendedAt = now()

removedAt = null
```

---

## OWNER Protection

If the Membership is the active OWNER:

```text
OWNER_TRANSFER_REQUIRED
```

unless the broader ownership invariant is preserved through an approved atomic workflow.

---

# Restore Membership

## Description

Restores a suspended Membership.

Transition:

```text
SUSPENDED
→
ACTIVE
```

---

## Input

```text
membershipId
```

---

## Preconditions

```text
Membership exists

status = SUSPENDED

Organization.status = ACTIVE

Existing roleId remains assigned and its Role remains valid

authorization succeeds
```

---

## Result

```text
status = ACTIVE

suspendedAt = null

removedAt = null
```

---

# Remove Membership

## Description

Ends normal tenant participation while preserving the Membership record.

---

## Transition

```text
ACTIVE
→
REMOVED
```

or, where approved:

```text
SUSPENDED
→
REMOVED
```

---

## Input

```text
membershipId
```

---

## Result

```text
status = REMOVED

removedAt = now()

suspendedAt = null
```

---

## OWNER Protection

The sole active OWNER cannot be removed through the normal Membership removal operation.

Ownership transfer must occur first.

---

# Restore Removed Membership

## Description

Restores a durable REMOVED Membership through an approved rejoin workflow.

---

## Input

Conceptually:

```ts
type RestoreRemovedMembershipInput = {
  membershipId: string
  targetRoleId: string
}
```

`targetRoleId` is required explicitly. The restore flow must not reuse the
previous Role implicitly.

---

## Preconditions

```text
status = REMOVED

Organization.status = ACTIVE

targetRoleId resolves to a valid non-OWNER Role

rejoin policy satisfied

authorization satisfied
```

---

## Result

```text
status = ACTIVE

roleId = explicit target Role

removedAt = null

suspendedAt = null
```

---

# Change Membership Role

## Description

Updates:

```text
OrganizationMembership.roleId
```

---

## Input

```ts
type ChangeMembershipRoleInput = {
  membershipId: string
  roleId: string
}
```

---

## Dependencies

```text
Memberships
→ persists roleId

Roles
→ resolves target Role

Permissions
→ authorizes operation
```

---

## Preconditions

```text
Membership exists

Target Role exists

Membership state permits change

OWNER safety preserved

Actor authorized
```

---

## OWNER Rule

Normal Role change must not perform:

```text
OWNER
→ another Role
```

or:

```text
another Role
→ OWNER
```

if that operation bypasses the dedicated ownership transfer workflow.

Normal Role change must reject an OWNER target Role. OWNER promotion or transfer
is exclusively handled by M-088.

---

# Transfer Ownership Integration

Ownership transfer is a cross-module operation.

Memberships supplies the Membership mutations.

---

## Input

Conceptually:

```ts
type TransferOwnershipMembershipInput = {
  organizationId: string
  currentOwnerMembershipId: string
  targetMembershipId: string
  previousOwnerRoleId: string
}
```

The broader Organization API may expose a simpler public contract.

---

## Required Behavior

```text
Target Membership → OWNER

Previous Owner → approved non-owner Role
```

atomically.

---

## Dependencies

```text
Organizations

Roles

Memberships
```

Permissions may additionally be required for production authorization.

---

# Create Invitation

## Description

Creates a secure Organization invitation.

---

## Input

```ts
type CreateInvitationInput = {
  organizationId: string
  recipientEmail: string
  roleId: string
}
```

The actor is resolved from authenticated tenant context.

Do not accept:

```text
invitedByMembershipId
```

blindly from the client as authoritative actor identity.

---

## Preconditions

```text
Organization exists

Organization.status = ACTIVE

Actor has ACTIVE Membership

Actor authorized

Recipient email valid

Target Role valid

Target Role assignable

Target Role != OWNER for normal invitation

No conflicting Membership state

No usable duplicate PENDING invitation
```

---

## Output

Trusted internal result may include:

```text
InvitationDto

+

Raw invitation token
```

The raw token must only be delivered to the trusted notification layer.

---

# Invitation Token Generation

`createInvitation()` must:

```text
crypto.randomBytes(32)

base64url transport encoding

SHA-256 lowercase hexadecimal hash

persist only that hash as tokenHash
```

Normal application DTOs must never expose `tokenHash`.
The raw token is returned once only to the trusted server-side consumer.

---

# Existing PENDING Invitation

If a non-expired PENDING invitation already exists for:

```text
organizationId
+
normalizedEmail
```

expected error:

```text
INVITATION_ALREADY_PENDING
```

---

# Expired PENDING Invitation During Creation

If the existing persisted PENDING invitation is expired:

```text
mark EXPIRED

then create new invitation
```

within a safe transaction where needed.

---

# OWNER Invitation

Normal:

```text
createInvitation(... OWNER ...)
```

must be rejected.

Expected error:

```text
OWNER_TRANSFER_REQUIRED
```

or an equivalent protected-role error.

---

# Get Invitation

## Description

Returns administrative invitation information by UUID.

---

## Input

```text
invitationId
```

---

## Output

```text
InvitationDto
```

---

## Authorization

Production administrative access requires Organization authorization.

Invitation secrets are never included.

---

# List Invitations For Organization

## Description

Returns invitation records for an Organization.

---

## Input

```text
organizationId
```

Possible filters:

```text
status?

pagination?
```

---

## Output

```text
InvitationDto[]
```

---

## Security

Do not expose:

```text
tokenHash

raw token
```

---

# Get Invitation By Token

## Description

Internal server-only capability used by invitation acceptance.

The external caller provides:

```text
raw token
```

Memberships converts it to a hash.

---

## Input

```text
rawToken
```

---

## Internal Flow

```text
rawToken
        ↓
Hash
        ↓
Repository.findByTokenHash()
```

---

## Output

Internal Invitation application object.

This should not become a general public invitation lookup API.

---

# Accept Invitation

## Description

Accepts a PENDING invitation and creates or restores the corresponding Membership.

This is a security-critical transactional capability.

---

## Input

Conceptually:

```ts
type AcceptInvitationInput = {
  token: string
}
```

Authenticated identity is resolved server side.

---

## Preconditions

```text
Token valid

Invitation exists

status = PENDING

expiresAt > now

Authenticated Profile exists

Authenticated identity matches recipient email

Organization.status = ACTIVE

Invitation Role exists

Membership relationship does not conflict with acceptance
```

---

## Output

Conceptual result:

```ts
type AcceptInvitationResult = {
  membership: MembershipDto
  invitation: InvitationDto
}
```

---

# Accept Invitation — No Existing Membership

Expected transaction:

```text
BEGIN

Create ACTIVE Membership
with invitation.roleId

Mark Invitation ACCEPTED

Set acceptedByProfileId

Set acceptedAt

COMMIT
```

---

# Accept Invitation — ACTIVE Membership

Expected:

```text
ALREADY_MEMBER
```

Do not:

```text
create duplicate Membership

change current Role silently
```

---

# Accept Invitation — SUSPENDED Membership

Expected:

```text
MEMBERSHIP_SUSPENDED
```

or an approved equivalent.

Invitation acceptance must not bypass suspension.

---

# Accept Invitation — REMOVED Membership

If approved rejoin behavior applies:

```text
BEGIN

Restore existing Membership

Assign invitation.roleId

Mark Invitation ACCEPTED

COMMIT
```

The original Membership record is reused.

---

# Accept Invitation — Recipient Mismatch

If authenticated identity does not match the invitation:

```text
INVITATION_RECIPIENT_MISMATCH
```

No Membership mutation occurs.

---

# Accept Invitation — Expired

If:

```text
expiresAt <= now
```

acceptance fails even if persisted status is still:

```text
PENDING
```

Expected:

```text
INVITATION_EXPIRED
```

The implementation may also transition the record to EXPIRED.

---

# Accept Invitation Concurrency

The API must guarantee:

```text
one invitation
→ at most one successful acceptance
```

Persistence must protect against concurrent acceptance.

Application pre-checks alone are not sufficient.

---

# Revoke Invitation

## Description

Transitions:

```text
PENDING
→
REVOKED
```

---

## Input

```text
invitationId
```

---

## Preconditions

```text
Invitation exists

status = PENDING

actor authorized
```

---

## Result

```text
status = REVOKED

revokedAt = now()
```

No Membership mutation occurs.

---

# Resend Invitation

## Description

Reissues delivery for an existing valid invitation.

The implemented behavior rotates the invitation token for a valid PENDING
invitation.

---

## Input

```text
invitationId
```

---

## Preconditions

```text
Invitation exists

status = PENDING

actor authorized
```

If already expired:

```text
use reinvitation flow
```

rather than blindly resending an invalid token.

---

## Result

Trusted internal result may contain:

```text
InvitationDto

+

new raw token
```

---

## Required Behavior

```text
Generate new raw token

Hash new token

Replace tokenHash

Preserve expiresAt

Persist

Deliver new invitation
```

Old token becomes invalid.

If the invitation is already `EXPIRED` or `expiresAt <= now`, the service uses
the reinvitation path and returns a new invitation with a fresh 72-hour
lifetime instead of rotating the stale row.

---

# Expire Invitation

## Description

Transitions an expired PENDING invitation to:

```text
EXPIRED
```

---

## Input

```text
invitationId
```

or internal expiration workflow.

---

## Preconditions

```text
status = PENDING

expiresAt <= now
```

---

## Result

```text
status = EXPIRED
```

No Membership mutation occurs.

---

# Invitation Terminal States

Initial terminal states:

```text
ACCEPTED

REVOKED

EXPIRED
```

Do not expose APIs that reset these records to:

```text
PENDING
```

A new invitation record is created for reinvitation.

---

# Invitation Normalization

Create and accept flows must use the same email normalization contract.

Initial policy:

```text
trim

lowercase
```

Exact normalization must remain compatible with Identity.

---

# Invitation Recipient Identity

The acceptance workflow must resolve recipient identity from the authenticated session.

Do not accept:

```text
profileId
```

or:

```text
email
```

from the client as sufficient proof of recipient identity.

---

# Organization Listing Integration

Memberships enables:

```text
listUserOrganizations
```

Conceptual cross-module flow:

```text
Authenticated Profile
        ↓
Memberships.listActiveMembershipsForProfile()
        ↓
Organizations resolves Organization data
        ↓
Return accessible Organization list
```

Memberships remains the source of truth for belonging.

---

# Active Organization Switching

Memberships participates in:

```text
switchActiveOrganization
```

by validating:

```text
Authenticated Profile
+
ACTIVE Membership in target Organization
```

Memberships does not necessarily own active-context persistence.

---

# Bootstrap Authorization Boundary

Permissions is not yet implemented.

Memberships Foundation may support workflow-specific security invariants required for bootstrap.

Examples:

```text
Initial OWNER creation

Authenticated recipient accepting own invitation
```

It must not create a general temporary authorization engine.

---

# Administrative Operations Blocked Until Authorization

The following production-facing operations require approved authorization:

```text
list Organization Memberships

create Invitation

revoke Invitation

resend Invitation

suspend Membership

restore Membership

remove Membership

change Membership Role
```

Persistence/services may be implemented internally before public exposure.

---

# No Numeric Role Authorization

Memberships API must not authorize actions through:

```text
sortOrder

OWNER > ADMIN > MANAGER
```

Role ordering is not Permission evaluation.

---

# No Permission Flags

Do not add Membership API inputs or DTO fields such as:

```text
canManageMembers

canInvite

canRemove

permissionsJson
```

Permissions owns authorization capabilities.

---

# Validation Rules

Membership operations may validate:

```text
UUIDs

Membership existence

Membership status

Organization relation

Profile relation

Role existence

OWNER safety

input data
```

Invitation operations may additionally validate:

```text
email

token

invitation status

expiration

recipient identity
```

---

# Input Validation

Preferred flow:

```text
Input

↓

Zod

↓

Server Action / Route Handler

↓

Memberships Service
```

Prisma errors are not the primary validation mechanism.

---

# Stable Errors

Recommended Membership errors:

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

Recommended:

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

---

# Generic Platform Errors

May include:

```text
UNAUTHENTICATED

PERMISSION_DENIED

VALIDATION_ERROR

RESOURCE_CONFLICT

PERSISTENCE_ERROR
```

---

# Error Security

Invitation token operations should avoid leaking unnecessary distinctions to unauthenticated callers.

Externally visible errors may intentionally be less specific than internal diagnostics.

Do not expose:

```text
whether arbitrary email has an account

whether arbitrary person belongs to Organization

token hash state

database details
```

---

# Repository Boundary

Recommended architecture:

```text
Consumer
   ↓
Memberships Service
   ↓
Membership Repository / Invitation Repository
   ↓
Prisma
```

---

# Membership Repository

Memberships adopts the Membership Repository and Invitation Repository under
ADR-007. ADR-007 makes repositories optional globally; Memberships requires
them because it has complex queries, secret `tokenHash` projections, and
transactional operations.

Services own transaction boundaries. Repositories receive either the Prisma
Client or the transaction client supplied by the Service.

Possible initial operations:

```text
findById

findByOrganizationAndProfile

findActiveByOrganizationAndProfile

listByOrganization

listByProfile

create

updateStatus

updateRole
```

Only required operations should be implemented.

---

# Invitation Repository

Possible initial operations:

```text
findById

findByTokenHash

findPendingByOrganizationAndEmail

listByOrganization

create

updateStatus

rotateToken
```

Persistence details remain hidden from API consumers.

---

# Service Boundary

Memberships services own lifecycle rules.
They own transactions and call the Membership or Invitation Repository; services
must not use direct Prisma access for Memberships persistence.

Examples:

```text
suspendMembership

restoreMembership

removeMembership

changeMembershipRole

createInvitation

acceptInvitation

revokeInvitation
```

Services may coordinate Roles and Organizations through their approved interfaces.

---

# Server Actions

Server Actions may expose authenticated application workflows.

They may:

```text
resolve authentication

validate input

call Membership services

revalidate UI

redirect
```

They must not:

```text
access Prisma directly

contain Membership lifecycle rules

trust client-supplied actor identity

implement temporary permission logic
```

---

# Route Handlers

Use Route Handlers only when a stable HTTP boundary is required.

Examples:

```text
external integration

public invitation callback if architecture requires one

external administrative API
```

Internal Platform Core usage should prefer direct server-side application interfaces.

---

# Invitation Acceptance Route

If invitation acceptance uses a web route:

```text
Request with raw token
        ↓
Server-side Memberships service
        ↓
Authentication
        ↓
Identity match
        ↓
Transactional acceptance
```

The route remains a transport adapter.

---

# Transaction Requirements

Required transactional operations include:

```text
Organization creation
+
Initial OWNER Membership
```

```text
Invitation acceptance
+
Membership create/restore
+
Invitation ACCEPTED
```

```text
Ownership transfer
+
Target Role update
+
Previous Owner Role update
```

---

# External Side Effects

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

Notification / Email / Webhook
```

External email delivery must not occur inside the database transaction.

---

# Invitation Delivery Failure

If Invitation persistence succeeds but email delivery fails:

```text
Invitation remains PENDING
```

The system may later resend it.

Do not roll back committed Memberships data because an external email provider failed.

---

# Audit

Memberships may request audit recording for:

```text
Membership created

Membership suspended

Membership restored

Membership removed

Membership Role changed

Invitation created

Invitation accepted

Invitation revoked

Invitation expired
```

Audit persistence belongs to Audit.

---

# Events

Memberships owns entity events:

```text
membership.created

membership.suspended

membership.restored

membership.removed

membership.role_changed

invitation.created

invitation.accepted

invitation.revoked

invitation.expired
```

Organization ownership transfer may also trigger:

```text
organization.ownership_transferred
```

owned by Organizations.

---

# Notifications

Memberships owns:

```text
Invitation created

Invitation resend requested
```

Notifications owns:

```text
email delivery

provider integration

delivery retries
```

Do not embed provider-specific fields into Memberships API contracts.

---

# RLS Integration

Memberships is the canonical tenant relationship for Membership-based RLS.

Conceptually:

```text
auth.uid()
        ↓
Profile
        ↓
OrganizationMembership
        ↓
organizationId
```

with:

```text
Membership status = ACTIVE
```

Foundation / Phase 11 creates no tenant RLS policies. First audit effective
database grants. If `anon` or `authenticated` can access these tables, enable
RLS with deny-by-default and add no permissive policies. M-087 later introduces
Memberships-based tenant policies.

---

# RLS Boundary

Memberships establishes tenant belonging.

Permissions remains responsible for fine-grained authorization.

Do not treat:

```text
ACTIVE Membership
```

as automatically granting every mutation capability.

---

# Invitation Security Boundary

Invitation token resolution should be server-only.

Normal clients must not have direct read access to:

```text
tokenHash
```

Invitation administrative reads should be Organization scoped.

---

# Performance

Membership queries should use explicit projections.

Avoid automatically loading:

```text
full Profile

all Organization data

all Role data

all Domain data
```

unless required.

---

# Pagination

Organization Memberships and Invitations may become unbounded.

Administrative list APIs should support pagination when real product scale requires it.

Do not overengineer pagination before required, but avoid designing contracts that make it impossible.

---

# Caching

Membership data is authorization-sensitive.

Caching must be conservative.

Any Membership mutation such as:

```text
suspend

remove

change Role
```

must invalidate affected authorization/tenant context immediately.

---

# Active Context Invalidation

If an active Membership becomes:

```text
SUSPENDED
```

or:

```text
REMOVED
```

the user's tenant context must no longer provide normal access.

---

# No Client Authority

Never accept client claims such as:

```text
I am OWNER

I belong to Organization X

my Membership is ACTIVE

assign me this Role
```

without server-side persistence validation.

---

# Cross-Module Consumption

## Organizations

May consume Memberships for:

```text
initial OWNER Membership

listUserOrganizations

active Organization switching

ownership transfer
```

---

## Roles

Memberships consumes Roles for:

```text
Role validation

Role lookup

OWNER resolution

Role change
```

---

## Permissions

Permissions will consume Membership + Role context for authorization.

---

## Identity

Memberships consumes authenticated Profile identity.

For invitation creation, Memberships consumes Identity's narrow,
transaction-compatible `normalized Auth email → profileId` lookup backed by
the derived `Profile.authEmailNormalized` projection. Supabase Auth remains
canonical, and neither the projection nor `tokenHash` is exposed by Memberships
DTOs.

---

## Business Domains

Domains may consume tenant Membership context.

Domains should not mutate Membership persistence directly.

---

# Initial Implementation Boundary

Memberships Foundation may implement:

```text
OrganizationMembership persistence

OrganizationInvitation persistence

Membership repository

Invitation repository

Membership lookup

Membership lifecycle services

Role assignment persistence

Invitation token mechanics

Invitation creation

Invitation acceptance

Invitation revocation

Invitation expiration

Membership uniqueness

Invitation uniqueness

OWNER safety primitives
```

---

# Blocked Production Exposure

Until Permissions has an approved implementation, production-facing administrative operations may remain blocked or explicitly scoped:

```text
Invite Member

Suspend Member

Restore Member

Remove Member

Change Member Role

List sensitive tenant Membership data
```

---

# Tenancy Integration Enabled

Once Organizations, Roles and Memberships foundations exist, the platform can implement:

```text
Complete Organization onboarding

Initial OWNER creation

Organization listing by Profile

Active Organization switching

Membership-based tenant RLS

Ownership transfer
```

---

# Explicitly Excluded APIs

Memberships must not expose or implement ownership of:

```text
createRole

deleteRole

grantPermission

revokePermission

createOrganization

changeOrganizationStatus

createProfile

authenticateUser

sendEmailDirectly
```

---

# Future API Possibilities

Possible future Memberships capabilities include:

```text
bulkInvite

bulkRemove

reassignMembers

SCIM provisioning

seat-limit validation

teams

membership metadata extensions

invitation resend policies

membership export
```

These are not part of Memberships Foundation.

---

# Definition of Ready

Memberships API is ready when:

- Membership entity ownership is explicit.
- Invitation entity ownership is explicit.
- Membership states are approved.
- Invitation states are approved.
- Organization/Profile uniqueness is approved.
- Role is required on Membership.
- Role assignment persistence belongs to Memberships.
- OWNER safety rules are explicit.
- Invitation token model is secure.
- Invitation acceptance requires matching authenticated identity.
- Rejoin behavior is defined.
- Suspension cannot be bypassed through invitations.
- Administrative authorization dependency is explicit.
- SPEC, DATA_MODEL and FLOWS agree with this API.

---

# Definition of Done

Memberships API implementation is complete when:

- Membership lookup by ID works.
- Organization/Profile Membership lookup works.
- Active Membership checks work.
- Membership listing works internally.
- Membership lifecycle services work.
- Membership Role replacement works.
- OWNER safety is enforced.
- Invitation creation works.
- Invitation tokens are secure.
- Raw tokens are not persisted.
- Invitation lookup by token hash works.
- Invitation revocation works.
- Invitation expiration is enforced.
- Invitation acceptance is atomic.
- Recipient identity is verified.
- Duplicate Memberships cannot be created.
- Duplicate effective PENDING Invitations cannot be created.
- SUSPENDED Memberships cannot bypass controls through invitations.
- REMOVED Memberships use the approved rejoin path.
- Stable errors are used.
- Repository boundaries are preserved.
- Permission logic is not duplicated.
- Prisma errors do not leak.
- Relevant tests pass.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.

Fully authorized production Membership administration additionally requires Permissions integration.

---

# Final Principle

Memberships exposes the canonical interface for tenant belonging.

Memberships owns Membership state and Invitation state.

Roles defines which Role exists.

Memberships assigns that Role.

Organizations defines the tenant.

Identity defines the Profile.

Permissions decides what the Membership may do.

The API may coordinate those capabilities, but must not absorb their ownership.
