---
title: Platform Architecture
version: 2.1.0
status: Living Document
owner: Platform Core
updated: 2026-08-07
---

# Platform Architecture

## Purpose

This document defines the overall architecture of Platform Core.

It explains how the platform is organized, how responsibilities are distributed, how data flows through the system and how reusable capabilities interact with business Domains.

Business-specific architecture is documented inside each Domain.

---

# Architectural Principles

Platform Core follows these principles:

- Server First
- Domain Driven Design (DDD)
- Documentation First
- AI-Assisted Development
- Feature-Oriented Architecture
- Separation of Responsibilities
- Business-Agnostic Core

Every architectural decision should reinforce these principles.

---

# High-Level Architecture

```text
                    Platform Core

                          ▲
                          │

                     Shared Layer

                          ▲
                          │

                    Business Domains

                          ▲
                          │

                    Next.js App Router

                          ▲
                          │

                         Client
```

Dependencies always flow downward.

Business knowledge never flows upward.

---

# Architecture Layers

## Application Layer

Located in:

```text
src/app
```

Responsibilities:

- Routing
- Layouts
- Metadata
- Server Components
- Client Components
- Route Groups

The Application layer coordinates requests.

It never contains business logic.

---

## Domain Layer

Located in:

```text
src/domains
```

Responsibilities:

- Business rules
- Domain services
- Domain repositories
- Domain UI
- Domain validation
- Domain documentation

Every business capability belongs to exactly one Domain.

Domains are independent from one another.

---

## Shared Layer

Located in:

```text
src/shared
```

Responsibilities:

- Shared UI
- Utilities
- Hooks
- Types
- Validators
- Providers
- Constants

Shared contains reusable technical code only.

Shared never contains business logic.

---

## Platform Core

Located in:

```text
src/core
```

Responsibilities:

- Identity
- Organizations
- Memberships
- Roles
- Permissions
- Profiles
- Notifications
- Billing
- Audit
- Feature Flags
- Platform Settings

Platform Core is completely business agnostic.

---

## Infrastructure Layer

Located in:

```text
src/lib
```

Responsibilities:

- Supabase
- Prisma
- Storage
- Email
- AI Providers
- External APIs
- Third-party SDKs

Infrastructure should remain replaceable.

---

# Request Lifecycle

Every request follows the same architecture.

```text
Browser

↓

Next.js Route

↓

Server Component / Server Action

↓

Application Service

↓

Repository

↓

Prisma

↓

Database
```

Every layer has exactly one responsibility.

---

# Dependency Rules

Allowed:

```text
Application
↓

Domain
↓

Shared
↓

Core
↓

Infrastructure
```

Forbidden:

```text
Core
↓

Domain
```

```text
Shared
↓

Domain
```

```text
Domain A
↓

Domain B
```

```text
Infrastructure
↓

Application
```

Dependencies must never form cycles.

---

# Business Flow

Business logic always belongs to Domains.

Reusable platform capabilities always belong to Platform Core.

Technical utilities belong to Shared.

External integrations belong to Infrastructure.

---

# Service Flow

Business operations should follow this pattern:

```text
Server Action

↓

Service

↓

Repository

↓

Prisma

↓

Database
```

Business logic belongs inside Services.

Persistence belongs inside Repositories.

---

# AI Architecture

AI providers are abstracted behind reusable services.

Domains never communicate directly with provider SDKs.

Provider replacement should not affect Domain code.

---

# Security Architecture

Security is enforced in multiple layers.

Examples:

- Authentication
- Authorization
- Row Level Security
- Input Validation
- Secure Cookies
- Server-side Enforcement

Client-side checks are never considered security.

---

# Scalability

The architecture supports future expansion without structural changes.

Examples:

- Web Applications
- Mobile Applications
- Public APIs
- Workers
- Background Jobs
- Event Processing
- Queues
- Multiple AI Providers
- Multi-tenancy

---

# Documentation

Architecture documentation belongs under:

```text
docs/architecture
```

Business documentation belongs under:

```text
docs/domains/<domain>
```

Every architectural decision with long-term impact should be documented as an ADR.

---

# Evolution

Platform Core evolves independently.

Domains evolve independently.

Infrastructure may evolve independently.

Public interfaces between layers should remain stable whenever possible.

---

# Final Principle

Platform Core is designed as a reusable SaaS foundation.

Business Domains extend the platform.

They never redefine it.