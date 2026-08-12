---
title: Memberships Tasks
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-12
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - ../organizations/TASKS.md
  - ../organizations/API.md
  - ../roles/TASKS.md
  - ../roles/API.md
  - ../../../architecture/CORE.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../../architecture/SECURITY.md
---

# Memberships Tasks

## Purpose

This document defines the implementation tasks for the Platform Core Memberships module.

Memberships Foundation introduces and owns:

```text
OrganizationMembership

OrganizationInvitation

MembershipStatus

InvitationStatus

Membership lifecycle

Invitation lifecycle

Membership Role assignment persistence
```

Memberships connects existing Platform Core entities:

```text
Profile

Organization

Role
```

Memberships must not duplicate those entities or absorb their architectural responsibilities.

---

# Implementation Strategy

```text
Memberships Foundation
= Phases 1–14 / M-xxx internal work

↓

Stage 2
Tenancy Integration

↓

Stage 3
Permissions Integration
```

## Glossary

- **Memberships Foundation:** Phases 1–14 and internal `M-xxx` work that establish Memberships persistence, services and security boundaries.
- **Stage 2:** cross-module Tenancy Integration, available only after Memberships Foundation.
- **Stage 3:** Permissions Integration for production-facing administrative authorization.

Memberships Foundation may be implemented before the full Permissions module exists.

Production-facing administrative Membership management must not be exposed without approved authorization.

---

# Architectural Ownership

Memberships owns:

```text
OrganizationMembership

OrganizationInvitation

MembershipStatus

InvitationStatus

Membership Role assignment persistence

Membership lifecycle

Invitation lifecycle
```

Memberships does not own:

```text
Profile

Organization

Role

Permission

Authentication

Organization lifecycle

Organization ownership definition

Audit persistence

Notification delivery
```

---

# Prerequisites

Memberships Foundation requires real persistence for:

```text
Profile

Organization

Role
```

Before implementation begins, confirm:

```text
Identity / Profile exists

Organizations Foundation exists

Roles Foundation exists

Canonical Roles are seeded

UUID strategy is stable
```

If these dependencies are not implemented:

```text
STOP

Do not create placeholder models

Do not create temporary string references
```

---

# Phase 1 — Prisma Persistence Foundation

## M-001

### Add MembershipStatus

Add:

```prisma
enum MembershipStatus {
  ACTIVE
  SUSPENDED
  REMOVED

  @@map("membership_status")
}
```

### Acceptance Criteria

- Enum contains only Membership lifecycle states.
- Invitation states are not included.
- No Role enum is introduced.
- Prisma format passes.
- Prisma validate passes.

---

## M-002

### Add InvitationStatus

Add:

```prisma
enum InvitationStatus {
  PENDING
  ACCEPTED
  REVOKED
  EXPIRED

  @@map("invitation_status")
}
```

### Acceptance Criteria

- Enum matches Memberships documentation.
- Membership lifecycle states are not duplicated here.
- Prisma format passes.
- Prisma validate passes.

---

## M-003

### Add OrganizationMembership Model

Implement the Memberships-owned model.

Required fields:

```text
id

organizationId

profileId

roleId

status

suspendedAt

removedAt

createdAt

updatedAt
```

Required relations:

```text
organizationId
→ Organization.id

profileId
→ Profile.id

roleId
→ Role.id
```

### Required Constraint

```text
UNIQUE (
  organizationId,
  profileId
)
```

### Acceptance Criteria

- UUID strategy is preserved.
- organizationId is required.
- profileId is required.
- roleId is required.
- Role is represented through foreign key.
- No free-form Role is stored.
- No Profile global Role is introduced.
- No Organization owner column is introduced.
- Delete relations use conservative behavior.
- Membership table maps to `organization_memberships`.

---

## M-004

### Add OrganizationMembership Indexes

Add indexes required by approved queries.

Initial recommended indexes:

```text
organizationId + status

profileId + status

roleId
```

### Acceptance Criteria

Indexes correspond to real Membership query patterns.

No speculative indexing is introduced.

---

## M-005

### Add OrganizationInvitation Model

Implement:

```text
OrganizationInvitation
```

Required fields:

```text
id

organizationId

recipientEmail

normalizedEmail

roleId

status

tokenHash

expiresAt

invitedByMembershipId

acceptedByProfileId

acceptedAt

revokedAt

createdAt

updatedAt
```

Required relations:

```text
Organization

Role

Inviter OrganizationMembership

Optional accepted Profile
```

### Acceptance Criteria

- UUID strategy is preserved.
- tokenHash is required.
- tokenHash is unique.
- Raw token is not persisted.
- expiresAt is required.
- acceptedByProfileId is nullable.
- invitedByMembershipId is required.
- No provider-specific notification fields are introduced.
- No generic metadata JSON is introduced.

---

## M-006

### Add Prisma Inverse Relations

Add only the inverse relations physically required by Prisma.

Possible additions:

```text
Organization
→ memberships
→ invitations

Profile
→ memberships
→ acceptedInvitations

Role
→ memberships
→ invitations

OrganizationMembership
→ invitationsSent
```

### Acceptance Criteria

Inverse fields do not change architectural ownership.

No unrelated behavior is added to Profile, Organization or Role modules.

---

## M-007

### Add Invitation Indexes

Required:

```text
UNIQUE(tokenHash)
```

Recommended:

```text
organizationId + status

status + expiresAt
```

### Acceptance Criteria

Indexes match documented query patterns.

No unnecessary broad email index is introduced unless required.

---

## M-008

### Add Pending Invitation Unique Constraint

Enforce:

```text
at most one PENDING invitation
per Organization + normalizedEmail
```

Preferred PostgreSQL semantic:

```sql
CREATE UNIQUE INDEX
  "organization_invitations_pending_email_unique"
ON
  "organization_invitations"
  ("organization_id", "normalized_email")
WHERE
  "status" = 'PENDING';
```

### Implementation Rule

Implement the partial unique index exclusively through deliberate migration SQL:

```sql
CREATE UNIQUE INDEX
  "organization_invitations_pending_email_unique"
ON
  "organization_invitations"
  ("organization_id", "normalized_email")
WHERE
  "status" = 'PENDING';
```

Do not represent this invariant through Prisma schema/index declarations.
Do not enable a Prisma preview feature merely to implement this constraint.

### Acceptance Criteria

- Concurrent duplicate pending invitations are database-protected.
- Historical ACCEPTED/REVOKED/EXPIRED invitations remain possible.
- Constraint is documented and covered by tests.

---

## M-009

### Generate Memberships Migration

Recommended migration name:

```text
add_platform_memberships
```

Expected scope:

```text
MembershipStatus

InvitationStatus

organization_memberships

organization_invitations

foreign keys

unique constraints

indexes

partial pending-invitation uniqueness
```

### Acceptance Criteria

Generated migration does not introduce:

```text
User

MembershipRole

Permission

RolePermission

ownerId

Profile.roleId

Organization.roleId

custom Roles

Domain-specific fields
```

---

## M-010

### Review Memberships Migration SQL

Inspect the migration before application.

Verify:

```text
UUID columns

enum values

required nullability

foreign keys

Restrict behavior

Organization/Profile uniqueness

tokenHash uniqueness

pending Invitation uniqueness

indexes

timestamps
```

Also verify no destructive unrelated schema changes.

---

## M-011

### Validate Prisma

Run:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

Then:

```bash
npm run typecheck
npm run lint
```

### Acceptance Criteria

All required checks pass.

Generated Prisma files are not manually edited.

---

# Phase 2 — Membership Repository Foundation

## Repository Decision

ADR-007 keeps repositories optional globally. Memberships explicitly adopts them because it requires complex queries, secret projections such as `tokenHash`, and transactional operations.

```text
Consumer
    ↓
Memberships Service
    ↓
Membership Repository / Invitation Repository
    ↓
Prisma
```

Services own transaction boundaries. Repositories receive a Prisma Client or Transaction Client and contain capability-specific persistence access; services do not use Prisma directly for Memberships persistence.

## M-012

### Create Membership Repository

Create:

```text
src/core/modules/memberships/repositories/membership-repository.ts
```

Initial persistence operations may include:

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

Only implement operations required by approved services.

### Acceptance Criteria

Repository:

- is the Membership persistence boundary;
- accesses Prisma directly;
- receives a Prisma Client or Transaction Client;
- contains no final Permission evaluation;
- contains no HTTP behavior;
- contains no UI logic;
- contains no Role-definition logic.

---

## M-013

### Implement Membership Lookup By ID

Implement:

```text
findById
```

### Acceptance Criteria

- UUID handled correctly.
- Missing Membership handled predictably.
- Query uses deliberate projection.
- No unnecessary Domain data loaded.

---

## M-014

### Implement Organization/Profile Membership Lookup

Implement:

```text
findByOrganizationAndProfile
```

### Acceptance Criteria

Uses the canonical durable relationship:

```text
organizationId
+
profileId
```

and relies on database uniqueness.

---

## M-015

### Implement Active Membership Lookup

Implement the persistence support required for:

```text
hasActiveMembership
```

### Acceptance Criteria

Only:

```text
status = ACTIVE
```

counts as normal tenant belonging.

SUSPENDED and REMOVED do not.

---

## M-016

### Implement Organization Membership Listing

Implement required repository support for:

```text
listByOrganization

list active by Organization
```

### Acceptance Criteria

Supports approved status filtering.

Pagination is introduced only if required by the application contract.

---

## M-017

### Implement Profile Membership Listing

Implement repository support for:

```text
listByProfile

list active by Profile
```

### Acceptance Criteria

Supports future:

```text
listUserOrganizations

Organization selection
```

Memberships remains the source of truth for belonging.

---

# Phase 3 — Invitation Repository Foundation

## M-018

### Create Invitation Repository

Create:

```text
src/core/modules/memberships/repositories/invitation-repository.ts
```

Possible operations:

```text
findById

findByTokenHash

findPendingByOrganizationAndEmail

listByOrganization

create

updateStatus

rotateToken
```

### Acceptance Criteria

Repository:

- accesses Prisma;
- receives a Prisma Client or Transaction Client;
- does not send email;
- does not authenticate users;
- does not expose tokenHash through normal DTOs;
- does not implement Permission logic.

---

## M-019

### Implement Invitation Lookup By Token Hash

Implement:

```text
findByTokenHash
```

### Acceptance Criteria

- Lookup uses unique tokenHash.
- Raw tokens are never queried against persistence.
- Method is server-internal.
- Security-sensitive projection is explicit.

---

## M-020

### Implement Pending Invitation Lookup

Implement:

```text
findPendingByOrganizationAndEmail
```

using:

```text
organizationId
+
normalizedEmail
+
status = PENDING
```

### Acceptance Criteria

Supports duplicate prevention and reinvitation logic.

---

## M-021

### Implement Organization Invitation Listing

Implement repository support for administrative Organization invitation listing.

### Acceptance Criteria

Normal projection excludes:

```text
tokenHash
```

and any secret material.

---

# Phase 4 — Application Contracts and Validation

## M-022

### Create Membership DTOs

Create stable Membership application contracts where needed.

Possible:

```text
MembershipDto

MembershipWithRoleDto
```

### Acceptance Criteria

DTOs expose only required application data.

Raw Prisma models are not treated automatically as public contracts.

---

## M-023

### Create Invitation DTOs

Create:

```text
InvitationDto
```

Normal DTO must not include:

```text
tokenHash
```

A separate trusted internal result may transiently contain:

```text
rawToken
```

only during invitation delivery workflows.

---

## M-024

### Create Membership Validation Schemas

Possible schemas:

```text
membershipIdSchema

organizationProfileMembershipSchema

changeMembershipRoleSchema

restoreRemovedMembershipSchema
```

### Acceptance Criteria

Validation covers input shape.

Validation does not become authorization.

---

## M-025

### Create Invitation Validation Schemas

Possible:

```text
createInvitationSchema

invitationIdSchema

acceptInvitationSchema
```

Validate:

```text
organizationId

recipientEmail

roleId

token
```

as appropriate.

### Acceptance Criteria

Actor identity is not accepted blindly from the client.

---

## M-026

### Create Email Normalization Helper

Create or reuse the canonical approved email normalization behavior.

Initial semantics:

```text
trim

lowercase
```

### Acceptance Criteria

The same normalization is used by:

```text
invitation creation

invitation lookup

invitation acceptance
```

Do not create competing normalization behavior if Identity already provides a canonical helper.

---

## M-027

### Create Stable Membership Errors

Recommended initial errors:

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

### Acceptance Criteria

Errors represent Memberships responsibilities only.

---

## M-028

### Create Stable Invitation Errors

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

### Acceptance Criteria

Raw persistence/security details are not leaked.

---

# Phase 5 — Membership Read Services

## M-029

### Implement Get Membership

Implement:

```text
getMembership
```

### Acceptance Criteria

- Calls repository.
- Does not access Prisma directly.
- Returns stable application result.
- Production exposure remains tenant-authorized.

---

## M-030

### Implement Get Membership For Profile

Implement:

```text
getMembershipForProfile
```

### Acceptance Criteria

Uses canonical Organization/Profile pair.

---

## M-031

### Implement Has Active Membership

Implement:

```text
hasActiveMembership
```

### Acceptance Criteria

Returns true only for:

```text
ACTIVE
```

Membership.

Does not imply complete Permission authorization.

---

## M-032

### Implement Membership Listing Services

Implement internal services required for:

```text
listMembershipsForOrganization

listActiveMembershipsForOrganization

listMembershipsForProfile

listActiveMembershipsForProfile
```

### Acceptance Criteria

Authorization-sensitive production exposure remains explicit.

---

# Phase 6 — Membership Lifecycle Services

## M-033

### Implement Membership Creation Primitive

Implement a restricted internal Membership creation service or service primitive.

Required input:

```text
organizationId

profileId

roleId
```

Initial state:

```text
ACTIVE
```

### Acceptance Criteria

- Organization exists.
- Organization.status is ACTIVE.
- Profile exists.
- Role exists.
- roleId is valid.
- Normal creation rejects the OWNER Role; the first OWNER is created only by M-084 and controlled test fixtures may insert OWNER through an internal-only path.
- Duplicate Organization/Profile relation fails predictably.
- This is not exposed as unrestricted public Membership creation.

---

## M-034

### Implement Suspend Membership

Implement:

```text
ACTIVE
→ SUSPENDED
```

Required persisted result:

```text
status = SUSPENDED

suspendedAt = now()

removedAt = null
```

### Acceptance Criteria

- Current state validated.
- OWNER safety checked.
- SUSPENDED and REMOVED invalid sources are handled.
- No Role assignment is removed.
- Authorization remains separate.

---

## M-035

### Implement Restore Suspended Membership

Implement:

```text
SUSPENDED
→ ACTIVE
```

Required result:

```text
status = ACTIVE

suspendedAt = null

removedAt = null
```

### Acceptance Criteria

- Organization.status is ACTIVE.
- Existing roleId still resolves and remains valid; no new Role is assigned.
- Invalid transition fails safely.

---

## M-036

### Implement Remove Membership

Implement:

```text
ACTIVE
→ REMOVED
```

and, if approved:

```text
SUSPENDED
→ REMOVED
```

Required result:

```text
status = REMOVED

suspendedAt = null

removedAt = now()
```

### Acceptance Criteria

- Durable Membership row is preserved.
- OWNER safety checked.
- Hard delete is not used.

---

## M-037

### Implement Restore Removed Membership

Implement explicit:

```text
REMOVED
→ ACTIVE
```

workflow.

### Acceptance Criteria

- Existing durable Membership reused.
- Organization.status is ACTIVE.
- An explicit targetRoleId is required and validated.
- The existing Role is not reused implicitly.
- removedAt cleared.
- No duplicate Membership created.

---

## M-038

### Implement Membership Role Change

Implement persistence mutation:

```text
OrganizationMembership.roleId
```

### Acceptance Criteria

- Target Role resolved through Roles.
- Target Membership exists.
- Normal Role changes reject OWNER as either source or target; OWNER promotion or transfer belongs only to M-088.
- OWNER safety checked.
- Generic Role mutation cannot bypass ownership transfer.
- Permissions are not simulated with Role ordering.

---

# Phase 7 — Invitation Security Foundation

## M-039

### Implement Secure Invitation Token Generation

Generate the raw token with `crypto.randomBytes(32)` and encode it for transport using base64url.

### Acceptance Criteria

- Transport encoding is base64url.
- Token is unpredictable.
- Token is never derived from invitation UUID/email.
- Raw token is returned once only to a trusted server-side consumer.

---

## M-040

### Implement Invitation Token Hashing

Persist only SHA-256 of the raw token, encoded as lowercase hexadecimal, in:

```text
tokenHash
```

### Acceptance Criteria

- Raw token is not stored.
- Hashing uses SHA-256 lowercase hexadecimal consistently during persistence and lookup.
- Same transformation is used during lookup.
- Secrets do not appear in logs.

---

## M-041

### Verify Token Secret Handling

Audit the implementation for raw token exposure.

### Acceptance Criteria

Raw invitation tokens are not persisted in:

```text
database

logs

analytics

audit payloads

normal DTOs
```

---

# Phase 8 — Invitation Lifecycle Services

## M-042

### Implement Create Invitation

Implement:

```text
createInvitation
```

Input:

```text
organizationId

recipientEmail

roleId
```

Actor Membership must be resolved server side.

### Required Flow

```text
Resolve actor identity

Resolve actor ACTIVE Membership

Normalize email

Resolve Role

Reject OWNER in normal invitation flow

Require Organization.status = ACTIVE

Check Membership conflict

Check existing PENDING invitation

Expire stale PENDING invitation if needed

Generate token

Hash token

Persist PENDING invitation

Commit

Return transient token to trusted delivery workflow
```

### Acceptance Criteria

- invitedByMembershipId is server resolved.
- Raw token is returned once only to a trusted server-side delivery consumer.
- tokenHash is the SHA-256 lowercase hexadecimal value.
- duplicate effective PENDING invitation prevented.
- external email is not sent inside DB transaction.

---

## M-043

### Implement Duplicate Invitation Handling

If a current usable PENDING invitation exists:

```text
INVITATION_ALREADY_PENDING
```

If it is expired:

```text
PENDING
→ EXPIRED
```

then allow creation of a new invitation.

### Acceptance Criteria

Behavior is deterministic under concurrency.

---

## M-044

### Implement Revoke Invitation

Implement:

```text
PENDING
→ REVOKED
```

Result:

```text
status = REVOKED

revokedAt = now()
```

### Acceptance Criteria

- Conditional expected-state mutation used.
- Accepted/expired invitations cannot be revoked through this flow.
- No Membership mutation occurs.

---

## M-045

### Implement Expire Invitation

Implement:

```text
PENDING
→ EXPIRED
```

when:

```text
expiresAt <= now
```

### Acceptance Criteria

Formal expiration is available.

Acceptance remains protected by real-time expiresAt checks even if status transition has not yet run.

---

## M-046

### Implement Resend Invitation

Implement secure resend behavior.

Recommended initial policy:

```text
rotate raw token

replace tokenHash

optionally renew expiresAt according to approved configuration

commit

send notification after commit
```

### Acceptance Criteria

- Old token becomes invalid.
- No second active tokenHash exists for same invitation.
- Accepted/revoked invitations are not resent as PENDING.
- Expired invitation follows approved reinvitation behavior.

---

# Phase 9 — Invitation Acceptance

## M-047

### Implement Invitation Token Resolution

Acceptance input:

```text
raw token
```

Flow:

```text
hash token

↓

findByTokenHash
```

### Acceptance Criteria

Raw token is never queried directly against persistence.

---

## M-048

### Implement Recipient Identity Validation

Resolve authenticated Profile and canonical identity email.

Normalize using approved rules.

Compare:

```text
authenticated normalized email

=

invitation.normalizedEmail
```

### Acceptance Criteria

Mismatch results in:

```text
INVITATION_RECIPIENT_MISMATCH
```

No Membership mutation occurs.

---

## M-049

### Implement Invitation Acceptance — New Membership

For:

```text
no existing Membership
```

perform atomically:

```text
create ACTIVE Membership

+

mark Invitation ACCEPTED

+

set acceptedByProfileId

+

set acceptedAt
```

### Acceptance Criteria

- Organization.status is ACTIVE.
- Invitation roleId is valid and is not OWNER.
- Either all changes commit or none do.

---

## M-050

### Implement Invitation Acceptance — Existing ACTIVE Membership

Expected:

```text
ALREADY_MEMBER
```

### Acceptance Criteria

Do not:

```text
create duplicate Membership

change existing Role silently

reactivate anything
```

---

## M-051

### Implement Invitation Acceptance — SUSPENDED Membership

Expected:

```text
reject normal acceptance
```

### Acceptance Criteria

Invitation cannot bypass administrative suspension.

No automatic restoration.

---

## M-052

### Implement Invitation Acceptance — REMOVED Membership

Use approved rejoin behavior:

```text
restore existing Membership

assign invitation.roleId explicitly

mark Invitation ACCEPTED
```

atomically.

### Acceptance Criteria

- Organization.status is ACTIVE.
- invitation.roleId is validated and is not OWNER.
- No second Membership row is created.

---

## M-053

### Implement Invitation Expiration Check During Acceptance

Acceptance must require:

```text
expiresAt > now
```

even if:

```text
status = PENDING
```

### Acceptance Criteria

Expired invitation cannot accept because a background expiration update has not yet run.

---

## M-054

### Implement Conditional Invitation Claim

Protect against concurrent acceptance.

The acceptance transition should conditionally require:

```text
status = PENDING

expiresAt > now
```

inside the transaction.

### Acceptance Criteria

Only one concurrent acceptance can succeed.

---

# Phase 10 — OWNER Safety Foundation

## M-055

### Implement OWNER Detection

Use Roles to determine whether a Membership holds canonical:

```text
OWNER
```

Do not hard-code OWNER UUID.

### Acceptance Criteria

OWNER semantics resolve through:

```text
Role.key = OWNER
```

---

## M-056

### Protect OWNER Suspension

Attempting normal suspension of sole active OWNER must fail with:

```text
OWNER_TRANSFER_REQUIRED
```

or approved equivalent.

---

## M-057

### Protect OWNER Removal

Attempting normal removal of sole active OWNER must fail.

Ownership transfer must happen first.

---

## M-058

### Protect OWNER Demotion

Normal Role change must not perform:

```text
OWNER
→ non-owner
```

if it violates the Organization invariant.

---

## M-059

### Protect OWNER Promotion

Normal Membership Role change or Invitation must not create a second OWNER.

OWNER promotion or transfer belongs only to M-088.
Controlled test fixtures may insert OWNER through a dedicated internal path.

---

# Phase 11 — Memberships Table Access Foundation

## M-060

### Define Canonical Active Membership Predicate

The reusable tenant relationship is conceptually:

```text
Profile
+
OrganizationMembership
+
status = ACTIVE
```

### Acceptance Criteria

This becomes the single Membership-based tenant relationship source.

Do not create alternative:

```text
organization_users

user_organizations

Profile.organizationIds
```

models.

---

## M-061

### Document Future Membership-Based RLS Integration

Define how tenant-aware RLS will resolve:

```text
auth.uid()

↓

Profile

↓

OrganizationMembership

↓

organizationId
```

### Acceptance Criteria

Design follows actual Identity mapping.

Do not assume a Profile/auth mapping that differs from the implemented Identity contract.

---

## M-062

### Audit Memberships Table Grants

Audit actual database grants on Memberships tables. This phase does not implement tenant RLS policies; M-087 is reserved for Membership-based tenant policies.

### Acceptance Criteria

- Actual grants for `anon` and `authenticated` are inspected and recorded.
- If neither role can access Memberships tables, no RLS change is required by this task.
- If either role can access a Memberships table, Foundation enables RLS in deny-by-default mode with no permissive policies.
- Access remains server-first.

---

## M-063

### Protect Invitation Secrets

Foundation access controls must prevent normal clients from reading invitation secrets.

### Acceptance Criteria

Normal clients cannot access:

```text
tokenHash
```

Token lookup is server-only.

Unrelated tenants cannot enumerate invitations.

---

# Phase 12 — Testing

## M-064

### Membership Persistence Tests

Cover:

```text
UUID generation

Organization relation

Profile relation

Role relation

roleId required

status default

timestamps

Organization/Profile uniqueness
```

---

## M-065

### Membership Lookup Tests

Cover:

```text
find by ID

find by Organization/Profile

active lookup

list by Organization

list by Profile
```

---

## M-066

### Membership Lifecycle Tests

Cover:

```text
ACTIVE → SUSPENDED

SUSPENDED → ACTIVE

ACTIVE → REMOVED

SUSPENDED → REMOVED

REMOVED → ACTIVE
```

Also test invalid transitions.

---

## M-067

### Membership Timestamp Tests

Verify lifecycle consistency:

```text
ACTIVE
→ suspendedAt null
→ removedAt null

SUSPENDED
→ suspendedAt set
→ removedAt null

REMOVED
→ removedAt set
→ suspendedAt null
```

---

## M-068

### Duplicate Membership Tests

Attempt concurrent or repeated creation using the same:

```text
organizationId

profileId
```

### Acceptance Criteria

Database uniqueness prevents duplicates.

---

## M-069

### Invitation Persistence Tests

Cover:

```text
UUID generation

Organization relation

Role relation

Inviter Membership relation

optional accepted Profile relation

status default

expiresAt

tokenHash uniqueness
```

---

## M-070

### Pending Invitation Uniqueness Tests

Verify:

```text
PENDING A
Organization X + email Y
```

blocks a second PENDING invitation for the same pair.

After A becomes:

```text
ACCEPTED

REVOKED

EXPIRED
```

a new PENDING invitation is allowed.

---

## M-071

### Invitation Token Tests

Verify:

```text
raw token not persisted

crypto.randomBytes(32) generation

base64url transport encoding

SHA-256 lowercase hexadecimal tokenHash

correct raw token resolves

incorrect token fails

tokenHash unique

resend rotates token

old token invalid after rotation
```

---

## M-072

### Invitation Lifecycle Tests

Cover:

```text
PENDING → ACCEPTED

PENDING → REVOKED

PENDING → EXPIRED
```

Reject terminal-state reversal.

---

## M-073

### Invitation Recipient Tests

Verify matching authenticated identity succeeds.

Mismatch fails.

No account-enumeration behavior is accidentally exposed.

---

## M-074

### Invitation Acceptance State Tests

Test acceptance with:

```text
no Membership

ACTIVE Membership

SUSPENDED Membership

REMOVED Membership
```

Each must follow the documented path.

---

## M-075

### Invitation Concurrency Tests

Test:

```text
simultaneous acceptance

accept vs revoke

accept vs expiration

simultaneous duplicate invitation creation
```

### Acceptance Criteria

No unauthorized duplicate tenant relationship can result.

---

## M-076

### OWNER Safety Tests

Test attempts to:

```text
suspend sole OWNER

remove sole OWNER

demote sole OWNER

assign second OWNER through normal Role change

invite recipient as OWNER

create Membership with OWNER through normal creation

change a normal Membership Role to OWNER
```

All must be rejected or routed through ownership transfer.

Controlled internal test fixtures may create OWNER only through their dedicated internal path.

---

## M-077

### Tenant Isolation Tests

Once Membership-based RLS/access integration exists, verify:

```text
ACTIVE Membership
→ valid tenant relationship

SUSPENDED
→ denied

REMOVED
→ denied

no Membership
→ denied

Membership in Organization A
→ no Organization B access
```

---

# Phase 13 — Documentation Validation

## M-078

### Validate Memberships Documentation

Review:

```text
SPEC.md

DATA_MODEL.md

FLOWS.md

API.md

PRISMA.md

TASKS.md
```

### Acceptance Criteria

Documents agree on:

```text
Membership ownership

Invitation ownership

Membership states

Invitation states

one Role per Membership

Invitation separation

OWNER safety

token security

pending invitation uniqueness

Permissions boundary
```

### Phase 13 Validation — 2026-08-12

Validated against the Prisma schema, migrations and implemented Memberships
services. The six documents agree on both persisted entities, their states,
one Role per Membership, Invitation separation, OWNER protection, SHA-256
token hashing, the partial PENDING-email uniqueness index and the deferred
Permissions boundary.

---

## M-079

### Validate Cross-Module Ownership

Confirm:

```text
Identity
→ Profile

Organizations
→ Organization

Roles
→ Role

Memberships
→ OrganizationMembership
→ OrganizationInvitation

Permissions
→ Permission
```

### Acceptance Criteria

No duplicated Core persistence exists.

### Phase 13 Validation — 2026-08-12

The shared Prisma schema confirms one `Profile`, `Organization`, `Role`,
`OrganizationMembership` and `OrganizationInvitation` persistence model under
their documented owners. Permissions retains ownership of the future
`Permission` capability but has no persistence model yet. Cross-owner inverse
relations do not transfer ownership, and no parallel Core persistence model
exists.

---

## M-080

### Validate Source Structure

Expected root:

```text
src/core/modules/memberships/
```

Possible implementation directories:

```text
repositories/

services/

schemas/

types/

security/
```

Only create what implementation actually needs.

### Acceptance Criteria

- No speculative empty directories.
- No alternate Membership module.
- No new root `src/types`.
- Structure follows architecture documentation.

### Phase 13 Validation — 2026-08-12

Confirmed one implementation root at `src/core/modules/memberships/`. Its
`repositories`, `services`, `schemas`, `types`, `security`, `errors`, `mappers`,
`tests` and `utils` directories are non-empty and have current consumers. No
alternate Memberships module or root `src/types` exists.

M-077 remains intentionally deferred until M-087 provides the approved
Membership-based tenant RLS/access integration; documentation validation does
not claim that tenant-isolation milestone.

---

# Phase 14 — Technical Quality Gate

## M-081

### Run Prisma Validation

Run:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

### Acceptance Criteria

All pass.

---

## M-082

### Run Project Validation

Run:

```bash
npm run typecheck
npm run lint
```

Run the approved automated test suite.

### Acceptance Criteria

All required validation passes.

---

## M-083

### Perform Memberships Foundation Review

Review:

```text
Prisma models

migration SQL

partial unique index

repositories

services

token security

Membership lifecycle

Invitation lifecycle

OWNER safety

concurrency

RLS boundary

tests

documentation
```

### Acceptance Criteria

No unresolved Memberships-owned defect blocks Tenancy Integration.

---

# Memberships Foundation Milestone

Memberships Foundation is complete when:

```text
MembershipStatus exists

InvitationStatus exists

OrganizationMembership exists

OrganizationInvitation exists

UUID strategy preserved

real Profile relation exists

real Organization relation exists

real Role relation exists

Organization/Profile uniqueness enforced

Membership roleId required

tokenHash unique

pending Invitation uniqueness enforced

repositories implemented

Membership lookups implemented

Membership lifecycle implemented

Role assignment persistence implemented

Invitation security implemented

Invitation lifecycle implemented

Invitation acceptance atomic

OWNER safety implemented

Memberships table grants audited and deny-by-default RLS enabled if `anon` or `authenticated` access is present

concurrency-sensitive flows tested

documentation synchronized
```

Memberships Foundation does not mean full tenant authorization is complete.

---

# Stage 2 — Tenancy Integration

The following tasks become available only after:

```text
Organizations Foundation

Roles Foundation

Memberships Foundation
```

are implemented and validated.

---

## M-084 — BLOCKED UNTIL FOUNDATIONS EXIST

### Complete Organization Onboarding

Implement atomic:

```text
Authenticated Profile
        ↓
Resolve OWNER
        ↓
BEGIN
        ↓
Create Organization
        ↓
Create ACTIVE OWNER Membership
        ↓
COMMIT
```

### Owners

```text
Organizations

Memberships

Roles
```

---

## M-085 — BLOCKED UNTIL FOUNDATIONS EXIST

### List User Organizations

Implement:

```text
Authenticated Profile
        ↓
ACTIVE Memberships
        ↓
Organizations
```

Memberships owns belonging.

Organizations owns Organization data.

---

## M-086 — BLOCKED UNTIL FOUNDATIONS EXIST

### Active Organization Switching

Validate:

```text
ACTIVE Membership
```

before switching tenant context.

Memberships does not necessarily own context persistence.

---

## M-087 — BLOCKED UNTIL FOUNDATIONS EXIST

### Membership-Based Tenant RLS

Introduce approved tenant relationship policies using the real:

```text
OrganizationMembership
```

model.

Do not create temporary membership tables.

M-087 is the first task that implements tenant policies; it is not part of Phase 11.

---

## M-088 — BLOCKED PENDING OWNERSHIP POLICY

### Ownership Transfer

Implement atomic:

```text
Target Membership → OWNER

Previous Owner → approved non-owner Role
```

### Dependencies

```text
Organizations

Roles

Memberships

approved previous-owner Role policy
```

Do not silently assume:

```text
ADMIN
```

until that policy is explicitly approved.

---

# Stage 3 — Permissions Integration

The following production-facing administrative operations require the Permissions architecture.

---

## M-089 — BLOCKED

### Authorize Member Invitation

Add canonical Permission evaluation before:

```text
createInvitation
```

Do not use Role `sortOrder` as a substitute.

---

## M-090 — BLOCKED

### Authorize Membership Suspension

Add canonical Permission evaluation before:

```text
suspendMembership
```

---

## M-091 — BLOCKED

### Authorize Membership Restoration

Add canonical Permission evaluation before:

```text
restoreMembership
```

---

## M-092 — BLOCKED

### Authorize Membership Removal

Add canonical Permission evaluation before:

```text
removeMembership
```

---

## M-093 — BLOCKED

### Authorize Membership Role Changes

Add canonical Permission evaluation before:

```text
changeMembershipRole
```

---

## M-094 — BLOCKED

### Authorize Membership Administration Reads

Protect sensitive Organization Membership and Invitation administrative listings through Permissions.

---

# Explicitly Deferred Work

Memberships Foundation must not implement:

```text
Permission model

RolePermission model

Permission engine

custom Organization Roles

multiple Roles per Membership

Profile.roleId

Organization.roleId

Organization.ownerId

Organization.ownerUserId

platform-wide admin through Membership

Teams

Departments

SCIM

seat billing persistence

custom membership metadata

Domain-specific membership fields

hard-delete Membership lifecycle

hard-delete Invitation lifecycle

notification provider persistence

AuditEvent persistence
```

---

# No Temporary Permission System

Do not introduce:

```text
canManageMembers Boolean

canInvite Boolean

isAdmin Boolean

permissionsJson

permissionFlags

Role sortOrder authorization
```

inside Memberships.

Missing Permissions is a dependency.

It is not permission to invent another authorization architecture.

---

# No Temporary Identity Model

Do not create:

```text
User

MembershipUser

OrganizationUser
```

as a shortcut.

Memberships references the existing:

```text
Profile
```

identity model.

---

# No Temporary Role Model

Do not create:

```text
MembershipRole enum
```

or:

```text
role String
```

Memberships references the existing:

```text
Role
```

entity.

---

# No Duplicate Tenant Relationship

Do not introduce:

```text
organization_users

user_organizations

organizationMemberIds

Profile.organizationIds
```

OrganizationMembership is the only tenant Membership source of truth.

---

# Risks

## Duplicate Memberships

Risk:

Two durable Memberships exist for the same Organization/Profile pair.

Mitigation:

```text
database UNIQUE(organizationId, profileId)
```

---

## Duplicate Pending Invitations

Risk:

Multiple usable invitation records exist for one Organization/email.

Mitigation:

```text
partial unique database constraint
+
transactional reinvitation logic
```

---

## Raw Token Leakage

Risk:

Invitation secret becomes retrievable from persistence or logs.

Mitigation:

```text
persist tokenHash only
```

and audit all secret handling.

---

## Suspension Bypass

Risk:

A suspended Membership regains access by accepting an invitation.

Mitigation:

Explicitly reject invitation acceptance for SUSPENDED Membership.

---

## OWNER Invariant Violation

Risk:

Membership mutations leave:

```text
zero OWNERs
```

or:

```text
multiple OWNERs
```

Mitigation:

Dedicated OWNER safety logic and atomic ownership transfer.

---

## Role Drift

Risk:

Memberships stores Role semantics independently from Roles.

Mitigation:

Persist:

```text
roleId
```

only.

Resolve semantics through Roles.

---

## Insecure Administrative Exposure

Risk:

Membership management becomes production-accessible before Permissions exists.

Mitigation:

Internal implementation and public authorization are separate milestones.

---

## Partial Index Drift

Risk:

A PostgreSQL partial unique index added through migration SQL is later forgotten.

Mitigation:

Document it, test it and include it in migration reviews.

---

## Invitation Concurrency

Risk:

Two acceptance requests both create tenant access.

Mitigation:

```text
transaction

conditional status transition

Membership uniqueness
```

---

# Cursor Implementation Rules

Cursor may implement only tasks whose prerequisites are satisfied.

Cursor must not:

```text
create placeholder Profile

create placeholder Organization

create placeholder Role

create User model

create MembershipRole enum

create Permission model

create RolePermission

use Role sortOrder as authorization

persist raw Invitation token

trust client actor Membership

trust client Profile identity

add Organization.ownerId

add Profile.roleId

create permissive RLS

bypass Membership status

invent a previous-owner Role policy

redesign tenancy architecture
```

If an unavailable dependency is encountered:

```text
STOP

Report dependency

Do not invent architecture
```

---

# Dependencies

## Required for Memberships Foundation

```text
Identity / Profile

Organizations Foundation

Roles Foundation

Prisma

PostgreSQL

UUID strategy
```

## Required for Tenancy Integration

```text
Organizations

Roles

Memberships
```

## Required for Full Administrative Authorization

```text
Permissions
```

## Optional Later Integrations

```text
Audit

Notifications

Billing
```

---

# Implementation Order

Approved architectural sequence:

```text
Identity
   ↓
Organizations Foundation
   ↓
Roles Foundation
   ↓
Memberships Foundation
   ↓
Tenancy Integration
   ↓
Permissions
```

Memberships must use real Organizations and Roles contracts rather than provisional replacements.

---

# Definition of Ready

Memberships Foundation is ready to enter implementation when:

- SPEC is approved for implementation.
- DATA_MODEL is consistent.
- FLOWS is consistent.
- API is consistent.
- PRISMA is consistent.
- TASKS is consistent.
- Profile persistence exists.
- Organization persistence exists.
- Role persistence exists.
- canonical Roles are seeded.
- UUID strategy is confirmed.
- Membership states are approved.
- Invitation states are approved.
- Membership uniqueness is approved.
- Role is required on Membership.
- secure token handling is approved.
- pending Invitation uniqueness strategy is approved.
- OWNER safety behavior is approved.
- Permissions boundary is explicit.
- existing Prisma schema has been reviewed for conflicts.

---

# Definition of Done

Memberships Foundation is complete when:

- MembershipStatus exists.
- InvitationStatus exists.
- OrganizationMembership exists.
- OrganizationInvitation exists.
- UUID strategy is preserved.
- real Profile relation exists.
- real Organization relation exists.
- real Role relation exists.
- Membership roleId is required.
- Organization/Profile uniqueness is enforced.
- Membership indexes exist where required.
- tokenHash is unique.
- raw Invitation tokens are not persisted.
- pending Invitation uniqueness is enforced.
- Invitation expiration is enforced.
- Membership repository exists.
- Invitation repository exists.
- repositories receive Prisma Client or Transaction Client while services own transactions.
- Membership lookups work.
- Membership lifecycle works.
- Membership Role replacement works.
- OWNER safety works.
- Invitation creation works.
- Invitation revocation works.
- Invitation resend securely rotates tokens.
- Invitation acceptance is atomic.
- recipient identity is verified.
- Membership duplication is impossible for every status through full Organization/Profile uniqueness.
- SUSPENDED Membership cannot bypass state through invitation.
- REMOVED Membership uses the approved rejoin path.
- concurrency-sensitive flows are protected.
- stable errors exist.
- repository boundaries are preserved.
- no duplicate User exists.
- no duplicate Role system exists.
- no Permission engine exists.
- no Domain-specific Membership logic exists.
- Prisma format passes.
- Prisma validation passes.
- Prisma generation passes.
- TypeScript passes.
- Lint passes.
- relevant tests pass.
- documentation matches implementation.

Complete production tenant administration additionally requires Permissions integration.

---

# Final Principle

Implement only what Memberships owns.

Memberships defines tenant belonging.

Memberships persists one Role assignment per Membership.

Invitations create a secure path toward that relationship.

Organizations owns the tenant.

Identity owns the Profile.

Roles owns Role definitions.

Permissions owns authorization capability.

Missing authorization capabilities are blockers, not reasons to invent temporary permission logic.
