---
title: Platform Core Specification
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - CORE.md
  - DOMAINS.md
  - IDENTITY.md
  - TENANCY.md
  - SECURITY.md
  - DATA.md
  - SOURCE_STRUCTURE.md
  - ../core/README.md
---

# Platform Core Specification

## Purpose

This document defines the functional scope of Platform Core.

It describes which reusable SaaS capabilities belong to Platform Core, their current maturity and the rules governing their evolution.

Architecture documents define how the platform is designed.

Core module specifications define the detailed behavior of individual reusable capabilities.

This document defines the platform-level functional boundary of Platform Core.

---

# Platform Core Definition

Platform Core contains reusable SaaS capabilities whose semantics are independent of a specific business vertical.

Examples include:

- authentication identity
- application profiles
- organizations
- tenant membership
- roles
- permissions
- notifications
- audit
- billing
- settings
- storage

Platform Core must not contain business-specific concepts merely because they may be useful to more than one screen or product.

Business-specific behavior belongs to a Domain.

---

# Capability Ownership

The current Platform Core ownership model is:

- Identity
  - Authentication
  - Profile
- Organizations
  - Organization
- Roles
  - Role
- Memberships
  - OrganizationMembership
  - OrganizationInvitation
- Permissions
  - Permission
  - RolePermission

Profile is part of Identity.

Profile is not an independent Platform Core module.

Tenancy is an architectural concern coordinated across several Core capabilities.

There is no separate persisted Tenant model and no `src/core/modules/tenancy/` module.

---

# Current Capability Status

Platform Core capabilities must be distinguished by maturity.

## Implemented

### Identity

Identity is currently implemented in source.

Current capabilities include:

- Supabase authentication
- Email + Password
- Magic Link
- authentication callback
- session handling
- logout
- Profile retrieval
- Profile update

Supabase `auth.users` is the canonical authentication identity.

Profile is the canonical application identity/profile.

Platform Core must not create a duplicate Prisma `User` authentication model.

---

## Specified but Not Yet Implemented

The following Core capabilities have approved architecture and functional documentation but are not yet complete in source.

### Organizations

Canonical tenant capability.

Owns:

- Organization

Organization is the canonical tenant.

Organization does not own Memberships, Roles or Permissions.

Organization ownership is not represented with an `ownerId`, `ownerUserId` or `ownerProfileId`.

Ownership is represented through an ACTIVE OrganizationMembership with the OWNER Role.

---

### Roles

Canonical tenant Role definitions.

Initial system Roles are:

- OWNER
- ADMIN
- MANAGER
- MEMBER
- VIEWER

Roles are global system reference data.

Role identity uses stable semantic keys.

Role UUID values must not be hard-coded into application behavior.

---

### Memberships

Canonical relationship between Profiles and Organizations.

Owns:

- OrganizationMembership
- OrganizationInvitation

Membership represents an established durable relationship.

Invitation represents a pending invitation workflow.

An invitation is not a Membership.

Membership lifecycle states are:

- ACTIVE
- SUSPENDED
- REMOVED

Invitation lifecycle states are:

- PENDING
- ACCEPTED
- REVOKED
- EXPIRED

---

### Permissions

Canonical authorization capability.

Owns:

- Permission
- RolePermission

Initial authorization chain:

`Authenticated Identity → Profile → ACTIVE OrganizationMembership → Role → RolePermission → Permission`

Authorization is deny-by-default.

Permissions are explicit positive grants.

There is no implicit OWNER authorization bypass.

Domains may define business-specific Permission keys while using the Platform Core Permissions engine.

---

# Tenancy Integration

Tenancy is not implemented as an independent Core module.

The tenant model emerges from coordinated Core capabilities:

`Identity → Profile → OrganizationMembership → Organization`

Authorization additionally resolves:

`Role → RolePermission → Permission`

The canonical tenant is Organization.

Tenant context must be resolved server-side.

Client-provided `organizationId` values must never be trusted as authorization authority.

---

# Foundation Implementation Sequence

The approved Foundation implementation sequence is:

1. Identity — existing
2. Organizations Foundation
3. Roles Foundation
4. Memberships Foundation
5. Tenancy Integration
6. Permissions

This order exists because later capabilities depend on earlier canonical entities.

Memberships requires canonical Roles.

Permissions requires Memberships, Roles and trusted tenant context.

Implementation agents must not bypass this sequence by inventing temporary Membership, Role or Permission models.

---

# Planned Platform Core Capabilities

The following capabilities are planned but are not yet fully specified or implemented.

## Notifications

Potential reusable capabilities may include:

- application notifications
- delivery channels
- notification preferences
- reusable notification lifecycle

Detailed ownership and provider architecture require specification before implementation.

---

## Audit

Potential reusable capabilities may include:

- audit record persistence
- actor information
- tenant context
- event retrieval
- reusable audit infrastructure

Domains remain responsible for the business meaning of audited events.

---

## Billing

Potential reusable capabilities may include:

- subscriptions
- plans
- entitlements
- billing lifecycle
- provider abstraction

Billing architecture must be defined before implementation.

---

## Settings

Potential reusable capabilities may include:

- Organization settings
- application preferences
- reusable configuration mechanisms

Settings must not become a generic storage location for unrelated business data.

---

## Storage

Potential reusable capabilities may include:

- persistent file storage
- private asset access
- signed access
- tenant-aware file ownership
- provider abstraction

No production object-storage provider is currently established as part of the application implementation.

---

# Capabilities Not Currently Defined as Core Modules

The following concepts must not automatically become Platform Core modules.

## Integrations

External technical integrations generally belong behind infrastructure adapters under `src/lib/`.

A reusable business capability may consume those adapters.

The existence of an external provider does not automatically justify a Core module named Integrations.

---

## Feature Flags

Feature Flags may become a reusable Platform Core capability if real product requirements demonstrate the need.

They are not currently part of the approved Core Foundation.

---

## Dashboard

Dashboard is application composition and presentation.

It is not a canonical Platform Core business entity.

Reusable dashboard UI primitives may belong to Shared where appropriate.

---

# Core Module Documentation

Specified Core modules use the following documentation package:

- `SPEC.md`
- `DATA_MODEL.md`
- `FLOWS.md`
- `API.md`
- `PRISMA.md`
- `TASKS.md`

Current specified modules include:

- Organizations
- Roles
- Memberships
- Permissions

Module documentation lives under:

`docs/core/modules/<module>/`

---

# Core Module Lifecycle

A new Platform Core capability should normally progress through:

1. Discovery of a reusable need
2. Ownership decision
3. Functional specification
4. Data model
5. Flows and interfaces
6. Architecture review
7. Implementation tasks
8. Implementation
9. Validation
10. Production adoption

Documentation status normally progresses through:

`Draft → Review → Approved → Living Document`

A Core module should be Approved before implementation begins unless an explicit architecture decision authorizes another process.

After validated production adoption, its documentation may become Living Document.

---

# Core Promotion Rule

A capability must not enter Platform Core merely because it could hypothetically be reused later.

Before promoting behavior from a Domain into Platform Core, determine:

- Is the behavior independent of a business vertical?
- Is the semantic meaning genuinely reusable?
- Do multiple products require the same capability?
- Would Platform Core remain cohesive after promotion?
- Would promotion reduce duplication without introducing business coupling?

If those conditions are not satisfied, the behavior remains in its Domain.

---

# Domain Relationship

Platform Core and Domains have different responsibilities.

Platform Core owns reusable SaaS behavior.

Domains own business-specific meaning.

Examples:

- Organization → Platform Core
- Membership → Platform Core
- Permission evaluation → Platform Core
- Playlist → DJ Domain
- Artist → DJ Domain
- Print Order → Copy Domain
- SEO Project → SEO Domain

A Domain may consume Platform Core capabilities.

Platform Core must not depend on a Domain.

---

# Domain-Specific Permissions

Domains may introduce Permission keys for their own business capabilities.

Examples may include:

- `dj.playlists.create`
- `dj.playlists.publish`
- `copy.orders.update`
- `seo.projects.manage`

The Domain owns the meaning of the capability.

Platform Core Permissions owns:

- Permission persistence
- RolePermission mappings
- authorization evaluation

Domains must not build competing authorization engines.

---

# Shared Relationship

Business-agnostic technical reuse belongs to Shared.

Examples may include:

- generic UI primitives
- technical utilities
- generic hooks
- generic validators
- technical types

Shared must not contain Platform Core business semantics.

Shared must not contain Domain business semantics.

---

# Infrastructure Relationship

Provider connectivity and technical adapters generally belong under:

`src/lib/`

Examples may include:

- database adapters
- Supabase clients
- AI provider adapters
- email provider adapters
- object-storage adapters

Platform Core and Domains may consume approved infrastructure adapters.

Infrastructure does not own business policy.

---

# Architecture Evolution

Platform Core is not permanently frozen.

New Domains may reveal genuinely reusable SaaS requirements.

When this occurs:

`Domain requirement → Architecture evaluation → Domain capability or Platform Core capability`

Core should evolve only when semantic reuse is demonstrated.

Adding a new Domain must not automatically require changes to Platform Core.

Likewise, the architecture must not prohibit justified Core evolution.

---

# Current Domain Context

The current source architecture includes the DJ Domain under:

`src/domains/dj/`

DJ is the first active business Domain in this repository.

This does not mean the DJ Domain is already production-complete.

Its implementation maturity must remain distinguishable from its documented product vision.

---

# Future Domain Possibilities

Potential future business Domains may include:

- Copy
- SEO
- CRM

Additional Domains should be created only from real product requirements.

Future Domain ideas do not constitute approved implementation scope.

---

# AI Agent Rules

AI coding agents must not:

- create speculative Core modules;
- create Profile as a separate Core module;
- create a persisted Tenant model;
- create `src/core/modules/tenancy/`;
- create a duplicate authentication User model;
- add `ownerId` to Organization;
- create temporary Role models;
- create temporary Membership models;
- create temporary Permission systems;
- make Platform Core depend on a Domain;
- move Domain business logic into Core without architecture approval;
- treat planned Core capabilities as already implemented;
- introduce infrastructure providers as Core modules without semantic justification;
- change the Foundation implementation sequence silently.

When implementation reveals a missing reusable capability:

`STOP → Report → Architecture Review → Ownership Decision → Documentation → Resume`

---

# Long-Term Vision

Platform Core exists to reduce the cost, risk and implementation time of successive SaaS products.

The intended evolution is:

`First product → reusable capability discovery → Platform Core improvement → next product → further validated reuse`

Platform Core accumulates proven reusable SaaS capabilities.

Domains remain focused on their own business semantics.

The objective is not to create a universal framework before products exist.

The objective is to build a stable reusable platform from demonstrated needs.

---

# Final Principle

Platform Core owns reusable SaaS capabilities.

Identity owns Profile.

Organization is the canonical tenant.

Membership owns tenant belonging.

Roles define canonical tenant positions.

Permissions provide the authorization engine.

Domains own business-specific behavior.

Shared owns business-agnostic technical reuse.

Infrastructure owns provider connectivity.

Platform Core evolves through demonstrated reuse, not speculation.