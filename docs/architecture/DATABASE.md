---
title: Database Architecture
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
---

# Database Architecture

## Purpose

PostgreSQL is the system of record. Prisma is the mandatory ORM and migration tool for application-owned data.

## Core decisions

- PostgreSQL for persistence.
- Prisma for schema, migrations and application queries.
- Separate databases for local, test, staging and production.
- UTC timestamps.
- Soft deletion for editorial entities.
- Explicit join models when relations contain metadata.
- PostgreSQL search first; external search only after measurement and ADR approval.

## Data access boundary

```text
Page
  ↓
Action or Route Handler
  ↓
Application Service
  ↓
Repository
  ↓
Prisma
  ↓
PostgreSQL
```

Only repositories may call Prisma directly.

Forbidden:

- Prisma inside React components.
- Prisma inside client code.
- Raw SQL outside documented infrastructure code.
- Direct database access from route composition files.

## Identifiers

Every public entity has:

- immutable internal ID
- unique stable slug
- optional external platform IDs

A slug is never the primary key. External IDs never replace internal IDs.

The final internal ID format—UUID or CUID2—requires an ADR before Prisma generation.

## Standard timestamps

Mutable entities include:

```text
createdAt
updatedAt
```

Editorial entities may include:

```text
publishedAt
reviewedAt
archivedAt
deletedAt
```

## Editorial status

Recommended enum:

```text
DRAFT
IN_REVIEW
PUBLISHED
ARCHIVED
```

Publication rules are enforced by application services, not only by the admin UI.

## Soft deletion

Soft deletion is the default for public editorial entities because it:

- preserves relations and ranking history
- prevents broken links
- enables recovery
- supports auditability

Soft-deleted records are excluded from normal queries and public rendering.

## Relations

Use explicit join models when a relation needs:

- role
- order
- weight
- confidence
- source
- dates
- editorial notes

Example:

```text
DjGenre
├── djId
├── genreId
├── role
├── weight
├── confidence
├── sourceId
└── createdAt
```

## Transactions

Use short transactions for atomic multi-write operations:

- create DJ and relations
- publish content and create audit event
- reorder ranking entries
- confirm an import batch

Never call AI, email, storage or other external APIs inside a database transaction.

## Indexing

Indexes follow measured query patterns.

Initial candidates:

- slug
- normalizedName
- status + publishedAt
- countryId
- rankingEditionId + position
- provider + externalId
- updatedAt

Do not index every column.

## Search

MVP order:

1. normalized columns
2. B-tree indexes
3. PostgreSQL trigram where justified
4. PostgreSQL full-text search

Meilisearch, Typesense or Elasticsearch require an ADR after PostgreSQL limitations are demonstrated.

## Imports

```text
Upload
  ↓
Parse
  ↓
Validate
  ↓
Normalize
  ↓
Detect duplicates
  ↓
Preview
  ↓
Confirm
  ↓
Transaction
  ↓
Report
```

Imports must have staging records and a dry-run mode.

## Migrations

- Every schema change creates a migration.
- Applied production migrations are immutable.
- Destructive migrations require backup and recovery plan.
- Production migrations run as a controlled deployment step.
- High-risk changes are tested in staging first.

## Backups

Production requires:

- automated daily backups
- off-server copy
- encryption
- retention policy
- periodic restore test

A backup is not verified until restoration has been tested.

## Forbidden practices

Never:

- share databases between environments
- edit applied migrations
- use production for testing
- expose the database openly
- run unbounded list queries
- perform provider calls inside transactions
- depend only on application validation for uniqueness
