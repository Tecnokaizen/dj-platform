---
title: Backend Database Standards
version: 1.0.0
status: Living Document
owner: Engineering
updated: 2026-08-08
related:
  - ../../architecture/DATA.md
  - ../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../architecture/SECURITY.md
  - ../../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Backend Database Standards

## Purpose

This document defines the persistence standards used across Platform Core and every Business Domain.

Architecture documentation defines the data model.

This document defines how persistence should be implemented.

---

# Philosophy

The database stores data.

Repositories retrieve data.

Services implement business rules.

Business logic must never depend on database implementation details.

---

# Persistence Stack

Current stack:

```text
PostgreSQL

↓

Prisma ORM

↓

Repositories

↓

Services
```

No application layer should communicate directly with the database.

---

# Repository Pattern

Repositories own persistence.

Responsibilities include:

- Queries
- Inserts
- Updates
- Deletes
- Transactions
- Mapping persistence results

Repositories do not implement business decisions.

---

# Services

Services coordinate business operations.

Services may:

- Call multiple repositories
- Validate workflows
- Execute transactions
- Communicate with external providers

Services should remain independent from SQL details.

---

# Prisma

Prisma is the ORM layer.

Responsibilities:

- Type-safe queries
- Migrations
- Schema generation
- Transactions
- Relations

Prisma models are persistence models.

They are not API contracts.

---

# Database Ownership

Every table has one owner.

Ownership belongs to either:

Platform Core

or

One Business Domain

Never both.

---

# Multi-Tenancy

Organization-owned entities must always preserve tenant isolation.

Preferred pattern:

```text
Organization

↓

Entity
```

Queries must always respect the active Organization.

---

# Transactions

Use transactions when multiple persistence operations must succeed together.

Examples:

- Membership creation
- Billing operations
- Imports
- Organization provisioning

Avoid unnecessary transactions.

---

# Soft Delete

When soft deletion is supported:

Repositories explicitly filter:

```text
deletedAt = null
```

Never rely on hidden ORM behavior.

---

# Cascade Rules

Cascade deletions must be intentional.

Review every relationship.

Prefer explicit behavior over accidental deletion.

---

# Indexing

Indexes should support:

- frequent lookups
- unique constraints
- foreign keys
- search patterns

Indexes are added for measured needs.

Not assumptions.

---

# Query Design

Queries should be:

- predictable
- explicit
- efficient
- measurable

Avoid hidden N+1 problems.

---

# Pagination

Repositories support pagination.

Business logic chooses pagination strategy.

Persistence should remain reusable.

---

# Filtering

Repositories expose explicit filters.

Never expose unrestricted database filtering.

---

# Sorting

Repositories expose documented sorting options.

Never expose arbitrary ordering from client input.

---

# Migrations

Every migration should be:

- reviewed
- reversible when possible
- documented
- tested

Production migrations require backup planning.

---

# Seed Data

Seeds should be:

- deterministic
- idempotent
- repeatable

Seeds are for platform initialization.

Not production content.

---

# Performance

Optimize only after measurement.

Typical optimization order:

1. Query review
2. Index review
3. Query restructuring
4. Caching
5. Infrastructure scaling

---

# Security

Database credentials:

- never committed
- environment specific
- least privilege
- rotated when required

Security standards follow:

```text
docs/architecture/SECURITY.md
```

---

# Observability

Persistence should expose enough information for troubleshooting.

Useful metrics include:

- slow queries
- connection usage
- transaction failures
- migration duration

---

# Testing

Repositories should be tested independently from transport.

Tests may include:

- CRUD operations
- Transactions
- Constraint validation
- Soft delete behavior
- Multi-tenant isolation

---

# AI Development Rules

AI coding agents must not:

- Query Prisma directly from UI.
- Skip repositories.
- Duplicate persistence logic.
- Introduce undocumented tables.
- Modify schema ownership without approval.

If persistence requirements are unclear:

Stop.

Request clarification.

---

# Forbidden Practices

Never:

- Place SQL inside components.
- Place SQL inside Server Actions.
- Duplicate queries across Services.
- Expose Prisma models directly as public contracts.
- Ignore Organization boundaries.
- Create migrations without documentation.

---

# Final Principle

Repositories own persistence.

Services own behavior.

The database is an implementation detail.

Business rules remain independent from storage.