---
title: Platform Documentation
version: 2.0.0
status: Living Document
updated: 2026-08-09
---

# Platform Documentation

## Purpose

This directory contains the main documentation for the `dj-platform` repository.

The repository currently contains and documents:

- DJ Platform as the current Product;
- Platform Core as the reusable SaaS foundation;
- the DJ Business Domain;
- system Architecture;
- Engineering standards;
- Backend and Frontend implementation guidance;
- Operations standards;
- Architecture Decision Records;
- formal Reviews.

Documentation is organized primarily by responsibility and ownership rather than by technology.

For detailed navigation use:

    docs/INDEX.md

For current repository state use:

    PROJECT_CONTEXT.md

---

# Conceptual Model

The repository follows this conceptual model:

    Product
        ↓
    App Composition
        +
    Platform Core
        +
    Business Domain
        +
    Shared Technical Capabilities
        +
    Infrastructure

For the current Product:

    DJ Platform
        ↓
    Platform Core
        +
    DJ Domain

Product and Domain are not synonyms.

---

# Documentation Structure

    docs/
    ├── README.md
    ├── INDEX.md
    ├── PLATFORM_MATURITY.md
    ├── architecture/
    ├── backend/
    ├── business/
    ├── core/
    ├── domains/
    ├── engineering/
    ├── frontend/
    ├── operations/
    ├── adr/
    └── reviews/

Each area has a distinct responsibility.

---

# Business

Location:

    docs/business/

Business documentation defines:

- Product value;
- customer problems;
- Product strategy;
- monetization;
- go-to-market;
- discovery methodology;
- roadmap direction.

Business answers primarily:

    Why are we building this?

Business documentation does not define source-code ownership.

---

# Architecture

Location:

    docs/architecture/

Architecture documentation defines:

- system boundaries;
- ownership;
- dependency direction;
- Platform Core boundaries;
- Domain boundaries;
- identity;
- tenancy;
- authorization;
- persistence conventions;
- API conventions;
- security;
- infrastructure direction;
- source structure;
- technology decisions.

Architecture answers primarily:

    Where does this belong?

    What may depend on what?

    Which constraints must implementation preserve?

Architecture is not limited to Platform Core.

It describes the architecture of the system built within this repository.

---

# Platform Core

Location:

    docs/core/

Platform Core contains reusable SaaS capabilities whose semantics are independent from a specific business vertical.

Current Foundation sequence:

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

Current specified Core modules:

- Organizations
- Roles
- Memberships
- Permissions

Core specifications do not prove implementation.

Potential reuse alone is not sufficient to promote a capability into Platform Core.

Future capabilities must be evaluated when demonstrated requirements justify them.

---

# Business Domains

Location:

    docs/domains/

Business Domains own business-specific semantics.

Current Domain:

    DJ

The DJ Domain may define concepts such as:

- DJs and artists;
- genres;
- festivals;
- tracks;
- labels;
- sessions;
- playlists;
- rankings;
- editorial content;
- relationships between music entities;
- AI-assisted domain workflows.

Domains remain independent from one another.

A future Product may introduce a new Domain when its business semantics require one.

Do not classify a Product itself as a Domain.

---

# Products

DJ Platform is the current Product.

Products compose:

- Platform Core capabilities;
- one or more Business Domains;
- Product-specific application composition;
- Shared technical capabilities;
- infrastructure.

Future Products may reuse Platform Core.

Their exact repository and Domain organization should be decided when demonstrated requirements exist.

---

# Engineering

Location:

    docs/engineering/

Engineering documentation defines how approved Architecture is implemented by:

- human developers;
- AI architecture agents when explicitly operating in that role;
- AI implementation agents;
- coding tools such as Cursor.

Engineering covers:

- implementation discipline;
- AI development rules;
- validation;
- code quality;
- architecture protection;
- implementation readiness.

Engineering does not silently redefine Architecture.

---

# Backend

Location:

    docs/backend/

Backend documentation defines technical implementation standards for areas such as:

- API;
- database access;
- integrations;
- jobs;
- queues;
- SEO;
- storage;
- webhooks.

A documented technical area does not necessarily mean its infrastructure is already implemented.

For example:

- queue documentation does not prove queue infrastructure exists;
- storage documentation does not prove generic storage exists.

---

# Frontend

Location:

    docs/frontend/

Frontend documentation defines standards for:

- accessibility;
- components;
- design system;
- forms;
- navigation;
- routing;
- themes.

Frontend technical reuse does not automatically belong to Platform Core.

Typical ownership:

    App
    → Product composition

    Core
    → UI for Core capabilities

    Domain
    → business-specific UI

    Shared
    → business-agnostic UI primitives

---

# Operations

Location:

    docs/operations/

Operations documentation defines standards for deployed Products, services and infrastructure.

Areas include:

- deployment;
- monitoring;
- backups;
- maintenance;
- runbooks;
- incident response.

Platform Core is not assumed to be an independently deployed Product.

Core capabilities are operated as part of Product runtime when deployed.

Operations documentation does not prove that:

- Production exists;
- Staging exists;
- monitoring exists;
- backups are verified;
- restore procedures are tested.

Runtime status requires evidence.

---

# Architecture Decision Records

Location:

    docs/adr/

ADRs record significant architectural decisions and their rationale.

Typical lifecycle:

    Proposed
    → Accepted
    → Superseded

Not every implementation detail requires an ADR.

An implementation agent must not make a foundational architectural decision and then create an ADR afterward merely to justify it.

Foundational decisions already established may be backfilled into ADRs where useful.

---

# Reviews

Location:

    docs/reviews/

Reviews provide evidence-based assessments of:

- architecture consistency;
- implementation readiness;
- AI-agent readiness;
- repository maturity;
- operational readiness where applicable.

Review lifecycle:

    Observation
    → Analysis
    → Findings
    → Recommendations
    → Approved Actions
    → Verification

Formal versioned reviews must distinguish documented intent from verified repository or runtime evidence.

---

# Platform Maturity

Document:

    docs/PLATFORM_MATURITY.md

Platform maturity is evaluated using evidence.

Avoid arbitrary completion percentages.

Documentation completion is not equivalent to:

- implementation completion;
- automated test coverage;
- deployment validation;
- operational readiness;
- Production readiness.

---

# Documentation Responsibilities

Use this mental model:

    Business
    → Why

    Architecture
    → Ownership and boundaries

    Platform Core
    → Reusable SaaS semantics

    Domains
    → Business-specific semantics

    Engineering
    → Implementation standards

    Backend / Frontend
    → Technical implementation guidance

    Operations
    → Runtime operations

    ADRs
    → Architectural decision history

    Reviews
    → Evidence-based readiness

---

# Documentation and Repository Reality

Documentation should remain aligned with the repository.

Do not use either extreme:

    Documentation always wins

or:

    Source code always wins

When documentation and implementation conflict materially:

1. identify the conflict;
2. inspect the relevant evidence;
3. determine which decision is authoritative;
4. resolve the inconsistency;
5. update stale documentation or implementation.

Source code must not silently redefine Architecture.

Stale documentation must not be followed blindly.

---

# Documentation Lifecycle

Different document types have different maturity models.

Architecture:

    Audited / Current
    → Living Document

Core specifications:

    Draft
    → Review
    → Approved
    → Living after implementation and adoption

Domain documentation:

    Draft
    → Living

ADRs:

    Proposed
    → Accepted
    → Superseded

Reviews:

    Observation
    → Analysis
    → Findings
    → Recommendations
    → Approved Actions
    → Verification

Document status should reflect actual maturity.

---

# Implementation Readiness

Before implementation ask:

    Can the implementation agent execute the approved work
    without making an architectural decision?

If yes:

    Implement
    → Validate
    → Review

If no:

    STOP
    → Resolve the architectural or business decision
    → Update documentation where required
    → Resume

---

# Reading Strategy

For significant implementation work:

1. `PROJECT_CONTEXT.md`
2. `AGENTS.md`
3. `docs/INDEX.md`
4. relevant Architecture documentation
5. relevant Core or Domain specification
6. relevant Engineering documentation
7. relevant Backend or Frontend guidance
8. current source affected by the task

For operational work also read the relevant Operations documentation.

For architectural decisions inspect relevant ADRs and the Architecture decision registry.

Do not load the entire documentation tree for every trivial change.

---

# Current Documentation State

Consolidated:

- Architecture
- Business
- Engineering
- Backend
- Frontend
- Operations

Core Foundation specifications completed:

- Organizations
- Roles
- Memberships
- Permissions

Repository context consolidation:

In progress.

Foundational ADR backfill:

Pending.

Formal versioned reviews:

Pending.

Production readiness:

Not established.

---

# Final Principle

Documentation exists to make ownership, decisions, behavior and maturity understandable.

DJ Platform is the current Product.

Platform Core is the reusable SaaS foundation.

Business Domains own business-specific semantics.

Architecture defines boundaries.

Engineering defines implementation standards.

Operations manages deployed systems.

ADRs preserve architectural decisions.

Reviews establish readiness through evidence.

Documentation must remain aligned with repository reality.
