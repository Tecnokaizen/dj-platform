---
title: Deployment Operations
version: 2.0.0
status: Living Document
owner: Operations
updated: 2026-08-13
related:
  - ../architecture/DEPLOYMENT.md
  - ../architecture/SECURITY.md
  - ../PLATFORM_MATURITY.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
  - README.md
  - BACKUPS.md
  - MONITORING.md
---

# Deployment Operations

## Current authorized milestone

Only deployment-readiness Phase A is authorized. It may validate containers,
database bootstrap, migration order, CI, health/readiness and recovery against
disposable infrastructure. It must not provision Coolify staging or production.

The operational release sequence is:

1. idempotent cluster-role bootstrap;
2. `prisma migrate deploy` with the migration role;
3. pinned Supabase CLI migration push with the migration role;
4. canonical idempotent seed;
5. database validation;
6. web deployment using only `app_runtime` credentials;
7. readiness verification.

The web service never receives owner/migration credentials or migration tools.
See ADR-010 for the complete privilege and topology contract.

Repository entry points:

- `scripts/deploy/bootstrap-postgres-roles.sh` provisions cluster roles through
  an administrator connection and validates their attributes;
- `scripts/deploy/migrate-release.sh` is the single release migration runner;
- `scripts/deploy/validate-database.ts` verifies both migration ledgers and the
  canonical Role/Permission seed.

Passwords are supplied only through the deployment secret environment. The
bootstrap does not embed credentials in SQL, source or images. The migration
role may inherit the official Supabase `supabase_admin` role when it exists;
`app_runtime` is explicitly prevented from inheriting or assuming migration
privileges.

The pinned Supabase topology is `self-hosted/v0.8.0` at commit
`241bb11c0627f2981746d37033f57dbfa81d29b0`. It is materialized from the
official repository by `scripts/deploy/fetch-supabase-release.sh`; the full
official `docker/` topology is proven before optional services are evaluated.

The repository Dockerfile exposes separate `runner` and `migrator` targets.
The runner uses Node 22.23.2, Next standalone output, UID 1001, an ephemeral
filesystem and `node server.js`. It contains no Prisma CLI, Supabase CLI or
migration credentials. `docker-compose.staging.yml` is a staging topology
template only; it does not establish a deployed staging environment.

The application exposes `/api/health` for process liveness and `/api/ready`
for configuration, PostgreSQL, Auth and PostgREST reachability. Both routes are
excluded from the session proxy, return no dependency details and disable HTTP
caching. A failed dependency returns only `503 {"status":"not_ready"}`.

GitHub Actions runs the deployment-readiness gate on Pull Requests and `main`.
It materializes the pinned official Supabase release, migrates a fresh database
twice, verifies `app_runtime`, runs the complete Vitest suite without hardcoded
counts, retains the normal Turbopack build, builds both Docker targets and
smoke-tests a non-root runner against Auth, REST and PostgreSQL.

## Purpose

This document defines operational standards for deploying Products built on the platform.

Architecture defines deployment strategy and infrastructure boundaries.

Engineering produces deployable software.

Operations executes and verifies deployments.

Platform Core is not assumed to be deployed independently from a Product.

---

# Core Principle

Deployment publishes a Product runtime composed from approved application capabilities.

Typical relationship:

    Product
        ↓
    Application Composition
        ↓
    Platform Core
    +
    Business Domains
    +
    Infrastructure
        ↓
    Deployment Environment

Deployment does not transfer ownership of Core or Domain behavior to Operations.

---

# Deployment Reality

Operational documentation must distinguish between:

- current development reality;
- currently available infrastructure;
- planned infrastructure;
- staging;
- production.

An environment is not considered operational merely because it appears in documentation.

Deployment status requires runtime evidence.

---

# Current Development Reality

Current development includes:

- local Next.js development;
- local repository validation;
- PostgreSQL infrastructure;
- Supabase-related infrastructure under active configuration;
- VPS infrastructure;
- Coolify as a deployment and infrastructure management platform.

Individual services may still be under configuration or validation.

This must not be represented as Production Ready.

---

# Current Infrastructure Direction

Current deployment architecture is oriented toward self-hosted infrastructure.

Relevant technologies include:

- VPS;
- Coolify;
- Docker-based services where appropriate;
- PostgreSQL;
- Supabase self-hosted infrastructure;
- Next.js application deployment.

These technologies describe current architectural direction.

They do not prove that every production service is fully deployed or validated.

---

# Environments

Environments should be described according to actual existence.

Possible lifecycle:

    Local Development
        ↓
    Development Deployment
        ↓
    Staging when justified
        ↓
    Production

This is a maturity path, not a statement that every environment currently exists.

---

# Local Development

Local development supports:

- implementation;
- type checking;
- linting;
- database development;
- authentication development;
- Product composition;
- local validation.

Local success does not prove deployment readiness.

---

# Development Deployment

A development deployment may be used to validate:

- container configuration;
- environment variables;
- networking;
- database connectivity;
- authentication;
- application startup;
- infrastructure integration.

Development infrastructure may change while Architecture is still being validated.

---

# Staging

Staging may be introduced when Product maturity and deployment risk justify it.

A staging environment should approximate production sufficiently to validate:

- deployment;
- migrations;
- configuration;
- integrations;
- security-sensitive flows;
- operational procedures.

Staging is not currently assumed to exist unless runtime evidence confirms it.

---

# Production

Production is an evidence-based operational state.

Production requires more than a successful application build.

Production readiness may require:

- validated deployment;
- validated environment configuration;
- database migration safety;
- backup strategy;
- restore verification;
- security validation;
- monitoring;
- health checks;
- incident procedures;
- operational ownership.

A Product must not be described as Production Ready until applicable requirements are verified.

---

# Deployment Flow

A deployment may follow a flow such as:

    Versioned Source
        ↓
    Validation
        ↓
    Build
        ↓
    Deployment
        ↓
    Migration when required
        ↓
    Runtime Verification
        ↓
    Operational Observation

The exact sequence depends on current infrastructure and Product requirements.

Do not impose CI, containers or migrations when a deployment does not require them.

---

# Version Control

Application source should be versioned.

Significant deployment configuration should be reproducible where practical.

Version control should provide traceability for:

- application code;
- configuration templates;
- infrastructure definitions where appropriate;
- migrations;
- deployment-relevant documentation.

Secrets must remain outside Git.

---

# Deployment Source

Deployments should originate from identifiable source revisions.

Useful deployment evidence may include:

- branch;
- commit;
- tag;
- build identifier;
- deployment timestamp.

Production should not depend on unidentified local modifications.

---

# Coolify

Coolify is part of the current self-hosted infrastructure strategy.

It may manage:

- application deployments;
- containerized services;
- environment configuration;
- databases;
- networking;
- service lifecycle.

Coolify configuration must still be validated per service.

The existence of Coolify does not prove that a Product is Production Ready.

---

# Containers

Containers may be used where supported by the infrastructure.

Containerized services should aim to be:

- reproducible;
- understandable;
- replaceable;
- observable.

Persistent application data must not depend solely on ephemeral container state.

Not every operational component must necessarily be containerized.

---

# Persistent Data

Persistent data may include:

- PostgreSQL databases;
- object storage when introduced;
- persistent service volumes;
- operational configuration where appropriate.

Persistent data strategy must be documented before destructive deployment changes.

---

# Configuration

Runtime configuration should remain outside application source where appropriate.

Environment configuration may include:

- database connection values;
- authentication configuration;
- public application URLs;
- provider credentials;
- service endpoints.

Secrets must not be committed to source control.

---

# Environment Variables

Environment variables should:

- have clear ownership;
- use documented names;
- distinguish public and private values;
- avoid unnecessary duplication;
- be validated when required.

Public frontend environment variables must not contain secrets.

---

# Secrets

Secrets may include:

- database credentials;
- provider API keys;
- authentication secrets;
- service tokens;
- infrastructure credentials.

They must:

- remain outside source control;
- use least privilege;
- avoid logs;
- avoid public bundles;
- be rotated when required.

---

# Database Deployment

Database changes require additional care because application rollback does not automatically reverse data changes.

Database deployment may include:

- Prisma schema changes;
- migrations;
- constraints;
- indexes;
- seed changes;
- manual SQL when explicitly required.

Migration behavior must follow Database and Architecture standards.

---

# Migration Validation

Before applying a significant migration, determine:

- expected schema change;
- data impact;
- compatibility with current application code;
- rollback or forward-fix strategy;
- backup requirements;
- expected runtime impact.

Migration safety depends on the actual change.

Do not use one universal migration procedure blindly.

---

# Backup Before Destructive Changes

Significant destructive or irreversible operations should consider backup requirements before execution.

Backup requirements depend on:

- environment;
- data importance;
- migration risk;
- recoverability.

Production-impacting destructive operations should not proceed when recovery capability is unknown.

---

# Deployment Verification

Deployment is not complete when the build finishes.

Verification may include:

- application startup;
- expected route availability;
- database connectivity;
- authentication;
- critical user flows;
- tenant behavior;
- provider connectivity;
- migrations;
- logs;
- runtime health.

Validate what actually matters to the deployed Product.

---

# Health Checks

Health checks should reflect services that actually exist.

Possible checks may include:

- application HTTP health;
- database connectivity;
- authentication availability;
- external dependency health;
- storage when implemented;
- background processing when implemented.

Do not require health checks for infrastructure that does not exist.

---

# Authentication Verification

Authentication deployment should verify relevant flows such as:

- login;
- registration when enabled;
- session handling;
- callback behavior;
- protected routes;
- logout.

Current authentication architecture must remain consistent with the configured provider and `Profile` application identity.

---

# Tenancy Verification

Tenant-aware deployment should validate:

- Organization access;
- Membership behavior;
- authorization boundaries;
- tenant isolation.

These checks become mandatory as the relevant Core Foundation capabilities are implemented.

---

# Rollback

Rollback strategy depends on the type of deployment.

Application rollback may involve restoring a previous source or image version.

Database rollback may be more complex.

Before deployment, consider:

- schema compatibility;
- data changes;
- application compatibility;
- infrastructure changes;
- external side effects.

Sometimes forward-fixing is safer than reversing a migration.

---

# Deployment Failure

When deployment fails:

1. stop further rollout;
2. identify the failing layer;
3. determine user or data impact;
4. decide whether to retry, fix forward or rollback;
5. restore stable service;
6. validate recovery;
7. record significant findings.

Do not continue deploying blindly after failed verification.

---

# Release Notes

Release notes may be useful for significant deployments.

They may describe:

- changes;
- migrations;
- known risks;
- operational impact;
- rollback considerations.

Not every development deployment requires formal release notes.

Release documentation depth should reflect Product maturity and deployment risk.

---

# Deployment Automation

Deployment automation may include:

- CI checks;
- automated builds;
- deployment triggers;
- migration execution;
- health verification.

Automation should be introduced when it reduces meaningful operational risk.

Do not create complex CI/CD infrastructure before requirements justify it.

---

# CI/CD

CI/CD is not assumed to be complete merely because deployment standards describe it.

Current implementation must be verified from:

- repository workflows;
- deployment configuration;
- runtime behavior.

Future CI/CD may progressively automate:

- lint;
- typecheck;
- tests;
- builds;
- deployment;
- migration checks.

---

# Monitoring After Deployment

Significant deployments should be observed after release when monitoring exists.

Useful signals may include:

- application errors;
- latency;
- resource usage;
- database errors;
- authentication failures;
- provider failures.

Monitoring must reflect actual deployed infrastructure.

---

# Manual Production Changes

Manual production changes should be exceptional.

When necessary they should be:

- deliberate;
- documented;
- scoped;
- validated;
- reversible where practical.

Avoid undocumented production drift.

---

# Infrastructure Changes

Infrastructure changes may include:

- networking;
- database configuration;
- container configuration;
- service deployment;
- DNS;
- secrets;
- persistent volumes.

Infrastructure changes require understanding of current runtime state.

Do not rely solely on documentation when the infrastructure can be inspected directly.

---

# Supabase Self-Hosted

Supabase self-hosted infrastructure is part of the current platform infrastructure work.

Relevant services may include:

- authentication;
- REST;
- storage;
- realtime;
- Studio;
- supporting infrastructure.

Individual services must not be considered operational merely because they exist in a Supabase deployment definition.

Runtime health must be verified.

---

# Service Health

Container or service status should be validated directly.

Useful evidence may include:

- running state;
- health status;
- logs;
- network connectivity;
- service responses;
- dependency connectivity.

A completed deployment command does not necessarily mean the service is healthy.

---

# Environment Drift

Environment drift occurs when runtime configuration no longer matches documented or versioned expectations.

Drift may result from:

- manual changes;
- forgotten environment variables;
- provider configuration;
- container changes;
- database modifications.

Significant drift should be documented and reconciled.

---

# Deployment Evidence

Useful evidence may include:

- deployed commit;
- build result;
- service status;
- migration result;
- application response;
- authentication verification;
- health checks;
- monitoring observation.

Deployment should be evaluated from evidence rather than assumption.

---

# Current vs Future

This document defines deployment standards.

It does not prove that the platform currently has:

- a production environment;
- a staging environment;
- complete CI/CD;
- automated production deployment;
- automated migration rollback;
- complete monitoring;
- complete health checks;
- automated release notes;
- fully validated Supabase self-hosted infrastructure.

These capabilities require runtime evidence.

---

# AI Development Rules

AI agents must not:

- assume the target environment;
- assume Staging exists;
- assume Production exists;
- deploy directly to Production without explicit instruction;
- apply destructive database changes without understanding recovery;
- invent environment variables;
- expose secrets;
- assume a container is healthy because deployment completed;
- assume Supabase services are operational without verification;
- introduce CI/CD infrastructure speculatively;
- infer deployment status from documentation alone.

---

# AI Deployment Stop Rule

AI agents must stop when:

- deployment target is unclear;
- environment ownership is unclear;
- required secrets are unavailable;
- runtime state conflicts with documentation;
- database change risk is unresolved;
- recovery capability is unknown before destructive work;
- service health cannot be verified;
- deployment may affect customer data unexpectedly.

The agent should report:

- target environment;
- current evidence;
- identified risk;
- required decision;
- safe next action.

---

# Success Indicators

Deployment operations are healthy when:

- deployment target is explicit;
- source revision is identifiable;
- configuration is controlled;
- secrets remain protected;
- database changes are understood;
- runtime health is verified;
- rollback or recovery is considered;
- operational evidence is recorded;
- documentation matches infrastructure reality.

---

# Failure Indicators

Deployment operations are unhealthy when:

- nonexistent environments are documented as active;
- Platform Core is treated as an independent deployment Product;
- production state is inferred from local success;
- deployment completion is confused with service health;
- migrations execute without impact analysis;
- secrets enter source control;
- manual production drift accumulates;
- CI/CD is assumed rather than verified;
- Supabase services are assumed healthy without inspection.

---

# Final Principle

Products are deployed.

Platform Core and Business Domains provide capabilities inside those Products.

Deployment state must reflect runtime reality.

Local success does not equal Production readiness.

Environment existence must be verified.

Database changes require recovery awareness.

Deployment is complete only after relevant runtime validation.

Trust evidence, not assumptions.
