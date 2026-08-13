---
title: Operations Handbook
version: 2.0.0
status: Living Document
owner: Operations
updated: 2026-08-09
related:
  - ../architecture/DEPLOYMENT.md
  - ../architecture/SECURITY.md
  - ../engineering/README.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Operations Handbook

## Purpose

This directory defines operational standards for deploying, monitoring, maintaining and supporting Products built on the platform.

Architecture defines how systems are designed.

Engineering defines how approved architecture is implemented.

Operations defines how deployed systems are operated safely and reliably.

Operations does not redefine Product, Domain or Platform Core ownership.

---

# Core Principle

Operations manages deployed systems.

A deployed Product may include:

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
    Runtime Environment

Platform Core is part of the application architecture.

It is not assumed to be deployed or operated as an independent Product.

---

# Operational Scope

Operations may cover:

- application deployment;
- database operation;
- environment configuration;
- monitoring;
- backup;
- recovery;
- maintenance;
- incident response;
- operational documentation;
- infrastructure validation.

The exact operational scope depends on the deployed Product and environment.

---

# Current Documents

This directory contains:

- `DEPLOYMENT.md`
- `MONITORING.md`
- `BACKUPS.md`
- `RUNBOOKS.md`
- `INCIDENT_RESPONSE.md`
- `MAINTENANCE.md`

These documents define operational standards.

Their existence does not prove that every described operational capability is currently implemented.

---

# Operational Responsibilities

Operations is responsible for keeping deployed systems:

- available;
- secure;
- observable;
- recoverable;
- maintainable;
- reproducible where practical.

Operations supports application capabilities without becoming the owner of their business semantics.

---

# Product Operations

Different Products may have different operational requirements.

For example:

    DJ Platform
    → public application
    → authenticated application
    → database
    → external integrations
    → future production infrastructure

Another Product may have:

    Copy Platform
    → operational SaaS application
    → tenant data
    → customer workflows
    → infrastructure
    → backup and maintenance requirements

Shared operational standards may be reused.

Product deployment requirements remain Product-specific.

---

# Platform Core Relationship

Platform Core defines reusable SaaS capabilities.

Operations ensures that those capabilities function correctly when they are part of a deployed Product.

Operations does not make Platform Core:

- a Product;
- a deployment target by itself;
- the owner of Product infrastructure;
- the owner of Business Domain runtime behavior.

---

# Business Domains

Business Domains define business-specific behavior.

Operations may need to understand Domain-specific runtime requirements such as:

- scheduled processing;
- external providers;
- data volume;
- storage;
- traffic;
- recovery requirements.

Operational knowledge does not transfer Domain ownership to Operations.

---

# Infrastructure

Operations may manage infrastructure such as:

- application runtime;
- databases;
- networking;
- secrets;
- storage;
- reverse proxies;
- deployment platforms;
- monitoring systems;
- backup systems.

Infrastructure should follow approved Architecture.

---

# Environment Reality

Operational documentation must distinguish between:

- current environments;
- planned environments;
- future production architecture;
- documented standards.

Do not describe an environment as operational merely because it appears in documentation.

Repository, deployment and runtime evidence determine actual environment status.

---

# Development

Development environments support implementation and validation.

They may differ from production in:

- configuration;
- infrastructure scale;
- monitoring;
- backup policy;
- availability requirements.

Development behavior must not be presented as proof of production readiness.

---

# Staging

A staging environment may be introduced when Product maturity and deployment risk justify it.

Staging is not assumed to exist merely because deployment standards describe it.

If staging does not exist, documentation must not claim otherwise.

---

# Production

Production is an operational state supported by evidence.

A Product should not be described as Production Ready solely because:

- code exists;
- local development works;
- lint passes;
- typecheck passes;
- deployment documentation exists.

Production readiness may require:

- deployment verification;
- backup validation;
- restore testing;
- monitoring;
- security review;
- operational procedures;
- incident readiness;
- environment validation.

---

# Operational Principles

Operations should aim to be:

- predictable;
- documented;
- observable;
- repeatable;
- recoverable;
- appropriately automated.

Automation should reduce operational risk.

It should not hide important behavior.

---

# Manual Operations

Manual intervention is sometimes necessary.

Manual operations should be:

- deliberate;
- documented when significant;
- reversible where practical;
- validated afterward.

Avoid undocumented production changes.

---

# Reproducibility

Important infrastructure and application configuration should be reproducible where practical.

Version control should contain appropriate application and infrastructure definitions.

Secrets must remain outside source control.

Reproducibility does not mean storing sensitive configuration in Git.

---

# Monitoring

Monitoring provides evidence about runtime health.

It may cover:

- application availability;
- errors;
- latency;
- database health;
- infrastructure health;
- resource usage;
- external dependencies.

Monitoring requirements depend on Product maturity and production risk.

Detailed standards live in:

    docs/operations/MONITORING.md

---

# Backups

Backup strategy must reflect actual data and recovery requirements.

Backups are useful only if recovery is possible.

Restore validation is therefore part of backup confidence.

Detailed standards live in:

    docs/operations/BACKUPS.md

---

# Maintenance

Maintenance includes planned operational work such as:

- dependency updates;
- infrastructure updates;
- database maintenance;
- certificate renewal;
- capacity work;
- operational cleanup.

Maintenance must preserve Product availability and data integrity according to current requirements.

---

# Incident Response

Incidents affect deployed Products or infrastructure.

Incident response should focus on:

1. detection;
2. impact assessment;
3. containment;
4. recovery;
5. verification;
6. learning.

Incident handling does not redefine Architecture during an emergency without explicit approval.

---

# Runbooks

Runbooks document repeatable operational procedures.

They help reduce uncertainty during:

- deployments;
- recovery;
- maintenance;
- incidents;
- routine operational work.

Runbooks should reflect actual infrastructure.

Outdated runbooks can be more dangerous than missing runbooks.

---

# Security

Operational security includes:

- secrets management;
- least privilege;
- access control;
- secure deployment;
- backup protection;
- logging hygiene;
- infrastructure updates;
- incident handling.

Operational convenience must not bypass approved security boundaries.

---

# Operational Evidence

Operational claims should be supported by evidence.

Examples include:

- successful deployment;
- health checks;
- backup completion;
- verified restore;
- monitoring data;
- incident records;
- maintenance logs;
- environment configuration.

Documentation alone is not operational evidence.

---

# Current vs Future

Operations documentation may describe standards for capabilities that do not yet exist.

Do not infer that the platform currently has:

- staging;
- production deployment;
- complete monitoring;
- automated backups;
- automated restore testing;
- incident automation;
- full deployment pipelines;
- complete operational runbooks.

Verify actual infrastructure before claiming operational maturity.

---

# AI Operations

AI agents may assist with:

- documentation;
- diagnostics;
- deployment preparation;
- validation;
- runbook execution;
- incident analysis;
- maintenance planning.

AI agents must not make unapproved destructive or production-impacting changes.

Production operations require explicit scope and verified context.

---

# AI Stop Rule

AI agents must stop when:

- the target environment is unclear;
- production impact is uncertain;
- credentials or secrets are missing;
- infrastructure state conflicts with documentation;
- backup status is unknown before destructive work;
- rollback behavior is unclear;
- an operation may affect customer data unexpectedly.

When uncertain:

1. stop;
2. report the operational risk;
3. request clarification;
4. resume only with sufficient context.

---

# Success Indicators

Operations is healthy when:

- deployed Products are observable;
- environment state is understood;
- deployments are reproducible;
- backups can be restored;
- maintenance is controlled;
- incidents can be diagnosed;
- operational documentation matches reality;
- production claims are evidence-based.

---

# Failure Indicators

Operations is unhealthy when:

- documentation describes environments that do not exist;
- Platform Core is treated as an independently deployed Product;
- production configuration is changed without traceability;
- backups exist but restores are untested;
- incidents rely entirely on improvisation;
- monitoring is assumed rather than verified;
- operational maturity is claimed without evidence.

---

# Final Principle

Architecture defines systems.

Engineering implements them.

Products are deployed.

Operations keeps deployed systems reliable.

Platform Core provides reusable capabilities inside Products.

Business Domains retain their business semantics.

Operational maturity must be demonstrated with evidence.

Documentation must reflect infrastructure reality.
