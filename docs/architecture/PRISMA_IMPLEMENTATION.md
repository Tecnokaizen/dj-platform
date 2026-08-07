---
title: Prisma Implementation
version: 2.0.0
status: Living Document
owner: Platform Core
updated: 2026-08-07
related:
  - DATA.md
  - ARCHITECTURE.md
  - IDENTITY.md
---

# Prisma Implementation

## Purpose

This document defines how Prisma is used within Platform Core.

It establishes conventions for schema management, migrations, code generation and database access.

Business-specific models belong to each Domain.

---

# Scope

Prisma is the persistence layer for Platform Core.

It is responsible for:

- Schema definition
- Database migrations
- Type generation
- Database client generation
- Repository access

Prisma is never accessed directly from Pages, Components or Server Actions.

---

# Prisma Project Layout

```text
prisma/
├── schema.prisma
├── seed.ts
└── migrations/

prisma.config.ts

src/generated/prisma/

src/lib/prisma/
└── client.ts
```

The generated client must never be edited manually.

---

# Configuration

Database configuration is managed through:

```text
prisma.config.ts
```

Environment variables remain outside the schema whenever possible.

---

# Driver

Current database:

- PostgreSQL

Current adapter:

- @prisma/adapter-pg

The adapter should remain replaceable.

---

# Generated Client

The Prisma Client is generated into:

```text
src/generated/prisma/
```

Application code should import the generated client through:

```text
src/lib/prisma/client.ts
```

The singleton implementation must be shared across the application.

---

# Repository Pattern

Database access always follows this flow:

```text
Server Action

↓

Service

↓

Repository

↓

Prisma Client

↓

PostgreSQL
```

Repositories are the only layer allowed to communicate with Prisma.

Business logic belongs to Services.

---

# Installation

Core dependencies:

```bash
npm install @prisma/client @prisma/adapter-pg pg
```

Development dependencies:

```bash
npm install -D prisma tsx @types/pg
```

Use a single package manager across the repository.

---

# Validation Workflow

Before every migration:

```bash
npx prisma format

npx prisma validate

npx prisma generate
```

Review:

- Model names
- Relations
- Constraints
- Cascades
- Indexes
- Nullable fields

---

# Migration Workflow

Typical workflow:

```bash
npx prisma migrate dev --name <migration-name>
```

Rules:

- One migration per schema change.
- Never edit applied migrations.
- Review destructive changes.
- Test in staging before production.
- Keep migrations small.

---

# Schema Design

Platform Core owns models such as:

- User
- Profile
- Organization
- Membership
- Role
- Permission
- Notification
- Audit
- FeatureFlag

Business entities belong to Domains.

Examples:

```text
DJ Domain

Track

Artist

Festival
```

```text
Commerce Domain

Order

Customer

Product
```

The Core must never contain Domain entities.

---

# Identifiers

Internal identifiers should use:

```text
cuid()
```

Identifier strategy must remain consistent across Platform Core.

Any future change requires an ADR.

---

# Soft Deletion

Soft deletion is optional.

When used:

```text
deletedAt
```

Repositories are responsible for excluding deleted records.

Prisma should never hide this behavior automatically.

---

# Seed Strategy

Seeds should be:

- Idempotent
- Predictable
- Repeatable

Platform seeds initialize only Platform Core data.

Domain-specific seeds belong inside the corresponding Domain.

---

# Performance

Repositories should:

- Select only required fields.
- Avoid N+1 queries.
- Prefer explicit projections.
- Keep transactions short.

Never expose raw Prisma models unnecessarily.

---

# Transactions

Transactions should contain only database work.

Never perform:

- HTTP requests
- Email
- AI processing
- File uploads
- External API calls

inside a transaction.

---

# Extensions

Prisma extensions may be introduced when they:

- Reduce duplication
- Improve safety
- Preserve transparency

Hidden behavior should be avoided.

---

# Definition of Ready

The Prisma layer is ready when:

- Schema formats successfully.
- Schema validates.
- Client generates correctly.
- Migrations are reviewed.
- Repositories follow the defined architecture.
- Platform Core models are stable.
- Domain models are documented.