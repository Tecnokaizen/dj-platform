---
title: Project Context
version: 2.1.0
status: Living Document
updated: 2026-08-12
repository: dj-platform
---

# PROJECT_CONTEXT

Executive context for human developers and AI agents working on this repository.

This document provides the minimum high-level context required before significant implementation work.

It does not replace Architecture, Business, Engineering, Core or Domain documentation.

---

# Project

Primary project and implementation focus:

Platform Core

Repository technical identifier:

`dj-platform`

Reference Product:

DJ Platform

Reference Business Domain:

DJ

Current State:

Architecture consolidated for the implemented Foundation boundary.

Platform Core Foundation implementation now reaches Identity, Organizations,
Roles, Memberships, Tenancy Integration and Permissions. Known decision gates
and deferred integrations remain explicit below.

DJ Platform remains the current validation consumer.

Production readiness not established.

---

# Product Strategy

Platform Core is the primary project: a reusable SaaS foundation whose capabilities have business-agnostic semantics.

Products are customer-facing compositions that consume Platform Core together with one or more Business Domains. Business Domains own vertical-specific semantics and do not own Core capabilities.

DJ Platform is the first/reference Product and current validation consumer of Platform Core. DJ is the current reference Business Domain; it is not synonymous with DJ Platform.

The long-term architecture may support additional Products when demonstrated requirements justify them, without duplicating common SaaS capabilities.

Conceptually:

    Platform Core
        ↓
    Reusable SaaS Capabilities

    Business Domains
        ↓
    Product-Specific Semantics

    Products
        ↓
    Customer-Facing Applications

Product and Domain are not synonyms.

---

# DJ Platform Reference-Product Context

DJ Platform is an AI-native knowledge and content Product focused on Electronic Dance Music and DJ culture.

Its broader Product direction may include:

- DJs and artists;
- genres;
- festivals;
- tracks;
- labels;
- sessions;
- playlists;
- rankings;
- editorial content;
- relationships between music entities;
- discovery;
- AI-assisted workflows.

Not every strategic capability is currently implemented.

Product strategy must not be confused with current repository maturity.

---

# Platform Core

Platform Core contains reusable SaaS capabilities whose semantics are independent from a specific business vertical.

Current Foundation model:

    Identity
        ↓
    Organizations
        ↓
    Roles
        ↓
    Memberships
        ↓
    Tenancy Integration
        ↓
    Permissions

Current Foundation ownership:

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

---

# Current Core Status

Identity foundation:

Implemented in source.

Organizations:

Specification complete.

Organizations Foundation Stage 1:

CONDITIONAL PASS (O-029).

Foundation may be paused.

Organizations Stage 1 is not the whole operational tenancy boundary. The
cross-module tenancy foundation is now implemented through Memberships and
Tenancy Integration.

Implemented and validated:

- OrganizationStatus
- Organization Prisma model and migration
- Prisma runtime access
- findOrganizationById / findOrganizationBySlug
- createOrganizationRecord persistence primitive
- updateOrganization
- lifecycle suspend / reactivate / archive / restore
- Zod validation schemas
- application types and OrganizationDto
- stable Organization errors
- O-019 persistence tests (8/8)
- O-020 lifecycle tests (12/12)
- O-022 persistence-integrity tests (6/6)
- total Organizations integration tests (26/26)
- O-023 RLS requirements review
- O-024 server-only access review
- O-025 documentation validation
- O-026 architecture boundaries review
- O-027 source structure review
- O-028 technical validation PASS
- O-029 implementation review CONDITIONAL PASS

Deferred Organizations tasks (not completed):

- O-017
- O-018
- O-021

Implemented cross-module tenancy capabilities:

- OrganizationMembership persistence and lifecycle;
- atomic Organization onboarding with the initial OWNER Membership;
- Organization discovery for the current Profile;
- validated Organization context switching;
- Membership-based tenant RLS;
- explicit RolePermission authorization for Memberships administration.

Remaining tenancy and Organizations decision gates:

- M-088 ownership transfer and previous-owner Role policy;
- database enforcement strategy for exactly one active OWNER;
- O-017, O-018 and O-021;
- Product-facing Organization read composition (`organizations.read`) where required beyond Core mutation authorization;
- Product-level Organization context composition where required.

createOrganizationRecord remains an internal persistence primitive only.
It is not the public createOrganization() workflow.

Roles:

Specification complete.

Roles Foundation Stage 1:

CLOSED / PASS (R-036).

R-001 → R-036 completed.

Implemented and validated:

- Role Prisma model and migration
- canonical catalog OWNER / ADMIN / MANAGER / MEMBER / VIEWER
- idempotent system Role seed (reconciles name / isSystem / sortOrder; preserves description)
- persistence access via Roles-owned services/functions (ADR-007; Repository not mandatory)
- RoleDto, Zod validation schemas, stable RoleError codes
- getRole / getRoleByKey / listSystemRoles / resolveRequiredRole / validateSystemRoleCatalog
- security and boundary reviews (visibility ≠ possession; no Membership/Permission ownership leak)
- Roles integration tests (27/27)
- Prisma format / validate / generate PASS
- typecheck / lint PASS
- documentation aligned with CURRENT implementation

No Roles-owned defect blocks Memberships specification or implementation.

Deferred / future (not Roles Foundation Stage 1):

- ownership transfer policy and enforcement;
- custom tenant Roles.

Memberships:

Specification complete.

Foundation implementation and quality gate complete through M-083.

Implemented work includes:

- Membership and Invitation schema, migrations and generated Prisma client;
- secure repository projections and transaction-compatible factories;
- membership lifecycle and read services;
- invitation token security, lifecycle, acceptance and resend flows;
- DTO, validation and stable error contracts;
- OWNER safety invariants;
- behavioral, persistence and security tests;
- documentation and Foundation quality gate;
- Tenancy Integration M-084 through M-087;
- Permissions Integration M-089 through M-094.

M-088 ownership transfer remains blocked pending an approved previous-owner
Role policy. This is an explicit decision gate, not an incomplete Memberships
Foundation implementation.

Conceptual link:

    Profile
        ↓
    OrganizationMembership
        ↓
    Organization + Role

Dependencies already available:

- Identity
- Organizations
- Roles

Permissions:

Specification complete.

Foundation implementation and validation complete for the approved scope:

- Permission and RolePermission persistence;
- canonical 12-key catalog;
- explicit system Role policy and idempotent synchronization;
- drift detection without silent deletion;
- Permission reads and tenant-scoped authorization evaluation;
- server-only persistence grants;
- Memberships administrative integration;
- Organization mutation authorization (`organizations.update`) for update,
  suspend, archive, restore and reactivate.

Protected administrative operations revalidate tenant context and explicit
RolePermission mappings in the same serializable database transaction as their
read or mutation. Permission-aware RLS, authorization caching, Domain extension,
Product-facing Organization read composition and ownership-transfer integration
remain deferred pending their documented decision gates.

Other future Core capabilities must not be implemented speculatively.

---

# Identity

Supabase authentication identity is the canonical authentication identity.

Application identity is represented by:

`Profile`

Do not introduce a second canonical Prisma `User` model.

A DJ or artist is a Domain entity.

A DJ is not equivalent to an authenticated application user.

---

# Tenancy

`Organization` is the canonical tenant boundary.

Organization ownership is represented by:

    Organization
    +
    ACTIVE OrganizationMembership
    +
    OWNER Role

Do not introduce competing ownership fields such as:

- `ownerUserId`
- `ownerId`
- `ownerProfileId`

Every operational Organization must have exactly one active OWNER.

---

# Authorization

Initial authorization architecture:

    ACTIVE Membership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission

Initial permission model is explicit.

Do not introduce wildcard permissions, implicit OWNER bypasses, role inheritance or alternative authorization engines without Architecture approval.

---

# Current Source Structure

High-level source ownership:

    src/
    ├── app/
    ├── config/
    ├── core/
    │   ├── identity/
    │   └── modules/
    ├── domains/
    │   └── dj/
    ├── generated/
    │   └── prisma/
    ├── lib/
    └── shared/

Responsibilities:

`src/app`

Application routing and Product composition.

`src/core`

Reusable SaaS capability implementation.

`src/domains`

Business-specific semantics.

`src/shared`

Business-agnostic technical reuse.

`src/lib`

Infrastructure adapters and provider connectivity.

`src/generated`

Generated artifacts.

`src/config`

Application configuration.

---

# Dependency Direction

Allowed:

    app
    → core / domains / shared

    domains
    → core / shared / lib

    core
    → shared / lib

    lib
    → generated / external providers

Forbidden:

    core
    → domains

    shared
    → core

    shared
    → domains

    Domain A
    → Domain B

Application composition may coordinate capabilities without taking ownership of them.

---

# Current Technology Stack

Runtime:

- Node.js 22 LTS

Frontend:

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4

Backend:

- Next.js server capabilities
- TypeScript

Database:

- PostgreSQL

ORM:

- Prisma 7

Authentication:

- Supabase Auth
- `@supabase/ssr`
- `@supabase/supabase-js`

Database connectivity:

- `pg`
- Prisma PostgreSQL adapter

Deployment direction:

- VPS
- Coolify
- Docker-based services where appropriate
- Supabase self-hosted infrastructure

Package manager:

- npm

The repository runtime is pinned in `.nvmrc`.

---

# Technologies Not Currently Assumed

Do not assume the repository currently contains:

- Auth.js;
- shadcn/ui;
- OpenAI SDK;
- Anthropic SDK;
- Playwright;
- Storybook;
- Redis;
- queue infrastructure;
- generic object storage;
- generic event architecture;
- generic Billing;
- production monitoring.

Verify `package.json`, source and runtime infrastructure before using any technology.

---

# Current Authentication Implementation

Current authentication supports:

- email/password registration;
- email/password login;
- magic-link flow;
- auth callback;
- logout;
- protected application area;
- Profile management.

Relevant source currently lives under:

    src/core/identity/auth/
    src/core/identity/profile/

Authentication is implemented.

Identity architecture must remain aligned with Supabase Auth plus application `Profile`.

---

# Current Validation

Current repository baseline validation includes:

    npm run typecheck
    npm run lint

Foundation persistence and behavior are additionally protected by capability
specific Vitest suites for Identity, Organizations, Roles, Memberships, Tenancy
and Permissions. Prisma changes require format, validation, generation,
migration review and explicit test-database validation. A production build is
part of the Foundation closure gate.

Current typecheck command includes Next.js type generation and TypeScript validation.

These checks are not equivalent to comprehensive automated testing.

---

# Testing Maturity

Static validation and substantial automated Foundation coverage exist.

Current automated tests protect Core persistence, lifecycle invariants, tenant
isolation, authorization policy, invitation security, migration behavior and
critical Foundation boundaries. This is not equivalent to complete Product or
production confidence.

Remaining testing maturity work includes:

- Product end-to-end flows;
- broader Domain behavior;
- deployed Supabase and infrastructure verification;
- backup and restore exercises;
- production monitoring and operational validation.

Do not claim production confidence from lint and typecheck alone.

---

# Infrastructure Status

Self-hosted infrastructure work is in progress.

Current infrastructure includes VPS and Coolify resources.

PostgreSQL services have been deployed during development.

Supabase self-hosted infrastructure has been deployed experimentally and remains under validation.

Individual Supabase services must not be assumed healthy without runtime verification.

Production infrastructure is not currently considered verified.

---

# Environment Status

Local Development:

Active.

Development Infrastructure:

Active and evolving.

Staging:

Not assumed to exist.

Production:

Not verified.

Production Ready:

No.

Environment status must be based on runtime evidence.

---

# Documentation Architecture

Main documentation areas:

    docs/
    ├── architecture/
    ├── backend/
    ├── business/
    ├── core/
    ├── domains/
    ├── engineering/
    ├── frontend/
    ├── operations/
    ├── adr/
    └── reviews/

Additional platform-level documents include:

- `docs/INDEX.md`
- `docs/README.md`
- `docs/PLATFORM_MATURITY.md`

---

# Documentation Status

Consolidated:

- Architecture
- Business
- Engineering
- Backend
- Frontend
- Operations

Core Foundation specifications completed:

- Organizations
- Roles
- Memberships
- Permissions

Reviews framework:

Consolidated.

Formal versioned reviews:

Pending.

ADR framework:

Defined.

Foundation ADR backfill:

Pending.

Domain documentation:

Exists and requires continued alignment with Product implementation and maturity.

---

# Documentation Boundaries

Business:

Defines why Products exist and what value they create.

Architecture:

Defines ownership, boundaries, dependencies and major system decisions.

Engineering:

Defines how approved Architecture is implemented.

Core:

Defines reusable SaaS capabilities.

Domains:

Define business-specific semantics.

Backend and Frontend:

Define technical implementation standards.

Operations:

Defines how deployed systems are operated.

Reviews:

Provide evidence-based readiness assessments.

ADRs:

Record significant architectural decisions.

---

# Product vs Domain

Never use:

    Product
    = Domain

Products are customer-facing applications.

Domains own business-specific semantics.

A Product may compose one or more Domains plus Platform Core capabilities.

---

# Core Promotion Rule

Never use:

    Could another Product reuse this?
    → Platform Core

Potential reuse is insufficient.

Platform Core ownership requires:

- business-agnostic semantics;
- demonstrated reuse or strong architectural justification;
- clear capability ownership;
- meaningful reduction of duplication;
- no Domain coupling.

Architecture decides final ownership.

---

# Current Business Method

The broader platform strategy uses real Product and client discovery to identify reusable capabilities.

Typical progression:

    Real Problem
        ↓
    Discovery
        ↓
    Process / Product Understanding
        ↓
    Prototype when useful
        ↓
    Validation
        ↓
    Architecture
        ↓
    Product Implementation

Reusable capabilities are extracted into Platform Core only when justified.

---

# DJ Platform Role

DJ Platform validates areas such as:

- structured content;
- editorial data;
- discovery;
- public Product experiences;
- SEO-heavy resources;
- AI-assisted workflows.

Strategic scope is broader than current implementation.

Do not implement the entire Product vision at once.

---

# Current Product Implementation

The repository currently contains:

- Next.js application foundation;
- Supabase authentication integration;
- protected application area;
- Profile functionality;
- Prisma foundation;
- generated Prisma client;
- Organizations Foundation Stage 1 CONDITIONAL PASS (pausable);
- Roles Foundation Stage 1 CLOSED / PASS;
- Memberships Foundation and quality gate complete;
- atomic Organization onboarding, tenant discovery and context validation;
- Membership-based tenant RLS;
- Permissions Foundation and explicit system Role policy;
- transaction-scoped Memberships administrative authorization;
- initial Domain and Core source boundaries.

Organizations Foundation Stage 1 remains CONDITIONAL PASS. Its deferred tasks
O-017, O-018 and O-021 are not silently closed by the cross-module tenancy
implementation.

Roles Foundation Stage 1 and Memberships Foundation are closed for their
approved scopes. Tenancy Integration M-084 through M-087 is implemented.
Permissions Foundation and Memberships administrative integration M-089 through
M-094 are implemented and validated. Organization mutation authorization (O-037)
is implemented for update and lifecycle writes.

M-088 ownership transfer remains blocked pending approved policy.
Permission-aware RLS, caching, Domain Permission composition and Product-facing
Organization read composition remain explicitly deferred.

Large parts of DJ Domain functionality remain unimplemented.

---

# Implementation Readiness Rule

Before implementation ask:

    Can the implementation agent execute this work
    without making architectural decisions?

If yes:

    Implement
    → Validate
    → Review

If no:

    STOP
    → Resolve Architecture or Business decision
    → Update documentation
    → Resume

---

# AI Agent Role

AI coding agents are implementation agents.

They may:

- implement approved tasks;
- create tests;
- perform constrained refactors;
- update implementation documentation;
- inspect repository state;
- identify inconsistencies;
- run validation;
- report blockers.

They must not silently redefine Architecture.

---

# AI Stop Conditions

Stop when:

- ownership is unclear;
- documentation conflicts materially;
- a business rule is missing;
- tenancy semantics are unresolved;
- authorization semantics are unresolved;
- a forbidden dependency would be required;
- implementation requires an architectural decision;
- runtime infrastructure contradicts documentation;
- destructive operational work lacks recovery context.

Do not guess on foundational decisions.

---

# Source of Truth

No single file should be followed blindly.

Relevant evidence may include:

- approved Architecture;
- accepted ADRs;
- Core specifications;
- Domain specifications;
- Engineering standards;
- approved tasks;
- current source;
- Prisma schema;
- package configuration;
- runtime infrastructure.

If evidence conflicts, stop and resolve the conflict.

Source code does not silently become Architecture.

Documentation must not be followed blindly when repository evidence proves it stale.

---

# Current Priorities

Current consolidation priorities:

1. perform formal Foundation Architecture and security review;
2. align remaining agent instructions and maturity docs with current repository evidence;
3. backfill foundational ADRs where established decisions require records;
4. resolve M-088 ownership-transfer policy before implementation;
5. authorize the next bounded Core or Product milestone explicitly.

---

# Foundation ADRs Pending

Architectural decisions already established should be backfilled into ADRs where appropriate.

Current candidates:

- Platform Core and Domain Boundary;
- Identity Source of Truth;
- Internal Identifier Strategy;
- Tenancy and Organization Model;
- Roles, Memberships and Ownership Model;
- Authorization and Permission Model;
- Prisma and Data Access Conventions;
- Deployment and Infrastructure Strategy.

Future ADRs should be created only when real decisions require them.

---

# Open Architecture Questions

Known areas still requiring explicit decisions or implementation review may include:

- ownership transfer behavior for the previous OWNER;
- exact database enforcement of one active OWNER per Organization;
- future storage architecture;
- future AI provider architecture;
- future search architecture;
- future queue and background-job architecture;
- future Billing architecture.

These questions must not be resolved implicitly by implementation agents.

---

# Current Core Implementation Sequence

Approved sequence:

    Identity
        ↓
    Organizations
        ↓
    Roles
        ↓
    Memberships
        ↓
    Tenancy Integration
        ↓
    Permissions

Identity foundation already exists.

Organizations Foundation Stage 1 is CONDITIONAL PASS and may be paused.

Roles Foundation Stage 1 is CLOSED / PASS.

Memberships Foundation and Tenancy Integration are implemented for their
approved scopes.

Permissions Foundation and Memberships administrative integration are the
current closure milestone. No subsequent implementation module is authorized by
this document.

Current authorization link:

    Profile
        ↓
    ACTIVE OrganizationMembership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission

The Core implementation work should respect this dependency order unless Architecture explicitly changes it.

---

# Production Rule

Implementation does not equal Production Ready.

Production readiness may require:

- behavioral tests;
- migration validation;
- deployment validation;
- backup verification;
- restore testing;
- monitoring;
- security review;
- operational runbooks;
- readiness review.

Do not describe the Product as Production Ready without evidence.

---

# Before Significant Work

Read:

1. `PROJECT_CONTEXT.md`
2. `AGENTS.md`
3. relevant Architecture
4. relevant Core or Domain documentation
5. relevant Engineering standards
6. current source affected by the task

Context depth should be proportional to task risk.

Do not load the entire documentation tree for every trivial change.

---

# Repository Goal

The repository should become progressively self-explanatory.

A developer or AI agent should be able to determine:

- what is being built;
- what is already implemented;
- what is only planned;
- where capabilities belong;
- which dependencies are allowed;
- what decisions remain unresolved;
- how implementation should be validated.

Better repository knowledge should reduce prompt complexity and implementation mistakes.

---

# Final Principle

Platform Core is the repository's primary reusable, business-agnostic SaaS foundation and current implementation focus.

DJ Platform is the first/reference Product and current validation consumer.

DJ is the current reference Business Domain. Business Domains own vertical-specific semantics; Products and Domains do not own Core capabilities.

App composes capabilities into Products.

Engineering implements approved Architecture.

AI agents implement approved work and stop on unresolved foundational decisions.

Documentation must reflect repository reality.

Implementation status requires evidence.

Build only the next justified capability.
