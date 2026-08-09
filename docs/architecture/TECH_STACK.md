---
title: Technology Stack
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - API.md
  - DATA.md
  - IDENTITY.md
  - SECURITY.md
  - DEPLOYMENT.md
  - SOURCE_STRUCTURE.md
  - PROJECT_STRUCTURE.md
  - DOMAINS.md
---

# Technology Stack

## Purpose

This document defines the technology stack currently used by the platform and distinguishes it from technologies that are only planned, approved for later implementation or under evaluation.

Technology documentation must reflect implementation reality.

A technology must not be described as currently used merely because it appears in architecture plans.

---

# Technology Status

Technology decisions are classified as:

```text
Current
→ installed and/or implemented in the project

Approved Target
→ architecturally accepted but not necessarily implemented yet

Planned / Evaluation
→ candidate requiring explicit implementation or architecture decision
```

When implementation and documentation disagree, the discrepancy must be resolved explicitly.

For installed JavaScript dependencies, `package.json` is the primary implementation reference.

---

# Current Application Stack

The current application stack includes:

```text
Next.js 16.3.0
React 19.2.8
React DOM 19.2.8
TypeScript 5
Tailwind CSS 4
Node.js application runtime
npm package management
```

---

# Frontend

## Framework

Current:

```text
Next.js 16.3.0
App Router
React 19.2.8
TypeScript
Tailwind CSS 4
```

The Application layer lives primarily under:

```text
src/app/
```

Business-specific UI may be colocated with its owning Domain.

Reusable business-agnostic UI may live under:

```text
src/shared/
```

---

# UI Component Libraries

Tailwind CSS is currently installed.

`shadcn/ui` is not currently installed as a project dependency.

Therefore it must not be treated as part of the current stack.

It may be evaluated or introduced later if there is a concrete UI requirement.

Do not create a dependency merely to satisfy documentation.

---

# Server Architecture

The platform follows a server-first architecture where appropriate.

Current Next.js capabilities include:

```text
Server Components
Server Actions
Route Handlers
```

These are transport and composition mechanisms.

They do not replace Core or Domain services.

There is no mandatory universal request flow.

---

# Backend

Backend application behavior is implemented through the Next.js server runtime.

Typical server-side capabilities may include:

```text
Server Components
Server Actions
Route Handlers
Core Services
Domain Services
Repositories
Infrastructure Adapters
```

Application code should call internal services directly when no genuine HTTP boundary is required.

---

# Database

Current database technologies:

```text
PostgreSQL
Prisma ORM 7.9.1
@prisma/client 7.9.1
@prisma/adapter-pg 7.9.1
pg 8.22.0
```

Prisma is the application ORM.

Generated Prisma code lives under:

```text
src/generated/prisma/
```

Generated code does not own business semantics.

---

# Database Ownership

Database models may belong semantically to:

```text
Platform Core
Business Domains
```

Prisma does not define architectural ownership.

Architectural ownership is defined by the capability that controls the entity and its lifecycle.

---

# Authentication

Current authentication stack:

```text
Supabase Authentication
@supabase/ssr 0.12.4
@supabase/supabase-js 2.112.2
```

Current implemented authentication capabilities include:

```text
Email + Password
Magic Link
Session handling
Authentication callback
Logout
```

Supabase:

```text
auth.users
```

is the canonical authentication identity.

Application identity is represented by:

```text
Profile
```

Platform Core must not introduce a duplicate Prisma `User` model for authentication identity.

---

# Future Authentication Capabilities

Possible future capabilities include:

```text
Google OAuth
GitHub OAuth
Enterprise SSO
MFA
```

These are not current implementation claims.

They should only be introduced when required by an approved product requirement.

---

# Validation

Runtime validation is mandatory at external trust boundaries.

However, no dedicated schema-validation library such as:

```text
Zod
```

is currently installed in the project.

Therefore Zod must not currently be documented as an active project dependency.

A validation library may be introduced later when implementation requires it.

Architecture must distinguish:

```text
transport validation
business validation
authorization
tenant validation
```

These responsibilities must not be collapsed into a single schema layer.

---

# Storage

No application-level object-storage integration is currently established as part of the implemented stack.

Platform Core includes Storage as a planned reusable capability.

Potential production storage may use:

```text
S3-compatible object storage
```

or another approved storage provider.

The actual provider and adapter architecture must be validated before implementation.

Domains must not integrate storage providers directly without an approved infrastructure boundary.

---

# AI

The application currently has no runtime AI provider dependency installed in `package.json`.

Therefore:

```text
OpenAI
Anthropic
```

must not be described as current application providers.

They remain potential provider integrations.

AI coding tools used during development are separate from runtime application dependencies.

---

# AI Architecture

When runtime AI is introduced:

```text
Domain
→ owns why AI is used

Domain
→ owns what AI output means

Infrastructure
→ owns provider connectivity
```

Preferred direction:

```text
Domain Service
        ↓
Infrastructure Adapter
        ↓
AI Provider SDK
```

Provider SDK calls must not be scattered throughout Domain code.

AI-generated output must be treated as untrusted input until validated.

---

# Infrastructure

Current infrastructure technologies and services include:

```text
Docker
Coolify
GitHub
GitHub Actions
```

PostgreSQL and Supabase services may be self-hosted through the project infrastructure.

Exact environment topology and deployment state belong to:

```text
docs/architecture/DEPLOYMENT.md
```

Technology Stack documentation must not imply that a service is production-ready merely because infrastructure exists.

---

# Supabase Infrastructure

Supabase is currently used for authentication infrastructure.

The wider self-hosted Supabase stack may provide services such as:

```text
Auth
REST
Realtime
Storage
PostgreSQL-related infrastructure
```

The presence of a Supabase service does not automatically make every Supabase capability part of the application architecture.

Application adoption must be explicit.

---

# Development Tooling

Current language:

```text
TypeScript
```

Current package manager:

```text
npm
```

Current development dependencies include:

```text
ESLint 9
Prettier 3.9.6
Prisma CLI 7.9.1
tsx 4.23.5
Tailwind CSS 4
TypeScript 5
```

---

# Code Formatting

Prettier is currently installed.

Available scripts include:

```text
npm run format
npm run format:check
```

Tailwind-aware formatting is supported through:

```text
prettier-plugin-tailwindcss
```

---

# Static Quality Checks

Current quality tooling includes:

```text
ESLint
TypeScript compiler
Next.js type generation
Prettier
Prisma validation
```

Current scripts include:

```text
npm run lint
npm run typecheck
npm run typegen
npm run format
npm run format:check
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
```

---

# Database Development Commands

Current Prisma scripts include:

```text
npm run db:migrate
npm run db:migrate:deploy
npm run db:seed
npm run prisma:studio
```

Migration execution must follow the database and deployment architecture.

Development migration commands must not be used blindly against production databases.

---

# Automated Testing

No dedicated automated testing framework is currently installed.

Specifically, the current project does not include:

```text
Vitest
Playwright
```

as dependencies.

Therefore automated testing must not be described as already implemented.

Testing infrastructure should be introduced before implementation reaches a maturity level that requires reliable automated regression protection.

---

# Testing Candidates

Potential future testing technologies include:

```text
Vitest
Playwright
```

Possible responsibilities:

```text
Vitest
→ unit and service-level tests

Playwright
→ browser and end-to-end tests
```

Final adoption should be reflected in both:

```text
package.json
architecture documentation
```

---

# Current Architecture Support

The current stack supports the intended architecture:

```text
Server-First application design
Platform Core
Business Domains
PostgreSQL persistence
Prisma repositories
Supabase authentication
Multi-tenant architecture
AI-assisted development
Self-hosted infrastructure
```

Some capabilities are architecturally specified but are not yet fully implemented.

Documentation must preserve that distinction.

---

# Technology and Architecture

Technology must not determine semantic ownership.

Examples:

```text
Prisma model
≠ architecture owner

Next.js route
≠ business owner

Supabase user
≠ Domain entity

React component
≠ business service
```

Architecture determines where behavior belongs.

Technology implements that architecture.

---

# Dependency Introduction Rule

Before adding a new dependency, determine:

```text
What problem does it solve?

Which architectural layer owns its use?

Does an existing dependency already solve the problem?

Does it introduce provider coupling?

Does it affect deployment?

Does it affect security?

Does it require an ADR?
```

Dependencies must not be added speculatively.

---

# Provider Isolation

External provider SDKs should normally be isolated behind infrastructure adapters.

Examples:

```text
AI provider
Email provider
Object storage
Payment provider
Search provider
```

Business code should depend on the capability it requires rather than unnecessary provider-specific details.

---

# Technology Version Policy

Major framework and infrastructure versions must be explicit when version-sensitive behavior matters.

Current important versions include:

```text
Next.js 16.3.0
React 19.2.8
Prisma 7.9.1
@supabase/ssr 0.12.4
@supabase/supabase-js 2.112.2
PostgreSQL 18 infrastructure currently used in development
```

Version changes with architectural consequences require review.

---

# Current Versus Planned

The following distinction must remain clear.

## Current

```text
Next.js
React
TypeScript
Tailwind CSS
PostgreSQL
Prisma
Supabase Authentication
@supabase/ssr
ESLint
Prettier
Docker
Coolify
GitHub
GitHub Actions
npm
```

## Not Currently Installed as Application Dependencies

```text
shadcn/ui
Zod
OpenAI SDK
Anthropic SDK
Vitest
Playwright
Redis client
queue framework
```

## Planned or Evaluation Candidates

```text
Zod or equivalent runtime validation library
shadcn/ui or another component system
Vitest
Playwright
S3-compatible storage integration
OpenAI
Anthropic
Redis
Background Workers
Queue Systems
Vector Databases
Search Engines
```

This list does not constitute automatic approval for implementation.

---

# Future Evaluation

Future technologies may be adopted when they provide measurable architectural or product benefits.

Potential areas include:

```text
runtime schema validation
component systems
automated testing
object storage
AI providers
cache infrastructure
background processing
queues
vector search
full-text search
observability
```

No technology should be introduced solely because it is common in similar projects.

---

# ADR Requirement

A technology decision should receive an ADR when it materially changes:

```text
architecture boundaries
data ownership
security model
deployment model
provider lock-in
tenant isolation
persistence strategy
critical infrastructure
```

Minor implementation dependencies do not automatically require an ADR.

---

# AI Agent Rules

AI coding agents must not:

```text
claim that an uninstalled dependency is already part of the stack
install a new framework without an approved requirement
replace an architectural component silently
introduce a second ORM
introduce a second authentication identity system
introduce provider SDK calls throughout business code
treat development AI tooling as application runtime infrastructure
assume every Supabase service is adopted by the application
introduce Redis, queues or workers speculatively
introduce a testing framework without updating project scripts and documentation
```

If implementation requires a new technology with architectural impact:

```text
STOP
        ↓
Report requirement
        ↓
Architecture review
        ↓
Approve technology
        ↓
Document decision
        ↓
Implement
```

---

# Final Principle

The official technology stack is defined by both:

```text
approved architecture

and

actual implementation
```

Documentation must never present planned technology as implemented reality.

Current dependencies must remain observable in project configuration.

Future technologies must remain clearly classified until adopted.

Architecture owns technology decisions.

Implementation must reflect them.

Documentation must reflect implementation reality.