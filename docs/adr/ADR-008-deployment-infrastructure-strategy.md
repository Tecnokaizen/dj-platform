# ADR-008 — Deployment and Infrastructure Strategy

**Status:** Accepted
**Date:** 2026-08-09
**Decision Type:** Foundation Architecture

## Context

`dj-platform` requires an infrastructure strategy that can support:

- DJ Platform;
- Platform Core;
- future Products;
- PostgreSQL persistence;
- Supabase Auth;
- application deployment;
- migrations;
- backups;
- operational monitoring;
- future scaling when demonstrated.

The current infrastructure direction uses self-hosted services on VPS infrastructure managed through Coolify.

Previous project work has also explored Supabase self-hosting and PostgreSQL deployment.

However, architecture must distinguish between:

- intended infrastructure;
- development infrastructure;
- deployed services;
- verified runtime behavior;
- Production Ready operation.

The existence of containers, configuration or documentation is not sufficient evidence of production readiness.

## Decision

The preferred current infrastructure direction is:

    VPS
        ↓
    Coolify
        ↓
    Application services
        +
    PostgreSQL
        +
    Supabase self-hosted capabilities as required

This is the current deployment strategy unless a demonstrated Product or operational requirement justifies changing it.

Infrastructure choices must remain evidence-based.

## Repository and Product

The repository remains:

    dj-platform

DJ Platform is the current Product.

Platform Core exists inside the same repository.

Infrastructure does not require a repository split merely because reusable Core capabilities exist.

Future multi-Product deployment topology may evolve when demonstrated operational needs justify it.

## Application Deployment

The Next.js application is intended to run as a server-capable deployment.

The application currently relies on server-side behavior including:

- Supabase SSR integration;
- authentication;
- Server Components;
- Server Actions;
- authentication callback handling;
- protected Product layouts.

Deployment must therefore preserve required server runtime behavior.

Static-only deployment must not be assumed.

## PostgreSQL

PostgreSQL is the canonical application persistence engine.

Deployment must provide:

- reliable database connectivity;
- controlled credentials;
- migration execution strategy;
- backup capability;
- restore capability;
- operational monitoring appropriate to the environment.

Database availability must not be inferred solely from container state.

Application connectivity and relevant database operations must be exercised before runtime claims are made.

## Prisma Migrations

Production-oriented deployment must preserve controlled Prisma migration history.

Migration workflow must distinguish between:

- development;
- staging when such an environment exists;
- production.

A deployment must not silently substitute:

    prisma db push

for approved migration history.

Database migrations should be executed deliberately and with appropriate operational context.

## Supabase

Supabase is used as the current authentication platform.

Self-hosted Supabase may provide multiple services.

The architecture must not assume that every Supabase service is required or operational.

Capabilities may include:

- Auth;
- REST;
- Storage;
- Realtime;
- Studio;
- other Supabase services.

Only capabilities actually required, deployed and verified should be treated as operational dependencies.

## Supabase Auth

Supabase Auth is part of the current implemented authentication architecture.

Application deployment must provide the configuration required by the active Supabase Auth integration.

Runtime verification must confirm that authentication flows actually work in the target environment.

Configuration presence alone is insufficient.

## Storage

Supabase Storage is not a default Product dependency.

Storage should be adopted when demonstrated Product requirements require persisted files or media.

Until implementation exists, Storage must not be described as an active dependency of DJ Platform.

## Realtime

Supabase Realtime is not a default Product dependency.

Realtime should be introduced only when a concrete workflow demonstrates a need for server-driven live updates.

Product architecture must not be shaped around Realtime merely because Supabase provides it.

## Infrastructure Adapters

Provider-specific application connectivity belongs under:

    src/lib/

Current implemented infrastructure includes:

    src/lib/supabase/

Future infrastructure may include:

    src/lib/prisma/

when application Prisma client infrastructure is implemented.

Provider adapters must not own Product or Domain business rules.

## Environment Configuration

Deployment configuration must be environment-specific.

Secrets must not be committed to source control.

Typical configuration may include:

- database connection values;
- Supabase URLs;
- Supabase public client configuration;
- server-only credentials when required.

Server-only secrets must never be exposed through public environment variables.

The architecture must not claim an environment variable is required until current implementation actually uses it.

## Environments

Architecture distinguishes environment intent from verified infrastructure.

Possible environments include:

    local development
    staging
    production

An environment must not be claimed as operational merely because its documentation exists.

Current repository and infrastructure evidence must determine which environments actually exist and are usable.

## Production Readiness

Production readiness is not established by:

- successful compilation;
- successful linting;
- valid Prisma schema;
- running containers;
- successful local authentication;
- completed architecture documentation.

Production readiness additionally requires evidence appropriate to the Product, including potentially:

- deployment validation;
- database connectivity;
- migration execution;
- backup verification;
- restore testing;
- authentication verification;
- authorization verification;
- tenant isolation;
- observability;
- incident procedures;
- security review;
- operational monitoring.

Production Ready must be an evidence-backed conclusion.

## Backups

Persistent production data requires a backup strategy.

Backup architecture must define:

- what is backed up;
- backup frequency;
- retention;
- storage location;
- credential protection;
- restore procedure;
- verification.

A backup that has never been restored successfully is not sufficient evidence of recoverability.

Restore testing is part of operational confidence.

## Monitoring

Operational environments require monitoring proportional to their importance.

Monitoring may include:

- application availability;
- application errors;
- database availability;
- resource pressure;
- authentication failures;
- migration failures;
- backup failures;
- infrastructure health.

Specific monitoring tooling should be chosen based on demonstrated operational need.

This ADR does not mandate a particular observability vendor.

## Logging

The platform does not currently require a dedicated logging library merely because logging may be useful later.

Logging infrastructure should be introduced when operational requirements justify it.

Application logging must avoid exposing:

- secrets;
- authentication tokens;
- sensitive personal data;
- privileged credentials.

## Cache

No dedicated application cache layer is assumed.

Cache infrastructure should be introduced only for demonstrated performance, scalability or operational requirements.

Redis or another cache technology must not be introduced speculatively.

## Background Jobs

No queue or background-job framework is mandated by Foundation Architecture.

Background processing may become necessary for:

- ingestion;
- enrichment;
- AI workflows;
- long-running imports;
- asynchronous integrations.

A job system should be chosen when a demonstrated workload requires it.

The platform must not commit prematurely to a queue provider.

## AI Providers

No OpenAI or Anthropic SDK is part of the current required application infrastructure merely because AI functionality exists in Product vision.

AI provider integration requires an explicit implemented capability and provider decision.

Provider-specific infrastructure belongs behind adapters.

Product or Domain architecture must avoid unnecessary provider lock-in.

## Horizontal Scaling

Horizontal scaling is not an immediate Foundation requirement.

The application should avoid unnecessary architectural choices that prevent future scaling, but infrastructure complexity must follow demonstrated load.

Scaling decisions require runtime evidence such as:

- traffic;
- concurrency;
- database load;
- job volume;
- latency;
- memory or CPU pressure.

Do not introduce distributed infrastructure solely for hypothetical future scale.

## Deployment Safety

Deployments should minimize avoidable operational risk.

Depending on the change, deployment planning may need to consider:

- schema compatibility;
- migration order;
- application/database version compatibility;
- rollback;
- forward fixes;
- secrets;
- downtime;
- data transformations.

Deployment success must be validated from application behavior, not only from orchestration status.

## Infrastructure State

Infrastructure documentation must distinguish:

    intended
    configured
    deployed
    healthy
    exercised
    verified

These states are not equivalent.

For example:

    container healthy
    ≠ application workflow verified

and:

    Supabase service deployed
    ≠ Product depends on that service

## Operational Evidence

Runtime claims require runtime evidence.

Examples:

    authentication works
    → execute authentication flow

    database reachable
    → exercise database connectivity

    migration works
    → apply or validate migration in an appropriate environment

    backup recoverable
    → perform restore test

    tenant isolation works
    → exercise tenant isolation tests

Static documentation cannot substitute for runtime verification.

## Self-Hosting Tradeoffs

Self-hosting provides advantages such as:

- infrastructure control;
- cost control at suitable scale;
- portability;
- reduced dependence on managed SaaS pricing.

It also creates responsibilities such as:

- upgrades;
- backups;
- restore testing;
- security patching;
- monitoring;
- incident response;
- capacity planning.

Self-hosting must therefore be treated as an operational responsibility, not merely a hosting-cost optimization.

## Vendor Lock-In

The architecture should avoid unnecessary provider lock-in.

However, avoiding lock-in does not mean refusing useful provider capabilities.

The preferred strategy is:

- isolate provider connectivity;
- preserve application-owned data semantics;
- use standard persistence where practical;
- avoid leaking provider-specific behavior across Core and Domains.

PostgreSQL remains the canonical application persistence engine.

## Coolify

Coolify is the current deployment orchestration direction.

Coolify may manage:

- application containers;
- databases;
- Supabase services;
- networking;
- environment configuration.

Coolify is deployment infrastructure.

It does not define Platform Core or Domain architecture.

A future change of deployment orchestrator should not require rewriting business semantics.

## VPS

VPS infrastructure is the current hosting direction.

The architecture does not depend on a particular VPS vendor.

Provider selection may change based on:

- cost;
- reliability;
- location;
- support;
- capacity;
- operational requirements.

Hosting provider identity must remain outside application business logic.

## Security

Infrastructure must protect:

- secrets;
- database credentials;
- Supabase privileged credentials;
- deployment credentials;
- backup credentials.

Production services must use appropriate network exposure and access controls.

Operational security requirements are further defined in:

    docs/architecture/SECURITY.md
    docs/operations/

## Incident Response

Production operation requires an incident-response capability proportionate to Product risk.

Incident handling should distinguish:

- application failure;
- database failure;
- authentication failure;
- deployment failure;
- infrastructure failure;
- security incident.

Operational procedures belong under:

    docs/operations/

## Current State

Current repository evidence confirms:

- Next.js application source;
- Supabase authentication integration;
- Prisma schema and initial migration;
- PostgreSQL architecture;
- Coolify/VPS as infrastructure direction;
- development validation through typecheck and lint.

Production deployment readiness is not currently established by repository evidence alone.

Production status must remain unclaimed until operational verification exists.

## Implementation Agent Rules

An implementation agent must not independently:

- declare production readiness;
- assume Storage is required;
- assume Realtime is required;
- introduce Redis speculatively;
- introduce a queue framework speculatively;
- add OpenAI or Anthropic SDKs without an approved capability need;
- change hosting strategy without architectural reason;
- bypass migration history;
- expose server secrets publicly;
- infer runtime health from static configuration;
- treat healthy containers as proof of Product correctness.

Infrastructure changes that materially alter architecture must be surfaced for review.

## Rejected Alternatives

### Managed Supabase required by architecture

Rejected because the current direction supports self-hosted Supabase and application architecture should not require the managed service.

### Every Supabase service is a required dependency

Rejected because only demonstrated Product capabilities should create dependencies.

### Redis from day one

Rejected because no demonstrated cache requirement currently justifies it.

### Queue framework from day one

Rejected because asynchronous infrastructure should respond to real workload.

### AI provider SDKs preinstalled speculatively

Rejected because provider integration should follow an approved implemented capability.

### Container health equals production readiness

Rejected because infrastructure process health does not prove Product workflows.

### Documentation equals operational verification

Rejected because runtime guarantees require runtime evidence.

### Repository split required for future Products

Rejected because deployment and repository topology should evolve from demonstrated multi-Product needs.

## Consequences

### Positive

- infrastructure remains adaptable;
- self-hosting strategy is explicit;
- speculative infrastructure is avoided;
- operational claims require evidence;
- provider dependencies remain isolated;
- Product and Domain logic remain portable;
- scaling complexity follows actual demand.

### Costs

- self-hosting requires operational discipline;
- production readiness requires explicit verification;
- backup and restore responsibilities belong to the platform operator;
- some managed conveniences may require additional operational work.

These costs are accepted because the current strategy prioritizes control, portability and sustainable infrastructure evolution.

## Related Decisions

- ADR-001 — Platform Core and Domain Boundary
- ADR-002 — Identity Source of Truth
- ADR-003 — Internal Identifier Strategy
- ADR-007 — Prisma and Data Access Conventions

## Related Documents

- `docs/architecture/DEPLOYMENT.md`
- `docs/architecture/TECH_STACK.md`
- `docs/architecture/SECURITY.md`
- `docs/architecture/PRISMA_IMPLEMENTATION.md`
- `docs/operations/README.md`
- `docs/operations/DEPLOYMENT.md`
- `docs/operations/MONITORING.md`
- `docs/operations/BACKUPS.md`
- `docs/operations/INCIDENT_RESPONSE.md`
- `docs/PLATFORM_MATURITY.md`

## Final Rule

Use self-hosted VPS + Coolify + PostgreSQL + required Supabase capabilities as the current infrastructure direction.

Adopt infrastructure capabilities only when demonstrated requirements justify them.

Deployment state and production readiness require runtime evidence.

Do not turn hypothetical scale or provider capability into present-day infrastructure complexity.
