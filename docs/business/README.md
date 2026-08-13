---
title: Business Documentation
version: 2.0.0
status: Living Document
owner: Business Strategy
updated: 2026-08-09
related:
  - ../architecture/README.md
  - ../architecture/DOMAINS.md
  - ../architecture/PLATFORM_CORE_SPEC.md
  - ../PLATFORM_MATURITY.md
---

# Business Documentation

## Purpose

This directory contains the business and product strategy documentation that guides the evolution of Platform Core and the SaaS products built with it.

Business documentation defines:

- why the platform exists
- which business problems are worth solving
- how product opportunities are discovered
- how products are validated
- how products may generate revenue
- how the product portfolio should evolve

Business documentation does not define technical implementation.

Architecture and engineering determine how approved business requirements are implemented safely.

---

# Business and Architecture

Business requirements influence architecture.

They do not bypass architecture.

The relationship is:

```text
Business Need
        ↓
Discovery
        ↓
Product / Domain Requirement
        ↓
Architecture Evaluation
        ↓
Platform Core or Domain Ownership
        ↓
Engineering
        ↓
Implementation
```

A business requirement may reveal a reusable Platform Core need.

It does not automatically become a Core capability.

Architectural ownership must be evaluated explicitly.

---

# Documentation Scope

The current Business documentation includes:

```text
VISION.md

PLATFORM_STRATEGY.md

PRODUCTS.md

METHODOLOGY.md

DISCOVERY_FRAMEWORK.md

ROADMAP.md

MONETIZATION.md

GO_TO_MARKET.md
```

Each document owns a different part of the business model.

---

# Recommended Reading Order

## 1. Vision

`VISION.md`

Defines the long-term direction of the platform and product portfolio.

Read this first to understand why Platform Core exists and what the platform is intended to become.

---

## 2. Platform Strategy

`PLATFORM_STRATEGY.md`

Defines the strategic logic behind reusable SaaS capabilities, product specialization and platform reuse.

It explains how Platform Core should create leverage across multiple products.

---

## 3. Business Methodology

`METHODOLOGY.md`

Defines the general method used to turn real business problems into validated software products.

The methodology prioritizes understanding and validation before implementation.

---

## 4. Discovery Framework

`DISCOVERY_FRAMEWORK.md`

Defines the practical workflow from client discovery to validated SaaS product.

The framework covers:

- discovery
- business analysis
- process mapping
- prototyping
- validation
- reusable capability extraction
- Domain definition
- production SaaS
- continuous improvement

---

## 5. Product Portfolio

`PRODUCTS.md`

Defines current and potential SaaS products built using the platform.

Products and Business Domains are related concepts but must remain architecturally distinguishable.

Product strategy defines what is offered to a market.

Domain architecture defines where business-specific software behavior belongs.

---

## 6. Roadmap

`ROADMAP.md`

Defines the strategic sequence in which the platform and product portfolio may evolve.

The Business Roadmap is not an engineering backlog.

Technical implementation tasks belong to the appropriate Core module, Domain or engineering workflow.

---

## 7. Monetization

`MONETIZATION.md`

Defines how products may generate revenue and how Platform Core creates economic leverage through reuse.

Monetization decisions may differ by product.

Platform Core itself does not need to share the same commercial model as every product built with it.

---

## 8. Go-To-Market

`GO_TO_MARKET.md`

Defines how products reach customers, how demand may be generated and how product-market validation can guide future platform evolution.

Go-To-Market strategy belongs to products and markets rather than to technical architecture.

---

# Platform Core Relationship

Platform Core provides reusable SaaS capabilities.

Business documentation may identify potential reusable needs such as:

- Organizations
- Memberships
- Roles
- Permissions
- Notifications
- Audit
- Billing
- Settings
- Storage

Whether a capability belongs to Platform Core is an architectural decision.

Business documentation must not silently redefine Core ownership.

---

# Domain Relationship

Business Domains own business-specific meaning.

Examples:

```text
DJ Domain
→ Artists
→ Tracks
→ Playlists
→ Festivals
```

```text
Copy Domain
→ Orders
→ Production Jobs
→ Deliveries
```

```text
SEO Domain
→ SEO Projects
→ Keywords
→ Rankings
```

Business discovery determines what problems need to be solved.

Domain architecture determines where the resulting business behavior belongs.

---

# Current Product Context

The first active business Domain in this repository is DJ.

DJ Platform is being used to validate the platform against a real product with content, data, search, editorial and AI-oriented requirements.

Its documented product vision is broader than its current source implementation.

Future product opportunities may include:

- Copy
- SEO
- CRM

These opportunities do not constitute implementation commitments.

---

# Discovery-Driven Platform Evolution

Platform Core should evolve from demonstrated reuse.

Preferred process:

```text
Real Business
        ↓
Discovery
        ↓
Validated Workflow
        ↓
Product Requirement
        ↓
Domain Implementation
        ↓
Reusable Need Identified
        ↓
Architecture Review
        ↓
Platform Core Capability when justified
```

This prevents Platform Core from becoming a speculative framework.

---

# Customer Discovery

Business discovery may begin with manual tools or low-code prototypes when they are the fastest way to validate real workflows.

A prototype is a discovery instrument.

It is not automatically the final product architecture.

Validated workflows may later be implemented as professional software using Platform Core and the appropriate Business Domain.

---

# Business Roadmap Versus Implementation Plan

The Business Roadmap describes strategic product evolution.

It may include phases such as:

- Platform Foundation
- Platform Core
- DJ Platform
- Platform Maturity
- additional products

These phases must not be interpreted as exact implementation milestones.

Engineering execution is controlled through:

- Core module specifications
- Domain specifications
- implementation tasks
- architecture decisions
- repository workflows

---

# Monetization Boundary

Platform Core creates economic value primarily through reuse.

Products generate commercial value through customer-facing offerings.

Potential commercial models may include:

- subscriptions
- implementation fees
- maintenance
- support
- freemium
- advertising
- usage-based pricing
- affiliate revenue
- enterprise services

The appropriate model depends on the product and market.

---

# Documentation Ownership

Business-wide strategy belongs under:

```text
docs/business/
```

Platform architecture belongs under:

```text
docs/architecture/
```

Business-specific product and Domain documentation belongs under:

```text
docs/domains/<domain>/
```

Detailed Core capability specifications belong under:

```text
docs/core/modules/<module>/
```

---

# Decision Boundary

Business documentation may decide:

- target market
- customer problem
- value proposition
- product opportunity
- pricing hypothesis
- monetization strategy
- Go-To-Market strategy
- discovery methodology
- portfolio priorities

Business documentation does not independently decide:

- source structure
- database architecture
- tenant architecture
- Identity architecture
- authorization architecture
- Core ownership
- Domain dependency direction
- infrastructure topology
- security architecture

Those decisions belong to Platform Architecture.

---

# AI Agent Rules

AI agents working from Business documentation must not:

- interpret product ideas as approved implementation scope
- convert every business concept into Platform Core
- create speculative Domains
- treat roadmap phases as engineering tasks automatically
- change architectural ownership from business wording alone
- infer production readiness from business strategy
- invent technical architecture to satisfy a business document

When business requirements require an architectural decision:

```text
STOP
        ↓
Report Requirement
        ↓
Architecture Evaluation
        ↓
Ownership Decision
        ↓
Implementation
```

---

# Current Consolidation State

The Business documentation set exists and covers the major strategic areas required by the platform.

The Business documentation set has been reviewed for consistency against the consolidated Architecture v2 baseline.

Current status:

**Consolidated**

---

# Final Principle

Business defines why and what should create value.

Architecture defines where responsibilities belong.

Engineering defines how approved capabilities are implemented.

Domains preserve business-specific meaning.

Platform Core accumulates proven reusable SaaS capabilities.

Product opportunities drive discovery.

Demonstrated reuse drives platform evolution.
