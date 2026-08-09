---
title: Business Domains
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - CORE.md
  - SOURCE_STRUCTURE.md
  - PROJECT_STRUCTURE.md
  - CONVENTIONS.md
  - API.md
  - DATA.md
  - IDENTITY.md
  - TENANCY.md
  - SECURITY.md
  - ../core/README.md
---

# Business Domains

## Purpose

This document defines how business Domains are modeled, organized and integrated with Platform Core.

A Domain contains business-specific behavior for a product vertical.

Examples include:

```text
DJ Domain
Copy Domain
SEO Domain
```

A Domain is not Platform Core.

A Domain is not Shared technical infrastructure.

A Domain is not necessarily the complete deployed application by itself.

A product is composed from:

```text
Platform Core
+
one or more approved business Domain capabilities
+
Application Layer
+
Infrastructure
```

---

# Core Principle

The primary architectural distinction is:

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

Semantic ownership determines placement.

Code must not be moved between these areas merely because it appears reusable.

---

# What Is a Domain?

A Domain represents a coherent area of business knowledge.

It owns concepts whose meaning depends on a specific business vertical.

Examples:

```text
DJ Domain

Artist
Track
Playlist
Festival
Ranking
Editorial workflow
```

```text
Copy Domain

Order
Print Job
Production State
Delivery
Customer Job
```

```text
SEO Domain

SEO Project
Keyword
SERP Analysis
Ranking Measurement
```

The Domain owns the meaning and lifecycle of those concepts.

---

# Domain Versus Product

A Domain and a product are related but not identical concepts.

For example:

```text
DJ Platform
```

may be composed from:

```text
Next.js Application
        +
Platform Core
        +
DJ Domain
        +
Infrastructure
```

Therefore:

```text
DJ Domain
≠ entire application
```

The Domain owns DJ-specific business behavior.

The Application layer owns routing, composition and presentation entry points.

Platform Core owns reusable SaaS capabilities.

---

# Current Domain Boundary

The current source structure includes:

```text
src/domains/dj/
```

This establishes the architectural ownership boundary for DJ-specific behavior.

The existence of the directory does not imply that every planned DJ capability is already implemented.

Documentation and implementation maturity must remain distinguishable.

---

# Future Domains

Potential future Domains may include:

```text
copy/
seo/
crm/
```

Additional Domains should be created only when there is an actual product requirement.

Do not create speculative Domain directories merely to represent future ideas.

---

# Domain Source Location

Business Domain implementation lives under:

```text
src/domains/<domain>/
```

Example:

```text
src/domains/dj/
```

Each Domain owns its implementation below its own directory.

---

# Domain Documentation

Business Domain documentation lives under:

```text
docs/domains/<domain>/
```

Example:

```text
docs/domains/dj/
```

Domain documentation may include:

```text
PRD.md

VISION.md

architecture/

database/

implementation documentation
```

according to the needs of the Domain.

---

# Domain Ownership

Every business capability must have one canonical Domain owner.

Examples:

```text
Playlist
→ DJ Domain

Print Order
→ Copy Domain

SEO Project
→ SEO Domain
```

A business entity must not be duplicated in several Domains merely because several screens use it.

---

# Domain Responsibilities

A Domain may own:

- business entities
- business rules
- lifecycle rules
- business workflows
- Domain services
- Domain repositories
- Domain-specific validation
- Domain types
- Domain-specific events
- Domain-specific UI
- Domain-specific permissions
- Domain documentation

Only create structures that the Domain actually requires.

---

# Domain Business Rules

Business rules belong to the Domain that understands their meaning.

Example:

```text
Can this Copy Order enter production?
→ Copy Domain
```

Example:

```text
Can this DJ Playlist be published?
→ DJ Domain
```

Example:

```text
Can this SEO Project be archived?
→ SEO Domain
```

Platform Core must not make these decisions.

---

# What Does Not Belong to a Domain

A Domain must not redefine reusable Platform Core capabilities such as:

```text
authentication

Profile identity

Organization

Organization Membership

Role definitions

Permission evaluation engine

tenant architecture
```

Domains consume those capabilities.

They do not create competing versions of them.

---

# Domain Does Not Own Authentication

Authentication belongs to Platform Core Identity.

Forbidden:

```text
DJ Authentication

Copy Authentication

SEO Authentication
```

when these duplicate Platform Core authentication.

Valid:

```text
DJ Domain
        ↓
require authenticated Profile
```

---

# Domain Does Not Own Tenant Identity

The canonical tenant is:

```text
Organization
```

A Domain must not create a parallel tenant abstraction merely to represent the same tenant.

Forbidden examples:

```text
DJTenant

CopyTenant

SEOWorkspace
```

when they are only alternative names for Organization.

A Domain may create a business entity associated with an Organization if that entity has real Domain meaning.

---

# Domain Does Not Own Membership

Tenant belonging is represented by:

```text
OrganizationMembership
```

and owned by Memberships.

A Domain must not create a competing generic membership model.

Domain-specific relationships may exist when they represent actual business concepts.

---

# Domain Does Not Own Roles

Canonical tenant Roles are owned by Platform Core Roles.

Initial system Roles are:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

A Domain must not redefine these Roles to create a second authorization hierarchy.

---

# Domain-Specific Permissions

Domains may define business-specific Permission keys.

Examples:

```text
dj.playlists.create

dj.playlists.publish

copy.orders.update

copy.production.manage

seo.projects.manage
```

The Domain defines the business capability being protected.

Platform Core Permissions owns the authorization mechanism.

---

# Permission Ownership Distinction

Example:

```text
copy.orders.update
```

has two different responsibilities.

```text
Permission catalog / evaluation
→ Platform Core Permissions

Meaning of updating a Copy Order
→ Copy Domain
```

The Domain must not implement a competing authorization engine.

---

# Authorization Flow

Typical Domain authorization:

```text
Authenticated Identity
        ↓
Profile
        ↓
ACTIVE OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Domain Permission
        ↓
Domain Service
        ↓
Business Invariants
```

Permission approval authorizes the capability.

The Domain service still validates whether the specific operation is valid.

---

# Permission Is Not Business Validation

Example:

```text
Permission
→ copy.orders.update
```

does not automatically mean every Order may be modified.

The Copy Domain may still validate:

```text
Order belongs to Organization

Order state allows modification

requested transition is valid

required business data exists
```

Authorization and business validity are separate concerns.

---

# Domain Identity Relationships

A Domain may associate a business entity with a Platform Profile when the business model requires it.

Example:

```text
Profile
        ↓
DJ Domain relationship
        ↓
Artist
```

This does not make:

```text
Profile = Artist
```

Likewise:

```text
Profile
        ↓
Copy Domain relationship
        ↓
Employee
```

does not make:

```text
Profile = Employee
```

Identity and business identity remain separate concepts.

---

# Domain Tenant Scope

Tenant-owned Domain data must have an unambiguous relationship to:

```text
Organization
```

That relationship may be direct:

```text
Order.organizationId
```

or safely derived through another required relationship.

Do not duplicate tenant identifiers mechanically when ownership is already structurally unambiguous.

---

# Cross-Tenant Protection

Domain operations must not trust a client-provided:

```text
organizationId
```

as tenant authority.

Tenant context must be resolved server-side.

Domain persistence must preserve that scope.

Cross-tenant access is denied by default.

---

# Domain RLS

Domain tables may use Row Level Security when appropriate.

Domain-specific RLS policies belong with the Domain data architecture.

Those policies must follow the canonical tenant model:

```text
Organization
+
OrganizationMembership
```

Do not create Domain-specific competing tenant or Role systems merely for RLS.

---

# Domain Independence

Domains are architecturally independent.

Forbidden:

```text
DJ Domain
        ↓
Copy Domain
```

Forbidden:

```text
Copy Domain
        ↓
SEO Domain
```

A Domain must not directly import business behavior from another Domain.

---

# Why Domains Do Not Depend on Domains

Direct cross-Domain dependencies create:

```text
business coupling

unclear ownership

migration coupling

testing complexity

product coupling
```

Each Domain must remain understandable as an independent business boundary.

---

# Cross-Domain Product Workflows

A future product may need to compose behavior from more than one Domain.

That does not automatically permit:

```text
Domain A
→ Domain B
```

Cross-Domain orchestration should be evaluated explicitly.

Possible solutions include:

```text
Application composition

Platform service

shared event contract when justified

promotion of genuinely reusable capability into Platform Core
```

The correct solution depends on semantic ownership.

---

# Promotion to Platform Core

A Domain capability must not be moved into Platform Core simply because another Domain might eventually use something similar.

Before promotion, verify:

```text
Is the behavior genuinely independent of a business vertical?

Do multiple products require the same semantics?

Would Core ownership remain coherent?

Would promotion remove duplication without introducing coupling?
```

If not:

```text
keep it in the Domain
```

---

# Domain and Shared

Domains may depend on:

```text
src/shared/
```

for business-agnostic technical resources.

Examples:

```text
generic UI primitive

technical utility

generic hook

generic validator

technical type
```

Shared does not own Domain semantics.

---

# Shared Must Not Absorb Domain Behavior

Forbidden:

```text
src/shared/order-status.ts
```

if `OrderStatus` belongs only to Copy Domain.

Forbidden:

```text
src/shared/playlist-rules.ts
```

if those rules belong to DJ Domain.

Correct:

```text
src/domains/copy/
```

or:

```text
src/domains/dj/
```

respectively.

---

# Domain and Infrastructure

Domains may consume approved infrastructure adapters under:

```text
src/lib/
```

Example:

```text
DJ Service
        ↓
AI Adapter
        ↓
AI Provider
```

Example:

```text
Copy Service
        ↓
Email Adapter
        ↓
Email Provider
```

The Domain owns why the provider is used.

Infrastructure owns how the provider is called.

---

# Provider-Specific Logic

Provider SDK details should not be scattered throughout Domain code.

Preferred:

```text
Domain Service
        ↓
Infrastructure Adapter
        ↓
Provider SDK
```

The Domain may define the interface it requires.

The adapter implements the external technical integration.

---

# Standard Domain Structure

A Domain may use a structure such as:

```text
src/domains/<domain>/
├── actions/
├── components/
├── repositories/
├── services/
├── types/
├── validators/
└── ...
```

This is not a mandatory directory template.

Only create directories required by actual implementation.

---

# Domain Actions

A Domain may colocate feature-owned Server Actions when this improves ownership clarity.

Server Actions remain transport boundaries.

They must not become the owner of Domain business logic.

Preferred:

```text
Server Action
        ↓
Domain Service
```

---

# Domain Components

Domain-specific UI may live with the Domain.

Examples:

```text
DJ playlist editor

Copy production board

SEO keyword table
```

These components may understand Domain presentation semantics.

They must not gain persistence authority or become the owner of business rules.

---

# Domain Services

Domain services own reusable Domain application behavior.

Examples:

```text
PlaylistService

OrderService

SeoProjectService
```

Responsibilities may include:

```text
business workflows

lifecycle validation

business invariants

transaction coordination

Domain orchestration
```

---

# Domain Repositories

Domain repositories own persistence operations for Domain entities.

Preferred:

```text
Domain Service
        ↓
Domain Repository
        ↓
Prisma
```

Repositories do not decide business policy.

---

# Domain Validation

Domain validation has multiple layers.

Runtime transport validation may check:

```text
shape

format

basic constraints
```

The Domain service validates:

```text
business meaning

resource relationships

lifecycle state

tenant ownership
```

Do not hide Domain rules in generic Shared validators.

---

# Domain Types

Domain-specific types belong with the Domain.

Example:

```text
src/domains/dj/types/
```

Do not move them into:

```text
src/shared/types/
```

merely because several files inside the same Domain use them.

---

# Domain Events

A Domain may define semantic events when an actual workflow requires them.

Examples could include:

```text
PlaylistPublished

OrderEnteredProduction
```

Do not introduce an event architecture merely because events might be useful later.

The Domain that owns the semantic event remains its owner.

---

# Domain API

A Domain may expose application capabilities through services or explicit application interfaces.

This does not imply HTTP.

Example:

```text
createPlaylist()

publishPlaylist()

updateOrder()
```

may be server-side application capabilities without:

```text
/api/...
```

Detailed transport rules belong to:

```text
docs/architecture/API.md
```

---

# Domain HTTP APIs

If a Domain capability requires an external HTTP contract, the Route Handler belongs to the Application transport boundary.

Conceptually:

```text
Route Handler
        ↓
Domain Service
```

Do not duplicate Domain behavior in HTTP handlers.

---

# Domain Imports

A Domain may implement business-specific ingestion.

Example:

```text
DJ track ingestion

Copy job import

SEO keyword import
```

The Domain owns the business interpretation and normalization rules.

Generic file and transport infrastructure may live elsewhere.

---

# Domain AI Behavior

AI may support Domain workflows.

Example:

```text
DJ Domain
→ playlist analysis

SEO Domain
→ keyword analysis
```

The Domain owns:

```text
why AI is used

what output means

how output affects business state
```

Infrastructure owns provider connectivity.

---

# AI Output Is Untrusted

AI-generated Domain data must pass:

```text
runtime validation

Domain validation

tenant validation

authorization where required
```

before affecting canonical application state.

AI does not bypass Domain rules.

---

# Domain Documentation

A Domain should document the decisions necessary to implement it safely.

Possible documents include:

```text
VISION.md

PRD.md

architecture/

database/

flows/

implementation notes
```

The exact package depends on Domain complexity.

Do not create documentation solely to satisfy a template.

---

# Platform Architecture Versus Domain Architecture

Platform-wide decisions belong under:

```text
docs/architecture/
```

Examples:

```text
Identity

Tenancy

Permissions architecture

source structure

API strategy
```

Business-specific decisions belong under:

```text
docs/domains/<domain>/
```

---

# Domain Database Documentation

Business-specific database architecture belongs with the Domain.

Example:

```text
docs/domains/dj/database/
```

A Domain database document may define:

```text
Domain entities

Domain relationships

Domain indexes

Domain RLS

Domain lifecycle
```

It must not redefine Platform Core ownership.

---

# Creating a New Domain

A new Domain should begin from a real product requirement.

Typical process:

```text
Business Discovery
        ↓
Product Vision
        ↓
Domain Boundary
        ↓
PRD
        ↓
Domain Data Model
        ↓
Domain Architecture
        ↓
Implementation Tasks
        ↓
Source Implementation
        ↓
Validation
```

The exact sequence may vary according to project complexity.

---

# Domain Discovery

Before creating a Domain, determine:

```text
What business problem does it solve?

Which concepts are genuinely business-specific?

Which existing Platform Core capabilities can it reuse?

Which new reusable needs does the Domain reveal?

Which behaviors must remain inside the Domain?
```

This prevents premature expansion of Platform Core.

---

# New Domain Checklist

Before implementation, answer:

```text
1. What business vertical does the Domain represent?

2. Which business entities does it own?

3. Which workflows does it own?

4. Which Platform Core capabilities does it consume?

5. Which Domain-specific Permissions are required?

6. How is tenant scope established?

7. Which external providers are required?

8. Which data belongs to the Domain?

9. Does it depend directly on another Domain?

10. Is any proposed Core capability actually Domain-specific?
```

If ownership is unclear, architecture must be resolved before implementation.

---

# Current Dependency Rules

Domains may depend on:

```text
core

shared

lib
```

Conceptually:

```text
domains
├──→ core
├──→ shared
└──→ lib
```

Domains must not depend directly on another Domain.

---

# Core Dependency Direction

Valid:

```text
Domain
→ Core
```

Forbidden:

```text
Core
→ Domain
```

Platform Core cannot contain knowledge of DJ, Copy, SEO or another business vertical.

---

# Shared Dependency Direction

Valid:

```text
Domain
→ Shared
```

Forbidden:

```text
Shared
→ Domain
```

Shared must remain business agnostic.

---

# Infrastructure Dependency Direction

Valid:

```text
Domain
→ Lib
```

Infrastructure adapters do not import Domain business policy.

The Domain may define an application-facing requirement while the infrastructure adapter supplies the technical implementation.

---

# Domain Reuse

A Domain should be cohesive and internally reusable where useful.

It does not have to be reusable across unrelated SaaS products.

That is the distinction between:

```text
Domain
→ business-specific capability

Platform Core
→ reusable SaaS capability
```

Do not require every Domain feature to satisfy Platform Core reuse criteria.

---

# Domain Replaceability

A Domain should remain isolated enough that unrelated Domains and Platform Core do not depend on its internals.

This does not mean a business Domain must be technically removable without any application changes.

Applications may intentionally depend on the Domain they were built to expose.

---

# Testing

Domain business behavior should be testable independently from presentation code.

Important Domain tests may include:

```text
business lifecycle

tenant isolation

authorization integration

invalid transitions

Domain invariants

repository behavior

external adapter failure behavior
```

Testing should focus on observable business behavior.

---

# Security

Domains inherit reusable security capabilities from Platform Core but still own security-relevant business rules.

Example:

```text
Permissions
→ actor has copy.orders.update

Copy Domain
→ Order belongs to tenant and may currently be modified
```

Security is therefore shared across architectural layers.

It is not correct to say that Domains have no security responsibility.

---

# Domain Auditability

Business-significant Domain operations may require audit records.

The Domain owns the meaning of the event.

A future Platform Core Audit capability may own reusable persistence and retrieval of audit records.

Do not build isolated ad hoc audit engines inside each Domain without review.

---

# Domain Evolution

Domains evolve as business requirements evolve.

Platform Core may also evolve when Domains reveal genuinely reusable SaaS needs.

Therefore the correct relationship is:

```text
Domain requirement
        ↓
evaluate semantics
        ↓
Domain capability
or
Platform Core capability
```

Platform Core is not frozen permanently.

---

# Core Evolution

Do not assume:

```text
new Domain
→ Core must never change
```

A new Domain may reveal a missing reusable capability.

Examples might include:

```text
Audit

Notifications

Billing

Storage

Feature Flags
```

The architecture may promote such capabilities into Platform Core when reuse is demonstrated.

---

# Core Stability

Although Platform Core may evolve, Domain introduction should avoid unnecessary Core modification.

Preferred:

```text
new business behavior
→ Domain
```

Only genuinely reusable SaaS needs should modify Core.

This preserves Platform Core stability without treating it as immutable.

---

# Multi-Domain Products

The architecture can support future products that compose several Domain capabilities.

This possibility does not remove Domain independence.

Cross-Domain workflows require explicit orchestration architecture.

Do not allow direct Domain-to-Domain dependency simply because two Domains appear in the same product.

---

# AI Agent Rules

AI coding agents working inside Domains must not:

```text
move Domain entities into Platform Core

create duplicate authentication

create duplicate tenant models

create duplicate Membership models

create duplicate Role systems

create duplicate authorization engines

make Domain A depend directly on Domain B

move Domain-specific types into Shared without semantic justification

scatter provider SDK calls through Domain code

trust client tenant context

bypass Platform Core Permissions for protected tenant operations

treat Permission approval as sufficient business validation

invent new Platform Core capabilities silently
```

If implementation reveals a reusable architectural need:

```text
STOP
        ↓
Report
        ↓
Architecture decision
        ↓
Document ownership
        ↓
Resume implementation
```

---

# Forbidden Domain Practices

Do not:

```text
put business entities in Platform Core

duplicate Platform Core entities inside Domains

create custom authentication per Domain

store generic tenant Membership inside a Domain

store generic tenant Role inside a Domain

create a Domain-specific authorization engine

make one Domain depend directly on another

put Domain business rules in Shared

put provider-specific SDK behavior throughout Domain services

trust client organizationId as authority

treat Profile as a business entity automatically

treat Domain-specific Permission keys as a separate permission engine

create speculative Domains

create directories merely to satisfy a template

claim a planned Domain capability is implemented before source exists
```

---

# Current Examples

## DJ Domain

Platform composition:

```text
Platform Core
        +
DJ Domain
```

DJ Domain may own concepts such as:

```text
Artists

Tracks

Playlists

Genres

Festivals

Labels

Rankings

Editorial workflows
```

according to the approved DJ product scope.

---

## Copy Domain

Potential future composition:

```text
Platform Core
        +
Copy Domain
```

Copy Domain may own concepts such as:

```text
Orders

Production Jobs

Deliveries

business Customers

production workflows
```

according to future validated requirements.

---

## SEO Domain

Potential future composition:

```text
Platform Core
        +
SEO Domain
```

SEO Domain may own concepts such as:

```text
SEO Projects

Keywords

Rankings

SERP analysis
```

according to future validated requirements.

---

# Long-Term Vision

Platform Core should make it progressively cheaper and safer to create new SaaS products.

The goal is not:

```text
Core never changes
```

The goal is:

```text
Core changes only for genuinely reusable SaaS needs.
```

Domains remain focused on their business vertical.

As new products are created:

```text
Domain
→ validates business-specific needs

Platform Core
→ accumulates proven reusable capabilities
```

This creates a reusable platform without allowing Platform Core to become a collection of unrelated business logic.

---

# Final Principle

Platform Core provides reusable SaaS capabilities.

Domains own business-specific meaning.

Shared owns business-agnostic technical reuse.

Infrastructure owns provider and technical connectivity.

The Application layer composes them into products.

A Domain may consume Identity, Organizations, Memberships, Roles and Permissions.

It must not redefine them.

A Domain may define business-specific Permission keys.

It must not redefine the authorization engine.

A Domain may reveal new reusable needs.

Architecture decides whether those needs remain in the Domain or become Platform Core.

Business ownership remains explicit.

Domain independence remains mandatory.

Platform Core evolves from demonstrated reuse, not speculation.