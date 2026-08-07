---
title: Deployment Architecture
version: 1.0.0
status: Living Document
owner: Architecture
updated: 2026-08-04
---

# Deployment Architecture

## Initial model

Platform Core applications are deployed as a containerized monolith managed by Coolify.

Initial resources:

```text
platform-web
platform-postgres
```

Optional later:

```text
platform-redis
platform-worker
object-storage
```

No microservices for the MVP.

## Environments

### Local

Developer machine.

### Staging

Integration, migration rehearsal, acceptance testing and preview.

### Production

Public stable environment.

Staging and production never share:

- database
- secrets
- storage bucket
- auth secret
- AI credentials where separate credentials are possible

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

- multi-stage build
- deterministic install
- non-root runtime user
- minimal final image
- no baked secrets
- health endpoint
- production runtime configuration

## Deployment pipeline

```text
Push
  ↓
CI
  ├── install
  ├── lint
  ├── typecheck
  ├── tests
  └── build
  ↓
Container build
  ↓
Deploy
  ↓
Migration
  ↓
Health check
  ↓
Traffic
```

## Migrations

Before production migration:

- backup
- staging rehearsal
- destructive-change review
- lock-duration review
- rollback or forward-fix plan

## Health checks

```text
/api/health
/api/ready
```

Health checks process availability.

Readiness checks required configuration and database connectivity.

Never return secrets.

## Rollback

Distinguish:

- application rollback
- database rollback
- forward migration

A database change may make an old application version incompatible. Risky deployments need compatibility planning.

## Storage

Persistent binary assets should use S3-compatible object storage in production.

The container filesystem is ephemeral and must never be considered persistent storage.

## Backups

- automated
- encrypted
- off-server
- retained
- restore-tested

## Monitoring

Minimum:

- uptime
- HTTP error rate
- latency
- container health
- database disk
- database connections
- backup status
- deployment failures

## Scaling order

1. optimize queries
2. use CDN
3. add selective caching
4. increase VPS resources
5. introduce horizontal scaling when justified

Horizontal scaling requires stateless application design and shared external storage.

## Background work

Long tasks should eventually move outside web requests:

Examples:

- large imports
- AI processing
- media processing
- synchronization jobs
- scheduled maintenance

Queues and workers require ADR approval.

## Production readiness checklist

- domain and TLS configured
- secrets configured
- isolated database
- backups restored successfully in test
- migrations rehearsed
- health checks active
- logs and error tracking available
- rate limits enabled
- public endpoints verified when applicable
- no test accounts exposed

## Forbidden practices

Never:

- deploy unreviewed local state
- share staging and production database
- store uploads only in container filesystem
- bake secrets into images
- skip backup before destructive migration
- expose database openly
- claim deployment success before health verification
