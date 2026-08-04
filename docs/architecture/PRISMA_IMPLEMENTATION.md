---
title: Prisma Implementation
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
related:
  - DATABASE.md
  - DATA_MODEL.md
  - ARCHITECTURE.md
---

# Prisma Implementation

## Scope

The first schema covers the platform's editorial and discovery foundation:

- DJs and aliases
- genres and genre relationships
- festivals and appearances
- rankings and editions
- sessions
- articles
- media
- external and social profiles
- sources
- users, roles and favorites
- audit events
- imports
- AI-generation records
- optional tracks and labels
- DJ similarity relationships

## Identifier decision

The first draft uses `cuid()` for internal IDs.

This is practical for distributed application-generated identifiers and avoids exposing sequential IDs. It must be recorded in an ADR before the first production migration.

## Prisma ORM 7 layout

```text
prisma.config.ts
prisma/schema.prisma
prisma/seed.ts
src/generated/prisma/
```

The connection URL is defined through `prisma.config.ts`, not inside the schema datasource block.

## Driver adapter

The seed is prepared for PostgreSQL through `@prisma/adapter-pg`.

The runtime Prisma singleton must later use the same adapter approach in:

```text
src/lib/prisma/client.ts
```

## Installation dependencies

Install only when bootstrapping the application:

```bash
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma tsx @types/pg
```

Use the chosen package manager consistently. Do not mix npm, pnpm, yarn and bun lockfiles.

## Validation sequence

Before creating the initial migration:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

Then review:

- relation names
- unique constraints
- deletion behavior
- indexes
- optional versus required fields
- models included in MVP

## First migration

Only after approval:

```bash
npx prisma migrate dev --name init
```

## Schema review items

1. Confirm `cuid()` identifier strategy.
2. Confirm Auth.js database models required by the selected session strategy.
3. Confirm whether Track and Label remain in the first migration.
4. Confirm article-body storage format.
5. Confirm multilingual timing.
6. Confirm whether permissions remain role-based initially.
7. Confirm storage provider before using MediaAsset.
8. Validate the self-relations for genres and DJs.
9. Review all cascade deletions.
10. Add PostgreSQL extensions only through an ADR.

## Soft deletion

Soft deletion fields exist on public editorial entities. Prisma does not automatically filter them.

Repositories must explicitly enforce:

```text
deletedAt: null
```

A shared repository helper or Prisma extension may be considered later, but must not hide behavior unexpectedly.

## Public query rule

A public DJ query requires:

```text
editorialStatus = PUBLISHED
publishedAt <= now
deletedAt = null
```

Equivalent rules apply to other public entities.

## Seed behavior

The seed is idempotent:

- countries are upserted by ISO code
- genres are upserted by slug
- the initial administrator is created only when `INITIAL_ADMIN_EMAIL` is configured

The seed does not publish genres automatically.

## Auth.js note

The current User model is the product user model, not yet the complete Auth.js adapter schema.

Account, Session and VerificationToken models will be added after the authentication method and session strategy are approved.

## Definition of ready

The Prisma layer is ready for migration only when:

- dependencies are installed
- schema formats successfully
- schema validates
- client generates
- ADRs are approved
- authentication model is settled
- schema review items are resolved
