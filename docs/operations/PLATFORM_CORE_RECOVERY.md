---
title: Platform Core Recovery
version: 1.0.0
status: Closed
owner: Operations
updated: 2026-09-13
related:
  - BACKUPS.md
  - DEPLOYMENT.md
  - ../adr/ADR-010-deployment-runtime-staging-contract.md
  - ../CURRENT_STATE.md
---

# Platform Core Recovery

Operational record of the 2026-09-13 production recovery that brought the
Coolify-hosted Platform Core database from a partial Foundation to the
repository Foundation state.

## Findings

- Coolify exposed two PostgreSQL resources:
  - **Canonical:** `supabase-db` (Supabase Postgres 15.8) — Auth + Prisma `public` app schema.
  - **Legacy:** `platform-core-bd` (`dj_platform`) — empty of application tables/migrations.
- Production was stuck on Prisma `20260806172928_init` only (1/8), with Auth live
  (`auth.users=2`, `profiles=2`) and Foundation tables absent.
- Repo SQL under `supabase/migrations/` had no `supabase_migrations` ledger yet.

## Recovery path (validated)

1. Logical backups (`pg_dump -Fc`) of both DBs; PREMIGRATION dump verified with
   `pg_restore --list` + SHA256; off-box copy retained outside the VPS.
2. Isolated dry-run restore → official pipeline (`bootstrap` → Prisma →
   `supabase db push` → seed → `validate-database`) until clean (8 finished /
   0 rolled_back).
3. Ownership issue: historical `public` objects owned by `postgres` while DDL
   runs as `platform_migration` → `must be owner of table profiles`.
4. Minimal fix (production runbook):
   - `db:bootstrap-roles` (roles + ADR-010 contract)
   - `REVOKE CREATE ON SCHEMA public FROM PUBLIC` (Supabase images grant CREATE
     to `PUBLIC`; required so `app_runtime` has no DDL)
   - `scripts/deploy/prepare-public-schema-ownership.sql` transfers **public**
     tables/sequences/enums/functions from `postgres`/`supabase_admin` to
     `platform_migration` only — **never** `auth.*` ownership
5. Production `db:migrate:release` executed successfully.

## Tooling

| Artifact | Purpose |
|----------|---------|
| `scripts/deploy/prepare-public-schema-ownership.sql` | Idempotent public ownership prep + guards |
| `scripts/deploy/prepare-public-schema-ownership.sh` | Wrapper |
| `scripts/deploy/bootstrap-postgres-roles.sh` | Bootstrap + verify + ownership prep |
| `infra/postgres/bootstrap-roles.sql` | Roles + `REVOKE CREATE … FROM PUBLIC` |
| `scripts/deploy/dryrun-restore-supabase-ownership-fidelity.sql` | **DRY-RUN ONLY** — align vanilla restore owners to Supabase topology |

Admin bootstrap against Supabase self-host must use a **superuser** connection
(typically `supabase_admin` / `DB_PASSWORD`). The image `postgres` role is often
`CREATEROLE` but not `rolsuper`.

## Production outcome (2026-09-13)

- Prisma: 8 finished / 0 rolled_back
- Supabase repo migrations: 6
- System roles: 5; Core permissions: 12; Core role_permissions: 27
  (Product/DJ Studio installs add Domain permissions on top — see
  `scripts/deploy/validate-database.ts` key-based checks, not rigid totals)
- profiles / auth.users: 2 / 2
- `validate-database`: PASS
- Supabase stack: healthy
- `auth.users` owner remains `supabase_auth_admin`
- Legacy `platform-core-bd`: untouched; deprecation pending (do not delete yet)

## Core vs Domain note

Foundation recovered in place still coexists with DJ-oriented tables from the
historical init (`tracks`, `artists`, `playlists`, …) and some Profile fields
that are Product/Domain-shaped. Extraction into a DJ Studio Domain is a
**later** phase — not part of this recovery.

## Legacy DB deprecation plan (`platform-core-bd`)

Resource UUID `gww3fbml08nacbdqctsjh9nn`, database `dj_platform` (empty app schema).
Backup exists. **Do not stop or delete yet.**

| Phase | Action | Status |
|-------|--------|--------|
| A | Mark deprecated in docs / Coolify notes | this closeout |
| B | Scan repo/env/Coolify/scripts/docs for references | pending |
| C | If zero active references → STOP container only | not authorized |
| D | Observation 7–14 days | not started |
| E | Delete resource if no impact | not authorized |
| F | Delete volume only after backup + observation | not authorized |

