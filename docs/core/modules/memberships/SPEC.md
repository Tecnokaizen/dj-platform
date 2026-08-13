---
title: Memberships Specification
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-12
related:
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../organizations/SPEC.md
  - ../organizations/FLOWS.md
  - ../roles/SPEC.md
  - ../roles/DATA_MODEL.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/CORE.md
  - ../../../architecture/SECURITY.md
  - ../../../architecture/DATA.md
---

# Memberships Specification

## Purpose

The Memberships module defines the relationship between an application Profile and an Organization.

It answers:

```text
Does this Profile belong to this Organization?

What is the current state of that relationship?

Which Role is assigned to that Membership?
```

Memberships is the bridge between:

```text
Profile
Organization
Role
```

Conceptually:

```text
Profile
   ↓
OrganizationMembership
   ↓
Organization
   +
Role
```

Memberships also owns the Organization invitation lifecycle required to establish new Memberships.

---

# Core Principle

Identity answers:

```text
Who is the authenticated person?
```

Organizations answers:

```text
What tenant exists?
```

Memberships answers:

```text
Who belongs to that tenant?
```

Roles answers:

```text
What Role does that Membership hold?
```

Permissions answers:

```text
What may that Role do?
```

These responsibilities must remain separate.

---

# Architectural Ownership

The tenancy model is:

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

Membership lifecycle

Membership Role assignment persistence

OrganizationInvitation

Invitation lifecycle

Invitation acceptance

Membership suspension

Membership restoration

Membership removal
```

Memberships does not own:

```text
Profile

Organization

Role definition

Permission definition

Permission evaluation

Organization lifecycle

Organization ownership invariant

Authentication
```

---

# Primary Entities

Memberships introduces two primary persisted entities:

```text
OrganizationMembership

OrganizationInvitation
```

They represent different concepts.

---

# OrganizationMembership

An OrganizationMembership represents an established relationship between:

```text
Profile
+
Organization
```

with an assigned:

```text
Role
```

Conceptually:

```text
Profile
   │
   ▼
OrganizationMembership
   │             │
   ▼             ▼
Organization    Role
```

---

# OrganizationInvitation

An OrganizationInvitation represents an invitation to establish a future OrganizationMembership.

An invitation may exist before the invited person has:

```text
Supabase auth user

Profile
```

Therefore invitations must not require an existing Profile for the invited recipient.

---

# Membership vs Invitation

Invitation and Membership are intentionally separate.

Correct lifecycle:

```text
Invitation
    ↓
Accepted
    ↓
Membership Created
```

Not:

```text
Membership with status INVITED
```

The initial architecture does not use OrganizationMembership as a pending invitation record.

This prevents the Membership entity from representing both:

```text
an actual tenant relationship
```

and:

```text
an invitation that may never be accepted
```

---

# Membership Identity

A Membership is uniquely identified by:

```text
UUID
```

Platform identifier strategy applies:

```text
id
→ UUID
```

The Membership also represents a unique logical relationship:

```text
Organization
+
Profile
```

There must not be multiple simultaneous Membership records representing the same Organization/Profile relationship.

---

# Unique Organization Membership

Initial invariant:

```text
One OrganizationMembership
per
Organization + Profile
```

Conceptually:

```text
UNIQUE (
  organizationId,
  profileId
)
```

This creates one durable Membership relationship that may change state over time.

---

# Membership Role

Every Membership references a valid Role.

Conceptually:

```text
OrganizationMembership.roleId
        ↓
Role.id
```

Role definition belongs to Roles.

Role assignment persistence belongs to Memberships.

---

# Active Membership Role Requirement

An ACTIVE Membership must always have a valid Role.

Required state:

```text
MembershipStatus = ACTIVE
+
valid roleId
```

Invalid:

```text
ACTIVE Membership
+
roleId = null
```

Invalid:

```text
ACTIVE Membership
+
missing Role
```

The initial design therefore expects `roleId` to be required for established Memberships.

---

# Initial Membership States

Initial Membership lifecycle:

```text
ACTIVE

SUSPENDED

REMOVED
```

These states describe an established tenant relationship.

They do not represent invitation state.

---

# ACTIVE

An ACTIVE Membership represents a Profile that currently belongs to the Organization.

Conceptually:

```text
Profile
+
Organization
+
Role
+
ACTIVE
```

An active Membership may participate in tenant workflows according to authorization rules.

---

# SUSPENDED

A SUSPENDED Membership remains persisted but temporarily loses normal tenant access.

Suspension preserves:

```text
Organization relationship

Profile relationship

Role assignment

Membership history
```

Suspension does not delete the Membership.

---

# REMOVED

A REMOVED Membership represents a relationship that has been administratively ended.

The Membership remains persisted for:

- historical consistency;
- audit correlation;
- future restoration policy;
- protection against accidental duplicate relationships.

A REMOVED Membership does not provide active Organization access.

---

# Why REMOVED Is Not Hard Delete

Memberships are security-relevant tenant relationships.

Hard deletion would remove useful historical context.

Initial behavior therefore prefers:

```text
ACTIVE
→ REMOVED
```

instead of:

```text
DELETE OrganizationMembership
```

Permanent deletion may be considered later under retention and privacy requirements.

---

# Membership Lifecycle

Initial lifecycle:

```text
              ┌──────────────┐
              │              ▼
ACTIVE → SUSPENDED → ACTIVE
  │
  ▼
REMOVED
```

Possible restoration:

```text
REMOVED
→ ACTIVE
```

may be supported only through an explicit restore/rejoin workflow.

Restoration requires `Organization.status = ACTIVE` and must revalidate:

```text
Organization state

Role validity

Authorization

Membership policy
```

---

# Invalid Membership Transitions

Examples of invalid or unsafe direct transitions include:

```text
REMOVED
→ SUSPENDED
```

and arbitrary state mutation that bypasses Membership services.

Membership lifecycle rules must be centralized.

---

# Role Preservation

When a Membership becomes:

```text
SUSPENDED
```

its Role should normally remain persisted.

This preserves the relationship semantics and allows predictable restoration.

When a Membership becomes:

```text
REMOVED
```

the Role may also remain persisted for historical meaning.

Restoration must still validate that the Role remains valid.

## Restore Role Rules

`SUSPENDED → ACTIVE` keeps the existing `roleId` and validates it; it does not receive a new Role.

`REMOVED → ACTIVE` requires an explicit `targetRoleId`; the existing Role is not implicitly restored. When reactivation results from invitation acceptance, the explicit target is `invitation.roleId`.

---

# Role Changes

Memberships owns persistence of:

```text
OrganizationMembership.roleId
```

A Role change conceptually performs:

```text
Current Membership
        ↓
Resolve Target Role
        ↓
Validate Assignment Rules
        ↓
Authorize Actor
        ↓
Update roleId
```

Roles provides the Role definition.

Memberships persists the assignment.

Permissions eventually determines whether the actor may perform the change.

---

# OWNER Membership

Organization ownership is represented through:

```text
OrganizationMembership
+
Role where key = OWNER
```

There is no competing:

```text
Organization.ownerId
```

or:

```text
Organization.ownerUserId
```

---

# Ownership Responsibility

Ownership responsibilities are divided deliberately:

```text
Organizations
→ exactly one active OWNER requirement

Roles
→ canonical OWNER Role

Memberships
→ persisted Membership with OWNER roleId
```

Memberships must preserve the Organization ownership invariant during Membership mutations.

It does not redefine that invariant.

---

# OWNER Protection

Normal Membership creation, normal invitations and normal Role changes reject the OWNER Role. The first OWNER is created only through M-084; OWNER promotion or transfer occurs only through M-088. Controlled test fixtures may insert OWNER through a dedicated internal path.

An OWNER Membership must not be:

```text
removed

suspended

demoted
```

if that operation would leave the Organization without exactly one active OWNER.

Normal Membership mutation must therefore detect OWNER-specific cases.

---

# Ownership Transfer

OWNER changes use the dedicated cross-module ownership transfer flow.

Conceptually:

```text
Current OWNER Membership
        ↓
Target ACTIVE Membership
        ↓
Resolve OWNER Role
        ↓
Resolve Approved Previous-Owner Role
        ↓
BEGIN TRANSACTION
        ↓
Target Membership → OWNER
        ↓
Previous OWNER → Approved Non-Owner Role
        ↓
COMMIT
```

Memberships persists the Role changes.

Organizations defines the ownership invariant.

Roles provides canonical Role definitions.

---

# Previous Owner Role

The previous OWNER must not be silently assigned an arbitrary Role.

The ownership transfer contract must explicitly define what Role the previous owner receives.

For example:

```text
ADMIN
```

may eventually be the approved default.

That policy must be documented before implementation.

---

# Initial Owner Membership

Complete Organization onboarding requires creation of the first Membership.

Conceptual flow:

```text
Authenticated Profile
        ↓
Resolve OWNER Role
        ↓
BEGIN TRANSACTION
        ↓
Organizations creates Organization
        ↓
Memberships creates ACTIVE Membership
        ↓
roleId = OWNER.id
        ↓
COMMIT
```

This is a cross-module tenancy workflow.

Memberships owns creation of the Membership record.

---

# Organization State

Membership existence does not override Organization lifecycle.

Example:

```text
Membership = ACTIVE
Organization = SUSPENDED
```

does not imply normal tenant access.

Effective tenant access requires both Organization and Membership state to permit access.

Invitation creation, invitation acceptance, Membership activation and Membership restoration require `Organization.status = ACTIVE`.

---

# Effective Tenant Relationship

Conceptually:

```text
Authenticated Profile
        ↓
Organization exists
        ↓
Organization state allows access
        ↓
Membership exists
        ↓
Membership = ACTIVE
        ↓
Role valid
        ↓
Authorization
```

Permissions will later complete the authorization decision.

---

# Membership Access

A Membership is not authentication.

A Membership is not a Permission.

A Membership is the tenant relationship.

Correct model:

```text
Authentication
→ Identity

Tenant relationship
→ Memberships

Authorization position
→ Roles

Authorization capability
→ Permissions
```

---

# Multiple Organizations

A Profile may belong to multiple Organizations.

Example:

```text
Profile A
│
├── Organization 1 Membership
│      └── ADMIN
│
├── Organization 2 Membership
│      └── MEMBER
│
└── Organization 3 Membership
       └── VIEWER
```

There is no single global tenant Role on Profile.

---

# No Profile Role

Do not introduce:

```text
Profile.role

Profile.roleId
```

for Organization authorization.

Role assignment belongs to each individual OrganizationMembership.

---

# No Organization User Array

Do not persist Organization membership as an uncontrolled list such as:

```text
Organization.userIds
```

or:

```text
Organization.members Json
```

OrganizationMembership is the canonical relationship.

---

# Invitation Purpose

OrganizationInvitation allows an authorized Organization member to invite another person to join an Organization.

The recipient may:

```text
already have a Profile
```

or:

```text
not yet have an account
```

Invitation identity is therefore initially based on:

```text
email
```

rather than requiring `profileId`.

---

# Invitation Role

An invitation must specify the Role intended for the future Membership.

Conceptually:

```text
OrganizationInvitation.roleId
        ↓
Role.id
```

This represents intended assignment.

It does not itself grant Organization access.

---

# Invitation States

Initial invitation lifecycle:

```text
PENDING

ACCEPTED

REVOKED

EXPIRED
```

These states belong to:

```text
OrganizationInvitation
```

not OrganizationMembership.

---

# PENDING Invitation

A PENDING invitation is valid and may potentially be accepted.

Acceptance additionally requires:

- invitation not expired;
- invitation not revoked;
- Organization.status = ACTIVE;
- Role still valid;
- recipient identity matches invitation policy;
- Membership relationship does not conflict.

---

# ACCEPTED Invitation

An ACCEPTED invitation has successfully produced or restored an Organization Membership according to approved workflow.

An accepted invitation cannot be accepted again.

---

# REVOKED Invitation

A REVOKED invitation was explicitly cancelled before acceptance.

It must no longer be usable.

---

# EXPIRED Invitation

An EXPIRED invitation passed its acceptance deadline.

It must no longer be usable.

Expiration may be represented through:

```text
status
```

and:

```text
expiresAt
```

Exact persistence behavior belongs in DATA_MODEL.md and PRISMA.md.

---

# Invitation Token

Generate the raw token with `crypto.randomBytes(32)` and encode it as base64url for transport. Persist only its SHA-256 lowercase hexadecimal digest as `tokenHash`.

```text
Raw token
→ returned once to a trusted server-side consumer only

tokenHash
→ persisted
```

The raw token must not be persisted or exposed through normal DTOs, logs, analytics or audit payloads.

---

# Invitation Expiration

Invitations must expire.

A PENDING invitation with:

```text
expiresAt <= now
```

must not be accepted.

Acceptance always checks the timestamp directly. Lifecycle services may also
persist `PENDING → EXPIRED` lazily when an expired invitation is observed or
when reinvitation replaces it; security does not depend on a scheduled job.

---

# Invitation Email

Invitation email must be normalized consistently.

Typical normalization:

```text
trim

lowercase
```

Exact rules must be shared with Identity where email semantics matter.

---

# Invitation Recipient Matching

When an invitation is accepted by an authenticated Profile:

```text
authenticated identity
```

must correspond to the intended invitation recipient according to approved email matching rules.

A user must not be able to accept an invitation intended for another person merely by obtaining an invitation identifier.

---

# Invitation Acceptance

Conceptual flow:

```text
Invitation Token
        ↓
Resolve Invitation
        ↓
Validate PENDING
        ↓
Validate Not Expired
        ↓
Authenticate / Resolve Profile
        ↓
Validate Recipient
        ↓
Validate Organization
        ↓
Resolve Role
        ↓
Check Existing Membership
        ↓
BEGIN TRANSACTION
        ↓
Create / Restore Membership
        ↓
Mark Invitation ACCEPTED
        ↓
COMMIT
```

Exact create-vs-restore policy must remain deterministic.

---

# Existing ACTIVE Membership

If the invited Profile already has:

```text
ACTIVE Membership
```

for the same Organization, invitation acceptance must not create a duplicate Membership.

The workflow must resolve the conflict safely.

Possible result:

```text
ALREADY_MEMBER
```

---

# Existing SUSPENDED Membership

An invitation must not silently bypass suspension.

If a Profile already has a:

```text
SUSPENDED Membership
```

the normal invitation acceptance workflow must not automatically reactivate it unless an explicit restore policy permits this.

Suspension is an administrative state.

---

# Existing REMOVED Membership

If a Membership exists in:

```text
REMOVED
```

state, rejoining reuses or restores the existing durable Membership relationship rather than creating a duplicate record.

The restore requires an explicit `targetRoleId`; invitation acceptance supplies `invitation.roleId` as that target.

---

# Pending Invitation Uniqueness

The platform prevents multiple PENDING invitations for the same:

```text
Organization
+
normalized email
```

Initial invariant:

```text
At most one effective PENDING invitation
per Organization + recipient email
```

PostgreSQL enforces this with the partial unique index
`organization_invitations_pending_email_unique` over `organization_id` and
`normalized_email` where `status = 'PENDING'`.

---

# Reinvitation

A recipient may be invited again after an earlier invitation becomes:

```text
REVOKED
```

or:

```text
EXPIRED
```

The system should support a new invitation without corrupting historical records.

---

# Invitation Revocation

An authorized actor may revoke a PENDING invitation.

Conceptual flow:

```text
Resolve Invitation
        ↓
Validate PENDING
        ↓
Authorize Actor
        ↓
Set REVOKED
        ↓
Invalidate Acceptance
```

Revocation does not affect an already established Membership.

---

# Invitation Resend

Resending an invitation is not necessarily equivalent to creating another invitation record.

Implemented behavior:

```text
non-expired PENDING
→ atomically rotate tokenHash and preserve expiresAt

EXPIRED or expiresAt <= now
→ close the stale invitation and create a new 72-hour invitation
```

Avoid uncontrolled duplicate invitations.

---

# Invitation History

Invitations are security-relevant records.

Accepted, revoked and expired invitations should normally remain persisted for operational history.

Hard deletion is not the default lifecycle.

---

# Membership Creation

Memberships may be created through approved workflows such as:

```text
Initial Organization ownership

Accepted Organization invitation

Administrative restoration
```

Generic unrestricted Membership creation is not a public user capability.

---

# Membership Suspension

Suspending a Membership:

```text
ACTIVE
→ SUSPENDED
```

preserves:

```text
Organization

Profile

Role
```

but removes normal active tenant participation.

---

# Membership Restoration

Restoring:

```text
SUSPENDED
→ ACTIVE
```

requires revalidation of:

```text
Organization state
Role validity
Authorization
OWNER invariant if relevant
```

---

# Membership Removal

Removing:

```text
ACTIVE
→ REMOVED
```

ends normal Organization participation.

Before removal:

```text
OWNER safety
```

must be checked.

---

# Membership Rejoin

A future approved rejoin flow may perform:

```text
REMOVED
→ ACTIVE
```

using the same Membership record.

It must not silently activate stale authorization.

Role and authorization must be validated again.

---

# Membership Role Change

Memberships owns:

```text
roleId mutation
```

Possible Role change:

```text
MEMBER
→ MANAGER
```

or:

```text
ADMIN
→ MEMBER
```

Role changes require:

- valid target Role;
- active target Membership where required;
- valid Organization;
- authorization;
- OWNER safety.

---

# Role Assignment Authorization

Memberships does not define the final Permission model.

Before Permissions exists, do not invent:

```text
canManageMembers
isSuperAdmin
roleLevel checks
permission flags
```

inside Memberships.

Membership persistence can be implemented before full Permission authorization.

Production member-management operations may remain blocked until required authorization contracts exist.

---

# Bootstrap Authorization

Some tenancy workflows must exist before Permissions is implemented.

Examples:

```text
Create initial OWNER Membership

Accept valid invitation
```

These flows use explicit workflow-specific invariants rather than a temporary general Permission engine.

They must not evolve into an undocumented authorization substitute.

---

# Owner-Specific Bootstrap

OWNER is structurally required for Organization onboarding.

This does not mean:

```text
OWNER automatically substitutes Permissions everywhere
```

OWNER-specific bootstrap rules should remain limited to the tenancy workflows that require them.

---

# Organization Listing

The operation:

```text
listUserOrganizations
```

depends on Memberships.

Conceptually:

```text
Authenticated Profile
        ↓
Find ACTIVE Memberships
        ↓
Resolve Organizations
        ↓
Return Accessible Organizations
```

Organizations may expose this as an Organization-oriented application capability.

Memberships remains the source of truth for belonging.

---

# Active Organization Context

Switching active Organization requires Membership validation.

Conceptually:

```text
Target Organization
        ↓
Find Membership
        ↓
Membership ACTIVE?
        ├── NO → deny
        └── YES
             ↓
           Organization state valid?
             ↓
           Switch Context
```

Memberships supplies the tenant relationship check.

It does not necessarily own active context persistence.

---

# Membership Lookup

Memberships should support internal capabilities such as:

```text
getMembership

getMembershipForProfile

listMembershipsForOrganization

listMembershipsForProfile

hasActiveMembership
```

Exact API contracts belong in API.md.

---

# Tenant Isolation

Organization-scoped data access depends on Membership validation.

Core principle:

```text
Authenticated
≠
Organization Member
```

and:

```text
Organization Member
≠
Authorized for every operation
```

Memberships establishes tenant belonging.

Permissions establishes fine-grained authorization.

---

# RLS Foundation

Memberships is the critical persistence source for tenant-aware RLS.

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

Final RLS design must use the real Membership model.

Do not implement competing tenant membership tables.

Memberships Foundation does not implement tenant RLS policies. It audits the actual grants on Memberships tables; if `anon` or `authenticated` can access them, Foundation enables deny-by-default RLS with no permissive policies. M-087 is reserved for Membership-based tenant policies.

---

# RLS Membership State

Tenant access policies should normally require:

```text
MembershipStatus = ACTIVE
```

A:

```text
SUSPENDED
```

or:

```text
REMOVED
```

Membership must not provide normal tenant access.

---

# Organization State and RLS

Membership-based RLS may additionally need to consider Organization lifecycle.

Example:

```text
Membership ACTIVE
+
Organization SUSPENDED
```

may still require denial for normal operations.

Exact RLS policy will be coordinated with Organizations and Security architecture.

---

# Security

Memberships is security-critical.

All Membership mutations must occur server side.

The platform must never trust client claims such as:

```text
I belong to Organization X

I am OWNER

My Membership is ACTIVE

Use this roleId
```

Persisted Membership data is authoritative.

---

# Membership Enumeration

Application interfaces should avoid leaking:

- Membership existence across unrelated Organizations;
- private Profile data;
- invitation recipient data;
- invitation tokens;
- tenant relationships to unauthorized actors.

---

# Invitation Security

Invitation responses must not unnecessarily reveal whether arbitrary emails:

```text
have accounts
```

or:

```text
belong to other Organizations
```

Invitation flows should minimize account enumeration risks.

---

# Invitation Token Exposure

Invitation tokens must not be:

- logged in plain text;
- returned unnecessarily after creation;
- stored as reusable plaintext secrets;
- exposed through analytics;
- persisted in audit payloads.

---

# Audit

Membership changes are security-relevant.

Important future audit events include:

```text
Membership created

Membership suspended

Membership restored

Membership removed

Membership Role changed

Invitation created

Invitation accepted

Invitation revoked

Ownership-related Membership changed
```

Audit persistence belongs to the Audit module.

Memberships requests audit recording.

---

# Events

Memberships owns Membership and invitation events.

Possible events:

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

Ownership transfer may additionally emit an Organization-level event through Organizations.

---

# Notifications

Invitation emails and Membership notifications may be delivered by Notifications.

Memberships owns:

```text
the business event
```

Notifications owns:

```text
message delivery
```

Memberships must not embed email-provider implementation.

---

# Cross-Module Dependencies

Memberships depends on:

```text
Identity / Profile

Organizations / Organization

Roles / Role

Prisma

PostgreSQL
```

Full member-management authorization will later depend on:

```text
Permissions
```

Optional integrations include:

```text
Audit

Notifications
```

---

# Identity Dependency

OrganizationMembership references:

```text
Profile
```

not a duplicate application User model.

Authentication remains:

```text
Supabase auth.users
        ↓
Profile
```

Memberships does not create another User entity.

---

# Organization Dependency

Memberships references:

```text
Organization
```

Organizations remains owner of Organization lifecycle and persistence.

Memberships must not duplicate Organization status or tenant metadata.

---

# Roles Dependency

Memberships references:

```text
Role
```

Roles Foundation must exist before Memberships becomes operational.

Memberships must not store free-form Role strings as a substitute.

---

# Permissions Dependency

Permissions is not required to persist the basic Membership relationship.

However, production administrative operations such as:

```text
invite member

remove member

change Role

suspend member
```

require an approved authorization strategy.

Do not create a temporary generic permission engine inside Memberships.

---

# Membership Repository Ownership

Memberships owns persistence access for:

```text
OrganizationMembership

OrganizationInvitation
```

ADR-007 keeps repositories optional globally. Memberships explicitly adopts repositories because its persistence has complex queries, secret projections such as `tokenHash`, and transactional operations.

Required boundaries:

```text
Membership Repository

Invitation Repository
```

Repositories contain persistence logic.

They do not contain final authorization policy.

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

# Service Ownership

Memberships services own Membership business rules such as:

```text
create Membership

suspend Membership

restore Membership

remove Membership

change Membership Role

create Invitation

accept Invitation

revoke Invitation
```

Cross-module services may coordinate Organizations and Roles where required.

Services own transaction boundaries. Repositories receive a Prisma Client or Transaction Client; Memberships services do not use Prisma directly for Memberships persistence.

---

# Transactions

Membership workflows must use transactions when multiple writes form one invariant.

Examples:

```text
Accept Invitation
+
Create Membership
+
Mark Invitation ACCEPTED
```

and:

```text
Transfer Ownership
+
Change Target Role
+
Change Previous Owner Role
```

Partial success is not acceptable.

---

# Invitation Acceptance Atomicity

Invalid state:

```text
Membership created
+
Invitation still PENDING
```

after a failed acceptance workflow.

Acceptance should commit as one logical operation.

---

# Duplicate Membership Protection

Application checks alone are insufficient.

The database must protect:

```text
Organization + Profile
```

uniqueness.

Race conditions must not create duplicate Membership records.

---

# Invitation Concurrency

Two simultaneous attempts to accept the same invitation must not produce:

```text
two Memberships
```

or:

```text
multiple successful acceptances
```

Persistence constraints and transactions must protect the workflow.

---

# Domain Independence

Memberships is business agnostic.

It must not contain fields such as:

```text
DJ type

Order responsibility

Production department

Editorial access

Customer category
```

Domain-specific assignment belongs to Business Domains or future approved capabilities.

---

# Membership Metadata

Initial Membership persistence should remain minimal.

Do not add speculative fields such as:

```text
jobTitle

department

notes

preferences

domainRole

customPermissions
```

unless a validated reusable Core requirement exists.

---

# Invitation Metadata

Invitation persistence should contain only information required for:

- recipient identity;
- Organization relationship;
- intended Role;
- security;
- lifecycle;
- expiration;
- actor/history where approved.

Do not turn Invitations into a generic CRM contact model.

---

# Custom Roles

Memberships does not require custom Organization Roles for its initial implementation.

It references the canonical Roles Foundation.

If custom Roles are introduced later, Memberships should continue referencing:

```text
Role.id
```

through the approved evolved Role architecture.

---

# Membership Role Cardinality

Initial architecture assigns:

```text
one Role
per Membership
```

Not:

```text
many Roles per Membership
```

This keeps the first tenancy model simple and deterministic.

Fine-grained capabilities come through Permissions.

---

# Why One Role Per Membership

The initial model:

```text
Membership
→ Role
→ Permissions
```

is easier to reason about than:

```text
Membership
→ many Roles
→ merged Permissions
```

Multiple simultaneous Roles should only be introduced if real product requirements justify the complexity.

---

# Platform Administrator

A future platform-wide administrator concept must not be implemented by abusing OrganizationMembership.

Platform administration is distinct from tenant Membership.

If required, it needs a separate approved architecture.

---

# Organization Owner Is a Membership

OWNER is not a special global user type.

Correct:

```text
Profile
↓
OrganizationMembership
↓
OWNER Role
```

A Profile may be OWNER of one Organization and VIEWER of another.

---

# Memberships Foundation

The initial Memberships Foundation should establish:

```text
OrganizationMembership persistence

MembershipStatus

OrganizationInvitation persistence

InvitationStatus

Organization/Profile/Role relations

Membership lookup

Membership lifecycle services

Invitation lifecycle services

Membership uniqueness

Secure invitation mechanics

Transaction boundaries
```

---

# Production Authorization Boundary

Persistence and core lifecycle logic may be implemented before Permissions.

However, exposing administrative Membership mutations to production users requires approved authorization.

Therefore distinguish:

```text
Memberships Foundation
```

from:

```text
Fully Authorized Membership Management
```

---

# Implementation Sequence

Current tenancy sequence:

```text
Identity
   ✅
    ↓
Organizations
   ✅ specification
    ↓
Roles
   ✅ specification
    ↓
Memberships
   ← current
    ↓
Tenancy Integration
    ↓
Permissions
```

After Memberships is specified, the complete tenant creation workflow can be defined without temporary models.

---

# Non-Goals

Memberships Foundation does not implement:

```text
Permission engine

Custom Organization Roles

Billing seats

Subscription limits

Organization settings

Platform-wide admin roles

Domain-specific team structures

Generic HR employee management

Custom workflow assignments

Notification provider implementation

Audit persistence
```

---

# Future Capabilities

Possible future Memberships features include:

```text
Seat limits

Bulk invitations

Invitation resend policy

Membership rejoin workflows

Membership transfer

External identity provisioning

SCIM

Teams / subgroups

Custom Role support

Domain-specific member metadata extensions
```

These require validated requirements.

---

# Definition of Ready

Memberships is ready for implementation when:

- OrganizationMembership ownership is explicit.
- OrganizationInvitation ownership is explicit.
- Profile relationship is approved.
- Organization relationship is approved.
- Role relationship is approved.
- Membership states are approved.
- Invitation states are approved.
- Membership uniqueness is approved.
- Active Membership requires a valid Role.
- Invitation and Membership are separate entities.
- OWNER safety rules are understood.
- Invitation security model is defined sufficiently.
- Hard deletion is not the default Membership lifecycle.
- Permissions remain separate.
- SPEC, DATA_MODEL, FLOWS, API, PRISMA and TASKS agree.

---

# Definition of Done

Memberships Foundation is complete when:

- OrganizationMembership persistence exists.
- OrganizationInvitation persistence exists.
- UUID strategy is preserved.
- Organization/Profile Membership uniqueness is enforced.
- MembershipStatus exists.
- InvitationStatus exists.
- Every established Membership references a valid Role.
- ACTIVE Memberships cannot exist without Role.
- Membership lookup works.
- Membership suspension works.
- Membership restoration works.
- Membership removal works.
- Role replacement persistence works.
- OWNER safety is respected.
- Invitation creation works.
- Invitation acceptance works atomically.
- Invitation revocation works.
- Expired invitations cannot be accepted.
- Duplicate Memberships cannot be created.
- Invitation tokens are handled securely.
- Membership data is tenant-safe.
- No duplicate User model exists.
- No Role definition is duplicated.
- No Permission engine is introduced.
- Relevant tests pass.
- Prisma validation passes.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.

Fully authorized administrative Membership management additionally requires Permissions integration.

---

# Final Principle

Memberships defines belonging.

A Profile belongs to an Organization through OrganizationMembership.

That Membership holds one Role.

Invitations establish future Memberships.

Roles defines the Role.

Organizations defines the tenant.

Identity defines the person.

Permissions determines what the Membership may do.

Keep those responsibilities separate.
