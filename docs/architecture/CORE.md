---
title: Platform Core
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - SOURCE_STRUCTURE.md
  - PROJECT_STRUCTURE.md
  - IDENTITY.md
  - TENANCY.md
  - API.md
  - SECURITY.md
  - PRISMA_IMPLEMENTATION.md
  - ../core/README.md
---

# Platform Core

## Purpose

Platform Core is the reusable SaaS foundation shared by the products built within this ecosystem.

It provides capabilities that are useful across multiple business applications while remaining independent from any specific industry or business vertical.

Platform Core is not a product.

Products are created by combining:

```text
Platform Core
+
Business Domain
+
Application Layer
```

Examples:

```text
Platform Core + DJ Domain
→ DJ Platform

Platform Core + Copy Domain
→ Copy Platform

Platform Core + SEO Domain
→ SEO Platform
```

---

# Core Principle

The fundamental separation is:

```text
Reusable SaaS behavior
→ Platform Core

Business-specific behavior
→ Domain

Business-agnostic technical reuse
→ Shared

External technical connectivity
→ Infrastructure
```

This distinction is architectural.

It must not be replaced by superficial code reuse.

---

# Platform Core Is Not Business-Free

Platform Core is business agnostic with respect to a specific vertical.

That does not mean it contains no rules.

Platform Core owns reusable SaaS rules such as:

```text
Organization lifecycle

Membership lifecycle

Role definitions

Permission evaluation

invitation lifecycle

tenant ownership invariants
```

These are real application rules, but they are reusable across different SaaS products.

---

# Domain Business Logic

Product-specific behavior belongs to Domains.

Examples:

```text
Track
Artist
Playlist
Festival
DJ ranking
```

belong to the DJ Domain.

Examples:

```text
Order
Print job
Production state
Delivery workflow
```

belong to the Copy Domain.

Examples:

```text
SEO keyword
SERP project
ranking analysis
```

belong to the SEO Domain.

Platform Core must not know these concepts.

---

# Source Location

Platform Core source code lives under:

```text
src/core/
```

Current foundational structure:

```text
src/core/
├── identity/
│   ├── auth/
│   └── profile/
└── modules/
    └── organizations/
```

Functional Platform Core modules are implemented under:

```text
src/core/modules/
```

Identity is foundational and remains outside that modules directory.

---

# Core Structure

Conceptually:

```text
Platform Core
│
├── Identity
│   ├── Authentication
│   └── Profile
│
├── Organizations
│
├── Roles
│
├── Memberships
│
├── Permissions
│
└── future reusable modules
```

Tenancy coordinates several of these capabilities but is not itself a Core module.

---

# Identity

Identity answers:

```text
Who is the actor?
```

Identity includes:

```text
Authentication

Profile
```

The current architecture uses:

```text
Supabase auth.users
```

as the canonical authentication identity source.

The application `Profile` represents that identity inside Platform Core.

---

# Profile Ownership

Profile belongs to Identity.

Do not create a separate:

```text
Profiles module
```

under:

```text
src/core/modules/
```

The canonical structure remains:

```text
src/core/identity/profile/
```

Profile does not own:

```text
Role

Organization

Membership

Permission
```

---

# Organizations

Organizations owns:

```text
Organization
```

Organization is the canonical tenant entity.

Organizations establishes the tenant boundary used throughout Platform Core.

Organizations does not own:

```text
OrganizationMembership

OrganizationInvitation

Role

Permission

RolePermission
```

---

# Roles

Roles owns:

```text
Role
```

Initial canonical system Roles are:

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

Roles are global reference data in the initial Platform Core architecture.

A Role definition does not establish tenant belonging by itself.

---

# Memberships

Memberships owns:

```text
OrganizationMembership

OrganizationInvitation
```

Membership establishes the relationship:

```text
Profile
        ↓
OrganizationMembership
        ↓
Organization
```

The Membership also references the Role held inside that Organization.

---

# Permissions

Permissions owns:

```text
Permission

RolePermission
```

Initial authorization uses explicit RBAC:

```text
ACTIVE OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

Permissions determines whether an actor has an approved capability.

The owning Core module or Domain still validates whether the requested operation is valid for the target resource and lifecycle state.

---

# Tenancy

Tenancy is an architectural concern.

It coordinates:

```text
Identity

Organizations

Roles

Memberships

Permissions
```

Tenancy is not a separate persisted entity.

Do not create:

```text
Tenant

TenantUser

TenantMembership

TenantRole
```

as parallel abstractions to the approved model.

Do not create:

```text
src/core/modules/tenancy/
```

The canonical tenant remains:

```text
Organization
```

Detailed tenancy rules are defined in:

```text
docs/architecture/TENANCY.md
```

---

# Foundational Ownership Model

Canonical ownership is:

```text
Identity
└── Profile

Organizations
└── Organization

Roles
└── Role

Memberships
├── OrganizationMembership
└── OrganizationInvitation

Permissions
├── Permission
└── RolePermission
```

Entity ownership must remain explicit.

Cross-module workflows do not transfer entity ownership.

---

# Organization Ownership

Tenant ownership is represented through:

```text
OrganizationMembership
+
OWNER Role
```

Do not add:

```text
ownerId

ownerUserId

ownerProfileId
```

to Organization as a second ownership system.

The canonical ownership relationship remains Membership-based.

---

# Core Authorization Model

Normal tenant authorization follows:

```text
Authenticated Identity
        ↓
Profile
        ↓
Organization
        ↓
ACTIVE OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

Each stage has a different responsibility.

---

# Authentication Is Not Membership

Authentication proves identity.

It does not prove that the Profile belongs to an Organization.

Incorrect:

```text
Authenticated Profile
→ tenant access
```

Correct normal tenant flow:

```text
Authenticated Profile
+
ACTIVE OrganizationMembership
→ tenant belonging
```

---

# Membership Is Not Permission

Membership proves tenant belonging.

It does not grant every action automatically.

Example:

```text
ACTIVE Membership
```

does not automatically imply:

```text
memberships.remove
```

Authorization remains explicit.

---

# Role Is Not Permission

Role identifies an authorization position.

Access is not determined from:

```text
Role.sortOrder
```

or from an implicit role hierarchy.

Permissions are granted explicitly through:

```text
RolePermission
```

---

# OWNER Is Not Allow-All

OWNER is a canonical Role.

It is not a hard-coded authorization bypass.

Do not implement:

```text
if role == OWNER:
    allow everything
```

OWNER receives explicit Permission mappings.

New Permissions are not automatically granted to OWNER.

---

# Core Permissions and Domain Permissions

Platform Core Permissions provides the reusable authorization mechanism.

Core modules may define permissions such as:

```text
organizations.read

organizations.update

memberships.read

invitations.create
```

Domains may define product-specific permissions such as:

```text
copy.orders.update

dj.playlists.create

seo.projects.manage
```

The permission key may be Domain-specific.

The authorization engine remains Platform Core.

---

# Domain Authorization Ownership

Example:

```text
Permissions
→ evaluates copy.orders.update

Copy Domain
→ decides whether this specific Order may be updated
```

The Domain does not create its own competing authorization engine.

Platform Core does not absorb the Order business rules.

---

# Current Specified Core Capabilities

The current foundational Platform Core capabilities are:

```text
Identity

Organizations

Roles

Memberships

Permissions
```

Identity already has source implementation.

The functional Core modules have been architecturally specified and are implemented according to their approved dependency sequence.

---

# Current Foundational Sequence

The current dependency sequence is:

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

This sequence describes foundational implementation dependencies.

It does not make Tenancy a Core module.

---

# Planned Core Modules

Planned reusable Core capabilities include:

```text
Notifications

Audit

Settings

Billing

Storage
```

Each must be specified before implementation.

The fact that a capability is potentially reusable does not automatically mean it belongs in Core.

---

# Candidate Core Capabilities

Other capabilities may eventually become Platform Core modules if actual product requirements justify them.

Examples could include:

```text
Feature Flags

Usage Metering

API Keys

Background Job coordination

Entitlements
```

These are not automatically part of the current Core architecture.

They require explicit specification and architectural approval before implementation.

---

# What Belongs to Platform Core

A capability belongs to Platform Core when it represents reusable SaaS behavior that should operate consistently across multiple products.

Examples include:

```text
authentication

application identity

Organizations

Memberships

Roles

Permissions

tenant invitations

notifications

billing

audit

settings

storage abstractions
```

where those capabilities remain independent of a specific business Domain.

---

# What Does Not Belong to Platform Core

Product-specific concepts do not belong in Platform Core.

Examples:

```text
Tracks

Artists

Playlists

Festivals

Print Orders

Production Jobs

SEO Keywords

Products

Restaurant Reservations
```

These belong to their corresponding Domains.

---

# Dashboard Is Not a Core Entity

A dashboard is primarily application composition and presentation.

Platform Core modules may provide data or capabilities displayed by dashboards.

The dashboard itself does not automatically belong in:

```text
src/core/
```

A generic dashboard abstraction should not be created without an actual reusable requirement.

---

# Integrations Are Not Automatically Core

External technical integrations generally belong behind infrastructure boundaries such as:

```text
src/lib/
```

Examples:

```text
Supabase

email provider

storage provider

AI provider

external API

third-party SDK
```

Platform Core may depend on an approved adapter.

The provider-specific implementation does not become a Core business capability merely because Core consumes it.

---

# Shared Is Not Core

Business-agnostic technical reuse belongs in:

```text
src/shared/
```

Examples may include:

```text
UI primitives

generic utilities

technical hooks

generic validators

technical types
```

Shared must remain independent of Platform Core business semantics.

Forbidden:

```text
shared
→ core
```

---

# Infrastructure Is Not Core

Infrastructure belongs primarily in:

```text
src/lib/
```

Examples include:

```text
Supabase clients

Prisma adapter access

storage provider adapters

email providers

AI provider adapters

external API clients
```

Infrastructure connects Platform Core and Domains to technical systems.

It does not own application policy.

---

# Core Dependency Rules

Platform Core may depend on:

```text
shared

lib
```

Conceptually:

```text
core
├──→ shared
└──→ lib
```

Platform Core must never depend on a business Domain.

Forbidden:

```text
core
→ domains
```

---

# Domain Dependency on Core

Domains may consume Platform Core capabilities.

Valid:

```text
Copy Domain
    ↓
Permissions
```

Valid:

```text
DJ Domain
    ↓
Identity
```

Valid:

```text
SEO Domain
    ↓
Organizations
```

The reverse dependencies are forbidden.

---

# Cross-Module Workflows

Some reusable SaaS workflows require coordination between multiple Core modules.

Examples:

```text
Organization onboarding

ownership transfer

tenant context resolution
```

A workflow may coordinate:

```text
Organizations

Roles

Memberships

Permissions
```

Coordination does not change ownership.

---

# Example: Organization Onboarding

Canonical onboarding requires coordination:

```text
Authenticated Profile
        ↓
Resolve OWNER Role
        ↓
BEGIN
        ↓
Create Organization
        ↓
Create ACTIVE OWNER Membership
        ↓
COMMIT
```

Organizations owns the Organization.

Memberships owns the Membership.

Roles owns the OWNER Role definition.

The cross-module transaction does not create a new ownership layer.

---

# Reuse Rule

Code should not be promoted into Platform Core solely because:

```text
it might be useful later
```

Before promotion, ask:

```text
Is the behavior genuinely independent of a business vertical?

Is the semantic model reusable?

Do multiple products need the same capability?

Would moving it to Core reduce duplication without coupling unrelated products?
```

If those answers are unclear, keep the behavior inside the owning Domain.

---

# Core Stability

Platform Core should become increasingly stable as multiple products use it.

Stability does not mean immutability.

Core may evolve when:

```text
real product requirements expose reusable needs

security requires architectural change

scalability requires architectural change

existing abstractions prove insufficient
```

Changes must preserve clear ownership and dependency direction.

---

# Domain Independence

Domains evolve independently from one another.

Forbidden:

```text
DJ Domain
→ Copy Domain
```

If several Domains need the same capability, evaluate whether it belongs in:

```text
Platform Core
```

or:

```text
Shared
```

depending on whether the behavior is application-semantic or purely technical.

---

# Security Responsibility

Security is systemic.

It is not correct to say:

```text
security belongs only to Platform Core
```

Platform Core owns reusable security capabilities such as:

```text
Identity

Membership validation

Role resolution

Permission evaluation

tenant architecture
```

Infrastructure may enforce:

```text
secure sessions

database connections

RLS

secret handling
```

Domains still enforce their own:

```text
resource ownership rules

business invariants

lifecycle constraints
```

Client-side checks are never authority.

---

# Row Level Security

RLS may provide database-level tenant isolation.

RLS does not replace application authorization.

Conceptually:

```text
RLS
→ row isolation
```

```text
Permissions
→ application capability authorization
```

```text
Core / Domain service
→ resource and lifecycle validity
```

These mechanisms are complementary.

---

# Documentation First

Every new Platform Core capability should be specified before implementation.

Current Core module documentation follows:

```text
SPEC.md

DATA_MODEL.md

FLOWS.md

API.md

PRISMA.md

TASKS.md
```

These documents define the approved behavior before an implementation agent creates source code.

---

# Core API

A Core module's:

```text
API.md
```

defines its application capabilities.

It does not imply that each capability receives an HTTP endpoint.

Core services may be consumed directly from server-side application code.

HTTP transport rules are defined separately in:

```text
docs/architecture/API.md
```

---

# Core Data Ownership

Each persisted entity must have one canonical owner.

Do not create competing representations because another module needs access to the data.

Prefer:

```text
owner module
        ↓
public application capability
        ↓
consumer
```

over duplicating the same concept in multiple modules.

---

# Core Persistence

Platform Core uses repositories as the persistence boundary.

Conceptually:

```text
Core Service
        ↓
Repository
        ↓
Prisma
        ↓
Database
```

Prisma is a persistence technology.

It does not define Core ownership.

---

# Core Transactions

Transactions should preserve approved Core invariants.

Cross-module atomic workflows are allowed where required.

The transaction boundary must follow the workflow invariant rather than arbitrary repository boundaries.

---

# Core Events

Core modules may eventually emit reusable application events where a real need exists.

Examples could include:

```text
OrganizationCreated

MembershipActivated

InvitationAccepted
```

An event system should not be introduced prematurely.

Event ownership remains with the module that owns the semantic event.

---

# Multi-Domain Philosophy

Platform Core exists so that new business products can reuse mature SaaS capabilities.

Conceptually:

```text
                 Platform Core
                 /     |      \
                /      |       \
               ▼       ▼        ▼
             DJ      Copy      SEO
            Domain    Domain    Domain
```

Each Domain uses the same reusable foundation while retaining its own business model.

---

# Platform Core May Evolve

It is not necessary for Platform Core to remain byte-for-byte identical for every future product.

Instead, it should evolve deliberately as reusable requirements are discovered.

The correct principle is:

```text
Domains may reveal reusable needs.

Architecture decides whether those needs belong in Core.

Core evolves without absorbing Domain-specific behavior.
```

---

# AI Development Rule

AI coding agents implement approved Platform Core specifications.

They must not:

```text
invent Core modules

move Domain behavior into Core

move Core behavior into Shared

create duplicate identity models

create duplicate tenant models

create duplicate authorization systems

change entity ownership silently

invent temporary Roles or Permissions

introduce unresolved architectural decisions during implementation
```

If implementation reveals an architectural gap:

```text
STOP
        ↓
Report
        ↓
Architecture decision
        ↓
Documentation update
        ↓
Resume implementation
```

---

# Core Qualification Test

Before placing a new capability in Platform Core, answer:

```text
1. Is it independent from a specific business vertical?

2. Is it reusable across multiple SaaS products?

3. Does it have clear semantic ownership?

4. Does it avoid depending on a Domain?

5. Is it application behavior rather than merely technical utility?

6. Does its placement reduce duplication without creating coupling?

7. Has the capability been specified before implementation?
```

If these questions cannot be answered clearly, the capability is not ready to become Platform Core.

---

# Forbidden Core Practices

Do not:

```text
put Domain entities in Core

make Core depend on Domains

make Shared depend on Core

create a separate Profiles module

create a Tenancy module

store Role directly on Profile

store tenant ownership directly on Organization

authorize using Role.sortOrder

special-case OWNER as allow-all

duplicate Permissions inside Domains

place provider-specific integrations directly in Core business behavior

treat Dashboard UI as a Core business entity

promote speculative reuse into Core

let implementation agents redefine Core architecture
```

---

# Long-Term Vision

Platform Core should progressively become a mature reusable SaaS foundation.

The current ecosystem can support products such as:

```text
DJ Platform

Copy Platform

SEO Platform

CRM-oriented products

other future SaaS Domains
```

The objective is not to make every product identical.

The objective is to avoid rebuilding the same foundational SaaS capabilities for every product.

Each new Domain should be able to focus primarily on its own business problem.

---

# Final Principle

Platform Core owns reusable SaaS behavior.

Domains own business-specific behavior.

Shared owns business-agnostic technical reuse.

Infrastructure owns connectivity to technical systems.

Identity establishes the actor.

Organizations establishes the tenant.

Memberships establishes belonging.

Roles establishes the authorization position.

Permissions establishes the allowed capability.

The owning Core module or Domain establishes whether the requested operation is valid.

Platform Core should evolve from demonstrated reusable needs, not speculation.

Clear ownership is more important than convenience.