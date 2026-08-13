---
title: Deployment Architecture
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-13
---

# Deployment Architecture

## Approved staging-readiness baseline

ADR-010 defines the executable baseline for the next deployment milestone.
Phase A produces reproducible images, migration tooling, CI, health/readiness
contracts and backup/restore tooling. It does not provision staging.

The baseline uses a pinned official Supabase self-hosting release. PostgreSQL,
Auth, PostgREST and the gateway are Product-required. Operational services from
the official topology are evaluated separately before any removal. The Next.js
runtime is standalone, non-root and migration-free.

Database release order is role bootstrap, Prisma migrations, Supabase
migrations, canonical seed, validation, then application deployment. One
release job preserves both migration ledgers. Production remains unauthorized.

## Initial model

The target deployment model is a containerized application managed through Coolify.

The application remains a modular monolith.

No microservices are required for the current architecture.

Current development infrastructure includes Docker, Coolify, PostgreSQL and self-hosted Supabase infrastructure under active validation.

The existence of an infrastructure service does not imply that every capability provided by that service is already adopted by the application.

Conceptual application resources may include:

```text
platform-web
platform-postgres
supabase infrastructure
```

Future resources may include, when justified:

```text
platform-redis
platform-worker
object-storage
```

These future resources must not be provisioned speculatively.

## Environments

The architecture distinguishes three environment classes.

### Local

Developer environment used for implementation and local validation.

### Staging

Target pre-production environment for:

- integration validation
- migration rehearsal
- acceptance testing
- deployment verification
- preview when appropriate

Staging must not be described as operational until it has actually been provisioned and validated.

### Production

Target public stable environment.

Production must not be described as operational or production-ready until all readiness requirements have been verified.

When Staging and Production exist, they must not share:

- database
- application secrets
- storage credentials or buckets
- authentication secrets
- provider credentials where separate credentials are possible

Environment isolation is a deployment and security requirement.

## Git flow

Recommended initial flow:

```text
The project follows a feature branch workflow.

Typical lifecycle:

```text
main
  ↓
feature/*
  ↓
Pull Request
  ↓
main
  ↓
CI/CD
  ↓
Deployment
```

Long-lived branches such as `develop` or `staging` are optional and depend on the project's deployment strategy.

The deployment model should remain independent from the branching strategy.
```

## Docker requirements

Production-oriented application containers should provide:

- deterministic dependency installation
- reproducible builds
- minimal runtime image
- non-root runtime user where practical
- no baked secrets
- runtime configuration through environment or secret management
- explicit health/readiness strategy
- ephemeral application filesystem

Multi-stage builds are preferred when they improve image size, security or reproducibility.

These are deployment requirements, not claims that every item is already implemented.

## Deployment pipeline

The deployment pipeline is release-aware rather than a fixed universal sequence.

Current project quality gates available in `package.json` include:

```text
install
lint
typecheck
build
```

Formatting and Prisma validation may also be included in CI when appropriate.

Automated tests become a deployment gate once an automated testing framework is implemented.

Conceptually:

```text
Push / Pull Request
        ↓
CI
        ├── install
        ├── lint
        ├── typecheck
        ├── validation
        └── build
        ↓
Release Planning
        ↓
Database Compatibility Review
        ↓
Migration / Deployment Strategy
        ↓
Application Deployment
        ↓
Health / Readiness Verification
        ↓
Traffic
```

Database migration and application deployment order depends on migration compatibility.

Do not assume that:

```text
Deploy
→ Migration
```

or:

```text
Migration
→ Deploy
```

is universally correct.

Risky releases should use compatibility-aware techniques such as expand-and-contract when appropriate.

## Migrations

Before a production database migration:

- create or verify a recoverable backup
- rehearse significant migrations in an isolated environment
- review destructive changes
- review lock duration and operational impact
- verify application/database compatibility
- define rollback or forward-fix strategy

Database rollback must not be assumed to be safe.

Forward-fix may be safer when data transformations or destructive schema changes have already occurred.

Prisma migration commands must be used according to the target environment and deployment strategy.

## Health checks

Health and readiness endpoints are architectural targets, not current implementation claims.

Recommended contracts may include:

```text
/api/health
/api/ready
```

A health check should confirm that the application process is available.

A readiness check may additionally verify required configuration and critical dependencies such as database connectivity.

Health endpoints must:

- avoid leaking secrets
- avoid exposing sensitive infrastructure details
- remain inexpensive to execute
- distinguish process health from dependency readiness where useful

The exact routes must be documented as implemented only after they exist in source.

## Rollback

Distinguish:

- application rollback
- database rollback
- forward migration

A database change may make an old application version incompatible. Risky deployments need compatibility planning.

## Storage

The application container filesystem must be treated as ephemeral.

Persistent binary assets must not rely exclusively on the application container filesystem.

No application-level object storage integration is currently established.

A future production storage capability may use:

```text
S3-compatible object storage
```

or another approved external persistent storage provider.

Storage provider adoption must follow the Platform Core Storage architecture when that capability is implemented.

## Backups

Production backup architecture should provide:

- automated backups
- encryption where appropriate
- storage outside the primary failure domain
- retention policy
- restore testing
- documented recovery procedure

A backup strategy is not considered validated until restoration has been tested.

Exact backup procedures belong to operational documentation.

## Monitoring

Production observability should cover, as applicable:

- uptime
- HTTP error rate
- latency
- container health
- database disk usage
- database connections
- backup status
- deployment failures

These are production requirements, not claims that a complete monitoring stack is currently implemented.

Monitoring technology should be selected according to measurable operational requirements.

## Scaling order

Scaling decisions are evidence-driven.

A typical investigation may consider:

1. query design
2. indexes
3. pagination and data-loading strategy
4. selective caching
5. CDN or edge delivery for appropriate public assets
6. vertical VPS scaling
7. horizontal scaling when measurements justify it

This is guidance, not a mandatory sequence.

Horizontal scaling requires compatible application design, including stateless web processes where appropriate and shared external persistence for state that cannot remain local.

## Background work

Long-running work should move outside synchronous web requests when execution time, reliability or retry requirements justify it.

Potential future examples include:

- large imports
- AI processing
- media processing
- synchronization jobs
- scheduled maintenance

No queue or worker architecture should be assumed to exist until implemented.

Queues, distributed workers or equivalent background-processing infrastructure require architectural review and ADR approval when they materially affect the platform.

## Production readiness checklist

The following is a readiness gate, not a description of current production state.

Before declaring an environment production-ready, verify as applicable:

- domain and TLS configured
- secrets configured securely
- isolated production database
- backup strategy active
- restore procedure successfully tested
- migrations rehearsed where risk requires it
- health/readiness verification implemented
- logs available
- error monitoring available
- rate limiting implemented where the threat model requires it
- public endpoints verified
- sensitive diagnostic endpoints protected
- no test credentials or test accounts exposed
- deployment rollback or forward-fix strategy understood

Production readiness must be verified against actual infrastructure and application behavior.

## Forbidden practices

Never:

- deploy unreviewed local state
- share staging and production database
- store uploads only in container filesystem
- bake secrets into images
- skip backup before destructive migration
- expose database openly
- claim deployment success before health verification
