---
title: Deployment Architecture
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
---

# Deployment Architecture

## Initial model

DJ Platform is deployed as a containerized monolith managed by Coolify.

Initial resources:

```text
dj-platform-web
dj-platform-postgres
```

Optional later:

```text
dj-platform-redis
dj-platform-worker
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
feature/*
  ↓
develop
  ↓
staging
  ↓
main
  ↓
production
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

Editorial media uses S3-compatible object storage in production.

Container filesystem is ephemeral and must not be the primary media store.

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

- imports
- AI batches
- image processing
- synchronization
- heavy sitemap generation

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
- robots and sitemap correct
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
