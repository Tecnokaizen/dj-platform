---
title: Product Portfolio
version: 2.0.0
status: Living Document
owner: Business Strategy
updated: 2026-08-09
related:
  - README.md
  - VISION.md
  - PLATFORM_STRATEGY.md
  - METHODOLOGY.md
  - DISCOVERY_FRAMEWORK.md
  - ROADMAP.md
  - ../architecture/DOMAINS.md
  - ../architecture/PLATFORM_CORE_SPEC.md
  - ../PLATFORM_MATURITY.md
---

# Product Portfolio

## Purpose

This document defines the portfolio of SaaS products that may be created using the platform.

It distinguishes:

- customer-facing Products;
- business-specific Domains;
- reusable Platform Core capabilities;
- Shared technical resources;
- Infrastructure.

Product ideas do not automatically become implementation commitments.

The portfolio should evolve from validated market and customer needs.

---

# Product and Domain Are Different Concepts

A Product and a Business Domain are related but are not the same architectural concept.

A Product is a customer-facing software offering.

A Domain owns the business-specific behavior required by that product.

Conceptually:

```text
Specialized SaaS Product
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
Product
≠ Domain
```

A product may currently rely primarily on one Domain.

Future products may compose several approved capabilities, but this does not permit direct Domain-to-Domain dependencies.

---

# Portfolio Strategy

The portfolio strategy is to create focused SaaS products that:

- solve validated business problems;
- target identifiable customer groups;
- reuse proven Platform Core capabilities;
- preserve business-specific behavior inside Domains;
- avoid duplicating reusable foundations;
- provide evidence for future Platform Core evolution.

Products should not be added merely because Platform Core could technically support them.

Market need and validated customer value come first.

---

# Platform Composition

The platform provides several distinct architectural areas.

```text
Product
  │
  ├── Application Composition
  │
  ├── Platform Core
  │
  ├── Business Domain
  │
  ├── Shared
  │
  └── Infrastructure
```

Each has a different responsibility.

---

# Platform Core

Platform Core owns reusable SaaS capabilities.

Current Foundation capabilities are:

```text
Identity
Organizations
Roles
Memberships
Permissions
```

Current maturity differs by capability.

Identity has an implemented foundation.

Organizations, Roles, Memberships and Permissions are specified but are not yet complete in source.

Planned reusable capabilities may later include:

```text
Notifications
Audit
Billing
Settings
Storage
```

Planned capabilities must not be described as currently available.

---

# Shared

Shared owns business-agnostic technical reuse.

Examples may include:

```text
generic UI primitives
technical utilities
generic hooks
generic validators
technical types
```

Shared is not Platform Core.

Shared must not contain Domain business logic.

---

# Infrastructure

Infrastructure provides technical connectivity.

Examples may include:

```text
database connectivity
authentication provider clients
email providers
object storage
AI providers
external APIs
```

Infrastructure does not own Product or Domain business policy.

---

# Product Lifecycle

A product should normally progress through evidence-driven stages.

```text
Opportunity
        ↓
Discovery
        ↓
Business Validation
        ↓
Product Definition
        ↓
Domain Boundary
        ↓
Architecture Evaluation
        ↓
Implementation
        ↓
Validation
        ↓
Launch
        ↓
Continuous Improvement
```

Not every opportunity must reach implementation.

Discovery may invalidate a product idea before software development begins.

That is a successful outcome when it prevents unnecessary engineering.

---

# Product Status Vocabulary

Portfolio status should describe reality rather than intention.

Recommended statuses include:

```text
Opportunity
Discovery
Validated Opportunity
Planned
In Development
Beta
Production
Paused
Archived
```

A Product must not be described as Production until the actual application and operational environment have been verified as production-ready.

---

# Current Active Product

## DJ Platform

Status:

**In Development**

DJ Platform is the first active product being built with the platform architecture.

Its corresponding business Domain is:

```text
DJ Domain
```

Source ownership exists under:

```text
src/domains/dj/
```

DJ Platform serves two strategic purposes:

1. create value for DJs, electronic music users and music-discovery audiences;
2. validate Platform Core through real product requirements.

---

# DJ Platform Scope

The documented DJ product vision includes areas such as:

- Artists
- Tracks
- Genres
- Labels
- Playlists
- Sessions
- Festivals
- Rankings
- Editorial content
- Search
- music intelligence
- AI-assisted workflows

The documented vision is broader than the current source implementation.

Documentation must not be interpreted as completed functionality.

---

# DJ Platform and Platform Core

DJ Platform can reuse Platform Core capabilities as they become available.

Current implemented Foundation capability:

```text
Identity
```

Specified Foundation capabilities that DJ Platform is expected to consume when implemented include:

```text
Organizations
Roles
Memberships
Permissions
```

Future product requirements may reveal reusable needs such as:

```text
Storage
Notifications
Audit
```

Those needs require architecture evaluation before becoming Platform Core capabilities.

---

# Product Opportunities

Potential products are portfolio opportunities rather than automatic engineering commitments.

Their status must remain distinguishable from the active DJ product.

---

# Copy Platform

Status:

**Validated Product Opportunity / Discovery**

Copy Platform represents a potential SaaS product for copy shops, print shops and closely related operational businesses.

Potential business capabilities may include:

- customer management;
- order intake;
- production workflow;
- job status;
- delivery management;
- files associated with jobs;
- internal coordination;
- operational dashboards;
- business reporting.

The product should emerge from real workflow discovery and validation.

Low-code or operational prototypes may be used to understand the business before committing to permanent software architecture.

---

# Copy Domain

If Copy Platform proceeds to implementation, its business-specific behavior should belong to:

```text
Copy Domain
```

Potential Domain concepts may include:

```text
Order
Production Job
Delivery
Customer Job
Production State
```

The Domain must reuse Platform Core tenant and authorization capabilities rather than creating its own generic identity, Organization, Membership, Role or Permission system.

---

# SEO Platform

Status:

**Product Opportunity**

SEO Platform represents a potential specialized SaaS product for SEO professionals, agencies and businesses.

Potential capabilities may include:

- SEO Projects;
- Keywords;
- SERP analysis;
- ranking tracking;
- technical audits;
- reporting;
- AI-assisted analysis.

Its corresponding SEO Domain should only be created when product requirements justify implementation.

---

# CRM Platform

Status:

**Product Opportunity**

CRM Platform represents a possible future customer relationship management product.

Potential capabilities may include:

- Companies;
- Contacts;
- Deals;
- Activities;
- Tasks;
- pipelines;
- reporting.

CRM is not current implementation scope.

Its inclusion in the portfolio does not constitute an engineering commitment.

---

# Additional Product Opportunities

Other vertical SaaS opportunities may emerge over time.

Examples could include:

- operations software;
- booking systems;
- inventory systems;
- asset management;
- help desk software;
- learning platforms;
- knowledge systems;
- specialized administration tools.

These are examples only.

Do not create Domains, modules or source directories for hypothetical products.

---

# Product Discovery Rule

A new product should begin from a real business problem.

Preferred process:

```text
Customer or Market Problem
        ↓
Discovery
        ↓
Process Understanding
        ↓
Validation
        ↓
Product Opportunity
        ↓
Domain Definition
        ↓
Architecture Evaluation
        ↓
Implementation Decision
```

This protects the platform from speculative product development.

---

# Shared Platform Capabilities

Products should reuse existing Platform Core capabilities whenever their semantics match.

Examples:

```text
Identity
Organizations
Roles
Memberships
Permissions
```

Products must not create alternative implementations merely because a Domain requires them.

However:

```text
Potential reuse
≠ automatic Platform Core ownership
```

New capabilities still require semantic ownership evaluation.

---

# Product-Specific Capabilities

Product-specific business behavior belongs to the corresponding Domain.

Examples:

```text
DJ Playlist publication
→ DJ Domain

Copy Order production lifecycle
→ Copy Domain

SEO ranking analysis
→ SEO Domain
```

Platform Core must not absorb these behaviors simply because they are important to the product.

---

# Domain Independence

Business Domains remain architecturally independent.

Forbidden:

```text
DJ Domain
→ Copy Domain
```

Forbidden:

```text
Copy Domain
→ SEO Domain
```

Forbidden:

```text
SEO Domain
→ CRM Domain
```

A Product may compose approved capabilities without creating direct Domain-to-Domain dependencies.

---

# Cross-Domain Capability Rule

Do not automatically use:

```text
Two Domains need something
        ↓
Move it to Platform Core
```

Instead evaluate:

```text
Do both Domains need the same semantics?

Is the capability independent of both business verticals?

Would Platform Core ownership remain coherent?

Would extraction reduce duplication without creating coupling?
```

Possible outcomes include:

```text
keep separate Domain behavior

promote reusable capability to Platform Core

use Shared technical functionality

use Infrastructure adapter

compose behavior at Application level
```

Architecture determines ownership.

---

# Platform Core Evolution

New products may reveal missing reusable capabilities.

Therefore Platform Core is not immutable.

Preferred evolution:

```text
Product Requirement
        ↓
Domain Need
        ↓
Reuse Evaluation
        ↓
Architecture Review
        ↓
Domain Capability
or
Platform Core Capability
```

A new Product should not require unnecessary Core changes.

But justified reusable requirements may evolve Platform Core.

---

# Product Independence

Products should remain operationally and commercially separable where practical.

Different products may have different:

- target customers;
- pricing;
- branding;
- feature sets;
- Go-To-Market strategies;
- Domain behavior;
- deployment requirements.

They may still reuse the same Platform Core architecture.

---

# Multi-Product Platform

The long-term objective is not one enormous SaaS application containing every business vertical.

The target is:

```text
Reusable Platform Foundation
        +
Focused Products
        +
Independent Business Domains
```

This allows the portfolio to grow without turning Platform Core into business-specific monolithic software.

---

# Product Roadmap

Portfolio sequencing belongs primarily to:

```text
docs/business/ROADMAP.md
```

This document does not commit the repository to a fixed implementation order such as:

```text
DJ
→ Copy
→ SEO
→ CRM
```

The next product should be selected using business evidence.

Strategic priorities may change.

The platform should preserve that flexibility.

---

# Second Product Validation

The second real product is strategically significant.

It will test whether Platform Core contains genuinely reusable capabilities rather than abstractions optimized only for DJ Platform.

A second Product may reveal:

- missing reusable capabilities;
- assumptions that were too DJ-specific;
- unnecessary abstractions;
- new operational requirements;
- opportunities to simplify Core;
- opportunities to promote proven reuse.

The second Product is therefore an important Platform Core validation milestone.

---

# Product Economics

Platform Core creates economic leverage by reducing repeated engineering effort.

Conceptually:

```text
Initial Engineering Investment
        ↓
Reusable Platform Capabilities
        ↓
Lower Repeated Foundation Cost
        ↓
Faster Product Development
        ↓
Larger Viable Product Portfolio
```

Reuse only creates value when capabilities are actually reused.

Speculative abstraction creates cost rather than leverage.

---

# Commercial Independence

Products may use different commercial models.

Examples include:

- subscription;
- implementation fee;
- maintenance;
- support;
- freemium;
- advertising;
- usage-based pricing;
- affiliate revenue;
- enterprise services.

Commercial strategy belongs to the product and market.

Platform Core must not force every product into the same monetization model.

---

# Product Success Criteria

The portfolio strategy is succeeding when:

- products solve validated problems;
- customer value increases;
- new products require less repeated foundation work;
- reusable capabilities are actually reused;
- Domain-specific behavior remains isolated;
- Platform Core remains cohesive;
- engineering effort becomes more predictable;
- maintenance cost grows slower than the portfolio;
- product development becomes faster without sacrificing architecture quality.

---

# Product Failure Indicators

The strategy is failing when:

- Products are treated as identical to Domains;
- speculative Products generate speculative source code;
- every Product rebuilds authentication or tenancy;
- Product business rules leak into Platform Core;
- Domains depend directly on one another;
- planned Core capabilities are treated as already available;
- the portfolio roadmap becomes an automatic engineering backlog;
- Platform Core grows without demonstrated reuse.

---

# AI Agent Rules

AI implementation agents must not:

- treat Product and Domain as synonyms;
- create a Domain because a Product appears in this portfolio;
- create source code for future Product opportunities without approved tasks;
- treat Copy, SEO or CRM as current implementation commitments;
- invent Platform Core modules from potential Product needs;
- assume planned Core capabilities already exist;
- create direct Domain-to-Domain dependencies;
- convert the Product Roadmap into implementation tasks automatically;
- infer production readiness from Product documentation.

When a Product requirement creates an architectural question:

```text
STOP
        ↓
Report Requirement
        ↓
Architecture Evaluation
        ↓
Ownership Decision
        ↓
Approved Implementation
```

---

# Current Portfolio State

## Active

```text
DJ Platform
→ In Development
```

## Validated Opportunity / Discovery

```text
Copy Platform
```

## Future Product Opportunities

```text
SEO Platform
CRM Platform
```

Additional products remain hypothetical until supported by market or customer evidence.

---

# Final Principle

Products solve customer and market problems.

Domains own business-specific software behavior.

Platform Core provides proven reusable SaaS capabilities.

Shared provides business-agnostic technical reuse.

Infrastructure provides technical connectivity.

A Product may depend on Platform Core and its Domain.

Platform Core must not depend on Product-specific Domain behavior.

Portfolio growth must come from validated opportunity.

Platform growth must come from demonstrated reuse.