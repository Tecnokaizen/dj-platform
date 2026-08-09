---
title: Platform Roadmap
version: 2.0.0
status: Living Document
owner: Business Strategy
updated: 2026-08-09
related:
  - README.md
  - VISION.md
  - PLATFORM_STRATEGY.md
  - PRODUCTS.md
  - METHODOLOGY.md
  - DISCOVERY_FRAMEWORK.md
  - ../PLATFORM_MATURITY.md
  - ../architecture/ARCHITECTURE.md
  - ../architecture/CORE.md
  - ../architecture/DOMAINS.md
  - ../architecture/PLATFORM_CORE_SPEC.md
  - ../reviews/README.md

---

# Platform Roadmap

## Purpose

This document defines the strategic evolution of the platform and its Product portfolio.

It describes direction, sequencing and major maturity goals.

It does not define detailed implementation tasks.

Detailed engineering work belongs in:

- Core module TASKS documents;
- Domain implementation plans;
- engineering tasks;
- milestones;
- issues;
- approved implementation sessions.

The Roadmap answers:

```text
Where are we going?
```

Implementation plans answer:

```text
What do we build next?
```

---

# Roadmap Principle

The platform should evolve through a balance of:

```text
Customer Value
+
Product Learning
+
Proven Reuse
+
Engineering Quality
+
Operational Maturity
```

Platform development must not become detached from real Product needs.

Product development must not repeatedly rebuild reusable SaaS foundations.

---

# Strategic Model

The intended progression is:

```text
Architecture and Documentation Baseline
        ↓
Platform Core Foundation
        ↓
DJ Product Validation
        ↓
Platform Maturity
        ↓
Second-Product Validation
        ↓
Portfolio Expansion
        ↓
Continuous Platform Evolution
```

This sequence defines strategic direction.

It is not an immutable delivery schedule.

---

# Roadmap Philosophy

Every major initiative should contribute meaningfully to at least one of these objectives:

- deliver customer or user value;
- reduce architectural uncertainty;
- validate a Product opportunity;
- validate Platform Core reuse;
- improve engineering quality;
- reduce repeated implementation cost;
- improve security;
- improve operational maturity;
- increase maintainability;
- generate reusable business knowledge.

Not every initiative must modify Platform Core.

---

# Product Before Speculative Platform

Platform Core exists to support real Products.

Do not implement hypothetical platform capabilities simply because they may eventually be useful.

Preferred evolution:

```text
Real Requirement
        ↓
Ownership Evaluation
        ↓
Domain Capability
or
Platform Core Capability
or
Shared
or
Infrastructure
```

Future possibilities do not automatically become roadmap commitments.

---

# Product and Domain

The Roadmap must preserve the distinction between Product and Domain.

```text
Product
≠ Domain
```

A Product is a customer-facing software offering.

A Business Domain owns the business-specific behavior required by that Product.

Conceptually:

```text
Product
        =
Application Composition
        +
Platform Core
        +
Business Domain
        +
Shared Technical Resources
        +
Infrastructure
```

Therefore:

```text
DJ Platform
→ Product

DJ Domain
→ Business Domain
```

```text
Copy Platform
→ Product Opportunity

Copy Domain
→ Business Domain if implementation proceeds
```

---

# Current State Snapshot

The platform is currently between architecture consolidation and Core Foundation implementation.

Current state:

```text
Architecture
→ Consolidated

Identity Foundation
→ Implemented

Organizations
→ Specified
→ Implementation Pending

Roles
→ Specified
→ Implementation Pending

Memberships
→ Specified
→ Implementation Pending

Tenancy Integration
→ Pending

Permissions
→ Specified
→ Implementation Pending

DJ Platform
→ In Development

DJ Domain
→ Early Implementation

Business Documentation
→ Consolidated

Formal Architecture Review
→ Pending

AI Agent / Cursor Readiness Review
→ Pending

Automated Test Foundation
→ Pending

Production Readiness
→ Future
```

This Roadmap must not describe planned capabilities as implemented capabilities.

---

# Phase 1 — Architecture and Documentation Baseline

## Objective

Create a sufficiently explicit architecture that humans and AI implementation agents can work without inventing foundational decisions during implementation.

## Major Areas

The baseline includes:

- Platform vision;
- Platform strategy;
- Product model;
- Business methodology;
- Discovery framework;
- architecture boundaries;
- Platform Core definition;
- Domain definition;
- tenancy model;
- identity model;
- authorization model;
- source structure;
- data architecture;
- API conventions;
- security principles;
- deployment principles;
- engineering standards;
- operational documentation;
- Core module specifications.

## Current Status

```text
In Progress
```

Architecture documentation has been substantially consolidated.

Core Foundation module specifications exist.

Additional documentation areas still require consolidation and formal review.

## Exit Criteria

This phase is complete when:

- major architectural documents are internally consistent;
- Product and Domain terminology is consistent;
- Core ownership is explicit;
- source structure matches architecture;
- foundational decisions are represented by ADRs where required;
- formal Architecture Review has been completed;
- unresolved architecture blockers are identified explicitly;
- implementation agents can distinguish decisions from implementation tasks.

---

# Phase 2 — Core Foundation

## Objective

Implement the minimum reusable SaaS foundation required by real Products.

The Foundation should remain focused.

Do not expand this phase automatically into every possible SaaS capability.

# Foundation Sequence

Approved implementation sequence:

```text
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
```

The sequence reflects real dependencies.

# Identity

## Status

```text
Foundation Implemented
```

Identity currently provides the application foundation around authenticated users and Profiles.

Authentication identity remains owned by the authentication provider.

Application Profile represents application identity.

The platform must not introduce a second canonical User model.

# Organizations

## Status

```text
Specified
Implementation Pending
```

Organizations provide the canonical tenant boundary.

An Organization represents the tenant.

Organization creation must eventually integrate with Roles and Memberships so operational Organizations have a valid OWNER Membership.

# Roles

## Status

```text
Specified
Implementation Pending
```

Roles provide canonical reusable role definitions.

Initial canonical roles include:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Roles must exist before Memberships depend on them.

# Memberships

## Status

```text
Specified
Implementation Pending
```

Memberships represent belonging between a Profile and an Organization.

The module also owns Organization invitations.

Memberships must not own the Organization itself.

# Tenancy Integration

## Status

```text
Pending
```

Tenancy Integration connects:

```text
Identity
+
Organization
+
Role
+
Membership
```

into a coherent tenant access model.

Ownership is represented through Membership plus the OWNER Role.

The platform must not introduce a separate Organization owner identifier as an alternative ownership system.

# Permissions

## Status

```text
Specified
Implementation Pending
```

Permissions provide reusable authorization capabilities.

Initial authorization model:

```text
ACTIVE Membership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

Domain-specific permission keys may use the same authorization engine without moving Domain business logic into Core.

# Core Foundation Exit Criteria

Core Foundation is validated when:

- Organizations can be created safely;
- a new Organization receives a valid OWNER Membership;
- Roles are canonical;
- Membership lifecycle rules are enforced;
- tenant access resolves correctly;
- permissions resolve through the approved RBAC model;
- sole OWNER protections are enforced;
- implementation matches documented ownership;
- automated tests cover critical invariants;
- DJ Platform can consume the Foundation without creating alternative identity or tenancy models.

# Capabilities Outside the Current Foundation

Potential future Platform Core capabilities include:

```text
Notifications
Audit
Billing
Settings
Storage
```

These are not part of the current Foundation implementation commitment merely because they are useful SaaS concepts.

They should progress when real Product requirements justify them.

---

# Phase 3 — DJ Product Validation

## Objective

Continue developing DJ Platform as the first active Product using the platform architecture.

DJ Platform validates the architecture against a real content, data, discovery and AI-oriented Product.

# DJ Platform

## Status

```text
In Development
```

DJ Platform is the customer-facing Product.

Its business-specific behavior belongs primarily to:

```text
DJ Domain
```

# DJ Product Direction

The broader documented vision may include:

- artists;
- tracks;
- genres;
- labels;
- festivals;
- playlists;
- sessions;
- rankings;
- editorial content;
- music discovery;
- search;
- SEO-oriented public content;
- AI-assisted workflows;
- music intelligence.

The roadmap does not imply that all documented DJ capabilities are part of the same MVP.

# DJ MVP Principle

The DJ MVP should validate useful Product behavior with the smallest coherent scope that creates real value.

Avoid:

```text
Entire Vision
→ First Release
```

Prefer:

```text
Focused Valuable Scope
        ↓
Real Usage
        ↓
Learning
        ↓
Expansion
```

# DJ Platform as Architecture Validation

DJ Platform should reveal whether:

- Identity works correctly;
- Organization tenancy is appropriate where required;
- authorization boundaries are practical;
- Domain separation is clear;
- public and private application areas coexist cleanly;
- structured content models remain maintainable;
- AI integrations can be isolated correctly;
- SEO-oriented content can coexist with application functionality;
- the source architecture supports growth without Domain leakage.

# DJ Platform Does Not Define the Entire Core

A capability required only by DJ Platform does not automatically belong in Platform Core.

Example:

```text
Playlist Publication
→ DJ Domain
```

A capability should move toward Core only after architectural evaluation demonstrates business-independent reusable semantics.

---

# Phase 4 — Platform Maturity

## Objective

Strengthen the platform based on evidence from actual implementation and Product use.

Platform Maturity is not simply the addition of more modules.

Maturity includes:

```text
Correctness
Security
Testing
Observability
Operations
Documentation
Maintainability
Developer Experience
```

# Potential Maturity Areas

Possible improvements include:

- automated testing;
- integration testing;
- end-to-end testing;
- stronger authorization validation;
- monitoring;
- structured logging;
- backup verification;
- deployment automation;
- migration safety;
- background processing;
- queue infrastructure;
- performance optimization;
- caching where justified;
- object storage;
- notifications;
- audit capabilities;
- administration tooling;
- public APIs;
- search infrastructure;
- AI provider abstraction;
- runtime AI observability.

These are candidates.

They are not automatic commitments.

# Maturity Decision Rule

Do not use:

```text
Useful Platform Feature
→ Implement Now
```

Use:

```text
Real Need
        ↓
Architecture Evaluation
        ↓
Priority Evaluation
        ↓
Approved Implementation
```

# Automated Testing Milestone

Automated testing is a major maturity milestone.

The platform should progressively establish evidence around:

- Core invariants;
- authorization;
- tenancy;
- Domain behavior;
- critical user flows;
- data migrations;
- integration boundaries.

Static validation alone is not sufficient for production maturity.

# Operations Milestone

Production maturity eventually requires validated operational capability.

Examples include:

- deployment procedures;
- rollback strategy;
- backups;
- restore verification;
- monitoring;
- incident response;
- secrets management;
- health checks;
- readiness checks;
- migration procedures;
- operational runbooks.

Production readiness must be demonstrated.

---

# Phase 5 — Second-Product Validation

## Objective

Use a second real Product to test whether Platform Core is genuinely reusable outside DJ Platform.

This is one of the most important strategic milestones.

# Why the Second Product Matters

A single Product can produce architecture that appears reusable while still containing hidden assumptions.

A second Product can reveal:

- DJ-specific assumptions inside Core;
- missing generic SaaS capabilities;
- excessive abstractions;
- missing operational requirements;
- tenancy weaknesses;
- authorization limitations;
- opportunities to simplify;
- genuine reusable capabilities.

# Current Second-Product Opportunity

## Copy Platform

Current portfolio status:

```text
Validated Product Opportunity / Discovery
```

Copy Platform represents a possible operational SaaS Product for copy shops and print businesses.

It is not yet an automatic implementation commitment.

# Copy Discovery Path

A possible progression is:

```text
Real Business
        ↓
Discovery
        ↓
Process Mapping
        ↓
Operational Prototype
        ↓
Real Usage
        ↓
Validation
        ↓
Product Definition
        ↓
Copy Domain
        ↓
Architecture Evaluation
        ↓
Permanent SaaS Decision
```

Low-code tooling may be used during Discovery.

Prototype technology does not determine permanent architecture.

# Copy Platform Strategic Value

If Copy Platform proceeds, it can validate Platform Core against a very different type of Product.

DJ Platform emphasizes areas such as:

```text
Content
Music Data
Discovery
Public Experience
AI
SEO
```

Copy Platform may emphasize:

```text
Organizations
Employees
Operational Workflows
Orders
Status Management
Permissions
Internal Coordination
Business Reporting
```

This contrast provides valuable architecture evidence.

# Second-Product Success Criteria

Second-product validation succeeds when:

- existing Core capabilities are reused without duplication;
- Product-specific behavior remains inside the new Domain;
- Core changes are driven by demonstrated reusable requirements;
- hidden first-Product assumptions are identified;
- the second Product requires less repeated foundation engineering;
- architecture remains understandable;
- Domain-to-Domain dependencies are avoided.

---

# Phase 6 — Product Portfolio Expansion

## Objective

Evaluate additional specialized SaaS opportunities using business evidence.

Potential opportunities currently include:

```text
SEO Platform
CRM Platform
Additional Vertical SaaS
```

These are Product opportunities.

They are not current Business Domains until implementation is justified.

# Portfolio Expansion Rule

Do not use:

```text
Platform Can Support Product
→ Build Product
```

Use:

```text
Market or Customer Problem
        ↓
Discovery
        ↓
Validation
        ↓
Commercial Evaluation
        ↓
Product Decision
```

Technical feasibility alone does not justify a Product.

# Future Domain Creation

Create a new Business Domain only when approved Product requirements require business-specific behavior.

Do not create speculative Domain directories for future portfolio ideas.

Examples:

```text
SEO Platform Opportunity
≠ SEO Domain must exist now
```

```text
CRM Platform Opportunity
≠ CRM Domain must exist now
```

---

# Phase 7 — Advanced Platform Capabilities

## Objective

Introduce advanced platform capabilities only when sufficient Product maturity and reuse justify them.

Potential long-term capabilities may include:

- public API platform;
- SDK;
- event architecture;
- marketplace capabilities;
- white-label capabilities;
- package ecosystem;
- advanced analytics;
- AI orchestration;
- advanced search;
- multi-region infrastructure;
- advanced billing;
- feature management.

These are possibilities.

They are not promised roadmap deliverables.

# Advanced Capability Rule

Before adding an advanced capability ask:

1. Which real Product requires it?
2. Is the requirement validated?
3. Is the capability business-independent?
4. Is the current architecture insufficient?
5. Does the expected value justify its complexity?
6. Does it belong to Core, Shared, Infrastructure or a Domain?
7. What operational burden does it introduce?

Only proceed when the answers justify permanent complexity.

---

# Continuous Architecture Evolution

Architecture is expected to evolve.

However:

```text
Evolution
≠ uncontrolled change
```

Important architectural changes should follow:

```text
Observation
        ↓
Analysis
        ↓
Decision
        ↓
ADR when appropriate
        ↓
Documentation Update
        ↓
Implementation
        ↓
Verification
```

Architecture stability comes from deliberate evolution.

Not from immobility.

---

# ADR Roadmap

Foundational decisions that already exist in architecture documentation should be backfilled into ADRs where appropriate.

Current ADR baseline candidates include:

```text
ADR-001 Platform Core and Domain Boundary
ADR-002 Identity Source of Truth
ADR-003 Internal Identifier Strategy
ADR-004 Tenancy and Organization Model
ADR-005 Roles, Memberships and Ownership Model
ADR-006 Authorization and Permission Model
ADR-007 Prisma and Data Access Conventions
ADR-008 Deployment and Infrastructure Strategy
```

Potential future ADRs should be created when real decisions require them.

---

# Formal Review Roadmap

Formal reviews provide evidence-based snapshots.

Important future reviews include:

```text
Architecture Review
AI Agent / Cursor Readiness Review
Production Readiness Review
```

Reviews should not approve work merely because documentation exists.

They must evaluate actual evidence.

---

# AI Agent Readiness

AI implementation agents should become progressively more useful as architectural ambiguity decreases.

The key readiness question is:

```text
Can the implementation agent execute approved work
without making architectural decisions?
```

If the answer is no, architecture or task definition is incomplete.

---

# Current AI Development Goal

The immediate objective is not maximum autonomous coding.

The objective is:

```text
Reliable AI-Assisted Engineering
```

based on:

- explicit architecture;
- current documentation;
- clear ownership;
- narrow implementation tasks;
- validation commands;
- review gates;
- documented lessons.

---

# Infrastructure Evolution

Infrastructure should evolve with Product and operational requirements.

Potential areas include:

- PostgreSQL;
- authentication infrastructure;
- container deployment;
- self-hosted services;
- object storage;
- queues;
- monitoring;
- backups;
- external providers.

Infrastructure changes should remain isolated from business semantics where practical.

---

# Production Roadmap

Production is not simply the final stage of coding.

A Product should progress toward production through verified maturity.

Conceptually:

```text
Implementation
        ↓
Automated Validation
        ↓
Environment Validation
        ↓
Security Validation
        ↓
Operational Validation
        ↓
Production Readiness Review
        ↓
Production
```

Skipping those steps creates operational risk.

---

# Business Roadmap

The Business Roadmap should continuously evaluate:

- customer demand;
- validated pain;
- willingness to pay;
- implementation economics;
- recurring revenue;
- support cost;
- maintenance cost;
- competitive position;
- reusable engineering leverage.

Platform capability should improve Product economics.

It should not replace market validation.

---

# Engineering Roadmap

Engineering should progressively reduce:

- duplicated foundation code;
- undocumented behavior;
- architectural ambiguity;
- untested invariants;
- manual release risk;
- provider coupling;
- unnecessary complexity;
- AI implementation corrections.

Engineering quality should improve without turning the platform into an over-engineered framework.

---

# Reuse Roadmap

The objective is not maximum code reuse.

The objective is correct reuse.

Prefer:

```text
Semantic Reuse
```

over:

```text
Superficial Code Reuse
```

Two features that look technically similar may belong to different Domains if their business meaning differs.

---

# Core Evolution Rule

Platform Core grows when reuse is demonstrated.

Avoid:

```text
New Product
→ New Core Features
```

Prefer:

```text
New Product
→ New Evidence
        ↓
Architecture Evaluation
        ↓
Core Change only when justified
```

A new Product that requires no Core changes may be evidence that Core boundaries are working well.

---

# Shared Evolution Rule

Generic technical reuse may belong to Shared rather than Platform Core.

Examples include:

```text
UI primitives
Technical utilities
Generic hooks
Technical types
Generic validation helpers
```

Shared must not become a hidden Business Domain.

---

# Infrastructure Evolution Rule

Provider-specific technical integration generally belongs in Infrastructure adapters.

Examples may include:

```text
Database Clients
Authentication Provider Clients
Email Providers
Object Storage Providers
AI Providers
External API Clients
```

Infrastructure integration does not automatically become Platform Core business capability.

---

# Continuous Platform Goals

The platform should continuously improve where evidence justifies investment.

Areas include:

- documentation;
- architecture clarity;
- security;
- testing;
- performance;
- automation;
- developer experience;
- AI-assisted development;
- observability;
- deployment safety;
- maintainability.

Improvement should reduce risk or increase useful leverage.

---

# Continuous Business Goals

Long-term business objectives include:

- deliver products that solve validated problems;
- reduce repeated development cost;
- reduce time-to-market;
- improve Product quality;
- create predictable recurring revenue where appropriate;
- create implementation and maintenance revenue where appropriate;
- reduce customer operational cost;
- build reusable expertise;
- increase portfolio optionality.

Different Products may use different commercial models.

---

# Success Indicators

The Roadmap is succeeding when:

- Products deliver measurable value;
- architecture remains coherent;
- Core capabilities are actually reused;
- new Products require less repeated foundation engineering;
- Product-specific behavior remains in Domains;
- Platform Core does not accumulate speculative features;
- engineering becomes more predictable;
- automated validation increases;
- operational maturity increases;
- AI-generated implementation requires less architectural correction;
- maintenance effort grows slower than the Product portfolio;
- new opportunities can be evaluated without forcing implementation.

---

# Failure Indicators

The Roadmap is failing when:

- roadmap ideas automatically become engineering tasks;
- future Product names automatically create Domains;
- every new requirement expands Platform Core;
- Product and Domain are treated as synonyms;
- planned capabilities are described as implemented;
- Product validation is delayed indefinitely by platform engineering;
- Core contains business-specific behavior;
- Domains depend directly on other Domains;
- production status is declared without evidence;
- technical ambition replaces customer value;
- roadmap sequencing becomes more important than validated opportunity.

---

# Priority Model

When priorities conflict, evaluate:

```text
1. Customer or User Value
2. Architectural Correctness
3. Product Validation
4. Security and Data Integrity
5. Core Foundation Dependencies
6. Engineering Quality
7. Demonstrated Reuse
8. Operational Maturity
9. Developer Experience
10. Future Optionality
```

This is a decision framework.

It is not an automatic numerical scoring system.

---

# Current Strategic Focus

Current focus is approximately:

```text
Documentation Consolidation
        ↓
Architecture Baseline
        ↓
Formal Architecture Review
        ↓
Core Foundation Implementation
        ↓
Core Foundation Validation
        ↓
DJ Product Development
        ↓
Second-Product Validation
```

Some activities may overlap.

The sequence does not prohibit useful DJ Product work while Foundation work progresses.

---

# Near-Term Objectives

Near-term strategic objectives include:

- complete documentation consolidation;
- backfill foundational ADRs;
- perform formal Architecture Review;
- establish AI Agent / Cursor Readiness;
- implement Organizations;
- implement Roles;
- implement Memberships;
- integrate tenancy;
- implement Permissions;
- establish automated testing foundations;
- continue focused DJ Product development.

Detailed task sequencing belongs outside this strategic Roadmap.

---

# Medium-Term Objectives

Medium-term objectives may include:

- validate the complete Core Foundation against DJ Platform;
- improve automated test coverage;
- mature deployment practices;
- improve observability;
- validate storage requirements;
- validate notification requirements;
- validate background job requirements;
- continue Copy Platform Discovery;
- determine whether Copy Platform merits permanent SaaS implementation;
- use second-product evidence to review Platform Core boundaries.

---

# Long-Term Objectives

Long-term objectives may include:

- operate multiple specialized SaaS Products;
- reuse a stable Core Foundation;
- create additional Core capabilities only when justified;
- improve Product delivery economics;
- build repeatable Discovery-to-SaaS methodology;
- strengthen operational maturity;
- increase business portfolio optionality;
- maintain clear architectural boundaries as the platform grows.

---

# Roadmap Does Not Equal Backlog

This document must not be interpreted as an implementation queue.

For example:

```text
Notifications appears in future platform planning
```

does not mean:

```text
Create Notifications module now
```

Likewise:

```text
SEO Platform appears as a Product opportunity
```

does not mean:

```text
Create SEO Domain now
```

Implementation requires approved scope.

---

# Change Management

The Roadmap should be updated when meaningful evidence changes strategic direction.

Examples include:

- Product validation succeeds or fails;
- a Product opportunity is abandoned;
- Core reuse assumptions prove incorrect;
- a second Product reveals missing architecture;
- production requirements change;
- business priorities change;
- operational risks appear;
- new commercial evidence changes portfolio priorities.

Roadmap change is expected.

Uncontrolled architectural drift is not.

---

# Final Goal

Create a reusable software foundation capable of supporting a portfolio of specialized SaaS Products with progressively lower repeated engineering cost and increasing architectural maturity.

The desired long-term relationship is:

```text
Real Business Problems
        ↓
Validated Products
        ↓
Independent Business Domains
        ↓
Proven Reusable Capabilities
        ↓
Stronger Platform Core
        ↓
Faster Future Products
```

Every Product should create customer or market value.

Every Product should generate learning.

Some Products will reveal opportunities to improve Platform Core.

Core should evolve only when that reuse is justified.

The platform becomes more valuable through validated Products, proven reuse and deliberate architecture.