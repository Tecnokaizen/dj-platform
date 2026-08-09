---
title: Platform Maturity
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - architecture/README.md
  - architecture/PLATFORM_CORE_SPEC.md
  - architecture/DECISIONS.md
  - reviews/README.md
  - business/ROADMAP.md
---

# Platform Maturity

## Purpose

This document tracks the current maturity of the platform using observable project evidence.

It provides a high-level view of:

- documentation maturity
- architectural maturity
- implementation maturity
- validation maturity
- operational maturity
- Platform Core progress
- Domain progress
- readiness for AI-assisted implementation

Maturity is not represented with arbitrary percentages.

A capability is described according to what currently exists and has been verified.

---

# Maturity Model

The following status vocabulary is used.

## Consolidated

Documentation or architecture has been reviewed for internal consistency and accepted as the current baseline.

## Implemented

The capability exists in source and has passed the currently available project validation relevant to it.

## Specified

Architecture, ownership and expected behavior are documented, but implementation is not yet complete.

## In Progress

Work exists but the capability has not reached the required implementation or documentation baseline.

## Pending Review

Documentation or implementation exists but has not yet been audited during the current consolidation.

## Planned

The capability has been identified but is not yet sufficiently specified or implemented.

## Not Verified

The capability may partially exist, but there is not yet enough evidence to declare it operational or production-ready.

---

# Current Platform Summary

The platform has moved beyond the conceptual stage.

Current evidence includes:

- implemented Next.js application source
- Supabase authentication integration
- Profile application identity
- PostgreSQL and Prisma integration
- authenticated/private application routes
- consolidated source architecture
- consolidated Platform Core architecture
- documented tenant model
- documented Role and Permission architecture
- documented Domain boundaries
- Docker and Coolify development infrastructure
- self-hosted Supabase infrastructure under validation
- lint and typecheck validation

The platform is not yet production-ready.

Several documentation areas still require consolidation, and most Platform Core functional modules remain to be implemented.

---

# Architecture

Status:

**Consolidated**

The `docs/architecture/` documentation set has been reviewed and aligned with the current architectural baseline.

Current consolidated areas include:

- Platform Core boundaries
- Business Domains
- Identity
- Tenancy
- Organizations ownership
- Roles
- Memberships
- Permissions
- Data architecture
- Prisma conventions
- Security
- API architecture
- caching strategy
- deployment architecture
- technology stack
- source structure
- dependency rules
- architecture decisions registry

The current canonical dependency direction is:

`app → core / domains / shared`

`domains → core / shared / lib`

`core → shared / lib`

`lib → generated / external`

Forbidden dependencies include:

`core → domains`

`shared → core`

`shared → domains`

`Domain A → Domain B`

---

# Architectural Decision Records

Status:

**Backfill Required**

The architecture decision registry has been consolidated.

No formal ADR files currently exist under:

`docs/adr/`

Several already-established architectural decisions require ADR backfill.

These include:

- Platform Core / Domain boundary
- Identity source of truth
- UUID identifier strategy
- tenancy and Organization model
- Roles, Memberships and ownership model
- Permission architecture
- Prisma and data-access conventions
- deployment and infrastructure strategy

Future ADR candidates are also documented.

ADR backfill should be completed before declaring the next formal architecture baseline complete.

---

# Reviews

Status:

**Framework Consolidated — Formal Reviews Pending**

The review process has been defined under:

`docs/reviews/README.md`

Formal reviews are evidence-based snapshots and must not be created merely to indicate readiness.

No versioned formal review currently exists.

Future reviews should include, when appropriate:

- Architecture Review
- AI Agent / Cursor Readiness Review
- Security Review
- Implementation Review
- Production Readiness Review

Formal readiness must be demonstrated after the relevant baseline has been verified.

---

# Business Documentation

Status:

**Pending Consolidation Review**

Business documentation exists for:

- Platform Vision
- Platform Strategy
- Products
- Methodology
- Discovery Framework
- Go-To-Market
- Monetization
- Roadmap

This documentation has not yet completed the same consolidation audit performed on `docs/architecture/`.

Therefore it must not currently be described as fully consolidated.

---

# Engineering Documentation

Status:

**Pending Consolidation Review**

Engineering documentation exists, including AI-assisted development guidance.

The engineering documentation still requires audit against the current Architecture v2 baseline.

The review should verify areas such as:

- AI agent responsibilities
- architecture decision authority
- source ownership
- implementation stop conditions
- dependency rules
- testing expectations
- documentation synchronization
- task execution workflow

---

# Backend Documentation

Status:

**Pending Consolidation Review**

Backend documentation currently covers areas such as:

- API
- database
- integrations
- jobs
- queues
- storage
- webhooks
- SEO

These documents must still be reviewed against the consolidated architecture.

Particular attention is required to ensure that planned capabilities are not described as already implemented.

---

# Frontend Documentation

Status:

**Pending Consolidation Review**

Frontend documentation currently includes:

- Design System
- Components
- Routing
- Forms
- Navigation
- Themes
- Accessibility

These documents still require consolidation against:

- current source structure
- Application composition
- Domain-specific UI ownership
- Shared UI ownership
- server-first architecture
- current installed dependencies

---

# Operations Documentation

Status:

**Pending Consolidation Review**

Operations documentation currently includes:

- Deployment
- Monitoring
- Backups
- Runbooks
- Incident Response
- Maintenance

These documents must be reviewed against the current deployment architecture and actual infrastructure maturity.

Documentation must distinguish:

- target production requirements
- implemented infrastructure
- validated operational capabilities

---

# Source Structure

Status:

**Consolidated**

The current source architecture has been validated.

Canonical high-level structure:

`src/app/`

`src/config/`

`src/core/`

`src/domains/`

`src/generated/`

`src/lib/`

`src/shared/`

Platform Core currently includes:

`src/core/identity/`

and:

`src/core/modules/organizations/`

Identity contains:

- auth
- profile

Roles, Memberships and Permissions are specified but not yet implemented as source modules.

No global `src/types/` architecture is required.

No `src/infrastructure/` layer is currently required.

No `src/core/modules/tenancy/` module should be created.

---

# Source Code

Status:

**Implementation Started**

Source implementation is not at zero maturity.

Current implemented capabilities include:

- Next.js application
- React application runtime
- Supabase SSR integration
- Email + Password authentication
- Magic Link authentication
- authentication callback
- logout
- private application routes
- Profile retrieval
- Profile update
- Prisma generated client
- PostgreSQL adapter integration

The source code is still an early implementation of the broader architecture.

---

# Identity

Status:

**Implemented Foundation**

Identity is the most mature Platform Core capability currently present in source.

Canonical model:

`Supabase auth.users → Profile`

Supabase `auth.users` is the authentication source of truth.

Profile is the application identity/profile.

Current capabilities include:

- Email + Password authentication
- Magic Link
- session handling
- authentication callback
- logout
- Profile retrieval
- Profile update

Identity does not own:

- Organization
- Membership
- Role
- Permission

---

# Organizations

Status:

**Specified — Implementation Pending**

Organizations has a complete Core documentation package.

Organizations owns:

`Organization`

Organization is the canonical tenant.

Organization ownership is represented through:

`ACTIVE OrganizationMembership + OWNER Role`

Organization must not contain a second ownership system such as:

- `ownerId`
- `ownerUserId`
- `ownerProfileId`

Organizations Foundation is the next Platform Core persistence implementation step.

---

# Roles

Status:

**Specified — Implementation Pending**

Roles has a complete Core documentation package.

Initial canonical Roles are:

- OWNER
- ADMIN
- MANAGER
- MEMBER
- VIEWER

Roles are global system reference data.

Role semantic identity is based on stable keys.

UUID values must not be hard-coded into application behavior.

Roles must be implemented before Memberships Foundation.

---

# Memberships

Status:

**Specified — Implementation Pending**

Memberships has a complete Core documentation package.

Memberships owns:

- OrganizationMembership
- OrganizationInvitation

Membership is the durable tenant relationship.

Invitation is a separate pending workflow.

Membership lifecycle:

- ACTIVE
- SUSPENDED
- REMOVED

Invitation lifecycle:

- PENDING
- ACCEPTED
- REVOKED
- EXPIRED

Memberships depends on canonical Organizations and Roles.

---

# Tenancy Integration

Status:

**Specified — Implementation Pending**

Tenancy is an architectural concern rather than an independent Core module.

Canonical tenant:

`Organization`

Canonical relationship:

`Profile → OrganizationMembership → Organization`

Trusted tenant context must be resolved server-side.

Tenancy Integration follows Organizations, Roles and Memberships Foundation.

---

# Permissions

Status:

**Specified — Implementation Pending**

Permissions has a complete Core documentation package.

Initial authorization chain:

`Authenticated Identity → Profile → ACTIVE OrganizationMembership → Role → RolePermission → Permission`

The model is:

- explicit
- positive-grant based
- deny-by-default

There is no implicit OWNER bypass.

Domains may define business-specific Permission keys but must use the Platform Core Permission engine.

Permissions implementation follows Tenancy Integration.

---

# Platform Core Foundation Sequence

The approved implementation sequence is:

1. Identity — implemented foundation
2. Organizations Foundation
3. Roles Foundation
4. Memberships Foundation
5. Tenancy Integration
6. Permissions

Implementation agents must not bypass this sequence using temporary tenant, Role, Membership or Permission models.

---

# Planned Platform Core Capabilities

Status:

**Planned**

Future reusable capabilities currently include:

- Notifications
- Audit
- Billing
- Settings
- Storage

These capabilities must be specified before implementation.

Additional capabilities may emerge from demonstrated product requirements.

Platform Core must evolve through validated reuse rather than speculation.

---

# DJ Domain

Status:

**Documented Domain — Early Implementation**

The repository includes:

`src/domains/dj/`

DJ-specific product and architecture documentation also exists.

The DJ Domain is the first active business Domain in the repository.

Its documented vision is broader than its current source implementation.

Potential DJ capabilities include:

- Artists
- Tracks
- Playlists
- Genres
- Festivals
- Labels
- Rankings
- Editorial workflows
- Sessions
- Search
- AI-assisted content

The existence of documented scope must not be interpreted as completed implementation.

---

# Future Domains

Status:

**Product Opportunities**

Potential future Domains include:

- Copy
- SEO
- CRM

These are not current implementation commitments.

A new Domain should begin from real business discovery and validated requirements.

The Business Roadmap may describe future product phases without implying current implementation maturity.

---

# Testing

Status:

**Static Validation Available — Automated Testing Pending**

No dedicated automated test framework is currently installed.

The project does not currently include:

- Vitest
- Playwright

Current validation capabilities include:

- ESLint
- TypeScript compilation
- Next.js type generation
- Prettier
- Prisma validation
- Prisma generation

Current scripts include:

`npm run lint`

`npm run typecheck`

`npm run format:check`

`npm run prisma:validate`

Automated unit, integration and end-to-end testing still need to be introduced.

Testing maturity must therefore not be described as zero, but automated regression coverage is not yet established.

---

# Technology Stack

Status:

**Current Stack Documented**

Current application technologies include:

- Next.js 16.3.0
- React 19.2.8
- TypeScript 5
- Tailwind CSS 4
- PostgreSQL
- Prisma 7.9.1
- Supabase Authentication
- `@supabase/ssr`
- ESLint
- Prettier
- npm

Technologies such as the following are not currently installed application dependencies:

- shadcn/ui
- Zod
- OpenAI SDK
- Anthropic SDK
- Vitest
- Playwright
- Redis client
- queue framework

Planned technology must remain distinct from implemented technology.

---

# Infrastructure

Status:

**Development Infrastructure Present — Production Not Verified**

Current development infrastructure includes:

- Docker
- Coolify
- PostgreSQL
- self-hosted Supabase infrastructure
- GitHub
- GitHub Actions

Some self-hosted Supabase services have been under active validation.

The presence of infrastructure does not prove application adoption or production readiness.

No production environment should be described as operational until deployment and operational readiness have been verified.

---

# Storage

Status:

**Planned**

No application-level persistent object-storage integration is currently established.

S3-compatible storage remains a potential future architecture.

The application container filesystem must be treated as ephemeral for production architecture.

---

# Cache

Status:

**Architecture Defined — Dedicated Cache Not Implemented**

No dedicated application cache or distributed cache is currently implemented.

Redis is not currently part of the application stack.

Caching remains an optional performance optimization to introduce only after measurable need.

---

# AI Runtime

Status:

**Planned / Domain-Driven**

No runtime OpenAI or Anthropic SDK is currently installed as an application dependency.

AI-assisted software development is separate from application runtime AI.

Runtime AI architecture should be introduced from actual Domain requirements.

Domains own:

- why AI is used
- what AI output means

Infrastructure owns provider connectivity.

---

# Deployment

Status:

**Target Architecture Defined — Production Not Verified**

The deployment architecture targets:

- containerized application deployment
- Coolify management
- modular monolith
- PostgreSQL persistence
- self-hosted Supabase capabilities where explicitly adopted
- isolated environments
- ephemeral application containers
- external persistent storage when required

Health/readiness endpoints are architectural targets and must not be treated as implemented until they exist in source.

Production readiness has not yet been formally verified.

---

# Current Architectural Blockers

The following architectural questions remain intentionally unresolved.

## Ownership Transfer Destination Role

When Organization ownership is transferred, the destination Role of the previous OWNER remains undecided.

Implementation must not assume ADMIN.

## Sole OWNER Database Enforcement

The architecture requires exactly one ACTIVE OWNER for every operational Organization.

The final PostgreSQL enforcement mechanism requires implementation review.

## Invitation Partial Uniqueness

The platform requires at most one PENDING invitation per:

`organizationId + normalizedEmail`

The active Prisma capability must be verified before choosing schema-native support or raw PostgreSQL migration SQL.

---

# Current Consolidation Status

## Consolidated

- Architecture documentation
- Source structure
- Platform Core ownership model
- Organizations specification
- Roles specification
- Memberships specification
- Permissions specification
- Review methodology

## Pending Consolidation Review

- Business documentation
- Engineering documentation
- Backend documentation
- Frontend documentation
- Operations documentation
- root project context
- AI/Cursor operational context
- Domain documentation consistency
- repository-level documentation consistency

## Pending Formal Review

- Architecture Review
- AI Agent / Cursor Readiness Review

---

# Next Milestones

## Milestone 1 — Documentation Consolidation

Status:

**In Progress**

Complete the remaining documentation audits and repository context consolidation.

---

## Milestone 2 — Formal Architecture Baseline

Status:

**Pending**

Tasks include:

- complete ADR backfill as required
- perform formal Architecture Review
- verify unresolved blockers
- verify repository consistency

---

## Milestone 3 — AI Agent Readiness

Status:

**Pending**

Perform formal Cursor / AI Agent Readiness Review.

The review must answer:

Can the implementation agent execute the next approved task without making architectural decisions?

---

## Milestone 4 — Platform Core Foundation Implementation

Status:

**Partially Started**

Identity already exists.

Remaining Foundation sequence:

1. Organizations Foundation
2. Roles Foundation
3. Memberships Foundation
4. Tenancy Integration
5. Permissions

---

## Milestone 5 — Automated Testing Foundation

Status:

**Pending**

Introduce appropriate automated testing before implementation complexity makes regression protection expensive.

Exact tooling should be adopted intentionally and reflected in the technology stack.

---

## Milestone 6 — DJ Domain Implementation

Status:

**Early**

Continue implementation against the approved DJ Domain scope after the required Platform Core capabilities are available.

---

## Milestone 7 — Production Readiness

Status:

**Future**

Production readiness requires evidence across:

- implementation
- testing
- security
- deployment
- backups
- restore testing
- monitoring
- operations
- environment isolation

Documentation maturity alone cannot satisfy this milestone.

---

# Relationship to Business Roadmap

The Business Roadmap includes a future phase named:

`Platform Maturity`

That phase represents continued evolution of reusable capabilities after real product validation.

It may include improvements such as:

- advanced search
- shared administration
- background processing
- AI orchestration
- public APIs
- monitoring
- performance optimization

This document serves a different purpose.

`PLATFORM_MATURITY.md` tracks the current observable maturity of the repository at any point in time.

The Business Roadmap describes future strategic product phases.

---

# Maturity Principle

Maturity must be evidence-based.

Do not infer implementation from documentation.

Do not infer production readiness from source code.

Do not infer application adoption from infrastructure presence.

Do not infer architectural approval from implementation convenience.

---

# Final Principle

The platform has a consolidated architectural foundation and a real implementation baseline.

It is not yet a complete Platform Core.

It is not yet production-ready.

The immediate objective is to finish consolidation, formalize the architecture baseline and then continue implementation through the approved Foundation sequence.

Measure maturity from evidence.

Measure progress from verified capability.

Do not replace uncertainty with arbitrary percentages.