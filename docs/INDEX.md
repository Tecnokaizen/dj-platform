---
title: Documentation Index
version: 2.0.0
status: Living Document
updated: 2026-08-09
---

# Documentation Index

This document is the navigation entry point for the documentation contained in the `dj-platform` repository.

The repository documents:

- DJ Platform as the current Product;
- Platform Core as the reusable SaaS foundation;
- Business Domains;
- Architecture;
- Engineering;
- Backend and Frontend standards;
- Operations;
- architectural decisions;
- formal reviews.

Documentation is organized primarily by responsibility and ownership rather than by technology.

---

# Repository Context

Before significant work, start with:

    PROJECT_CONTEXT.md
    AGENTS.md

Then use this index to locate the documentation relevant to the task.

Do not load every document for every change.

Context depth should be proportional to task risk.

---

# Business

Location:

    docs/business/

Purpose:

Defines why Products exist, which problems they solve and how the broader platform strategy evolves.

Includes:

- `README.md`
- `VISION.md`
- `PLATFORM_STRATEGY.md`
- `PRODUCTS.md`
- `METHODOLOGY.md`
- `DISCOVERY_FRAMEWORK.md`
- `ROADMAP.md`
- `MONETIZATION.md`
- `GO_TO_MARKET.md`

Business documentation defines value and strategy.

It does not define source-code ownership.

---

# Architecture

Location:

    docs/architecture/

Purpose:

Defines system boundaries, ownership, dependency direction, identity, tenancy, persistence conventions, infrastructure direction and major architectural constraints.

Includes:

- `README.md`
- `ARCHITECTURE.md`
- `CORE.md`
- `PLATFORM_CORE_SPEC.md`
- `DOMAINS.md`
- `IDENTITY.md`
- `TENANCY.md`
- `DATA.md`
- `API.md`
- `CACHE.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `TECH_STACK.md`
- `PRISMA_IMPLEMENTATION.md`
- `PROJECT_STRUCTURE.md`
- `SOURCE_STRUCTURE.md`
- `CONVENTIONS.md`
- `DECISIONS.md`

Architecture defines boundaries.

Engineering implements those boundaries.

---

# Platform Core

Location:

    docs/core/

Purpose:

Defines reusable SaaS capabilities whose semantics are independent from a specific business vertical.

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

Each specified module may contain:

- `SPEC.md`
- `DATA_MODEL.md`
- `FLOWS.md`
- `API.md`
- `PRISMA.md`
- `TASKS.md`

Core specifications do not prove implementation.

Future capabilities must not be promoted into Platform Core merely because they could theoretically be reused.

---

# Business Domains

Location:

    docs/domains/

Purpose:

Defines business-specific semantics.

Current Domain:

- DJ

The DJ Domain may describe concepts such as:

- artists and DJs;
- genres;
- festivals;
- tracks;
- labels;
- sessions;
- playlists;
- rankings;
- editorial content;
- domain relationships;
- AI-assisted domain workflows.

Strategic Domain scope may be broader than current implementation.

Product and Domain are not synonyms.

Do not classify future Products automatically as Domains.

---

# Product Composition

DJ Platform is the current Product.

Conceptually:

    DJ Platform
        ↓
    App Composition
        +
    Platform Core
        +
    DJ Domain
        +
    Shared Technical Capabilities
        +
    Infrastructure

A Product may compose one or more Domains plus Core capabilities.

Product composition does not transfer ownership of Core or Domain semantics into `src/app`.

---

# Engineering

Location:

    docs/engineering/

Purpose:

Defines implementation standards for human developers and AI agents.

Includes:

- `README.md`
- `AI_DEVELOPMENT_GUIDE.md`

Engineering documentation governs how approved Architecture is implemented.

It does not silently redefine Architecture.

---

# Backend

Location:

    docs/backend/

Purpose:

Defines backend engineering standards and implementation guidance.

Areas include:

- API
- Database
- Integrations
- Jobs
- Queue
- SEO
- Storage
- Webhooks

Backend standards may document patterns for capabilities that are not yet implemented.

Documentation presence does not imply runtime infrastructure exists.

---

# Frontend

Location:

    docs/frontend/

Purpose:

Defines frontend engineering and Product presentation standards.

Includes:

- `README.md`
- `ACCESSIBILITY.md`
- `COMPONENTS.md`
- `DESIGN_SYSTEM.md`
- `FORMS.md`
- `NAVIGATION.md`
- `ROUTING.md`
- `THEMES.md`

Frontend technical reuse does not automatically belong to Platform Core.

Typical ownership remains:

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

Purpose:

Defines operational standards for deployed Products and infrastructure.

Includes:

- `README.md`
- `DEPLOYMENT.md`
- `MONITORING.md`
- `BACKUPS.md`
- `RUNBOOKS.md`
- `MAINTENANCE.md`
- `INCIDENT_RESPONSE.md`

Operations documentation does not prove that Production, monitoring, backups or other operational capabilities are currently verified.

Runtime status requires evidence.

---

# Architecture Decision Records

Location:

    docs/adr/

Purpose:

Records significant architectural decisions and their rationale.

ADR lifecycle:

    Proposed
    → Accepted
    → Superseded

Not every implementation detail requires an ADR.

Foundational architectural decisions already established may be backfilled where useful.

Current backfill candidates include:

- Platform Core and Domain Boundary
- Identity Source of Truth
- Internal Identifier Strategy
- Tenancy and Organization Model
- Roles, Memberships and Ownership Model
- Authorization and Permission Model
- Prisma and Data Access Conventions
- Deployment and Infrastructure Strategy

---

# Reviews

Location:

    docs/reviews/

Purpose:

Provides formal evidence-based assessments of architecture and implementation readiness.

Review lifecycle:

    Observation
    → Analysis
    → Findings
    → Recommendations
    → Approved Actions
    → Verification

Current review framework exists.

Formal versioned reviews remain pending.

Planned initial reviews include:

- Architecture Review
- Cursor / AI Agent Readiness Review

---

# Platform Maturity

Document:

    docs/PLATFORM_MATURITY.md

Purpose:

Describes current platform maturity using evidence rather than arbitrary completion percentages.

Documentation completion must not be confused with:

- implementation completion;
- runtime validation;
- operational readiness;
- Production readiness.

---

# Documentation Ownership Model

Use the following mental model:

    Business
    → Why

    Architecture
    → Ownership and boundaries

    Core
    → Reusable SaaS capability semantics

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

# Product vs Domain Rule

Never use:

    Product
    = Domain

DJ Platform is a Product.

DJ is the current Business Domain.

Future Products may reuse Platform Core and introduce their own Domain semantics where justified.

---

# Core Promotion Rule

Never use:

    Could another Product use this?
    → Platform Core

Potential reuse is insufficient.

Core promotion requires demonstrated architectural justification and business-agnostic semantics.

---

# Current Documentation State

Consolidated:

- Architecture
- Business
- Engineering
- Backend
- Frontend
- Operations

Core Foundation specifications complete:

- Organizations
- Roles
- Memberships
- Permissions

Repository-level context consolidation:

In progress.

ADR foundational backfill:

Pending.

Formal reviews:

Pending.

Production readiness:

Not established.

---

# Reading Strategy

For significant implementation work:

1. `PROJECT_CONTEXT.md`
2. `AGENTS.md`
3. relevant Architecture documentation
4. relevant Core or Domain specification
5. relevant Engineering documentation
6. relevant Backend or Frontend guidance
7. current source affected by the task

For operational work also read:

8. relevant Operations documentation

For architectural decisions also inspect:

9. relevant ADRs and decision registry

Do not read documentation mechanically.

Read what is necessary to make the task safe and unambiguous.

---

# Implementation Readiness

Before implementation ask:

    Can the implementation agent execute the approved work
    without making architectural decisions?

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

# Final Principle

This repository contains a Product, reusable platform capabilities and business-specific Domain semantics.

DJ Platform is the current Product.

Platform Core is the reusable SaaS foundation.

Domains own business semantics.

Architecture defines ownership and boundaries.

Engineering defines implementation standards.

Operations manages deployed systems.

ADRs preserve architectural decisions.

Reviews establish readiness through evidence.

Documentation describes intent and current understanding.

Repository and runtime evidence determine actual implementation state.
