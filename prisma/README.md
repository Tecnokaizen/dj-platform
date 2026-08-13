# Prisma

## Purpose

This directory contains the active Prisma persistence definition for the `dj-platform` repository.

Prisma is the ORM layer currently used with PostgreSQL.

The Prisma schema must remain aligned with:

- approved Architecture;
- Core capability ownership;
- DJ Domain ownership;
- tenancy rules;
- identity rules;
- migration history;
- current source implementation.

---

# Current Structure

    prisma/
    ├── README.md
    ├── schema.prisma
    ├── seed.ts
    └── migrations/
        └── ...

Related repository files include:

    prisma.config.ts
    src/generated/prisma/
    docs/architecture/PRISMA_IMPLEMENTATION.md

---

# Active Prisma Schema

The canonical active schema is:

    prisma/schema.prisma

This file defines the Prisma persistence model currently used by the repository.

Do not treat historical schemas or documentation drafts as the active database definition.

Significant schema changes must respect capability ownership and architectural constraints.

---

# Generated Client

Prisma generates its client under:

    src/generated/prisma/

Generated source is not architectural ownership.

Do not place business logic inside generated Prisma files.

Do not manually edit generated client output unless Prisma tooling explicitly requires it.

---

# Configuration

Prisma configuration is defined at repository level in:

    prisma.config.ts

Environment-specific database configuration must remain outside committed secrets.

Do not commit real credentials in:

- `.env`
- `.env.local`
- Prisma configuration
- scripts
- migration files

---

# Migrations

Migration history lives under:

    prisma/migrations/

Migrations represent database evolution.

Schema changes require migration awareness.

Before creating or applying a migration, evaluate:

- schema impact;
- existing data impact;
- tenant impact;
- constraint changes;
- migration safety;
- compatibility with current source;
- rollback or forward-fix implications.

Do not create destructive migrations blindly.

---

# Prisma Migration Workflow

Use the Prisma migration workflow appropriate to the actual environment.

Development workflows may use Prisma migration tooling when database connectivity and environment configuration are valid.

Do not assume that a migration command is safe merely because it succeeds locally.

Production migration behavior requires explicit deployment and operational context.

Avoid using `prisma db push` as a substitute for migration history unless the task explicitly requires that workflow and its consequences are understood.

---

# Seed

The active seed entry point is:

    prisma/seed.ts

Seed behavior must reflect current schema and approved development requirements.

Seed data must not become an undocumented source of Product or Domain truth.

Do not place secrets or sensitive production data in seed files.

---

# Identity

Supabase Auth is the canonical authentication identity.

Application identity is represented by:

    Profile

Do not introduce a second canonical Prisma `User` model.

A DJ or artist is a DJ Domain entity and must not be modeled as the authenticated application identity merely because both may represent people.

---

# Tenancy

`Organization` is the canonical tenant boundary.

Organization ownership is represented through:

    Organization
    +
    ACTIVE OrganizationMembership
    +
    OWNER Role

Do not introduce competing ownership fields such as:

- `ownerUserId`
- `ownerId`
- `ownerProfileId`

as an alternative ownership system.

---

# Core Foundation

Current Core Foundation sequence:

    Identity
        ↓
    Organizations
        ↓
    Roles
        ↓
    Memberships
        ↓
    Tenancy Integration
        ↓
    Permissions

Identity already has source implementation.

Organizations, Roles, Memberships and Permissions have specifications but must not be considered implemented merely because schema work exists or is planned.

---

# Capability Ownership

Prisma models must belong conceptually to the capability that owns their semantics.

Examples:

    Profile
    → Identity

    Organization
    → Organizations

    Role
    → Roles

    OrganizationMembership
    → Memberships

    Permission
    → Permissions

DJ-specific entities belong to the DJ Domain.

Physical co-location inside `schema.prisma` does not erase architectural ownership.

---

# Prisma Access

Prisma access must respect:

- capability ownership;
- server-side execution boundaries;
- tenant isolation;
- authorization;
- transaction requirements.

A Repository Pattern is not mandatory globally.

Repository abstractions may be introduced when they provide demonstrated value.

Do not access Prisma directly from browser-side UI code.

Do not bypass Prisma casually.

---

# Raw SQL

Raw SQL may be justified when an approved requirement cannot be represented safely through the current Prisma capabilities:
- verify whether Prisma already supports the requirement;
- understand migration implications;
- preserve tenant and authorization invariants;
- document significant architectural consequences.

Raw SQL must solve a demonstrated problem, not an assumed limitation.

---

# Current Validation

Repository baseline validation includes:

    npm run typecheck
    npm run lint

Prisma-specific changes may additionally require:

- Prisma client generation;
- schema validation;
- migration inspection;
- database connectivity verification;
- migration execution in an appropriate development environment;
- runtime verification.

Validation must match the actual task.

Do not claim database behavior was verified unless it was actually exercised.

---

# Source of Truth

For persistence work, relevant evidence may include:

- `prisma/schema.prisma`;
- migration history;
- approved Architecture;
- Core specifications;
- Domain specifications;
- current source;
- database runtime state.

If these materially conflict:

    STOP
    → inspect the conflict
    → resolve the authoritative decision
    → update stale artifacts
    → continue

Do not assume either schema or documentation is automatically correct when evidence contradicts it.

---

# Production Rule

A valid Prisma schema does not mean the database is Production Ready.

Production readiness may additionally require:

- migration validation;
- data integrity verification;
- backup verification;
- restore testing;
- tenant isolation testing;
- authorization testing;
- operational deployment validation.

---

# Final Principle

`schema.prisma` is the active Prisma schema.

Migration history records database evolution.

Architectural ownership remains outside physical schema layout.


Preserve identity and tenancy invariants.

Validate database changes with evidence.
