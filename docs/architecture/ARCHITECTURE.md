---
title: Platform Architecture
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - SOURCE_STRUCTURE.md
  - PROJECT_STRUCTURE.md
  - CORE.md
  - IDENTITY.md
  - TENANCY.md
  - API.md
  - DATA.md
  - SECURITY.md
  - PRISMA_IMPLEMENTATION.md
  - ../core/README.md
---

# Platform Architecture

## Purpose

This document defines the high-level architecture of Platform Core and the applications built on top of it.

It explains:

- how source code is organized
- which architectural layer owns each responsibility
- how dependencies may flow
- how Platform Core interacts with business Domains
- how tenancy and authorization are composed
- how application operations reach persistence and infrastructure
- how the architecture can evolve without mixing reusable platform capabilities with product-specific business logic

Business-specific architecture belongs inside each Domain.

Detailed implementation rules belong in the specialized architecture and engineering documents referenced from this document.

---

# Architectural Goal

Platform Core is a reusable SaaS foundation.

It must support multiple products without embedding the business rules of any specific product.

Examples:

```text
Platform Core
├── DJ Domain
├── Copy Domain
├── SEO Domain
└── future Domains
```

Platform Core provides reusable SaaS capabilities.

Domains provide product-specific behavior.

The Application layer composes both.

---

# Architectural Principles

Platform Core follows these principles:

- Server First
- Documentation First
- Explicit Ownership
- Clear Dependency Direction
- Business-Agnostic Core
- Domain-Oriented Business Logic
- Feature-Oriented Organization
- Separation of Responsibilities
- Secure by Default
- Multi-Tenant by Design
- AI-Assisted Development with Human Architecture Control
- Infrastructure Behind Explicit Boundaries
- Incremental Complexity

Architecture should remain explicit enough that an implementation agent can build approved behavior without inventing architectural decisions.

---

# Source Architecture

The canonical source structure is:

```text
src/
├── app/
├── config/
├── core/
├── domains/
├── generated/
├── lib/
└── shared/
```

Each directory has a distinct architectural responsibility.

Detailed source rules are defined in:

```text
docs/architecture/SOURCE_STRUCTURE.md
docs/architecture/PROJECT_STRUCTURE.md
```

---

# High-Level Architecture

The architecture is not a single linear stack.

Several layers may depend on lower-level capabilities independently.

Conceptually:

```text
Client
  │
  ▼
Next.js App (src/app)
  │
  ├──→ Core
  │      ├──→ Shared
  │      └──→ Lib
  │
  ├──→ Domains
  │      ├──→ Core
  │      ├──→ Shared
  │      └──→ Lib
  │
  └──→ Shared

Lib
  ├──→ Generated
  ├──→ External SDKs
  └──→ External Services / Database

Shared
  └──→ Generic technical libraries
```

This diagram represents dependency direction, not runtime execution order.

---

# Architectural Ownership

Every capability must have one clear owner.

The primary ownership categories are:

```text
Application
Platform Core
Business Domain
Shared Technical Code
Infrastructure Adapter
Generated Code
Configuration
```

A workflow may coordinate several owners.

Coordination does not transfer ownership.

---

# Application Layer

Located in:

```text
src/app
```

Responsibilities include:

- Next.js routing
- layouts
- route groups
- metadata
- Server Components
- Client Components
- Server Actions
- Route Handlers
- application composition
- presentation orchestration

The Application layer connects approved capabilities to user-facing or HTTP entry points.

It does not own Core or Domain business behavior.

---

# Application Composition

The Application layer may compose:

```text
Core capabilities

Domain capabilities

Shared technical components
```

Example:

```text
Server Action
    ↓
Permissions
    ↓
Copy Domain Order Service
    ↓
Repository
```

The Server Action coordinates the invocation.

It does not become the owner of authorization or Order behavior.

---

# Platform Core

Located in:

```text
src/core
```

Platform Core contains reusable SaaS capabilities that are independent of any specific business vertical.

Current foundational structure:

```text
src/core/
├── identity/
│   ├── auth/
│   └── profile/
└── modules/
    └── organizations/
```

As implementation progresses, approved functional modules are added under:

```text
src/core/modules/
```

---

# Platform Core Capabilities

Foundational capabilities currently specified include:

```text
Identity
Organizations
Roles
Memberships
Permissions
```

Additional planned reusable capabilities include:

```text
Notifications
Audit
Settings
Billing
Storage
```

These capabilities must remain business agnostic.

---

# Identity

Identity is foundational and is not treated as a normal functional module under:

```text
src/core/modules/
```

Its structure is:

```text
src/core/identity/
├── auth/
└── profile/
```

Identity answers:

```text
Who is the actor?
```

Supabase authentication is the canonical authentication identity source.

`Profile` is the application profile associated with that identity.

A Profile is not a Role, Membership or tenant.

---

# Organizations

Organizations owns the canonical tenant entity:

```text
Organization
```

An Organization establishes the tenant boundary used by multi-tenant Platform Core capabilities.

Organizations does not own Membership, Role or Permission entities.

---

# Roles

Roles owns reusable Role definitions.

Initial canonical system Roles are:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Roles describe authorization positions.

A Role does not itself prove tenant membership.

---

# Memberships

Memberships owns the relationship between a Profile and an Organization.

Canonical durable relationship:

```text
OrganizationMembership
```

Membership establishes:

```text
Profile
        ↓
belongs to
        ↓
Organization
```

and associates that relationship with a Role.

Invitation lifecycle is also owned by Memberships.

---

# Permissions

Permissions owns authorization capabilities and Role-to-Permission mappings.

Conceptually:

```text
Permission
RolePermission
```

Authorization follows the approved RBAC model:

```text
ACTIVE Membership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

Permissions uses explicit positive grants.

Absence of a grant means denial.

---

# Tenancy

Tenancy is an architectural concern.

It is not a separate persisted entity and not a Platform Core module.

Do not create:

```text
src/core/modules/tenancy/
```

Tenancy coordinates:

```text
Identity
Organizations
Roles
Memberships
Permissions
```

The canonical tenant remains:

```text
Organization
```

Detailed tenancy architecture is defined in:

```text
docs/architecture/TENANCY.md
```

---

# Business Domain Layer

Located in:

```text
src/domains
```

Domains contain product-specific behavior.

Examples:

```text
src/domains/dj/
src/domains/copy/
src/domains/seo/
```

A Domain may contain:

- business rules
- application/domain services
- domain repositories
- domain-specific validation
- domain-specific UI
- domain types
- domain workflows
- domain events
- domain documentation

---

# Domain Ownership

Every business capability belongs to exactly one Domain.

Examples:

```text
DJ playlist behavior
→ DJ Domain

Copy production workflow
→ Copy Domain

SEO project analysis
→ SEO Domain
```

Platform Core must not absorb business-specific behavior merely because several products might eventually use something similar.

Reuse must be demonstrated before promoting business behavior into Core.

---

# Domain Independence

Domains must not directly depend on one another.

Forbidden:

```text
DJ Domain
    ↓
Copy Domain
```

If two Domains require the same reusable capability, evaluate whether that capability belongs in:

```text
Platform Core

or

Shared technical code
```

depending on its semantics.

---

# Shared Layer

Located in:

```text
src/shared
```

Shared contains business-agnostic technical code.

Examples may include:

- reusable UI primitives
- technical hooks
- generic utilities
- generic validators
- technical types
- reusable constants
- framework-neutral helpers

Shared must not own:

```text
tenant behavior

authorization rules

business workflows

Domain entities

Core entities
```

---

# Shared Is Not a Business Layer

Shared must not become a dumping ground.

Before moving code into Shared, ask:

```text
Is this technical and business agnostic?
```

If no:

```text
do not place it in Shared
```

Shared never depends on Platform Core merely to make something reusable.

---

# Infrastructure Layer

Located primarily in:

```text
src/lib
```

Infrastructure provides technical adapters to external systems and low-level services.

Examples:

- Supabase clients
- Prisma access
- storage adapters
- email providers
- AI provider adapters
- external APIs
- third-party SDK wrappers

Infrastructure should remain replaceable where practical.

---

# Infrastructure Does Not Own Business Rules

An infrastructure adapter may know how to:

```text
send an email

query Supabase

call an AI provider

access storage

call an external API
```

It must not decide:

```text
who may transfer Organization ownership

whether an invitation may be accepted

whether a Copy order may enter production

whether a DJ workflow is valid
```

Those decisions belong to the appropriate Core module or Domain.

---

# Generated Code

Located in:

```text
src/generated
```

Generated code is produced by tools.

Example:

```text
Prisma generated client
```

Generated code is not an architectural ownership layer.

Application, Core and Domain behavior must not be implemented directly inside generated files.

Generated files should not be manually edited unless the generating tool explicitly requires it.

---

# Configuration

Located in:

```text
src/config
```

Configuration contains application configuration and validated configuration composition.

It does not own business logic.

Secrets must not be hard-coded into source configuration.

Environment-specific behavior must follow the approved security and deployment architecture.

---

# Canonical Dependency Rules

Allowed high-level source dependencies are:

```text
app
├──→ core
├──→ domains
└──→ shared
```

```text
domains
├──→ core
├──→ shared
└──→ lib
```

```text
core
├──→ shared
└──→ lib
```

```text
lib
├──→ generated
└──→ external libraries / services
```

Shared may use generic technical libraries but must remain independent of Core and Domains.

---

# Forbidden Dependencies

The following are forbidden:

```text
core
→ domains
```

```text
shared
→ core
```

```text
shared
→ domains
```

```text
Domain A
→ Domain B
```

```text
lib
→ core business behavior
```

```text
lib
→ domain business behavior
```

Dependencies must not form architectural cycles.

---

# Dependency Principle

Higher-level behavior may consume lower-level capabilities.

Lower-level technical code must not gain knowledge of higher-level business semantics.

Example:

```text
Copy Domain
    ↓
Permissions
```

is valid.

The reverse:

```text
Permissions
    ↓
Copy Domain
```

is forbidden.

---

# Runtime Flows

There is no single runtime flow for every request.

The correct flow depends on the entry point and operation.

Common patterns are defined below.

Detailed transport rules are defined in:

```text
docs/architecture/API.md
```

---

# Server Read Flow

Typical server-rendered read:

```text
Client Request
        ↓
Next.js Server Component
        ↓
Application / Domain Service
        ↓
Repository
        ↓
Prisma
        ↓
Database
```

Not every read requires an HTTP API endpoint.

Server-side code should normally call services directly when no real HTTP boundary is required.

---

# Protected Tenant Mutation Flow

Typical authenticated tenant mutation:

```text
Client
        ↓
Server Action / Route Handler
        ↓
Authentication
        ↓
Input Validation
        ↓
Trusted Tenant Context
        ↓
Permission Authorization
        ↓
Owning Service
        ↓
Resource / Business Invariants
        ↓
Repository
        ↓
Database
```

Authentication, tenancy and authorization are distinct concerns.

---

# HTTP Boundary Flow

When an explicit HTTP contract is required:

```text
External Caller
        ↓
Route Handler
        ↓
Authentication / Signature Validation
        ↓
Runtime Validation
        ↓
Authorization where applicable
        ↓
Application Service
        ↓
Repository / Integration
        ↓
Mapped HTTP Response
```

Route Handlers must remain thin.

---

# Bootstrap Flows

Some valid operations occur before a normal tenant authorization context exists.

Examples:

```text
registration

login

Profile self-service

initial Organization creation

initial OWNER Membership creation

invitation acceptance
```

These operations use their explicitly approved bootstrap rules.

Do not invent temporary Permissions or fake Memberships merely to force bootstrap flows through normal tenant authorization.

---

# Organization Bootstrap

Canonical initial tenant creation:

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

The Organization and initial OWNER Membership are created atomically.

If the Membership cannot be created, Organization creation must roll back.

---

# Tenant Authorization Architecture

Normal tenant authorization conceptually follows:

```text
Supabase auth.users
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

Each stage answers a different question.

---

# Identity Question

Identity answers:

```text
Who is the actor?
```

Authentication alone does not grant tenant access.

---

# Membership Question

Membership answers:

```text
Does this Profile belong to this Organization?
```

Only an approved active Membership establishes normal tenant participation.

Membership alone does not grant every operation.

---

# Role Question

Role answers:

```text
Which authorization position does this Membership hold?
```

Role ordering or display order is not authorization.

Do not use:

```text
Role.sortOrder
```

to determine access.

---

# Permission Question

Permission answers:

```text
May this Role perform this capability?
```

Example:

```text
invitations.create
```

Permission evaluation is explicit and server-side.

---

# Business Invariant Question

Permission approval is not the end of validation.

The owning module or Domain must still answer:

```text
Is this operation valid for this resource and current state?
```

Example:

```text
Permission allows memberships.remove
```

does not mean the service may remove the sole OWNER.

Structural and lifecycle invariants remain owned by the responsible module.

---

# OWNER Is Not an Authorization Bypass

OWNER is a canonical Role.

It receives explicit RolePermission mappings.

Do not implement:

```text
if role === "OWNER":
    allow everything
```

New Permissions are not automatically granted merely because a Membership has the OWNER Role.

Authorization policy remains explicit.

---

# Row Level Security

Row Level Security provides database-level tenant isolation where applicable.

RLS and application Permissions solve different problems.

Conceptually:

```text
RLS
→ may this database identity access this tenant row?
```

```text
Permissions
→ may this actor perform this application capability?
```

Application authorization must not be replaced with simplistic RLS assumptions.

Detailed policy belongs in the tenancy, security and Domain-specific RLS documentation.

---

# Defense in Depth

Security may be enforced through multiple independent mechanisms:

```text
Authentication
        ↓
Trusted Tenant Resolution
        ↓
Membership Validation
        ↓
Permission Authorization
        ↓
Application Invariants
        ↓
RLS where applicable
        ↓
Database Constraints
```

Not every mechanism is required for every operation.

Each mechanism must have a clearly defined responsibility.

---

# Client Is Never Authority

Client-side checks exist for UX.

Examples:

```text
hide button

disable action

adapt navigation
```

They are not security controls.

Never trust client-provided:

```text
role

permission list

profileId

organizationId

membershipId

canManage

isAdmin
```

without server-side resolution and validation.

---

# Service Architecture

Core and Domain operations should be exposed through explicit services.

Typical pattern:

```text
Transport / Server Component
        ↓
Application Service
        ↓
Repository
        ↓
Persistence
```

Services own application behavior.

Repositories own persistence access.

Transport layers own transport concerns.

---

# Repository Architecture

Repositories form the persistence boundary.

Responsibilities may include:

- database queries
- persistence projections
- persistence-specific mapping
- query composition
- transactional persistence participation

Repositories should not own business policy.

---

# Prisma Architecture

Prisma is a persistence technology.

It must not become the application architecture.

Preferred:

```text
Service
    ↓
Repository
    ↓
Prisma
```

Avoid spreading raw Prisma operations throughout:

```text
src/app
```

or across unrelated business code.

Generated Prisma types are not automatically public application contracts.

---

# Cross-Module Orchestration

Some Platform Core workflows legitimately coordinate several modules.

Examples:

```text
Organization onboarding

ownership transfer

tenant context resolution
```

A workflow may involve:

```text
Organizations
Roles
Memberships
Permissions
```

Cross-module orchestration does not change entity ownership.

Example:

```text
Organizations owns Organization

Memberships owns OrganizationMembership

Roles owns Role

Permissions owns Permission and RolePermission
```

---

# Transactions

Transactional boundaries follow business and architectural invariants.

If several writes must succeed or fail together, orchestration must preserve atomicity.

Example:

```text
Create Organization
+
Create initial OWNER Membership
```

must be atomic.

Transport code must not fragment an approved transaction into unrelated writes.

---

# Business Flow

Business-specific logic belongs to Domains.

Reusable SaaS behavior belongs to Platform Core.

Technical reusable code belongs to Shared.

External technical connectivity belongs behind Infrastructure boundaries.

This distinction takes priority over superficial code reuse.

---

# AI Architecture

AI is a technical capability that may support Core or Domain workflows.

Provider-specific SDK usage belongs behind infrastructure adapters.

Conceptually:

```text
Domain / Core Service
        ↓
AI Adapter
        ↓
Provider SDK
        ↓
AI Provider
```

Business decisions around AI outputs remain owned by the consuming Domain or Core capability.

---

# AI Output Trust

AI-generated output is untrusted input.

Before AI output can affect:

- persistence
- publishing
- authorization-sensitive data
- automation
- external actions

it must pass the required validation and application invariants.

AI does not bypass architecture.

---

# AI-Assisted Development

AI coding agents are implementation agents.

They may:

- implement approved specifications
- create code inside approved ownership boundaries
- add tests
- update implementation documentation
- report inconsistencies

They must not silently invent architecture.

If implementation requires an unresolved architectural decision:

```text
STOP
        ↓
Report finding
        ↓
Architecture decision
        ↓
Document decision
        ↓
Resume implementation
```

---

# Security Architecture

Security is systemic rather than confined to one directory.

Major security concerns include:

- authentication
- tenant isolation
- Membership validation
- Role resolution
- Permission authorization
- runtime validation
- RLS
- database constraints
- secure cookies
- secrets management
- provider validation
- safe error handling
- server-side enforcement
- auditability where required

Detailed requirements belong in:

```text
docs/architecture/SECURITY.md
docs/architecture/IDENTITY.md
docs/architecture/TENANCY.md
```

---

# Multi-Tenancy

Platform Core is multi-tenant by design.

The canonical tenant entity is:

```text
Organization
```

Do not introduce parallel persisted tenant abstractions such as:

```text
Tenant
TenantUser
TenantMembership
TenantRole
```

unless a future architectural decision explicitly supersedes the current model.

---

# Domain Authorization

Domains may define Domain-specific Permissions.

Example:

```text
copy.orders.update
```

The authorization engine remains Platform Core Permissions.

The Domain owns the business behavior being protected.

Example:

```text
Permissions
→ evaluates copy.orders.update

Copy Domain
→ decides whether this specific Order may be updated
```

Domains must not implement competing authorization engines.

---

# Scalability

Architecture should support growth without prematurely implementing infrastructure that is not yet required.

Potential future capabilities include:

- multiple web applications
- mobile clients
- public APIs
- background workers
- queues
- scheduled jobs
- event processing
- multiple AI providers
- larger multi-tenant workloads
- additional business Domains

Scalability mechanisms should be introduced when real workload or product requirements justify them.

---

# Incremental Complexity

Do not introduce infrastructure merely because it may someday be useful.

Examples:

```text
queue

event bus

microservices

distributed cache

complex role hierarchy

permission overrides

public API versioning
```

should be introduced only when requirements justify their complexity.

Platform Core should remain structurally extensible without becoming prematurely distributed.

---

# Documentation Architecture

Architecture documentation belongs under:

```text
docs/architecture/
```

Core module specifications belong under:

```text
docs/core/modules/<module>/
```

Business Domain documentation belongs under:

```text
docs/domains/<domain>/
```

Engineering standards belong under:

```text
docs/engineering/
```

Operational documentation belongs under:

```text
docs/operations/
```

Architectural decisions with durable impact belong under:

```text
docs/adr/
```

Formal reviews belong under:

```text
docs/reviews/
```

---

# Documentation Is Part of Architecture

Documentation must describe the architecture that actually governs implementation.

Do not leave obsolete architecture in active documentation merely because source code has not yet caught up.

Likewise, documentation must not claim implementation exists when it has only been specified.

Architecture, specification and implementation maturity must remain distinguishable.

---

# Architecture Evolution

Platform Core may evolve independently from business Domains.

Domains may evolve independently from one another.

Infrastructure may change behind stable boundaries.

Architecture changes should preserve ownership clarity and dependency direction.

Breaking architectural changes require explicit review and, where appropriate, an ADR and migration plan.

---

# Public Interfaces

Stable interfaces between architectural owners should change deliberately.

Internal implementation details may evolve without forcing unrelated layers to change.

A module's:

```text
API.md
```

describes application capabilities.

It does not imply that every capability must become an HTTP endpoint.

---

# Definition of Architectural Ownership

Before implementing a capability, the team should be able to answer:

```text
Who owns the entity?

Who owns the behavior?

Who owns persistence?

Who owns authorization?

Who owns transport?

Which dependencies are allowed?
```

If ownership cannot be answered clearly, architecture is not ready for implementation.

---

# Forbidden Architectural Practices

Do not:

```text
place business logic in src/app

place Domain behavior in Platform Core

place Core behavior in Shared

make Shared depend on Core

make Core depend on Domains

make one Domain depend directly on another

create duplicate tenant models

create duplicate authorization systems

store Role directly on Profile

store tenant ownership directly on Organization as ownerId

authorize using Role.sortOrder

special-case OWNER as allow-all

trust client tenant context

trust client Role or Permission values

scatter provider SDKs through business code

treat generated Prisma models as application architecture

create internal HTTP endpoints when direct server calls are sufficient

introduce temporary architecture to bypass unresolved design decisions
```

---

# Architecture Validation

When introducing a new capability, validate:

```text
1. Is it reusable SaaS behavior or business-specific behavior?

2. Who owns it?

3. Which source layer should contain it?

4. Which existing modules may it depend on?

5. Does it alter tenancy?

6. Does it alter identity?

7. Does it alter authorization?

8. Does it require persistence?

9. Does it require a new external boundary?

10. Does it introduce a durable architectural decision?
```

If a durable new decision is required, document it before implementation.

---

# Current Foundational Sequence

The current foundational implementation dependency is:

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

This is an implementation dependency sequence.

It does not mean Tenancy is a Core module.

It does not imply that every later Platform Core module must follow the same sequence.

---

# Final Principle

Platform Core is a reusable SaaS foundation.

Business Domains extend that foundation without redefining it.

The Application layer composes capabilities without owning their business rules.

Identity establishes the actor.

Organizations establishes the tenant.

Memberships establishes belonging.

Roles establishes the authorization position.

Permissions establishes the allowed capability.

The owning Core module or Domain establishes whether the requested operation is valid.

Shared provides business-agnostic technical reuse.

Infrastructure connects the application to technical systems.

Clear ownership and explicit dependency direction are more important than convenience.

When architecture is unclear, decide and document first.

Then implement.