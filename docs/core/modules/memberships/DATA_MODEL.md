---
title: Memberships Data Model
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-12
related:
  - SPEC.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../organizations/DATA_MODEL.md
  - ../organizations/PRISMA.md
  - ../roles/DATA_MODEL.md
  - ../roles/PRISMA.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../../architecture/SECURITY.md
---

# Memberships Data Model

## Purpose

This document defines the data model owned by the Platform Core Memberships module.

Memberships persists two security-relevant concepts:

```text
OrganizationMembership

OrganizationInvitation
```

An OrganizationMembership represents an established tenant relationship.

An OrganizationInvitation represents a request to establish a future tenant relationship.

These concepts must remain separate.

---

# Architectural Ownership

The tenancy model is divided across Platform Core.

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

Memberships owns:

```text
OrganizationMembership

MembershipStatus

OrganizationInvitation

InvitationStatus

Membership lifecycle

Membership Role assignment persistence

Invitation lifecycle
```

Memberships does not own:

```text
Profile

Organization

Role

Permission

Organization lifecycle

Authentication

Organization ownership definition
```

Relations between entities do not transfer architectural ownership.

---

# Core Data Model

Conceptually:

```text
Profile
   │
   │
   ▼
OrganizationMembership
   │           │
   │           └──────────► Role
   │
   ▼
Organization


OrganizationInvitation
   │
   ├──────────► Organization
   │
   ├──────────► Role
   │
   └──────────► Inviting Membership
```

---

# Primary Entities

Memberships introduces:

```text
OrganizationMembership

OrganizationInvitation
```

Supporting enums:

```text
MembershipStatus

InvitationStatus
```

---

# OrganizationMembership

OrganizationMembership represents the durable relationship between:

```text
Profile
+
Organization
```

with one assigned:

```text
Role
```

A Membership is not authentication.

A Membership is not a Permission.

A Membership represents tenant belonging.

---

# OrganizationMembership Fields

Recommended initial fields:

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

No Domain-specific fields belong in the initial model.

---

# Membership id

Membership persistence identifier.

Strategy:

```text
UUID
```

Recommended conceptual representation:

```prisma
id String @id @default(uuid()) @db.Uuid
```

The ID is immutable.

---

# organizationId

References the Organization to which the Membership belongs.

Conceptually:

```text
OrganizationMembership.organizationId
        ↓
Organization.id
```

Required.

UUID.

Organizations owns the Organization entity.

Memberships owns this relationship.

---

# profileId

References the application Profile that belongs to the Organization.

Conceptually:

```text
OrganizationMembership.profileId
        ↓
Profile.id
```

Required.

UUID.

Identity owns Profile.

Memberships does not create another User model.

---

# roleId

References the canonical Role assigned to the Membership.

Conceptually:

```text
OrganizationMembership.roleId
        ↓
Role.id
```

Required.

UUID.

Roles owns Role definitions.

Memberships owns persistence of the assignment.

---

# status

Membership lifecycle state.

Initial values:

```text
ACTIVE

SUSPENDED

REMOVED
```

Recommended persisted enum:

```text
MembershipStatus
```

---

# suspendedAt

Nullable timestamp representing the most recent transition into:

```text
SUSPENDED
```

Expected behavior:

```text
ACTIVE → SUSPENDED

suspendedAt = now()
```

When restored:

```text
SUSPENDED → ACTIVE

suspendedAt = null
```

The transition keeps and validates the existing `roleId`; it does not assign a new Role.

Historical suspension events should eventually be preserved through Audit rather than by turning the Membership row into an event log.

---

# removedAt

Nullable timestamp representing transition into:

```text
REMOVED
```

Expected behavior:

```text
ACTIVE → REMOVED

removedAt = now()
```

A restored Membership may clear:

```text
removedAt
```

after the restoration transaction succeeds.

Historical removal events belong in Audit.

---

# createdAt

Timestamp when the durable Membership relationship was first created.

This is not rewritten when a Membership is suspended, removed or restored.

---

# updatedAt

Timestamp reflecting the most recent persisted Membership update.

---

# MembershipStatus

Initial enum:

```text
ACTIVE

SUSPENDED

REMOVED
```

Invitation state does not belong in MembershipStatus.

Do not add:

```text
INVITED
PENDING
ACCEPTED
EXPIRED
```

to MembershipStatus.

Those states belong to OrganizationInvitation.

---

# ACTIVE Membership

Required conceptual state:

```text
status = ACTIVE

roleId = valid Role

suspendedAt = null

removedAt = null
```

ACTIVE represents a currently established Organization relationship.

---

# SUSPENDED Membership

Expected conceptual state:

```text
status = SUSPENDED

roleId = valid Role

suspendedAt != null

removedAt = null
```

The Role remains persisted.

Suspension temporarily disables normal tenant participation.

---

# REMOVED Membership

Expected conceptual state:

```text
status = REMOVED

roleId = valid Role

removedAt != null
```

The Membership remains stored.

REMOVED does not provide tenant access.

---

# Membership Uniqueness

There must be one durable Membership relationship per:

```text
Organization
+
Profile
```

Required database invariant:

```text
UNIQUE (
  organizationId,
  profileId
)
```

This applies regardless of Membership status.

Membership uniqueness is the full `UNIQUE(organizationId, profileId)` constraint; it is not a partial ACTIVE-only uniqueness rule.

---

# Why REMOVED Memberships Remain Unique

If a Membership becomes REMOVED, creating a second Membership for the same Profile and Organization would produce competing historical identities.

Invalid:

```text
Membership A
Organization 1 + Profile X
REMOVED

Membership B
Organization 1 + Profile X
ACTIVE
```

Preferred:

```text
Membership A
Organization 1 + Profile X
REMOVED
        ↓
explicit restore/rejoin
        ↓
ACTIVE
```

The same durable relationship is reused.

---

# Role Cardinality

Initial architecture:

```text
One Membership
→ One Role
```

Not:

```text
One Membership
→ Many Roles
```

This produces a deterministic tenant authorization position.

Permissions provide fine-grained capabilities later.

---

# Role Requirement

Every persisted Membership requires a valid Role.

Preferred schema:

```text
roleId NOT NULL
```

Do not introduce:

```text
roleId nullable
```

as a temporary workaround.

If a valid Role cannot be resolved, Membership creation must fail.

---

# No Free-Form Role

Do not persist:

```text
role = "ADMIN"
```

as a replacement for the Role relation.

Correct:

```text
roleId
↓
Role.id
```

Canonical semantic resolution may use:

```text
Role.key
```

before persistence.

---

# No Role on Profile

A Profile may belong to multiple Organizations with different Roles.

Example:

```text
Profile X

Organization A
→ ADMIN

Organization B
→ MEMBER

Organization C
→ VIEWER
```

Therefore do not add:

```text
Profile.roleId
```

for tenant authorization.

---

# No Role on Organization

Do not add:

```text
Organization.roleId
```

A Role describes the Membership relationship.

It does not describe the Organization.

---

# OWNER Representation

Organization ownership is represented by:

```text
OrganizationMembership
+
Role where key = OWNER
```

Not:

```text
Organization.ownerId
```

Not:

```text
Organization.ownerUserId
```

Not:

```text
Profile.isOwner
```

---

# OWNER Responsibilities

Ownership is divided across modules.

```text
Organizations
→ defines exactly-one-active-OWNER invariant

Roles
→ defines canonical OWNER Role

Memberships
→ persists which Membership holds OWNER
```

---

# OWNER Membership State

Normal Membership creation, normal invitations and normal Role changes reject OWNER. The first OWNER is created only through M-084, and OWNER promotion or transfer occurs only through M-088. Controlled test fixtures may insert OWNER through a dedicated internal path.

An operational Organization requires exactly one:

```text
ACTIVE Membership
+
Role = OWNER
```

Therefore an OWNER Membership cannot be transitioned arbitrarily.

---

# OWNER Suspension

Before:

```text
ACTIVE OWNER
→ SUSPENDED
```

the workflow must verify that the Organization ownership invariant remains valid.

Normal direct suspension of the sole OWNER is prohibited.

---

# OWNER Removal

Before:

```text
ACTIVE OWNER
→ REMOVED
```

the workflow must ensure ownership has already been transferred atomically.

Normal direct removal of the sole OWNER is prohibited.

---

# OWNER Role Change

Changing:

```text
OWNER
→ ADMIN
```

outside an ownership transfer workflow is prohibited if it leaves no active OWNER.

---

# Ownership Transfer

Ownership transfer affects multiple Membership assignments.

Conceptually:

```text
Target Membership
→ OWNER

Previous Owner Membership
→ approved non-owner Role
```

These changes must occur atomically.

Memberships owns the Role assignments.

Organizations owns the ownership invariant.

Roles provides both Role definitions.

---

# Membership Referential Model

Required relationships:

```text
OrganizationMembership
├── organizationId → Organization.id
├── profileId      → Profile.id
└── roleId         → Role.id
```

All are required for established Memberships.

---

# Organization Referential Principle

Organization deletion is not normal tenancy behavior.

Memberships should not disappear through an accidental Organization cascade.

Implemented referential action:

```text
Organization deletion
→ onDelete: Restrict while Memberships exist
```

---

# Profile Referential Principle

Memberships are security and historical records.

Automatic destructive cascade from Profile deletion should not be introduced casually.

Privacy/deletion behavior requires an explicit retention policy.

Implemented referential action:

```text
Profile deletion
→ onDelete: Restrict while Memberships or accepted Invitations reference it
```

Exact handling belongs to the identity/privacy architecture.

---

# Role Referential Principle

A Role referenced by Memberships must not be deleted casually.

Implemented referential action:

```text
Role deletion
→ onDelete: Restrict while referenced
```

Canonical system Roles are durable reference data.

---

# OrganizationInvitation

OrganizationInvitation represents an invitation to establish a future Membership.

It is not itself a Membership.

---

# Invitation Fields

Recommended initial fields:

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

---

# Invitation id

Invitation persistence identifier.

Strategy:

```text
UUID
```

Recommended conceptual representation:

```prisma
id String @id @default(uuid()) @db.Uuid
```

---

# organizationId

Organization receiving the future member.

Required.

Conceptually:

```text
OrganizationInvitation.organizationId
        ↓
Organization.id
```

An invitation always belongs to one Organization.

---

# recipientEmail

Email address supplied for the invitation.

This may preserve a user-facing representation if required by product behavior.

It is not used as the only canonical uniqueness value.

---

# normalizedEmail

Canonical email value used for deterministic matching and invitation uniqueness.

Initial normalization policy:

```text
trim
+
lowercase
```

Exact email normalization must remain compatible with Identity behavior.

---

# Why Store normalizedEmail

Invitation security and uniqueness require deterministic email comparison.

Example:

```text
Person@Example.com

person@example.com
```

should not create two simultaneously effective invitations merely because casing differs.

---

# roleId on Invitation

Represents the intended Role for the future Membership.

Conceptually:

```text
OrganizationInvitation.roleId
        ↓
Role.id
```

This does not grant access.

The Role becomes an actual tenant assignment only when Membership acceptance/restoration succeeds.

---

# Invitation status

Initial values:

```text
PENDING

ACCEPTED

REVOKED

EXPIRED
```

Persisted through:

```text
InvitationStatus
```

---

# tokenHash

Stores the cryptographic hash of the invitation acceptance token.

Required.

Unique.

The raw invitation token is generated with `crypto.randomBytes(32)`, encoded as base64url for transport, and returned once only to a trusted server-side consumer. `tokenHash` is the SHA-256 lowercase hexadecimal digest and is the only persisted token representation.

Conceptually:

```text
Raw Token
        ↓
Cryptographic Hash
        ↓
tokenHash stored
```

---

# Raw Invitation Token

The raw token may exist transiently when creating the invitation and is returned once only to a trusted server-side consumer.

It may be delivered through a secure invitation URL.

It must not be:

```text
stored in plaintext

logged

included in audit payloads

returned from unrelated APIs

stored in analytics
```

---

# Token Hash Uniqueness

Required:

```text
UNIQUE(tokenHash)
```

Two invitations must not resolve from the same token.

---

# expiresAt

Required timestamp representing invitation expiration.

Implemented policy:

```text
createdAt + 72 hours
```

The lifetime is centralized by Memberships lifecycle support. Rotating a valid
PENDING invitation preserves its original `expiresAt`; reinviting after expiry
creates a new invitation with a fresh 72-hour lifetime.

---

# invitedByMembershipId

References the active OrganizationMembership responsible for creating the invitation.

Conceptually:

```text
OrganizationInvitation.invitedByMembershipId
        ↓
OrganizationMembership.id
```

Required for normal invitation creation.

This establishes tenant actor context without duplicating Profile information.

---

# Why invitedByMembershipId

An invitation is an Organization action.

The relevant actor is not merely:

```text
Profile
```

but:

```text
Profile
acting through
OrganizationMembership
```

This also makes it possible to correlate the inviter's tenant Role at the time of the workflow.

Audit remains responsible for historical security-event detail.

---

# acceptedByProfileId

Optional Profile reference populated when the invitation is accepted successfully.

Conceptually:

```text
OrganizationInvitation.acceptedByProfileId
        ↓
Profile.id
```

Before acceptance:

```text
null
```

After acceptance:

```text
Profile responsible for accepted Membership
```

This field is historical correlation.

It does not replace the created/restored OrganizationMembership relation.

---

# acceptedAt

Nullable timestamp.

Expected:

```text
status = ACCEPTED
→ acceptedAt != null
```

---

# revokedAt

Nullable timestamp.

Expected:

```text
status = REVOKED
→ revokedAt != null
```

---

# EXPIRED Timestamp

A separate:

```text
expiredAt
```

field is not required initially.

Expiration can be understood through:

```text
expiresAt
```

and:

```text
status = EXPIRED
```

Do not add redundant lifecycle fields without demonstrated need.

---

# InvitationStatus

Initial enum:

```text
PENDING

ACCEPTED

REVOKED

EXPIRED
```

---

# PENDING

Expected conceptual state:

```text
status = PENDING

acceptedAt = null

revokedAt = null

expiresAt > creation time
```

A PENDING invitation may still be unusable if current time has passed `expiresAt`.

---

# ACCEPTED

Expected:

```text
status = ACCEPTED

acceptedAt != null

acceptedByProfileId != null
```

An accepted invitation cannot be used again.

---

# REVOKED

Expected:

```text
status = REVOKED

revokedAt != null
```

A revoked invitation cannot be accepted.

---

# EXPIRED

Expected:

```text
status = EXPIRED
```

once the invitation is formally transitioned after expiration.

A PENDING invitation whose:

```text
expiresAt <= now
```

must also be treated as expired even if a background process has not yet persisted the status transition.

---

# Expiration Truth

Security must not depend solely on whether a background task changed:

```text
PENDING
→ EXPIRED
```

Acceptance must always check:

```text
expiresAt > now
```

---

# Pending Invitation Uniqueness

Required business invariant:

```text
At most one PENDING invitation
per
Organization + normalizedEmail
```

Historical invitations must remain possible.

Therefore a normal composite uniqueness constraint on:

```text
organizationId
normalizedEmail
```

would be too restrictive.

---

# Pending Invitation Database Constraint

Preferred PostgreSQL strategy:

```text
partial unique index
```

conceptually:

```sql
CREATE UNIQUE INDEX
  "organization_invitations_pending_email_unique"
ON
  "organization_invitations"
  ("organization_id", "normalized_email")
WHERE
  "status" = 'PENDING';
```

This index is implemented exclusively through deliberate PostgreSQL migration SQL.
Do not represent it through Prisma schema/index declarations.

---

# Expired Pending Invitations and Reinvitation

A persisted PENDING invitation whose:

```text
expiresAt <= now
```

may still occupy the partial unique constraint until its status becomes EXPIRED.

Therefore reinvitation should transactionally:

```text
Find existing effective/persisted PENDING invitation
        ↓
If expired
        ↓
Mark EXPIRED
        ↓
Create new PENDING invitation
```

This keeps database and application state aligned.

---

# Invitation History

Historical records may coexist:

```text
Invitation A
ACCEPTED

Invitation B
REVOKED

Invitation C
EXPIRED

Invitation D
PENDING
```

for the same Organization and email over time.

Only one may remain PENDING.

---

# Invitation Acceptance and Membership Uniqueness

Invitation acceptance must respect:

```text
UNIQUE (
  organizationId,
  profileId
)
```

The invitation does not bypass Membership uniqueness.

---

# Accept With No Existing Membership

Expected:

```text
Valid Invitation
+
No Membership
        ↓
Create ACTIVE Membership
        ↓
Assign Invitation roleId
        ↓
Mark Invitation ACCEPTED
```

Atomically.

---

# Accept With Existing ACTIVE Membership

Expected:

```text
Valid Invitation
+
Existing ACTIVE Membership
        ↓
Do not create duplicate Membership
```

The workflow should return an explicit conflict such as:

```text
ALREADY_MEMBER
```

or approved equivalent.

---

# Accept With Existing SUSPENDED Membership

Invitation acceptance must not silently reactivate a suspended Membership.

Expected:

```text
Existing SUSPENDED Membership
        ↓
Explicit policy required
```

Suspension is an administrative security state.

---

# Accept With Existing REMOVED Membership

Rejoining should reuse the durable Membership.

Conceptually:

```text
REMOVED Membership
        ↓
Validate rejoin policy
        ↓
Validate Role
        ↓
Restore Membership
        ↓
Mark Invitation ACCEPTED
```

Do not create another Membership row.

The restore uses `invitation.roleId` explicitly as the target Role; it does not implicitly reuse the Role retained by the REMOVED Membership.

---

# Invitation Role Changes

A PENDING invitation may potentially have its intended Role changed through a controlled workflow.

If supported:

```text
roleId
```

is updated before acceptance.

Such mutation requires authorization and should be auditable.

This capability is optional in the first implementation.

---

# Invitation Organization Consistency

The inviter Membership must belong to the same Organization as the invitation.

Required invariant:

```text
Invitation.organizationId
=
InviterMembership.organizationId
```

Application services must enforce this.

Database-level enforcement may require more complex design and should not be duplicated unnecessarily.

---

# Invitation Role Validity

Invitation `roleId` must reference an existing Role.

A Role being valid globally does not mean the inviter is authorized to assign it.

Role assignment authorization belongs to Permissions/cross-module policy.

---

# OWNER Invitations

Inviting a recipient directly as:

```text
OWNER
```

should not be treated as a normal invitation.

OWNER represents Organization ownership.

Initial rule:

```text
Normal invitation flow
→ must not create a second OWNER
```

Ownership transfer uses a dedicated workflow.

---

# Normal Assignable Roles

Initial invitation UI may eventually expose:

```text
ADMIN
MANAGER
MEMBER
VIEWER
```

depending on authorization policy.

OWNER should remain protected by ownership-transfer rules.

Exact assignable-role policy belongs to authorization integration.

---

# Invitation Recipient Identity

Invitation matching initially uses:

```text
normalizedEmail
```

When accepted:

```text
Authenticated Profile
        ↓
Canonical identity email
        ↓
Normalize using approved rules
        ↓
Compare with invitation.normalizedEmail
```

Mismatch denies acceptance.

---

# Profile Email Source

Memberships should not independently invent identity semantics.

Supabase Auth remains authoritative. Identity maintains the nullable,
server-only `Profile.authEmailNormalized` projection and exposes the narrow,
transaction-compatible lookup `normalized Auth email → profileId`.

Memberships uses that lookup only to detect an existing tenant relationship
during invitation creation. The projection is not an invitation field, public
DTO, form value or second canonical identity.

---

# Invitation Does Not Require Existing Profile

Before acceptance:

```text
acceptedByProfileId = null
```

This allows invitations to people not yet registered.

The recipient may complete registration/authentication before acceptance.

---

# Invitation and Authentication

Invitation token possession is not sufficient by itself to establish Membership.

Preferred security model:

```text
Valid invitation token
+
Authenticated matching identity
```

before Membership creation.

---

# Invitation Token Lookup

Acceptance typically receives a raw token.

Conceptual flow:

```text
Raw Token
        ↓
SHA-256 lowercase hexadecimal digest
        ↓
Find Invitation by tokenHash
```

The raw value is never queried or persisted directly.

---

# Token Hashing

The invitation token procedure is fixed:

```text
crypto.randomBytes(32)
        ↓
base64url transport encoding
        ↓
SHA-256 lowercase hexadecimal digest persisted as tokenHash
```

The raw token is returned once only to a trusted server-side consumer.
Only the one-way `tokenHash` is persisted; plaintext tokens are never stored.

---

# Invitation Token Rotation

For a non-expired PENDING invitation, resend rotates the token:

```text
Old raw token
→ invalid

New raw token
→ valid
```

The stored:

```text
tokenHash
```

must change atomically while `expiresAt` remains unchanged. If the invitation
is already EXPIRED or its timestamp has elapsed, resend follows reinvitation:
the stale row is closed and a new 72-hour PENDING invitation is created.

---

# Invitation Revocation

Expected update:

```text
status = REVOKED

revokedAt = now()
```

No Membership mutation occurs.

---

# Invitation Acceptance

Expected update:

```text
status = ACCEPTED

acceptedByProfileId = Profile.id

acceptedAt = now()
```

This update must be in the same logical transaction as Membership creation/restoration.

---

# Invitation Expiration

Formal expiration update:

```text
status = EXPIRED
```

may occur through:

- lazy evaluation when accessed;
- scheduled cleanup;
- reinvitation workflow;
- maintenance operation.

Regardless, acceptance checks `expiresAt`.

---

# Invitation Deletion

Normal invitation lifecycle does not use hard delete.

Historical invitations remain useful for:

- troubleshooting;
- security investigations;
- audit correlation;
- duplicate/reinvite reasoning.

Privacy policy may require later retention controls.

---

# Membership Creation Sources

Initial legitimate sources:

```text
Organization onboarding

Invitation acceptance

Explicit Membership restoration/rejoin
```

Avoid generic unrestricted:

```text
createMembership(profileId, organizationId, roleId)
```

being exposed to arbitrary callers.

---

# Initial Organization Membership

Complete Organization creation requires:

```text
Organization

Profile

OWNER Role

OrganizationMembership
```

The Membership created during onboarding uses:

```text
status = ACTIVE

roleId = OWNER.id
```

---

# Initial Owner Membership and Invitation

The first OWNER Membership is not created through OrganizationInvitation.

It is created atomically with Organization onboarding.

---

# Membership Lifecycle State Matrix

Conceptual state transitions:

| From | To | Allowed |
|---|---|---|
| ACTIVE | SUSPENDED | Yes |
| ACTIVE | REMOVED | Yes, subject to OWNER safety |
| SUSPENDED | ACTIVE | Yes |
| SUSPENDED | REMOVED | Yes, subject to policy and OWNER safety |
| REMOVED | ACTIVE | Only through explicit restore/rejoin |
| REMOVED | SUSPENDED | No |
| ACTIVE | ACTIVE | No-op / invalid mutation |
| SUSPENDED | SUSPENDED | No-op / invalid mutation |
| REMOVED | REMOVED | No-op / invalid mutation |

Exact service semantics belong in FLOWS.md.

---

# Lifecycle Timestamp Matrix

Recommended consistency:

```text
ACTIVE

suspendedAt = null
removedAt = null
```

```text
SUSPENDED

suspendedAt != null
removedAt = null
```

```text
REMOVED

removedAt != null
```

If transition occurs:

```text
SUSPENDED → REMOVED
```

the implementation may preserve or clear `suspendedAt` according to the approved final persistence rule.

Prefer one documented deterministic behavior.

---

# Recommended SUSPENDED → REMOVED Behavior

Initial recommendation:

```text
status = REMOVED

removedAt = now()

suspendedAt = null
```

Current state timestamps should describe the current lifecycle state.

Historical transition history belongs to Audit.

---

# Membership Role During Removal

`roleId` remains persisted when Membership becomes REMOVED.

That persisted `roleId` is historical context only.

Reasons:

- historical semantic context;
- audit correlation;
- no nullable Role state.

It is not an implicit restoration target.

Every `REMOVED → ACTIVE` restoration requires a supplied and validated `targetRoleId`,
even when that target equals the previous Role.

---

# Rejoin Role Policy

A REMOVED Membership should not automatically regain powerful stale authorization without validation.

Before restoration:

```text
Explicit targetRoleId supplied
        ↓
targetRoleId resolves and is non-OWNER?
        ↓
Authorization policy allows restoration?
        ↓
Assign roleId = targetRoleId
```

The workflow must not retain the existing Role implicitly.
The historical persisted `roleId` may inform policy review, but restoration always
requires an explicit `targetRoleId`.

---

# Membership Lookup Patterns

Expected Membership repository reads:

```text
findById

findByOrganizationAndProfile

findActiveByOrganizationAndProfile

listByOrganization

listActiveByOrganization

listByProfile

listActiveByProfile
```

Only implement queries required by real flows.

---

# Invitation Lookup Patterns

Expected invitation repository reads:

```text
findById

findByTokenHash

findPendingByOrganizationAndEmail

listPendingByOrganization
```

Administrative listing requirements may expand later.

---

# Membership Indexes

Required:

```text
UNIQUE (
  organizationId,
  profileId
)
```

Likely query-supporting indexes:

```text
organizationId

profileId

roleId

status
```

Composite indexes should follow observed query patterns.

Do not add every possible index preemptively.

---

# Recommended Membership Composite Indexes

Likely useful patterns include:

```text
organizationId + status
```

for listing active Organization members.

And:

```text
profileId + status
```

for listing accessible Organizations for a Profile.

Exact indexing should be confirmed in PRISMA.md against real queries.

---

# Invitation Indexes

Required:

```text
UNIQUE(tokenHash)
```

Recommended:

```text
organizationId

normalizedEmail

status

expiresAt
```

Potential composite/partial:

```text
organizationId + normalizedEmail
WHERE status = PENDING
```

---

# Tenant Organization Listing

The query:

```text
listUserOrganizations
```

will depend on:

```text
Profile.id
        ↓
OrganizationMembership.profileId
        ↓
status = ACTIVE
        ↓
Organization
```

Memberships is the canonical source of this relationship.

---

# Active Organization Context

Active Organization selection may depend on:

```text
OrganizationMembership
```

but active-context persistence is not automatically owned by Memberships.

Memberships only answers:

```text
Does this Profile have an ACTIVE Membership here?
```

---

# Membership and Organization State

Effective tenant access requires both entities to allow it.

Example valid:

```text
Organization = ACTIVE
Membership = ACTIVE
```

Invitation creation, invitation acceptance, Membership activation and Membership restoration require `Organization.status = ACTIVE`.

Example denied:

```text
Organization = ACTIVE
Membership = SUSPENDED
```

Example denied for normal operations:

```text
Organization = SUSPENDED
Membership = ACTIVE
```

---

# RLS Data Source

OrganizationMembership is the canonical source for Membership-based RLS.

Conceptually:

```text
auth.uid()
        ↓
Profile.id
        ↓
OrganizationMembership.profileId
        ↓
OrganizationMembership.organizationId
```

with:

```text
status = ACTIVE
```

Memberships Foundation does not implement tenant RLS policies. It audits actual grants on Memberships tables; if `anon` or `authenticated` can access them, Foundation enables deny-by-default RLS with no permissive policies. M-087 is reserved for Membership-based tenant policies.

---

# RLS Source of Truth

Do not introduce alternate structures such as:

```text
organization_users

user_organizations

organization_member_ids Json

Profile.organizationIds
```

OrganizationMembership is the sole tenant-membership persistence model.

---

# Role and RLS

Membership-based tenant access may only need:

```text
ACTIVE Membership
```

for broad row visibility.

Fine-grained mutation authorization may additionally depend on:

```text
Role
+
Permission
```

Do not overload one RLS policy with the entire future authorization architecture without deliberate design.

---

# Invitation RLS

Invitation records contain:

```text
recipient email

token hash

tenant relationship

security metadata
```

They require stricter access than the global Role catalog.

Direct browser access should be minimized.

Invitation token resolution should occur server side.

---

# tokenHash Exposure

`tokenHash` must not be part of normal public Invitation DTOs.

It is persistence/security implementation data.

---

# Invitation DTO Boundary

A normal administrative Invitation representation may include:

```text
id

recipientEmail

role summary

status

expiresAt

createdAt
```

It should not include:

```text
tokenHash
```

---

# Membership DTO Boundary

Application contracts may expose:

```text
id

organizationId

profile summary

role summary

status

createdAt
```

depending on caller needs.

Do not expose unrelated Profile private data through Membership DTOs.

---

# Data Privacy

Memberships relates user identity to Organizations.

This relationship may be sensitive operational information.

Access must be Organization scoped and purpose limited.

---

# Account Enumeration

Invitation creation should not reveal unnecessary details such as:

```text
This email already has a platform account.
```

unless product requirements explicitly justify such disclosure.

---

# Membership Enumeration

A caller must not be able to enumerate arbitrary:

```text
Profile ↔ Organization
```

relationships outside authorized tenant scope.

---

# Audit Boundary

Membership rows are current state.

They are not a complete historical event log.

Audit eventually preserves events such as:

```text
Membership created

Role changed

Membership suspended

Membership restored

Membership removed

Invitation created

Invitation accepted

Invitation revoked
```

Do not add unlimited history columns to Membership merely to replace Audit.

---

# Event Ownership

Memberships owns events for its entities.

Examples:

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

Organizations may separately own:

```text
organization.ownership_transferred
```

for the cross-module ownership workflow.

---

# Notification Boundary

OrganizationInvitation contains invitation state.

It does not contain email-provider state.

Avoid fields such as:

```text
sendgridMessageId

smtpStatus

emailProviderPayload
```

inside the Core Invitation model unless a reusable Notifications contract later requires a relation.

---

# Billing Boundary

Memberships does not initially persist:

```text
seatCost

billingSeatId

subscriptionMemberId
```

Billing may later count active Memberships through its own integration.

---

# Domain Boundary

Memberships must remain business agnostic.

Do not add fields such as:

```text
department

productionArea

DJType

editorialRole

orderResponsibility

customerAccessLevel
```

to Core Memberships without validated cross-product need.

---

# Custom Permissions

Do not add:

```text
permissions Json

permissionOverrides Json

canManageMembers Boolean
```

to OrganizationMembership.

Authorization capability belongs to Permissions.

---

# Multiple Roles

Do not add:

```text
roles Role[]
```

to OrganizationMembership in the initial architecture.

Initial model:

```text
roleId
→ one Role
```

---

# Membership Metadata

Do not create generic:

```text
metadata Json
```

merely to avoid making future modeling decisions.

Core entities should remain explicit and minimal.

Domain extensions should be modeled by their owning Domains.

---

# Invitation Metadata

Likewise avoid generic unrestricted:

```text
metadata Json
```

on OrganizationInvitation in the initial model.

Security-relevant invitation data should be explicit.

---

# Timestamps

Membership:

```text
createdAt
updatedAt
suspendedAt?
removedAt?
```

Invitation:

```text
createdAt
updatedAt
expiresAt
acceptedAt?
revokedAt?
```

These timestamps represent current lifecycle metadata.

Full history belongs to Audit.

---

# Data Ownership Summary

```text
Identity
→ Profile

Organizations
→ Organization

Memberships
→ OrganizationMembership
→ MembershipStatus
→ OrganizationInvitation
→ InvitationStatus

Roles
→ Role

Permissions
→ Permission
```

---

# Physical Prisma Schema

The project uses a shared:

```text
prisma/schema.prisma
```

Therefore models may physically include inverse relations across owners.

Example:

```text
Organization
→ memberships OrganizationMembership[]
```

or:

```text
Role
→ memberships OrganizationMembership[]
```

These physical relations do not transfer architectural ownership.

---

# Physical Inverse Relations

The shared Prisma schema contains required inverse fields on:

```text
Profile

Organization

Role
```

for Memberships relations.

That is acceptable.

Ownership remains:

```text
Memberships
→ OrganizationMembership
```

---

# Referential Delete Policy

Initial conservative principle:

```text
OrganizationMembership relationships
→ do not cascade-delete casually
```

and:

```text
OrganizationInvitation history
→ do not cascade-delete casually
```

Exact foreign-key actions must be decided in PRISMA.md.

---

# OrganizationInvitation Actor Relation

The inviter is represented by:

```text
invitedByMembershipId
```

This relation is Memberships-owned on both sides.

Because Memberships normally uses soft lifecycle states rather than deletion, invitation history can preserve the inviter reference.

---

# Invitation Acceptance Profile Relation

`acceptedByProfileId` is optional because the invitation exists before acceptance.

On successful acceptance it provides explicit historical correlation.

It does not represent Membership authority.

---

# Invitation Acceptance Membership Relation

A direct:

```text
acceptedMembershipId
```

field is not required initially.

The resulting Membership is deterministically discoverable through:

```text
organizationId
+
acceptedByProfileId
```

because Membership uniqueness guarantees one relationship.

Avoid redundant foreign keys unless later workflows demonstrate a need.

---

# Invitation Inviter Profile Duplication

Do not store both:

```text
invitedByMembershipId
```

and:

```text
invitedByProfileId
```

initially.

The inviter Profile is resolvable through OrganizationMembership.

Avoid duplicated sources of truth.

---

# Invitation Recipient Profile Before Acceptance

Do not require:

```text
recipientProfileId
```

at invitation creation.

The recipient may not yet have an account.

Email remains the initial recipient identifier.

---

# Existing Profile Optimization

Even if the invited email currently maps to an existing Profile, the Invitation model should not depend on that fact.

This avoids different persistence paths for:

```text
existing user
```

and:

```text
new user
```

---

# Invitation Security Invariant

An invitation becomes usable only when all conditions hold:

```text
status = PENDING

expiresAt > now

token matches tokenHash

Organization.status = ACTIVE

Role exists

recipient identity matches

Membership relationship does not conflict with acceptance
```

---

# Invitation Token Invariant

A token can successfully accept at most one invitation.

Required protection:

```text
UNIQUE(tokenHash)

+

status transition

+

transaction
```

---

# Concurrent Acceptance

Two requests may attempt to accept one invitation simultaneously.

The persistence design must ensure only one transaction succeeds in converting:

```text
PENDING
→ ACCEPTED
```

and establishing/restoring Membership.

The exact locking/update strategy belongs in PRISMA.md/FLOWS.md.

---

# Concurrent Membership Creation

Two workflows may attempt to create the same Membership.

Database uniqueness:

```text
organizationId + profileId
```

is the final protection.

Application pre-checks are not sufficient.

---

# Concurrent Invitations

Two workflows may attempt to create a PENDING invitation for the same:

```text
Organization + normalizedEmail
```

The partial uniqueness constraint is the final protection.

---

# Seed Requirements

Memberships does not require Membership seed data.

Do not seed:

```text
fake Organizations

fake Memberships

default OWNER Memberships
```

as Platform Core reference data.

Memberships are real application relationships.

---

# Enum Migration

Memberships Foundation introduces:

```text
MembershipStatus

InvitationStatus
```

No Membership status should duplicate Organization lifecycle or Role semantics.

---

# No Membership OWNER Enum

Do not create:

```text
MembershipRole
```

enum containing:

```text
OWNER
ADMIN
...
```

Roles already owns canonical Role definitions.

---

# No Invitation Role Enum

Do not create a separate:

```text
InvitationRole
```

enum.

OrganizationInvitation references:

```text
Role.id
```

---

# Data Model Dependencies

Memberships Foundation requires existing:

```text
Profile

Organization

Role
```

persistence.

These relations should be real from the first Membership migration.

Do not create temporary string references.

---

# Implementation Sequence

Data-model dependency order:

```text
Profile
   ↓
Organization
   ↓
Role
   ↓
OrganizationMembership
   ↓
OrganizationInvitation
```

OrganizationInvitation additionally references OrganizationMembership as inviter.

---

# Migration Strategy

Memberships should be introduced after:

```text
Organizations Foundation

Roles Foundation
```

are stable.

Initial Memberships migration should introduce:

```text
MembershipStatus

InvitationStatus

organization_memberships

organization_invitations

foreign keys

uniqueness constraints

required indexes
```

---

# No Temporary Nullable Relations

Do not make:

```text
organizationId

profileId

roleId
```

nullable merely to ease migration in a development environment.

Memberships should begin with its intended structural invariants.

---

# Existing Organizations

If Organizations exist before Memberships is introduced, they may temporarily lack Membership records in development.

The tenancy integration step must identify and resolve any Organizations intended to become operational tenants.

Do not infer ownership automatically without an approved migration rule.

---

# Existing Profiles

Existing Profiles do not automatically become Members of any Organization.

Membership must be established through explicit tenancy workflows.

---

# Existing Role Catalog

Memberships assumes canonical Roles already exist.

In particular:

```text
OWNER
```

must be resolvable before complete Organization onboarding becomes operational.

---

# Membership Data Model Validation Checklist

Before implementation verify:

```text
[ ] OrganizationMembership owned by Memberships

[ ] OrganizationInvitation owned by Memberships

[ ] Membership uses UUID

[ ] Invitation uses UUID

[ ] Organization relation is required

[ ] Profile relation is required for Membership

[ ] Role relation is required for Membership

[ ] Membership roleId is NOT NULL

[ ] One Membership per Organization + Profile

[ ] MembershipStatus = ACTIVE / SUSPENDED / REMOVED

[ ] InvitationStatus = PENDING / ACCEPTED / REVOKED / EXPIRED

[ ] Invitation is separate from Membership

[ ] Invitation does not require recipient Profile before acceptance

[ ] Invitation stores tokenHash, not raw token

[ ] tokenHash is unique

[ ] Invitation expires

[ ] One PENDING invitation per Organization + normalized email

[ ] OWNER is represented through Membership + Role

[ ] No ownerId exists on Organization

[ ] No Profile.roleId exists

[ ] No Permission fields exist

[ ] No multiple Roles per Membership

[ ] No Domain-specific Membership fields exist
```

---

# Definition of Ready

Memberships data model is ready when:

- OrganizationMembership ownership is explicit.
- OrganizationInvitation ownership is explicit.
- UUID strategy is confirmed.
- Organization/Profile uniqueness is approved.
- Membership states are approved.
- Invitation states are approved.
- Membership Role is required.
- Role assignment belongs to Memberships.
- Role definition belongs to Roles.
- Invitation recipient identity strategy is approved.
- Secure token-hash storage is approved.
- Invitation expiration is required.
- Pending invitation uniqueness is understood.
- OWNER representation is approved.
- OWNER mutation safety is understood.
- Profile does not receive a global tenant Role.
- Permissions remain separate.
- Referential policy is sufficiently defined for Prisma design.

---

# Definition of Done

Memberships persistence is complete when:

- OrganizationMembership model exists.
- OrganizationInvitation model exists.
- MembershipStatus exists.
- InvitationStatus exists.
- UUID strategy is preserved.
- Organization/Profile uniqueness is enforced.
- Membership references Organization.
- Membership references Profile.
- Membership references Role.
- Membership Role is non-null.
- Invitation references Organization.
- Invitation references intended Role.
- Invitation references inviter Membership.
- Invitation can exist without recipient Profile.
- Invitation token hash is unique.
- Raw tokens are not persisted.
- Invitation expiration is stored.
- Pending invitation concurrency is protected.
- Duplicate Membership concurrency is protected.
- Membership lifecycle timestamps remain consistent.
- Invitation lifecycle timestamps remain consistent.
- OWNER remains Membership + Role.
- No duplicate User model exists.
- No Profile global Role exists.
- No Permission engine exists.
- No Domain-specific Membership model exists.
- Prisma validation passes.
- Relevant tests pass.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.

---

# Final Principle

OrganizationMembership is the durable tenant relationship.

OrganizationInvitation is the secure path toward creating that relationship.

A Membership connects one Profile to one Organization and holds one valid Role.

Memberships owns that relationship.

Identity owns the Profile.

Organizations owns the tenant.

Roles owns Role definitions.

Permissions owns authorization capability.

Do not collapse those responsibilities into one model.
