---
title: Tenancy Architecture
version: 1.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - CORE.md
  - IDENTITY.md
  - SECURITY.md
  - DATA.md
  - PRISMA_IMPLEMENTATION.md
  - ../core/modules/organizations/SPEC.md
  - ../core/modules/organizations/DATA_MODEL.md
  - ../core/modules/organizations/FLOWS.md
  - ../core/modules/roles/SPEC.md
  - ../core/modules/roles/DATA_MODEL.md
  - ../core/modules/memberships/SPEC.md
  - ../core/modules/memberships/DATA_MODEL.md
  - ../core/modules/memberships/FLOWS.md
---

# Tenancy Architecture

## Purpose

This document defines the canonical tenancy architecture of Platform Core.

Tenancy is not an independent functional module.

It is the coordinated architecture through which:

```text
Identity
Organizations
Memberships
Roles
Permissions
```

work together to provide secure multi-tenant behavior.

Tenancy answers questions such as:

```text
Who is the authenticated person?

Which Organizations exist?

Which Organizations does that person belong to?

What Role does that Membership hold?

What operations may that Membership perform?

Which tenant context is currently active?

How is Organization ownership represented?

How is tenant isolation enforced?
```

---

# Core Principle

Platform Core tenancy is composed from independent capabilities.

Conceptually:

```text
Identity
    ↓
Organizations
    ↓
Memberships
    ↓
Roles
    ↓
Permissions
```

This represents collaboration, not entity ownership.

The actual ownership model is:

```text
Identity
└── Profile

Organizations
└── Organization

Memberships
├── OrganizationMembership
└── OrganizationInvitation

Roles
└── Role

Permissions
└── Permission
```

No additional:

```text
Tenant
```

entity is required.

An Organization is the tenant boundary.

---

# Tenancy Is Architecture, Not a Module

Do not create:

```text
src/core/modules/tenancy/
```

merely because tenancy coordinates several Platform Core capabilities.

Tenancy does not own persistence such as:

```text
Tenant
TenantUser
TenantRole
TenantMembership
```

The required concepts already have canonical owners.

Tenancy defines how those owners collaborate.

---

# Canonical Tenant

The Platform Core tenant is:

```text
Organization
```

Therefore the canonical tenant identifier is:

```text
Organization.id
```

Tenant-scoped entities normally reference:

```text
organizationId
```

Do not introduce a parallel persisted Tenant entity unless a future architectural decision explicitly replaces this model.

---

# Canonical Identity

Authentication is provided by:

```text
Supabase auth.users
```

Application identity is represented through:

```text
Profile
```

Conceptually:

```text
Supabase auth.users
        ↓
Profile
```

Memberships references:

```text
Profile.id
```

Do not introduce another application User entity.

---

# Canonical Membership

Tenant belonging exists through:

```text
OrganizationMembership
```

Conceptually:

```text
Profile
        ↓
OrganizationMembership
        ↓
Organization
```

OrganizationMembership is the canonical source of truth for the relationship between a Profile and an Organization.

Do not introduce competing persistence such as:

```text
organization_users

tenant_users

user_organizations

Profile.organizationIds

Organization.userIds
```

---

# Canonical Role Assignment

Role assignment exists on:

```text
OrganizationMembership.roleId
```

Conceptually:

```text
Profile
        ↓
OrganizationMembership
        ├────────────► Organization
        │
        └────────────► Role
```

A tenant Role is not a global property of Profile.

A Profile may have different Roles in different Organizations.

Example:

```text
Profile A

Organization 1
→ OWNER

Organization 2
→ MEMBER

Organization 3
→ VIEWER
```

Therefore do not add:

```text
Profile.roleId
```

for tenant authorization.

---

# Canonical Authorization Model

The intended authorization chain is:

```text
Authenticated Identity
        ↓
Profile
        ↓
ACTIVE OrganizationMembership
        ↓
Role
        ↓
Permissions
        ↓
Requested Operation
```

Membership establishes:

```text
belonging
```

Role establishes:

```text
authorization position
```

Permissions establishes:

```text
allowed capabilities
```

These concepts must remain separate.

---

# Responsibility Matrix

| Concern | Owner |
|---|---|
| Authentication | Identity |
| Application Profile | Identity |
| Tenant entity | Organizations |
| Organization lifecycle | Organizations |
| Tenant belonging | Memberships |
| Membership lifecycle | Memberships |
| Organization invitations | Memberships |
| Role definitions | Roles |
| Membership Role assignment | Memberships |
| Permission definitions | Permissions |
| Permission evaluation | Permissions |
| Organization ownership invariant | Organizations |
| OWNER Role definition | Roles |
| OWNER Membership persistence | Memberships |
| Active tenant context | Application/context integration |
| Tenant Membership source for RLS | Memberships |
| Tenant-scoped Domain data | Owning Domain |

---

# No Duplicate User Model

Platform Core must not introduce:

```text
User

TenantUser

OrganizationUser

MembershipUser
```

as alternative application identities.

The identity chain remains:

```text
Supabase auth.users
        ↓
Profile
```

---

# Organization as Tenant Boundary

Business Domains containing tenant-owned data should normally reference:

```text
organizationId
```

when the entity belongs to exactly one Organization.

Example:

```text
CopyOrder
├── id
├── organizationId
└── ...
```

The Domain owns its business entity.

Organizations owns the tenant.

Tenancy defines the isolation relationship.

---

# Domain Independence

Tenancy is business agnostic.

It must not contain concepts such as:

```text
DJ

Playlist

Track

Copistería

Pedido

Servicio

Cliente

SEO Project
```

Domains consume Platform Core tenancy.

Platform Core does not absorb Domain semantics.

---

# Global vs Tenant-Scoped Data

Not every entity requires an Organization.

Persistence ownership must explicitly determine whether data is:

```text
global

tenant-scoped

user-scoped

public reference data
```

Do not mechanically add:

```text
organizationId
```

to every table.

For example, global editorial or reference data may legitimately exist outside tenant ownership.

---

# Complete Tenant Onboarding

Creating an Organization row alone does not create a complete operational tenant.

Complete Organization onboarding requires:

```text
Authenticated Profile

Organization

OWNER Role

ACTIVE OWNER Membership
```

---

# Complete Organization Creation

Canonical flow:

```text
Authenticated User
        ↓
Resolve Profile
        ↓
Validate Organization Input
        ↓
Resolve OWNER Role
        ↓
BEGIN TRANSACTION
        ↓
Create Organization
        ↓
Create OrganizationMembership
        ↓
organizationId = Organization.id
profileId = Profile.id
roleId = OWNER.id
status = ACTIVE
        ↓
COMMIT
```

Result:

```text
Organization
+
exactly one ACTIVE OWNER Membership
```

---

# Organization Creation Atomicity

The following committed state is invalid:

```text
Organization exists
+
no OWNER Membership
```

If initial OWNER Membership creation fails:

```text
ROLLBACK Organization creation
```

A tenant must not become operational partially.

---

# Ownership Representation

Organization ownership is represented through:

```text
OrganizationMembership
+
Role.key = OWNER
```

Do not introduce:

```text
Organization.ownerId

Organization.ownerUserId

Organization.ownerProfileId

Profile.isOwner

OrganizationMembership.isOwner
```

as competing ownership sources.

---

# Ownership Invariant

For every operational Organization:

```text
exactly one ACTIVE OrganizationMembership
whose Role is OWNER
```

Responsibility is distributed deliberately:

```text
Organizations
→ defines the invariant

Roles
→ defines OWNER

Memberships
→ persists the OWNER assignment
```

---

# OWNER Is Organization Scoped

OWNER is not a global identity property.

A Profile may be:

```text
OWNER
```

in one Organization and:

```text
MEMBER
```

in another Organization.

---

# OWNER Mutation Protection

The sole active OWNER must not be normally:

```text
suspended

removed

demoted
```

Any operation that would produce:

```text
zero active OWNERs
```

must fail.

Normal workflows must also prevent:

```text
multiple active OWNERs
```

---

# Ownership Transfer

Ownership transfer is a dedicated cross-module workflow.

Conceptually:

```text
Current OWNER Membership
        ↓
Target ACTIVE Membership
        ↓
Resolve OWNER Role
        ↓
Resolve approved previous-owner Role
        ↓
Validate same Organization
        ↓
BEGIN TRANSACTION
        ↓
Target Membership.roleId = OWNER
        ↓
Previous OWNER.roleId = approved non-owner Role
        ↓
Validate Ownership Invariant
        ↓
COMMIT
```

The operation must be atomic.

---

# Previous Owner Policy

The Role assigned to the previous OWNER must be explicit.

Do not silently assume:

```text
ADMIN
```

until that policy is approved.

The ownership-transfer contract must specify the destination Role.

---

# OWNER Invitation

Normal invitation workflows must not create another OWNER.

Invalid:

```text
Create Invitation
role = OWNER
```

Ownership changes use:

```text
Ownership Transfer
```

not normal invitation or normal Role-change workflows.

---

# Membership States

Canonical Membership states are:

```text
ACTIVE

SUSPENDED

REMOVED
```

Only:

```text
ACTIVE
```

represents normal tenant belonging.

---

# Invitation States

Canonical OrganizationInvitation states are:

```text
PENDING

ACCEPTED

REVOKED

EXPIRED
```

Invitation and Membership lifecycle must remain separate.

Do not represent an invitation through:

```text
MembershipStatus = INVITED
```

---

# Invitation to Membership

Conceptually:

```text
OrganizationInvitation
        ↓
Recipient Authenticates
        ↓
Resolve Profile
        ↓
Validate Recipient Identity
        ↓
Validate Organization
        ↓
Validate Role
        ↓
Validate Membership State
        ↓
BEGIN TRANSACTION
        ↓
Create or Restore Membership
        ↓
Mark Invitation ACCEPTED
        ↓
COMMIT
```

---

# Invitation Security

Possession of an invitation token alone is not Membership authority.

Required:

```text
Valid Invitation Token
+
Authenticated Matching Identity
```

Raw invitation secrets must not be persisted.

Preferred model:

```text
Raw Token
→ delivered transiently

Token Hash
→ persisted
```

---

# Authentication Is Not Membership

An authenticated user does not automatically belong to an Organization.

Correct flow:

```text
Authentication
        ↓
Profile
        ↓
Membership lookup
```

Therefore:

```text
Authenticated
≠
Organization Member
```

---

# Membership Is Not Authorization

An ACTIVE Membership does not automatically permit every operation.

Correct flow:

```text
ACTIVE Membership
        ↓
Role
        ↓
Permissions
```

Therefore:

```text
Organization Member
≠
Authorized for every Organization operation
```

---

# Effective Tenant Access

Normal tenant access requires multiple conditions.

Conceptually:

```text
Authenticated Identity
        ↓
Profile exists
        ↓
Organization exists
        ↓
Organization lifecycle permits access
        ↓
OrganizationMembership exists
        ↓
Membership status = ACTIVE
        ↓
Role is valid
        ↓
Permission permits requested operation
```

Failure at any required step denies the operation.

---

# Multiple Organizations

A Profile may belong to:

```text
zero

one

many
```

Organizations.

Example:

```text
Profile
├── Company A → OWNER
├── Company B → ADMIN
└── Company C → VIEWER
```

This enables one identity to participate in several SaaS tenants.

---

# List User Organizations

Canonical tenant-discovery flow:

```text
Authenticated User
        ↓
Resolve Profile
        ↓
Find ACTIVE Memberships
        ↓
Resolve Organizations
        ↓
Filter Organization lifecycle where required
        ↓
Return accessible Organizations
```

Memberships owns belonging.

Organizations owns Organization data.

---

# Active Organization Context

Applications may maintain an:

```text
active Organization
```

context.

This is a runtime/application concept.

It is not another persisted tenant entity.

---

# Switch Active Organization

Canonical validation:

```text
Authenticated Profile
        ↓
Target Organization
        ↓
Find OrganizationMembership
        ↓
Membership ACTIVE?
        ├── NO → deny
        └── YES
             ↓
           Organization permits access?
             ├── NO → deny
             └── YES
                  ↓
                Set Active Context
```

---

# Active Context Is Not Authority

The client selecting:

```text
organizationId = X
```

does not prove Membership.

Every protected server operation must validate the persisted relationship or consume a trusted server-side tenant context that has already performed that validation.

---

# Client Tenant Claims

Never trust client claims such as:

```text
I belong to this Organization.

I am OWNER.

My Role is ADMIN.

My Membership is ACTIVE.

This is my active tenant.
```

Tenant authority is resolved from persisted server-side data.

---

# Organization Lifecycle and Membership Lifecycle

Organization lifecycle and Membership lifecycle are independent.

Example:

```text
Organization = SUSPENDED

Membership = ACTIVE
```

The Membership remains persisted.

Normal tenant access may still be denied because the Organization is suspended.

---

# Organization Suspension

Suspending an Organization must not automatically mutate all Memberships into:

```text
SUSPENDED
```

Organization state and Membership state represent different concepts.

---

# Organization Restoration

Restoring an Organization does not automatically restore Memberships.

Example:

```text
Organization → ACTIVE

Membership A → ACTIVE
Membership B → SUSPENDED
Membership C → REMOVED
```

Each Membership retains its own lifecycle state.

---

# Membership Suspension

Suspending:

```text
ACTIVE
→ SUSPENDED
```

must remove normal tenant participation.

The Membership and its Role remain persisted.

---

# Membership Removal

Removing:

```text
ACTIVE
→ REMOVED
```

preserves the durable relationship while ending normal tenant participation.

Hard deletion is not the default Membership lifecycle.

---

# Membership Restoration

Restoration must explicitly revalidate:

```text
Organization state

Role validity

authorization

OWNER safety where relevant
```

Do not blindly restore stale authority.

---

# Role Assignment

Every established Membership references one Role.

Initial architecture:

```text
OrganizationMembership
→ one roleId
```

Not:

```text
OrganizationMembership
→ many Roles
```

---

# Canonical Initial Roles

Initial system Roles are:

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

They are global Platform Core reference data.

Tenant-specific authorization position comes from:

```text
OrganizationMembership.roleId
```

---

# No Organization-Specific Roles Initially

Initial tenancy must not introduce:

```text
Role.organizationId
```

Custom tenant Roles are deferred until validated requirements justify them.

---

# Role Hierarchy Is Not Authorization

Do not authorize operations through:

```text
OWNER > ADMIN > MANAGER > MEMBER > VIEWER
```

or:

```text
Role.sortOrder
```

as a generic permission engine.

Role ordering may support presentation or human semantics.

Permissions defines authorization capabilities.

---

# Permissions Boundary

Tenancy Foundation can exist before Permissions is implemented.

However, production-facing operations such as:

```text
invite Member

remove Member

suspend Member

restore Member

change Membership Role
```

require approved authorization before exposure to users.

---

# No Temporary Permission Engine

Do not create temporary mechanisms such as:

```text
canManageMembers Boolean

canInvite Boolean

isAdmin Boolean

permissionFlags

permissionsJson

numeric Role hierarchy authorization
```

inside Organizations, Memberships or Roles.

Missing Permissions is a dependency.

It is not justification to invent another authorization architecture.

---

# Bootstrap Operations Before Permissions

Limited structural workflows may exist before full Permissions.

Examples:

```text
Create initial OWNER during Organization onboarding

Authenticated recipient accepts an invitation intended for them
```

These use explicit workflow-specific invariants.

They are not a general Permissions substitute.

---

# Tenant-Scoped Persistence

A tenant-owned entity should normally carry:

```text
organizationId
```

when it belongs to exactly one Organization.

Example:

```text
DomainEntity
├── id
├── organizationId
└── ...
```

The Domain owns the entity.

Organization provides the tenant boundary.

---

# Tenant Isolation

Tenant-scoped data must not leak across Organizations.

Conceptually:

```text
Profile A
Membership in Organization X
```

must not imply access to:

```text
Organization Y data
```

without a separate valid Membership in Organization Y.

---

# RLS Foundation

Memberships provides the canonical relationship required by tenant-aware PostgreSQL RLS.

Conceptually:

```text
authenticated identity
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

---

# Canonical RLS Membership Predicate

The reusable conceptual rule is:

```text
Profile has ACTIVE Membership
for target organizationId
```

Do not create Domain-specific copies of tenant Membership persistence.

---

# RLS Is Defense in Depth

Application services must enforce authorization correctly even if the Prisma database connection:

```text
bypasses RLS
```

or is not constrained by the same PostgreSQL policies used for direct Supabase access.

Therefore the desired security model is:

```text
Application Authorization
+
Database RLS
```

where appropriate.

RLS is not a replacement for service-layer authorization.

---

# RLS and Permissions

RLS may answer:

```text
May this identity access rows belonging to this Organization?
```

Permissions may answer:

```text
May this Membership perform this specific operation?
```

These layers cooperate but are not equivalent.

---

# Membership Table Security

Do not expose every OrganizationMembership row to every authenticated Profile.

Membership relationships are tenant-sensitive data.

---

# Invitation Table Security

OrganizationInvitation is especially security-sensitive.

It contains data such as:

```text
recipient email

token hash

Organization relationship

Role intent

inviter relationship
```

Preferred architecture:

```text
writes
→ trusted server

token resolution
→ trusted server

administrative reads
→ authorized tenant server flow
```

---

# Domain Authorization

A tenant-owned Domain operation should conceptually follow:

```text
Request
        ↓
Authentication
        ↓
Profile
        ↓
Active Organization Context
        ↓
Membership
        ↓
Role / Permissions
        ↓
Domain Service
        ↓
Domain Persistence
```

Domains must not invent their own tenant-user persistence.

---

# Copy Platform Example

Conceptually:

```text
Profile
        ↓
OrganizationMembership
        ↓
Copy Shop Organization
        ↓
Copy Domain
        ↓
Orders
Services
Customers
Production Workflows
```

Operational copy-shop concepts remain owned by the Copy Domain.

---

# DJ Platform Example

Tenant-owned DJ SaaS capabilities may conceptually use:

```text
Profile
        ↓
OrganizationMembership
        ↓
Organization
        ↓
DJ Domain
```

However, global editorial/public DJ data may legitimately remain global.

Tenancy must not force Organization ownership onto data that is intentionally platform-wide.

---

# SaaS Reuse

The tenancy architecture is reusable Platform Core infrastructure for multiple products.

Examples:

```text
DJ Platform

Copy Platform

SEO Platform

CRM products

future vertical SaaS products
```

No product-specific Domain logic should leak into tenancy.

---

# Data Ownership

Tenant isolation does not change entity ownership.

Example:

```text
CopyOrder.organizationId
```

does not mean Organizations owns CopyOrder.

Correct ownership:

```text
Copy Domain
→ CopyOrder

Organizations
→ Organization

Tenancy
→ relationship and isolation architecture
```

---

# Repository Ownership

Each module retains its own persistence boundary.

```text
Organizations
→ Organization Repository

Memberships
→ Membership Repository
→ Invitation Repository

Roles
→ Role Repository

Domains
→ Domain Repositories
```

Cross-module transactions may coordinate those repositories.

---

# Cross-Module Transactions

Some tenancy invariants require transactions spanning several module owners.

Examples:

```text
Organization
+
Initial OWNER Membership
```

```text
Ownership Transfer
```

```text
Invitation Acceptance
+
Membership Creation / Restoration
```

A cross-module transaction does not transfer entity ownership.

---

# Tenancy Orchestration

Cross-module tenancy workflows may use an application/orchestration service whose purpose is coordination.

An orchestrator may:

```text
call Identity

call Organizations

call Memberships

call Roles

later call Permissions
```

It must not recreate their persistence logic.

---

# Orchestrator Rule

Correct:

```text
Organization Onboarding Orchestrator
        ↓
Organizations.create
Roles.resolveRequiredRole
Memberships.create
```

Incorrect:

```text
Tenancy Module
        ↓
owns Organization
owns Membership
owns Role
```

---

# Source Ownership

Current intended source structure:

```text
src/core/
├── identity/
│   ├── auth/
│   └── profile/
└── modules/
    ├── organizations/
    ├── roles/
    └── memberships/
```

Permissions will later live under:

```text
src/core/modules/permissions/
```

Tenancy architecture does not require:

```text
src/core/modules/tenancy/
```

---

# Application Composition

`src/app` may compose tenancy capabilities.

Example:

```text
Private Route
        ↓
Resolve Profile
        ↓
Resolve active Organization
        ↓
Validate Membership
        ↓
Render tenant UI
```

`src/app` must not contain canonical Membership or authorization business rules.

---

# Shared Boundary

`src/shared` may contain reusable technical utilities.

It must not own:

```text
Organization Membership rules

OWNER invariant

Role assignment

Permission evaluation
```

Being reusable does not automatically make a capability Shared.

Reusable SaaS business capabilities belong to Platform Core.

---

# Infrastructure Boundary

`src/lib` may contain infrastructure adapters such as:

```text
Supabase

Prisma

external integration helpers
```

Infrastructure does not own tenancy business rules.

---

# Generated Boundary

`src/generated` contains generated artifacts such as the Prisma client.

Generated types do not define architectural ownership.

---

# Tenant Context

The application may eventually use a trusted server-side resolved projection such as:

```text
TenantContext
├── profileId
├── organizationId
├── membershipId
├── roleId
└── roleKey
```

TenantContext is a runtime projection.

It is not a persisted Core entity.

---

# Tenant Context Construction

Conceptually:

```text
Authenticated Identity
        ↓
Profile
        ↓
Organization
        ↓
ACTIVE Membership
        ↓
Role
        ↓
TenantContext
```

Permissions may later be resolved from this trusted context.

---

# Tenant Context Validation

TenantContext must never be built solely from:

```text
URL organizationId

cookie organizationId

localStorage

client-supplied Role

client-supplied Membership
```

Persisted server-side data must establish the tenant relationship.

---

# Context Invalidation

Tenant context becomes invalid when relevant state changes.

Examples:

```text
Membership SUSPENDED

Membership REMOVED

Membership Role changed

Organization SUSPENDED

Organization ARCHIVED

ownership transferred
```

Caching and context layers must not continue granting stale authority.

---

# Cache Safety

Tenant-aware cache keys must contain the required tenant identity.

Never allow:

```text
Organization A result
```

to be reused as:

```text
Organization B result
```

because the tenant boundary was omitted from the cache key.

---

# URLs and Organization Context

The UI may represent Organization context through:

```text
route

subdomain

slug

session

server-side context
```

The transport mechanism itself provides no authorization.

Example:

```text
/org/acme/settings
```

still requires persisted Membership and Permission validation.

---

# Organization Slug

A future Organization slug may identify an Organization in URLs.

A slug is not the authorization source.

Security decisions must resolve:

```text
canonical Organization

+

canonical Membership
```

---

# Public Organization Data

Some Organization information may eventually be public.

Public Organization visibility does not imply Membership.

Tenant-private resources still require their own access rules.

---

# Platform Administration

Platform-wide administration is distinct from Organization Membership.

Do not implement platform administrators through:

```text
special Organization

special OWNER Membership

Profile.roleId = SUPER_ADMIN
```

without a separate approved architecture.

---

# Billing Boundary

Billing may eventually depend on:

```text
Organization

subscription

ACTIVE Membership count
```

but Billing remains its own Platform Core capability.

Memberships does not own subscription authority.

---

# Seat Counting

If future plans charge per seat, Billing may consume:

```text
count ACTIVE Memberships
```

according to its own billing policy.

Do not prematurely add:

```text
billable Boolean
```

to OrganizationMembership.

---

# Audit Boundary

Tenant security changes should eventually be auditable.

Important events include:

```text
Organization created

Membership created

Membership suspended

Membership restored

Membership removed

Membership Role changed

Invitation created

Invitation accepted

Invitation revoked

Ownership transferred
```

Audit owns persistence of audit records.

Each entity-owning module owns the semantic events it requests or emits.

---

# Notifications Boundary

Memberships may produce:

```text
Invitation created
```

Notifications handles:

```text
email delivery
```

Tenancy does not own notification-provider integrations.

---

# Organization Deletion

Organization hard deletion is intentionally not a normal Foundation operation.

It potentially affects:

```text
Memberships

Invitations

Domain data

Audit

Billing

Storage

retention requirements
```

Therefore Organization hard deletion requires explicit coordinated architecture.

---

# Membership Hard Delete

Normal Membership lifecycle uses:

```text
REMOVED
```

not hard delete.

This preserves the durable tenant relationship.

---

# Invitation Hard Delete

Normal Invitation lifecycle uses:

```text
ACCEPTED

REVOKED

EXPIRED
```

rather than hard deletion.

Retention or privacy requirements may later define physical deletion separately.

---

# Referential Integrity

Tenant relationships should use real foreign keys.

OrganizationMembership requires:

```text
organizationId → Organization.id

profileId → Profile.id

roleId → Role.id
```

Avoid loose string-based relationship substitutes.

---

# Identifier Strategy

Platform Core uses UUID identifiers for tenancy entities.

Expected:

```text
Profile.id                  → UUID

Organization.id             → UUID

OrganizationMembership.id   → UUID

Role.id                     → UUID

OrganizationInvitation.id   → UUID
```

Do not introduce CUID for new Platform Core tenancy entities.

---

# Concurrency

Tenancy invariants must remain valid under concurrent requests.

Important races include:

```text
duplicate Membership creation

duplicate invitation creation

simultaneous invitation acceptance

simultaneous ownership transfers

OWNER demotion vs ownership transfer

Membership suspension vs Role change
```

Database constraints and transactions provide final protection.

---

# Membership Uniqueness

Required database invariant:

```text
UNIQUE (
  organizationId,
  profileId
)
```

Application pre-checks alone are insufficient.

---

# Pending Invitation Uniqueness

Required invariant:

```text
at most one PENDING invitation
per
Organization + normalized recipient email
```

Database enforcement should protect against concurrent creation.

---

# OWNER Database Enforcement

The invariant:

```text
exactly one ACTIVE OWNER
per operational Organization
```

depends on:

```text
OrganizationMembership.status

OrganizationMembership.roleId

Role.key
```

Because OWNER semantics live in Role, this is not safely represented by a simple static unique index without coupling the database to a specific Role UUID.

Initial Foundation therefore relies on:

```text
transactional workflows

OWNER safety services

integration tests
```

A stronger PostgreSQL mechanism may be introduced later through explicit architectural review.

---

# No Hard-Coded OWNER UUID

Do not encode ownership through:

```text
OWNER_ROLE_ID
```

inside database constraints.

Canonical OWNER semantics are resolved through:

```text
Role.key = OWNER
```

---

# Tenant RLS Rollout

Tenant-aware RLS should be introduced only after:

```text
Identity mapping

Organizations

Roles

Memberships
```

are real and stable.

Do not build temporary RLS policies around provisional tenancy structures.

---

# Tenancy Integration Milestone

Tenancy Integration joins the existing Core foundations.

Required capabilities include:

```text
Complete Organization onboarding

Initial OWNER Membership

List user Organizations

Active Organization switching

Membership-based tenant isolation

Ownership transfer

Tenant context construction
```

---

# Tenancy Integration Prerequisites

Before implementing the integration milestone:

```text
Identity implemented

Organizations Foundation implemented

Roles Foundation implemented

Memberships Foundation implemented

canonical Roles seeded

real Prisma relations available
```

Documentation alone does not satisfy these implementation prerequisites.

---

# Tenancy Integration Does Not Own New Entities

The integration milestone must not introduce:

```text
Tenant

TenantMembership

TenantRole

TenantUser
```

The existing canonical entities are sufficient.

---

# Permissions Sequence

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

This allows Permissions to operate against real tenant relationships rather than provisional authorization structures.

---

# Documentation Responsibilities

Tenancy architecture depends on the canonical Core packages:

```text
Organizations
├── SPEC
├── DATA_MODEL
├── FLOWS
├── API
├── PRISMA
└── TASKS

Roles
├── SPEC
├── DATA_MODEL
├── FLOWS
├── API
├── PRISMA
└── TASKS

Memberships
├── SPEC
├── DATA_MODEL
├── FLOWS
├── API
├── PRISMA
└── TASKS
```

`TENANCY.md` defines how these packages integrate.

It does not replace their module-specific contracts.

---

# Implementation Readiness Rule

An AI coding agent may implement tenancy integration only when the required module foundations actually exist in source code.

If an approved dependency is missing:

```text
STOP

Report dependency

Implement the prerequisite approved module first
```

Do not invent temporary architecture.

---

# AI Agent Rules

AI agents working on tenancy must not:

```text
create duplicate User models

create Tenant entity

add Profile.roleId

add Organization.roleId

add Organization.ownerId

add Organization.ownerUserId

create MembershipRole enum

create temporary Permissions

use Role.sortOrder as authorization

hard-code OWNER UUID

trust client tenant context

create alternate Membership tables

bypass Membership state

bypass Organization state

move Domain logic into Platform Core
```

---

# AI Agent Cross-Module Rule

When a workflow crosses module boundaries:

```text
identify each owner

use its approved service/repository boundary

coordinate atomically when required
```

Do not move all logic into whichever module initiates the operation.

---

# Security Invariants

The following are non-negotiable:

```text
Authentication does not equal Membership.

Membership does not equal Permission.

One Profile may belong to many Organizations.

One Membership belongs to exactly one Organization.

One Membership references exactly one Role initially.

Only ACTIVE Membership grants normal tenant belonging.

Organization lifecycle also affects tenant access.

Every operational Organization has exactly one ACTIVE OWNER.

OWNER cannot be created through normal invitation.

Tenant context is resolved server side.

Cross-tenant data leakage is forbidden.
```

---

# Data Model Invariants

Required:

```text
OrganizationMembership
→ unique Organization + Profile

OrganizationMembership.roleId
→ required

OrganizationInvitation
→ separate from Membership

Invitation recipient
→ may exist without Profile

Invitation raw token
→ never persisted

Membership removal
→ durable REMOVED state

Profile tenant Role
→ not stored globally

Organization owner
→ not stored as ownerId
```

---

# Tenancy Validation Scenarios

At minimum, integration testing must validate:

```text
Create Organization
→ one OWNER Membership created

Create Organization failure
→ no partial operational tenant

Profile belongs to Organization A
→ can resolve A

Profile not in Organization B
→ cannot resolve B as tenant

Membership SUSPENDED
→ tenant access denied

Membership REMOVED
→ tenant access denied

Organization SUSPENDED
→ normal tenant access denied

Membership Role change
→ affected tenant context invalidated

OWNER suspension attempt
→ rejected

OWNER removal attempt
→ rejected

second OWNER through normal flow
→ rejected

ownership transfer
→ exactly one OWNER before and after

invitation acceptance
→ Membership created/restored atomically

duplicate Membership
→ database rejected

cross-tenant resource request
→ denied
```

---

# Tenant Isolation Matrix

| Organization State | Membership State | Normal Tenant Relationship |
|---|---|---|
| ACTIVE | ACTIVE | Allowed |
| ACTIVE | SUSPENDED | Denied |
| ACTIVE | REMOVED | Denied |
| ACTIVE | None | Denied |
| SUSPENDED | ACTIVE | Denied |
| ARCHIVED | ACTIVE | Denied |

Fine-grained Permissions are evaluated afterward where required.

---

# Future Capabilities

Potential future tenancy capabilities include:

```text
custom Organization Roles

multiple Roles per Membership

teams

sub-organizations

Organization hierarchies

SCIM

SSO

enterprise identity provisioning

platform administration

delegated Organization ownership

seat-based billing
```

These should not be implemented without validated requirements.

---

# Non-Goals

This architecture does not define:

```text
Domain-specific employee structures

CRM contacts

DJ personas

editorial roles

production departments

subscription plans

billing rules

notification providers

audit persistence

custom Role editor

platform super-admin architecture
```

---

# Definition of Ready

Tenancy Integration is ready for implementation when:

- Identity/Profile implementation is stable.
- Organizations Foundation is implemented.
- Roles Foundation is implemented.
- Memberships Foundation is implemented.
- Canonical Role seed exists.
- OWNER resolves reliably by key.
- Organization/Profile Membership uniqueness exists.
- Membership lifecycle exists.
- Active Membership lookup exists.
- Organization lifecycle is available.
- Transaction boundaries are approved.
- Active Organization context strategy is sufficiently defined.
- Identity-to-Profile mapping for RLS is confirmed.
- No competing tenant model exists.
- Required automated tests can be written.

---

# Definition of Done

Tenancy Integration is complete when:

- Organization onboarding creates the initial OWNER Membership atomically.
- Operational Organizations preserve the required OWNER relationship.
- User Organization listing uses ACTIVE Memberships.
- Active Organization switching validates Membership.
- Tenant context is built from persisted server-side data.
- Membership suspension invalidates normal tenant access.
- Membership removal invalidates normal tenant access.
- Organization suspension invalidates normal tenant access.
- OWNER mutation safety is enforced.
- Ownership transfer is atomic.
- Membership-based tenant isolation exists.
- Tenant-owned Domain persistence can safely reference Organization.
- Cross-tenant isolation tests pass.
- No duplicate User model exists.
- No duplicate Membership system exists.
- No global Profile tenant Role exists.
- No Organization ownerId exists.
- No temporary Permission engine exists.
- Prisma validation passes.
- TypeScript passes.
- Lint passes.
- Relevant automated tests pass.
- Architecture documentation matches implementation.

Permissions may remain a subsequent milestone for complete fine-grained authorization.

---

# Final Principle

An Organization is the tenant.

A Profile represents the application identity.

A Profile belongs to an Organization through OrganizationMembership.

That Membership holds one Role.

Roles defines the authorization position.

Permissions defines allowed capabilities.

Organizations defines the tenant and its ownership invariant.

Memberships defines belonging.

Identity defines the person.

Tenancy is the architecture that makes those independent capabilities operate as one secure multi-tenant system.

Do not create another layer of entities for concepts that already have canonical owners.