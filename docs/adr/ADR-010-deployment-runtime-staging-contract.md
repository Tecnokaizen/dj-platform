# ADR-010 — Deployment Runtime and Staging Contract

**Status:** Accepted  
**Date:** 2026-08-13  
**Decision Type:** Deployment Architecture

## Context

Platform Core Foundation is closed within scope, but no staging or production
runtime has been proven. Deployment readiness needs a reproducible application
image, the Supabase capabilities used by the Product, controlled database
changes, recoverability evidence and clear privilege boundaries.

## Decision

### Runtime topology

Staging starts from a pinned official Supabase self-hosting release. Required
Product capabilities are PostgreSQL, Auth, PostgREST and the compatible API
gateway. Studio is optional and private. A service that the Product does not
use is removed only after proving that the official operational topology does
not depend on it.

The Next.js application uses `output: 'standalone'`, Node.js 22.23.2, a
non-root runner and an ephemeral filesystem. The web image contains neither
migration tools nor migration credentials.

### PostgreSQL roles

Cluster roles are provisioned by an idempotent operational bootstrap, not by
an application-schema migration. Passwords never enter Git.

- the migration role owns and applies DDL, both migration ledgers and the
  canonical seed; it is never supplied to the web runtime;
- `app_runtime` is a non-owner LOGIN role with no superuser, database creation,
  role creation, replication, DDL or role-escalation capability;
- `app_runtime` receives only required object privileges and `BYPASSRLS` for
  the trusted Prisma server path;
- `anon` and `authenticated` remain RLS-governed browser roles.

### Release migration contract

Exactly one release migration job executes, in order:

1. PostgreSQL role/bootstrap preconditions;
2. `prisma migrate deploy`;
3. pinned Supabase CLI `supabase db push --db-url ...`;
4. canonical idempotent seed;
5. database validation;
6. application deployment and readiness checks.

Prisma and `supabase_migrations.schema_migrations` remain independent ledgers.
`prisma db push`, per-replica migrations and edits to applied migration history
are forbidden.

### Configuration and images

Secrets are injected at runtime and are absent from source and image layers.
Public Supabase values may be build-time values for this staging-specific
image. Migrator and runner are separate targets. A normal Next.js production
build is tested first; Webpack is not selected because of sandbox-only failure.

### Staging email, backup and observation

Staging routes email to internal Mailpit. Its UI is not public. Production SMTP
remains a future operational decision.

PostgreSQL logical backups are encrypted client-side and stored in an external
S3-compatible system outside the VPS. Staging retention is seven daily and four
weekly snapshots. The target is RPO <= 24 hours and RTO <= 4 hours. An isolated
restore drill is required before declaring staging ready.

Application and infrastructure emit operational evidence through standard
output, container state, health/readiness endpoints, migration results,
database/Auth availability and backup results. No observability vendor is
mandated.

## Consequences

- Phase A may create and validate artifacts locally and in CI without external
  provider credentials.
- Phase B provisions real staging only after explicit authorization and access
  to Coolify, DNS/TLS, database, Supabase, email, backup and vault systems.
- A successful Phase A is deployment readiness evidence, not staging evidence.
- Production remains unauthorized and not production ready.

## References

- ADR-008 — Deployment and Infrastructure Strategy
- `docs/architecture/DEPLOYMENT.md`
- `docs/operations/DEPLOYMENT.md`
- `docs/operations/BACKUPS.md`

