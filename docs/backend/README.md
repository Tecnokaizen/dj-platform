---
title: Backend Engineering Handbook
version: 2.0.0
status: Living Document
owner: Engineering
updated: 2026-08-09
related:
  - ../architecture/README.md
  - ../engineering/README.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Backend Engineering Handbook

## Purpose

This directory defines backend implementation standards for the platform.

Backend documentation explains how approved Architecture should be implemented across:

- Platform Core;
- Business Domains;
- application services;
- persistence;
- APIs;
- provider integrations;
- asynchronous processing;
- storage;
- webhooks;
- technical SEO concerns.

Backend documentation does not redefine capability ownership.

Architecture remains authoritative for architectural boundaries.

---

# Documentation Boundary

Architecture defines:

- capability ownership;
- Platform Core boundaries;
- Domain boundaries;
- dependency direction;
- tenancy;
- authorization;
- data ownership;
- infrastructure boundaries.

Backend documentation defines:

- implementation patterns;
- technical contracts;
- persistence conventions;
- API implementation;
- provider isolation;
- asynchronous execution patterns;
- technical operational behavior.

Backend standards must not silently promote Product or Domain behavior into Platform Core.

---

# Current Documents

This directory currently contains:

- `api/README.md`
- `database/README.md`
- `integrations/README.md`
- `jobs/README.md`
- `queue/README.md`
- `seo/README.md`
- `storage/README.md`
- `webhooks/README.md`

Each document owns a specific technical concern.

---

# API

`api/README.md` defines backend API implementation standards.

API layers should remain thin.

Transport should delegate business behavior to the capability that owns it.

APIs do not own business rules.

---

# Database

`database/README.md` defines persistence implementation standards.

Persistence must respect:

- data ownership;
- transaction boundaries;
- constraints;
- migrations;
- repository boundaries;
- tenant isolation.

Database structure must not redefine Business Domain ownership.

---

# Integrations

`integrations/README.md` defines technical standards for third-party provider connectivity.

Provider-specific adapters generally belong to infrastructure-facing code such as `src/lib/`.

Platform Core or Business Domains may own the capability semantics that consume those adapters.

Provider connectivity and business capability ownership are different concerns.

---

# Jobs

`jobs/README.md` defines standards for asynchronous units of work.

Jobs coordinate execution.

They must not become hidden owners of business logic.

---

# Queues

`queue/README.md` defines queue implementation standards.

Queue technology is infrastructure.

Business behavior should remain independent from the selected queue provider.

A queue system is not currently assumed to be implemented merely because standards exist.

---

# Storage

`storage/README.md` defines technical storage standards and future implementation guidance.

Storage is not currently assumed to be an implemented Platform Core capability.

Provider-specific object storage connectivity belongs to infrastructure.

A reusable Core Storage capability may be introduced only when approved requirements justify it.

---

# Webhooks

`webhooks/README.md` defines webhook transport standards.

Webhooks should:

- verify requests;
- validate payloads;
- map provider events;
- delegate processing;
- remain idempotent where required.

Webhook endpoints do not own Product business rules.

---

# SEO

`seo/README.md` defines technical SEO implementation concerns.

SEO requirements may originate from Products or Business Domains.

Generic technical helpers may belong to Shared or application infrastructure.

SEO must not automatically be treated as a Platform Core capability.

---

# Current vs Future Capabilities

The existence of backend documentation does not prove that the corresponding infrastructure is implemented.

Documentation may describe:

- current implementation standards;
- approved implementation direction;
- future technical patterns.

Agents must inspect repository reality before claiming a capability exists.

In particular, do not infer that the platform currently has:

- a queue system;
- distributed background workers;
- object storage;
- generic webhook infrastructure;
- generic SEO infrastructure;
- generic integration orchestration;

unless source and runtime evidence confirm it.

---

# Source Ownership

Backend implementation must respect the current source structure:

    src/
    ├── app/
    ├── config/
    ├── core/
    │   ├── identity/
    │   └── modules/
    ├── domains/
    ├── generated/
    ├── lib/
    └── shared/

High-level ownership:

- `app` → application composition and routing;
- `core` → reusable SaaS capabilities;
- `domains` → business-specific behavior;
- `shared` → generic technical reuse;
- `lib` → infrastructure adapters and provider connectivity;
- `generated` → generated artifacts;
- `config` → configuration.

---

# Dependency Rules

Backend implementation must preserve:

    app
    → core / domains / shared

    domains
    → core / shared / lib

    core
    → shared / lib

    lib
    → generated / external providers

Forbidden:

- Core depending on Domains;
- Shared depending on Core;
- Shared depending on Domains;
- direct Domain-to-Domain dependencies.

---

# Platform Core Boundary

Backend technical reuse does not automatically imply Platform Core ownership.

Do not use:

    Reusable backend code
    → Platform Core

Possible owners include:

- Platform Core;
- Business Domain;
- Shared;
- Infrastructure;
- Application Composition.

Architecture determines ownership.

---

# Provider Boundary

Third-party SDKs should remain isolated where practical.

Examples include:

- authentication providers;
- database providers;
- email providers;
- storage providers;
- AI providers;
- payment providers;
- external APIs.

Provider-specific implementation should not leak unnecessarily into Product or Domain behavior.

---

# Backend Validation

Backend changes should use repository validation appropriate to the task.

Current baseline validation includes:

    npm run typecheck
    npm run lint

These checks do not replace behavioral or integration testing.

---

# AI Agent Rules

AI implementation agents must not:

- treat backend technical concerns as automatic Core modules;
- introduce provider SDKs directly into business behavior without justification;
- create speculative queues, storage systems or integration layers;
- treat future documentation as proof of current implementation;
- move Domain behavior into backend infrastructure;
- introduce forbidden dependencies;
- resolve architectural ownership silently.

If ownership is unclear:

1. stop;
2. report the requirement;
3. request Architecture evaluation;
4. resume after the decision.

---

# Final Principle

Backend Engineering implements approved Architecture.

Business behavior remains with its owner.

Provider connectivity remains isolated where practical.

Technical reuse does not automatically mean Platform Core.

Documentation does not prove implementation.

Build only approved capabilities.

Validate repository reality before declaring completion.
