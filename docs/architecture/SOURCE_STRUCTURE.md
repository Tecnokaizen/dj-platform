---
title: Source Structure
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - PROJECT_STRUCTURE.md
  - CONVENTIONS.md
  - CORE.md
  - DOMAINS.md
---

# Source Structure

## Purpose

This document defines the physical source tree used by Platform Core and every Business Domain.

The source structure reflects the architectural responsibilities defined throughout the platform documentation.

---

# Root Source Tree

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

---

# app/

Application entry points.

Contains:

- Routes
- Pages
- Layouts
- Route Handlers
- Metadata
- Route Groups

Pages compose capabilities.

They do not contain business logic.

---

# config/

Platform configuration.

Typical responsibilities:

```text
config/

├── constants/
├── env/
├── navigation/
└── site/
```

Configuration must remain business agnostic unless explicitly scoped to a Domain.

---

# core/

Reusable Platform Core capabilities.

Initial structure:

```text
core/

├── identity/
│   ├── auth/
│   └── profile/
│
└── modules/
    └── organizations/
```

Identity is a foundational Core capability.

Reusable functional modules live under:

```text
core/modules/
```

Specified modules not yet implemented in source:

```text
roles/
memberships/
permissions/
```

Planned modules may include:

```text
notifications/
audit/
billing/
settings/
storage/
```

Modules are created only when implementation begins.

Do not create speculative source modules.

---

# Core Module Template

A Core module may contain:

```text
module/

├── actions/
├── components/
├── hooks/
├── repositories/
├── schemas/
├── services/
├── types/
├── utils/
└── validators/
```

Only create directories required by the module.

Empty architectural ceremony should be avoided.

---

# domains/

Contains business-specific implementations.

Initial structure:

```text
domains/

└── dj/
```

Future Domains may include:

```text
copy/
seo/
crm/
```

Each Domain owns its business entities, workflows and rules.

Domains never depend directly on other Domains.

---

# Domain Structure

A Domain may contain business capabilities or submodules.

Example:

```text
domains/dj/

├── artists/
├── genres/
├── playlists/
├── tracks/
├── festivals/
├── rankings/
└── search/
```

Exact structure is defined by the Domain documentation.

Do not create Domain folders before they are required.

---

# generated/

Contains generated source code.

Example:

```text
generated/

└── prisma/
```

Generated code:

- is produced by tooling
- is never edited manually
- does not define architectural ownership

Generated models may represent entities from multiple Domains or Core modules.

---

# lib/

Contains low-level infrastructure adapters and technical integrations.

Examples:

```text
lib/

├── cache/
├── logger/
├── prisma/
├── supabase/
├── openai/
└── anthropic/
```

Provider-specific implementations belong here or behind an approved integration abstraction.

Business logic never belongs in `lib/`.

---

# shared/

Contains reusable technical resources that are independent from business Domains.

Typical structure:

```text
shared/

├── components/
├── constants/
├── hooks/
├── icons/
├── layout/
├── providers/
├── schemas/
├── services/
├── types/
├── ui/
├── utils/
└── validators/
```

Shared never contains business rules.

---

# Type Ownership

Types should live as close as possible to their owner.

Core module type:

```text
core/modules/<module>/types/
```

Domain type:

```text
domains/<domain>/types/
```

Globally reusable technical type:

```text
shared/types/
```

Do not create a second global `src/types/` tree.

---

# Request Flow

There is no single universal request flow.

Typical internal mutation flow:

```text
Client / Application UI

↓

Server Action

↓

Service

↓

Repository / Infrastructure Adapter

↓

Persistence / External System
```

Typical server read flow:

```text
Server Component

↓

Service

↓

Repository / Infrastructure Adapter

↓

Persistence / External System
```

Explicit HTTP boundaries may instead use:

```text
External Caller

↓

Route Handler

↓

Service

↓

Repository / Infrastructure Adapter
```

Server-side code should call services directly when no real HTTP boundary is required.

UI components never access Prisma directly.

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

# Routing and Domains

Routes may exist under:

```text
src/app/
```

even when they expose Domain functionality.

The route is only application composition.

Business implementation belongs under:

```text
src/domains/<domain>/
```

---

# Infrastructure Rule

Do not introduce:

```text
src/infrastructure/
```

while `src/lib/` adequately represents infrastructure adapters.

A new infrastructure layer requires architectural justification.

---

# Final Principle

The physical source tree must reflect architectural ownership.

Core contains reusable capabilities.

Domains contain business knowledge.

Shared contains reusable technical resources.

Lib contains infrastructure.

App composes everything.