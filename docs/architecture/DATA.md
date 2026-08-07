---
title: Data Architecture
version: 2.0.0
status: Living Document
owner: Platform Core
updated: 2026-08-07
---

# Data Architecture

## Purpose

This document defines how Platform Core manages data.

It establishes the principles, responsibilities and conventions for persistence, data access, migrations and lifecycle management.

Business-specific data models belong to each Domain.

---

# Philosophy

Platform Core owns the data platform.

Domains own their business data.

Examples:

Platform Core

- Users
- Profiles
- Organizations
- Memberships
- Roles
- Permissions
- Notifications
- Settings

Domains

- BUSINESSENTITY
- RESOURCE
- Orders
- Customers
- Products
- Projects

The Core never owns business entities.

---

# Data Stack

Current stack:

- PostgreSQL
- Prisma ORM
- Supabase
- Row Level Security (RLS)

The persistence layer should remain replaceable.

---

# Data Access

Every request follows the same path.

```text
Page

↓

Server Action

↓

Service

↓

Repository

↓

Prisma

↓

PostgreSQL
```

Rules:

- Pages never access Prisma.
- Components never access the database.
- Server Actions never contain queries.
- Repositories own persistence.
- Services own business workflows.

---

# Platform Data

Platform Core stores:

- Users
- Profiles
- Organizations
- Memberships
- Roles
- Permissions
- Settings
- Notifications
- Audit
- Billing
- Feature Flags

Business entities belong to Domains.

---

# Domain Data

Every Domain owns its own entities.

Example:

```text
DJ Domain

Tracks

Artists

Playlists
```

```text
Copy Domain

Orders

Customers

Deliveries
```

Domains define:

- Tables
- Relations
- Validation
- Business rules

---

# Identifiers

Every entity should expose:

- Internal ID
- Public ID or Slug (when applicable)
- External IDs (optional)

Internal IDs are never exposed as business identifiers.

---

# Timestamps

Mutable entities should contain:

```text
createdAt

updatedAt
```

Optional timestamps:

```text
deletedAt

publishedAt

archivedAt
```

The Domain decides whether they are required.

---

# Relationships

Use explicit join tables whenever a relationship contains metadata.

Examples:

- Order Items
- Playlist Tracks
- User Roles
- Artist Genres

Avoid hidden many-to-many relationships when metadata exists.

---

# Transactions

Transactions should remain:

- Short
- Atomic
- Predictable

Never perform:

- HTTP requests
- AI calls
- Email
- File uploads

inside a transaction.

---

# Search

Default strategy:

1. PostgreSQL indexes
2. PostgreSQL Full Text Search
3. PostgreSQL Trigram

External search engines should only be introduced after measuring actual limitations.

---

# Imports

Large imports follow this lifecycle:

```text
Upload

↓

Validation

↓

Normalization

↓

Preview

↓

Confirmation

↓

Transaction

↓

Report
```

Every import should support preview mode.

---

# Migrations

Rules:

- One migration per schema change.
- Never edit executed migrations.
- Test before production.
- Backup before destructive changes.
- Rollback strategy required.

---

# Backups

Production requires:

- Automated backups.
- Off-site copies.
- Encryption.
- Restore validation.

A backup is only valid after a successful restore test.

---

# Performance

Prefer:

- Correct indexes.
- Pagination.
- Lazy loading.
- Explicit projections.

Avoid:

- SELECT *
- Unbounded queries.
- N+1 queries.

---

# Multi-tenancy

Platform Core supports multiple organizations.

Domain data should always respect organization boundaries where applicable.

Authorization is enforced through:

- Identity
- Membership
- Role
- Permission
- Row Level Security

---

# Documentation

Platform-wide data architecture belongs here.

Business-specific schemas belong inside:

```text
docs/domains/<domain>/database/
```

---

# Future Roadmap

Platform Core should support:

- Read replicas
- Background processing
- Event sourcing (where justified)
- Data warehouse integration
- Analytics pipelines
- Cross-domain reporting