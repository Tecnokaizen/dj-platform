---
title: Project Structure
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - SOURCE_STRUCTURE.md
  - CONVENTIONS.md
  - CORE.md
  - DOMAINS.md
---

# Project Structure

## Purpose

This document defines the high-level project organization of Platform Core.

The objective is to maintain clear ownership, predictable dependencies and reusable architecture across multiple SaaS products.

---

# Source Structure

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

Detailed source conventions are defined in:

```text
SOURCE_STRUCTURE.md
```

---

# app/

Contains application entry points.

Responsibilities:

- Routing
- Layouts
- Pages
- Route Groups
- Route Handlers
- Metadata

Application files compose capabilities.

They contain no business logic.

---

# core/

Contains reusable platform capabilities.

Core currently includes:

```text
identity/
modules/
```

Identity owns foundational authentication and profile behavior.

Reusable functional modules live under:

```text
core/modules/
```

Examples:

- Organizations
- Roles
- Memberships
- Permissions
- Settings
- Billing
- Notifications
- Audit
- Storage

Platform Core is business agnostic.

---

# shared/

Contains reusable technical resources.

Examples:

- Components
- UI
- Hooks
- Utilities
- Providers
- Validators
- Schemas
- Types
- Icons
- Constants

Shared contains no business logic.

---

# domains/

Contains independent Business Domains.

Example:

```text
domains/

├── dj/
├── copy/
├── seo/
└── crm/
```

Domains may consume Platform Core and Shared resources.

Domains never depend directly on other Domains.

---

# generated/

Contains generated code.

Examples:

- Prisma Client
- Generated Types

Generated files are never edited manually.

Generated code does not determine architectural ownership.

---

# lib/

Contains infrastructure adapters and low-level technical integrations.

Examples:

- Supabase
- Prisma
- Cache
- Logging
- AI Provider SDKs
- External SDKs

Business rules never belong in `lib/`.

---

# config/

Contains application and platform configuration.

Examples:

- Environment validation
- Site configuration
- Navigation configuration
- Constants

---

# Documentation Structure

Documentation is organized independently by responsibility:

```text
docs/

├── architecture/
├── backend/
├── business/
├── core/
├── domains/
├── engineering/
├── frontend/
├── operations/
├── reviews/
└── adr/
```

Documentation does not need to mirror source code directory-for-directory.

It mirrors architectural responsibility.

---

# Core Documentation

Reusable functional Core modules are specified under:

```text
docs/core/modules/
```

Example:

```text
docs/core/modules/organizations/
```

Implementation lives under:

```text
src/core/modules/organizations/
```

---

# Domain Documentation

Business Domain documentation lives under:

```text
docs/domains/<domain>/
```

Implementation lives under:

```text
src/domains/<domain>/
```

---

# Naming Rules

Folders and files use:

```text
kebab-case
```

TypeScript components and types use:

```text
PascalCase
```

Functions use:

```text
camelCase
```

Established capability names should remain stable.

Do not rename modules solely to normalize grammatical singular or plural forms.

Consistency and stable references take priority over cosmetic renaming.

---

# Type Ownership

Types belong to their owner.

Core types:

```text
src/core/.../types/
```

Domain types:

```text
src/domains/.../types/
```

Globally reusable technical types:

```text
src/shared/types/
```

Avoid duplicate global type trees.

---

# Dependency Rules

Allowed:

```text
app
 ↓
core / domains / shared
```

```text
domains
 ↓
core / shared / lib
```

```text
core
 ↓
shared / lib
```

```text
lib
 ↓
generated / external providers
```

Forbidden:

```text
core
 ↓
domains
```

```text
shared
 ↓
core
```

```text
Domain A
 ↓
Domain B
```

---

# Business Logic Rule

When creating functionality ask:

## Is it reusable across SaaS products?

If yes:

```text
Platform Core
```

## Is it specific to one business vertical?

If yes:

```text
Business Domain
```

## Is it reusable technical functionality with no business meaning?

If yes:

```text
Shared
```

## Is it provider or infrastructure specific?

If yes:

```text
Lib
```

---

# Growth Rule

Do not create architectural layers in anticipation of hypothetical requirements.

New directories, abstractions and modules must solve a demonstrated problem.

---

# Final Principle

Project structure communicates ownership.

If the correct location of a feature is unclear, clarify its responsibility before writing code.