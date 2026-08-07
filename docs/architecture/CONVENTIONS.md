# Development Conventions

## Purpose

This document defines the development conventions used across Platform Core and every Domain.

These conventions ensure consistency, readability, maintainability and AI-assisted development.

When in doubt, follow this document.

---

# General Principles

Every piece of code should be:

- Simple
- Readable
- Testable
- Documented
- Reusable

Avoid clever code.

Prefer explicit code over implicit behavior.

---

# Naming Conventions

## Folders

Use:

kebab-case

Examples:

```text
user-profile

feature-flags

batch-import
```

---

## Files

Use:

kebab-case

Examples:

```text
profile-form.tsx

create-resource.ts

get-current-user.ts
```

---

## Components

Use:

PascalCase

Examples:

```text
ProfileForm

DashboardCard

DataTable
```

One component per file.

---

## Functions

Use:

camelCase

Examples:

```text
createOrganization()

updateProfile()

getCurrentUser()
```

Function names must describe an action.

---

## Types

Use:

PascalCase

Examples:

```text
Profile

Organization

Resource
```

---

## Constants

Use:

UPPER_SNAKE_CASE

Examples:

```text
MAX_UPLOAD_SIZE

DEFAULT_LANGUAGE

SESSION_DURATION
```

---

# Folder Responsibilities

## actions/

Contains Server Actions only.

Responsibilities:

- Validate input
- Call Services
- Redirect
- Revalidate

Server Actions never contain business logic.

---

## services/

Contains business logic.

Responsibilities:

- Business workflows
- Transactions
- External integrations
- Domain orchestration

Services communicate with Repositories.

Services should remain framework-independent whenever possible.

Services never import React.

---

## repositories/

Responsible for persistence.

Responsibilities:

- Database queries
- Data mapping
- Persistence

Repositories encapsulate Prisma.

Repositories never contain business rules.

---

## components/

Contains UI components.

Components should:

- remain small
- receive data through props whenever possible
- avoid direct data fetching
- avoid business logic

---

## hooks/

Reusable React hooks.

Hooks manage UI behavior.

Hooks never contain business rules.

---

## validators/

Validation schemas.

Recommended:

- Zod

Validation belongs here.

---

## schemas/

Shared schemas.

Examples:

- DTOs
- Contracts
- Response Objects

---

## types/

Shared TypeScript types.

---

## utils/

Pure utility functions.

Utilities should:

- be deterministic
- have no side effects
- contain no business logic

---

# Import Rules

Always use aliases.

Correct:

```ts
import { createClient } from '@/lib/supabase/server'
```

Avoid:

```ts
import '../../../lib/...'
```

Never use deep relative imports.

Never import across Domains.

Allowed:

```text
Domain
↓

Shared
↓

Core
```

Forbidden:

```text
Domain A
↓

Domain B
```

---

# Components

Prefer small components.

Every component should have a single responsibility.

If a component becomes too large:

Split it.

---

# Server Actions

Server Actions should only:

- Validate
- Call Services
- Redirect
- Revalidate

Never implement business rules.

---

# Services

Services are the heart of the application.

They contain:

- Business logic
- Workflows
- Transactions
- External integrations

Services communicate with Repositories.

Avoid circular service dependencies.

---

# Database Access

Database access always follows this flow:

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

Pages, Components, Layouts and Hooks must never access the database directly.

Repositories are the only layer allowed to communicate with Prisma.

---

# Domains

Every business feature belongs to exactly one Domain.

Never duplicate business logic between Domains.

Domains may depend on:

- Platform Core
- Shared

Domains never depend on other Domains.

---

# Core

Platform Core must remain business agnostic.

Never introduce business entities into the Core.

---

# Shared

Shared contains reusable technical code only.

Never place business rules inside Shared.

---

# Documentation

Every significant module should include documentation.

Documentation comes before implementation.

Architectural decisions with long-term impact should be recorded as ADRs.

---

# Testing

Business logic should be testable independently from the UI.

Avoid coupling business logic with React components.

---

# Error Handling

Never swallow errors.

Return meaningful messages.

Log unexpected failures.

Never expose internal implementation details to clients.

---

# Security

Validate every input.

Trust nothing from the client.

Authorization belongs to Platform Core.

Never rely on client-side validation for security.

---

# AI Development

This repository is designed for AI-assisted development.

Architecture, documentation and naming consistency are first-class requirements.

Every module should be:

- Predictable
- Well documented
- Loosely coupled
- Easy to understand
- Easy to extend

---

# Rule of Three

When a pattern appears three times:

Stop.

Extract.

Reuse.

---

# Dependency Rule

Dependencies always flow downward.

```text
App
↓

Domain
↓

Shared
↓

Core
↓

Infrastructure
```

Never invert the dependency flow.

Business logic must never leak into Shared or Core.

---

# Final Principle

Before creating any file ask:

- Does it belong to Platform Core?
- Does it belong to Shared?
- Does it belong to a Domain?

If the answer is unclear, improve the architecture before writing code.