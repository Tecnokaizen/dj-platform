---
title: Development Conventions
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - SOURCE_STRUCTURE.md
  - PROJECT_STRUCTURE.md
  - CORE.md
  - API.md
  - IDENTITY.md
  - TENANCY.md
  - SECURITY.md
  - PRISMA_IMPLEMENTATION.md
---

# Development Conventions

## Purpose

This document defines development conventions used across Platform Core, business Domains and application code.

The objective is to keep the repository:

- predictable
- readable
- testable
- maintainable
- secure
- easy to navigate
- suitable for AI-assisted development

These conventions must be interpreted together with the architecture documents.

When a convention conflicts with an explicit architectural decision, the architectural decision takes precedence.

---

# General Principles

Prefer code that is:

- simple
- explicit
- readable
- testable
- cohesive
- correctly owned
- minimally coupled

Avoid clever abstractions when straightforward code is sufficient.

Prefer:

```text
explicit behavior
```

over:

```text
implicit magic
```

Prefer solving the current approved requirement without introducing speculative infrastructure.

---

# Architecture Before Convenience

Before creating a file, function, type or abstraction, determine:

```text
Who owns this behavior?

Which architectural layer owns it?

Which module or Domain owns it?

Which dependencies are allowed?
```

Convenient placement is not sufficient justification.

---

# Naming Conventions

## Folders

Use:

```text
kebab-case
```

Examples:

```text
user-profile

feature-flags

batch-import
```

Use names that describe semantic ownership rather than implementation accidents.

---

## Files

Use:

```text
kebab-case
```

Examples:

```text
profile-form.tsx

create-organization.ts

get-current-profile.ts

organization-repository.ts
```

---

## React Components

Component names use:

```text
PascalCase
```

Examples:

```text
ProfileForm

DashboardCard

DataTable
```

Component filenames remain:

```text
kebab-case
```

Example:

```text
profile-form.tsx
```

Prefer one primary exported component per file.

Small tightly related internal components may remain colocated when splitting them would reduce clarity.

---

## Functions

Use:

```text
camelCase
```

Examples:

```text
createOrganization()

updateProfile()

getCurrentProfile()

requirePermission()
```

Function names should describe behavior clearly.

Prefer verbs for commands and operations.

---

## Types

Use:

```text
PascalCase
```

Examples:

```text
Profile

Organization

TenantContext

CreateOrganizationInput
```

Types belong with the architectural owner whenever practical.

---

## Constants

Use:

```text
UPPER_SNAKE_CASE
```

for true module-level constants.

Examples:

```text
MAX_UPLOAD_SIZE

DEFAULT_LANGUAGE

SESSION_DURATION
```

Do not convert ordinary runtime values into constants merely for stylistic consistency.

---

# Source Ownership

Canonical source roots are:

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

Each root has a distinct architectural responsibility.

---

# app/

`src/app/` owns Next.js application composition.

It may contain:

- routes
- layouts
- route groups
- metadata
- Server Components
- Client Components
- Server Actions
- Route Handlers

It does not own Core or Domain business behavior.

---

# core/

`src/core/` owns reusable SaaS application capabilities.

Current foundational structure includes:

```text
src/core/
├── identity/
│   ├── auth/
│   └── profile/
└── modules/
```

Functional reusable modules belong under:

```text
src/core/modules/
```

Identity remains foundational and separate from normal functional modules.

---

# domains/

`src/domains/` owns business-specific behavior.

Examples:

```text
src/domains/dj/

src/domains/copy/

src/domains/seo/
```

Every business capability belongs to one canonical Domain.

Domains do not directly depend on other Domains.

---

# shared/

`src/shared/` contains business-agnostic technical reuse.

Examples may include:

- generic UI primitives
- generic hooks
- technical utilities
- framework helpers
- business-agnostic validators
- shared technical types

Shared must not contain Core or Domain business semantics.

---

# lib/

`src/lib/` contains infrastructure adapters and technical integrations.

Examples:

- Supabase clients
- Prisma access infrastructure
- storage adapters
- email providers
- AI provider adapters
- external API clients
- third-party SDK wrappers

Provider-specific behavior belongs here rather than being scattered throughout application code.

---

# generated/

`src/generated/` contains tool-generated code.

Example:

```text
Prisma generated client
```

Do not manually implement application behavior inside generated files.

---

# config/

`src/config/` contains application configuration and validated configuration composition.

It does not own business behavior.

Secrets must not be hard-coded into source configuration.

---

# Feature and Module Colocation

Code should normally live close to its owner.

A module may contain folders such as:

```text
actions/

services/

repositories/

components/

validators/

types/
```

when those folders are genuinely useful.

These folders are not mandatory for every module.

Do not create empty architectural ceremony merely to satisfy a template.

---

# actions/

Use `actions/` for Server Actions owned by that feature or module.

Server Actions may:

- validate transport input
- resolve required server context
- invoke application services
- map expected errors
- revalidate application data
- redirect when appropriate
- return typed action results

Server Actions must not own reusable Core or Domain business rules.

---

# services/

Services own reusable application operations and workflows inside their architectural owner.

Examples:

```text
Core service

Domain service
```

Responsibilities may include:

- application workflows
- business rules
- lifecycle validation
- transaction coordination
- cross-repository coordination
- approved cross-module orchestration

Services should remain independent from React.

---

# External Providers in Services

A service may coordinate an external capability.

It should not normally contain provider-specific SDK behavior.

Preferred:

```text
Service
    ↓
Infrastructure Adapter
    ↓
Provider SDK
```

Example:

```text
Invitation Service
    ↓
Email Adapter
    ↓
Email Provider
```

The service owns why the email is sent.

The adapter owns how the provider is called.

---

# repositories/

Repositories form persistence boundaries.

Responsibilities may include:

- persistence queries
- persistence mapping
- query composition
- persistence projections
- participation in approved transactions

Repositories do not own business policy.

---

# Prisma Access

Application persistence should normally follow:

```text
Service
    ↓
Repository
    ↓
Prisma
    ↓
Database
```

Do not spread Prisma operations throughout:

```text
src/app/
```

or unrelated business code.

Generated Prisma models are persistence representations, not automatically public application contracts.

---

# components/

Components own presentation.

Components should generally:

- remain focused
- receive deliberate data contracts
- avoid business policy
- avoid persistence access
- avoid duplicating authorization logic

A Server Component may invoke approved server-side services for reads.

A Client Component must not gain direct database authority.

---

# hooks/

Hooks own reusable React behavior.

Hooks may manage:

- local state
- browser effects
- client interaction
- reusable UI behavior

Hooks do not own Core or Domain business policy.

---

# validators/

Use `validators/` when a feature has enough validation behavior to justify a dedicated location.

Validation should remain owned by the capability it validates.

Examples:

```text
Core-specific validation
→ Core module

Domain-specific validation
→ Domain

generic technical validation
→ Shared
```

Zod is the preferred runtime validation library where appropriate.

---

# schemas/

The name `schemas/` may be used when an owner has meaningful shared contracts or schema definitions.

Examples:

- transport contracts
- DTO schemas
- runtime schemas
- external payload schemas

Do not create a global schema dumping ground.

---

# types/

Types should normally be colocated with their owner.

Examples:

```text
Core-specific type
→ Core module

Domain-specific type
→ Domain

business-agnostic technical type
→ src/shared/types
```

Do not recreate a generic root:

```text
src/types/
```

unless a future architectural decision explicitly requires it.

---

# utils/

Utility functions should remain narrow and correctly owned.

A utility is not automatically Shared.

Examples:

```text
DJ-specific helper
→ DJ Domain

Membership-specific helper
→ Memberships

generic string helper
→ Shared
```

Pure utilities should preferably be deterministic and side-effect free.

Do not hide business rules inside files called `utils`.

---

# Import Rules

Use clear imports that preserve architectural ownership.

Prefer configured aliases for cross-boundary imports.

Example:

```ts
import { createClient } from '@/lib/supabase/server'
```

Relative imports are acceptable for nearby implementation details inside the same owner when they improve clarity.

Avoid fragile deep relative imports such as:

```text
../../../../../../lib/...
```

---

# Canonical Dependency Rules

Allowed:

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

Shared may depend on generic technical libraries.

---

# Forbidden Dependencies

Forbidden:

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
→ Core business behavior
```

```text
lib
→ Domain business behavior
```

Architectural dependency cycles are forbidden.

---

# Cross-Domain Imports

Never import business behavior directly from another Domain.

Forbidden:

```text
DJ Domain
→ Copy Domain
```

If several Domains require the same behavior, determine whether it is:

```text
reusable SaaS behavior
→ Platform Core
```

or:

```text
business-agnostic technical reuse
→ Shared
```

Do not move code merely to eliminate an import.

Semantic ownership comes first.

---

# Server Components

Server Components may perform server-side reads through approved services.

Preferred:

```text
Server Component
        ↓
Application / Core / Domain Service
        ↓
Repository
```

Do not create an internal HTTP request to the same Next.js application when a direct server call is sufficient.

---

# Server Actions

Server Actions are application transport boundaries for internal commands.

Typical flow:

```text
Server Action
        ↓
Runtime Validation
        ↓
Required Server Context
        ↓
Application Service
        ↓
Repository
```

They do not own reusable business behavior.

---

# Route Handlers

Use Route Handlers when a real HTTP boundary exists.

Examples:

- webhooks
- external callbacks
- integrations
- uploads
- exports
- health endpoints
- future public APIs

Route Handlers must remain thin.

Provider-specific behavior belongs behind the appropriate integration adapter.

---

# No Universal Request Flow

Do not assume every operation begins with:

```text
Server Action
```

Valid entry points include:

```text
Server Component

Server Action

Route Handler

trusted internal workflow

background process when introduced
```

The owning service remains reusable across transport choices.

---

# Services

Services own application behavior inside Core or Domains.

Preferred:

```text
Transport / Server Read
        ↓
Service
        ↓
Repository / Adapter
```

Avoid circular service dependencies.

Cross-module orchestration must preserve documented ownership boundaries.

---

# Transactions

Services or approved orchestration boundaries coordinate transactions when an invariant requires atomic behavior.

Example:

```text
Create Organization
+
Create initial OWNER Membership
```

must succeed or fail atomically.

Do not allow transport code to fragment an approved atomic workflow.

---

# Database Access

Repositories are the normal persistence boundary.

Do not access Prisma directly from:

```text
Client Components

React hooks

presentation components
```

Server-side infrastructure or migration tooling may access persistence according to its own approved technical responsibility.

The repository rule applies to application persistence behavior, not to generated tooling or migration infrastructure.

---

# Domains

Domains own business-specific behavior.

Examples:

```text
DJ playlist behavior

Copy production workflow

SEO project behavior
```

Domains may depend on:

- Platform Core
- Shared
- Infrastructure adapters

Domains never directly depend on another Domain.

---

# Platform Core

Platform Core owns reusable SaaS behavior.

Examples:

```text
Identity

Organizations

Roles

Memberships

Permissions
```

Platform Core must remain independent from business Domains.

Core may depend on:

```text
Shared

Lib
```

Core must not depend on:

```text
Domains
```

---

# Identity Convention

Identity is foundational.

Canonical source structure:

```text
src/core/identity/
├── auth/
└── profile/
```

Do not create a separate:

```text
src/core/modules/profiles/
```

unless architecture is explicitly changed.

Profile belongs to Identity.

---

# Tenancy Convention

The canonical tenant is:

```text
Organization
```

Tenancy is architectural composition, not a separate Core module.

Do not create:

```text
src/core/modules/tenancy/
```

Do not introduce parallel tenant abstractions without an approved architectural decision.

---

# Shared

Shared owns business-agnostic technical reuse.

Shared must not know:

- Organizations
- Memberships
- Roles
- Permissions
- Domain entities
- business workflows

If a Shared helper needs Core semantics, it probably does not belong in Shared.

---

# Infrastructure

Infrastructure owns technical connectivity.

Examples:

```text
Supabase

Prisma

Email

Storage

AI providers

External APIs
```

Infrastructure adapters do not decide business policy.

---

# Authorization

Platform Core Permissions owns the reusable authorization mechanism.

Normal tenant authorization follows:

```text
Authenticated Identity
        ↓
Profile
        ↓
ACTIVE Membership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

Authorization is always enforced server-side for protected operations.

---

# Authorization Does Not Replace Business Validation

Permission approval does not mean every requested operation is valid.

Example:

```text
Permission
→ memberships.remove
```

does not allow violating the sole-OWNER invariant.

The owning Core module or Domain still validates:

- resource relationships
- tenant ownership
- lifecycle state
- business invariants

---

# Role Conventions

Do not:

```text
store Role directly on Profile

authorize through Role.sortOrder

trust client Role values
```

Role assignment belongs to Membership.

Authorization uses explicit Permission mappings.

---

# OWNER Convention

OWNER is a Role.

It is not an implicit allow-all bypass.

Do not implement:

```text
if role === "OWNER":
    allow everything
```

OWNER receives explicit RolePermission mappings.

---

# Client Authority

Never trust client-provided:

```text
profileId

organizationId

membershipId

role

permission list

isAdmin

canManage
```

as authoritative security context.

Resolve security-sensitive context server-side.

---

# Validation

Validate runtime data at trust boundaries.

Examples:

- form input
- route parameters
- query parameters
- HTTP bodies
- provider payloads
- webhook payloads
- uploaded files
- AI-generated structured output

TypeScript does not replace runtime validation.

---

# Validation Ownership

Transport validation checks shape and basic constraints.

The owning Core module or Domain checks semantic validity.

Example:

```text
Zod
→ targetMembershipId is a UUID

Memberships
→ target Membership belongs to Organization
```

Do not duplicate business validation inside generic validators.

---

# Error Handling

Do not silently swallow errors.

Expected application errors should use stable semantic error codes where specified.

Unexpected failures should be logged safely.

Do not expose:

- stack traces
- raw Prisma errors
- SQL details
- secrets
- internal filesystem paths
- cross-tenant data

to clients.

---

# Logging

Logs should contain enough context for diagnosis without leaking secrets or sensitive values.

Never log:

```text
raw invitation tokens

passwords

session secrets

provider secrets
```

Sensitive payload logging requires deliberate review.

---

# Documentation

Architecture documentation belongs under:

```text
docs/architecture/
```

Core module specifications belong under:

```text
docs/core/modules/<module>/
```

Domain documentation belongs under:

```text
docs/domains/<domain>/
```

Durable architectural decisions belong under:

```text
docs/adr/
```

Formal reviews belong under:

```text
docs/reviews/
```

Documentation must match approved architecture and actual implementation maturity.

---

# Documentation First

Core capabilities should be specified before implementation.

The current standard module documentation package is:

```text
SPEC.md

DATA_MODEL.md

FLOWS.md

API.md

PRISMA.md

TASKS.md
```

An AI implementation agent must not silently fill architectural gaps.

---

# Testing

Business and application logic should be testable independently from presentation code.

Important tests should cover:

- lifecycle rules
- tenant isolation
- authorization boundaries
- transaction invariants
- error behavior
- cross-tenant denial
- important bootstrap flows

Do not couple Core or Domain behavior unnecessarily to React.

---

# Test Ownership

Tests should live near the capability they verify or in the approved project testing structure.

Avoid a testing structure that obscures ownership.

A test name should describe observable behavior rather than implementation trivia.

---

# Security

Security is systemic.

Responsibilities are distributed.

Platform Core owns reusable security capabilities such as:

```text
Identity

Membership validation

Role resolution

Permission evaluation
```

Infrastructure may enforce:

```text
session security

RLS

secret handling

provider security
```

Core modules and Domains enforce their own:

```text
resource rules

lifecycle invariants

business constraints
```

Client-side checks are UX, never authority.

---

# RLS

Row Level Security and application Permissions have different responsibilities.

Conceptually:

```text
RLS
→ tenant row isolation
```

```text
Permissions
→ application capability authorization
```

Do not treat one as an automatic replacement for the other.

---

# AI Development

This repository is designed for AI-assisted implementation.

AI agents must follow:

- documented architecture
- documented ownership
- documented dependency rules
- approved module specifications
- existing naming conventions

AI agents implement.

They do not silently architect.

---

# AI Stop Rule

If an implementation task requires an unresolved architectural decision:

```text
STOP
        ↓
Report the issue
        ↓
Architecture decision
        ↓
Documentation update
        ↓
Resume implementation
```

Do not create temporary models or conventions merely to continue coding.

---

# Avoid Premature Abstraction

Do not extract an abstraction purely because similar code appears twice.

Evaluate:

```text
semantic ownership

expected stability

real reuse

coupling introduced
```

before extraction.

Repetition can be cheaper than the wrong abstraction.

---

# Rule of Three

The Rule of Three is a heuristic, not a mandatory architectural rule.

When a pattern appears repeatedly:

```text
observe
        ↓
compare semantics
        ↓
identify true shared responsibility
        ↓
extract only when ownership is clear
```

Three similar snippets do not automatically belong in Shared or Core.

---

# Dependency Rule

The architecture is not a linear dependency chain.

Use the canonical dependency graph:

```text
app
├──→ core
├──→ domains
└──→ shared

domains
├──→ core
├──→ shared
└──→ lib

core
├──→ shared
└──→ lib

lib
├──→ generated
└──→ external systems
```

Never replace this with:

```text
App
↓
Domain
↓
Shared
↓
Core
```

That model is incorrect.

---

# New File Checklist

Before creating a file, ask:

```text
1. Who owns this behavior?

2. Is it Core, Domain, Shared, Infrastructure, App or Config?

3. Does an existing owner already contain this capability?

4. Are the intended imports allowed?

5. Is the file actually necessary?

6. Am I introducing a new architectural concept?

7. Does documentation already define the expected behavior?
```

If ownership is unclear, resolve architecture before writing code.

---

# Forbidden Practices

Do not:

```text
put business logic in src/app

put Domain behavior in Core

put Core behavior in Shared

make Shared depend on Core

make Core depend on Domains

make one Domain depend directly on another

create a generic src/types dumping ground

hide business policy inside utils

scatter Prisma access through presentation code

scatter provider SDK calls through business services

put provider-specific policy in Core or Domains

trust client authorization values

store Role directly on Profile

authorize through Role.sortOrder

special-case OWNER as allow-all

create a Tenancy module

create duplicate tenant or authorization systems

create internal HTTP endpoints when direct server calls are sufficient

invent infrastructure before there is a requirement

let an AI coding agent resolve architecture silently
```

---

# Final Principle

Code structure follows semantic ownership.

Platform Core owns reusable SaaS behavior.

Domains own business-specific behavior.

Shared owns business-agnostic technical reuse.

Infrastructure owns connectivity to technical systems.

App owns composition and transport.

Generated code owns nothing architecturally.

Clear ownership comes before abstraction.

Clear dependency direction comes before convenience.

When architecture is unclear, document the decision before implementation.