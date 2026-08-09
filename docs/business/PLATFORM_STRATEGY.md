---
title: Platform Strategy
version: 2.0.0
status: Living Document
owner: Business Strategy
updated: 2026-08-09
related:
  - README.md
  - VISION.md
  - PRODUCTS.md
  - METHODOLOGY.md
  - DISCOVERY_FRAMEWORK.md
  - ROADMAP.md
  - ../architecture/CORE.md
  - ../architecture/DOMAINS.md
  - ../architecture/PLATFORM_CORE_SPEC.md
---

# Platform Strategy

## Purpose

Platform Core exists to reduce the cost, time and risk required to create specialized SaaS products.

Instead of rebuilding common SaaS foundations for every product, the platform should accumulate proven reusable capabilities while Business Domains preserve product-specific meaning.

The strategy is not to build a universal framework before products exist.

The strategy is to discover reusable capabilities through real products and progressively turn those capabilities into platform leverage.

---

# Vision

Build a reusable software foundation capable of supporting multiple specialized SaaS products.

Each product should concentrate development effort on the business behavior that makes it valuable while reusing established platform capabilities wherever appropriate.

Platform Core is a long-term strategic asset.

Business Domains contain specialized business behavior.

Applications compose Platform Core, Domain capabilities and infrastructure into customer-facing products.

---

# Strategic Objective

The desired progression is:

```text
First Product
      ↓
High Foundation Cost
      ↓
Reusable Capabilities Identified
      ↓
Platform Core Improvement
      ↓
Second Product
      ↓
Less Repeated Foundation Work
      ↓
Further Reuse
      ↓
Successive Products Become Faster to Build
```

The objective is cumulative engineering leverage.

Every validated reusable capability should make future products cheaper and safer to develop.

---

# Strategic Principles

## Reuse Before Duplication

Existing Platform Core capabilities should be reused before equivalent functionality is created again.

However:

```text
Potential reuse
≠ automatic Core ownership
```

A capability belongs to Platform Core only when its semantics are genuinely independent of a specific business vertical.

---

## Demonstrated Reuse Before Abstraction

A capability must not become Platform Core merely because it might be useful someday.

Before promoting behavior into Core, ask:

- Is the behavior business-agnostic?
- Does more than one product require the same semantics?
- Would Core ownership remain coherent?
- Would promotion reduce duplication without introducing business coupling?
- Is the need demonstrated rather than hypothetical?

If those conditions are not satisfied, the behavior remains in its Domain.

---

## Business Isolation

Business-specific rules belong to the Domain that understands their meaning.

Examples:

```text
Playlist publication
→ DJ Domain

Print Order production lifecycle
→ Copy Domain

SEO ranking workflow
→ SEO Domain
```

Business rules must not leak into Platform Core merely to increase apparent reuse.

---

## Domain Independence

Business Domains must remain independent.

Forbidden:

```text
DJ Domain
→ Copy Domain
```

and:

```text
Copy Domain
→ SEO Domain
```

A product may eventually compose several Domain capabilities, but cross-Domain orchestration requires explicit architecture.

Direct Domain-to-Domain dependency is not the default solution.

---

## Stable Core, Evolvable Core

Platform Core should be more stable than individual business Domains.

That does not mean Platform Core is immutable.

The correct strategy is:

```text
Business Requirement
        ↓
Evaluate Semantic Ownership
        ↓
Domain Capability
or
Reusable Platform Core Capability
```

Core evolves when real products reveal reusable SaaS needs.

---

## Product Delivery Matters

Platform architecture must not become a reason to delay useful product delivery indefinitely.

The platform should balance:

```text
Reusable Foundation
+
Real Product Delivery
```

Too little platform thinking creates duplication.

Too much abstraction creates complexity before value exists.

---

# Product, Domain and Platform

A Product and a Domain are related but different concepts.

A Domain owns business-specific behavior.

A Product is the customer-facing application or service.

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
Infrastructure
```

Therefore:

```text
Domain
≠ complete Product
```

---

# Platform Layers

The strategic model is:

```text
Business Need
        ↓
Product
        ↓
Application Composition
        │
        ├── Platform Core
        ├── Business Domain
        ├── Shared Technical Resources
        └── Infrastructure
```

Each layer has a distinct responsibility.

---

# Platform Core Responsibilities

Platform Core owns reusable SaaS capabilities whose semantics are independent of a specific business vertical.

Current Foundation capabilities include:

```text
Identity
Organizations
Roles
Memberships
Permissions
```

Additional reusable capabilities may include, when properly specified and justified:

```text
Notifications
Audit
Billing
Settings
Storage
```

Platform Core must not contain product-specific business logic.

---

# Business Domain Responsibilities

Domains own business-specific concepts such as:

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

Domains may consume Platform Core capabilities.

Platform Core must not depend on Domain business behavior.

---

# Shared Technical Resources

Business-agnostic technical reuse does not automatically belong to Platform Core.

Generic technical resources may belong to Shared.

Examples:

```text
generic UI primitives
technical utilities
generic hooks
technical types
generic validation helpers
```

Shared must not become a hidden location for business logic.

---

# Infrastructure Strategy

Infrastructure provides technical connectivity and runtime foundations.

Examples may include:

```text
database connectivity
authentication provider clients
email providers
object storage
AI providers
external APIs
```

Provider-specific connectivity should remain isolated from business semantics.

Platform Core and Domains should depend on capabilities rather than unnecessary provider details.

---

# Reuse Decision Rule

Do not use the rule:

```text
Reusable?
→ Core
```

That rule is too simplistic.

Use:

```text
1. What capability is required?

2. Who owns its semantic meaning?

3. Is that meaning independent of a business vertical?

4. Does an existing Core capability already provide it?

5. Is reuse demonstrated by real requirements?

6. Would Core ownership reduce duplication without increasing coupling?
```

Possible outcomes are:

```text
Platform Core

Business Domain

Shared

Infrastructure

Application Composition
```

Architecture determines the correct owner.

---

# Capability Promotion

A capability may begin inside a Domain and later become a Platform Core capability.

Example:

```text
Product Requirement
        ↓
Domain Implementation
        ↓
Second Product Reveals Equivalent Need
        ↓
Semantic Comparison
        ↓
Architecture Review
        ↓
Promote to Platform Core
```

Promotion should happen deliberately.

Existing Domain code must not simply be moved into Core without reconsidering its semantics and API.

---

# Product Portfolio Strategy

The first active business Domain is DJ.

The first product using that Domain is DJ Platform.

DJ Platform serves two strategic purposes:

1. provide real product value;
2. validate Platform Core against actual requirements.

Potential future product opportunities include:

```text
Copy Platform
SEO Platform
CRM Platform
```

These are opportunities rather than automatic implementation commitments.

Each should begin from real market or customer evidence.

---

# Second-Product Effect

The second product is strategically important.

It tests whether Platform Core actually contains reusable capabilities rather than assumptions derived from a single product.

A second Domain may reveal:

- capabilities that genuinely belong in Core;
- abstractions that were too DJ-specific;
- missing tenant features;
- missing operational capabilities;
- unnecessary platform complexity.

Reuse becomes credible when multiple real products validate it.

---

# Discovery Strategy

New product opportunities should begin with business discovery rather than immediate software implementation.

Preferred process:

```text
Real Business Problem
        ↓
Discovery
        ↓
Process Understanding
        ↓
Prototype when useful
        ↓
Validation
        ↓
Product Requirement
        ↓
Domain Boundary
        ↓
Reusable Capability Evaluation
        ↓
Implementation
```

This allows Platform Core to evolve from evidence.

---

# Low-Code and Prototype Strategy

Low-code systems may be used during discovery when they reduce validation cost.

Examples may include operational prototypes, workflow tools or temporary data systems.

Their purpose is to answer questions such as:

- How does the business actually operate?
- Which workflows repeat?
- Which information is critical?
- Which automation creates real value?
- Which capabilities deserve permanent software?

A prototype is not automatically the production architecture.

---

# Platform Core as Economic Leverage

Platform Core creates business value by reducing repeated engineering work.

The economic model is:

```text
Reusable Engineering Investment
        ↓
Lower Marginal Cost per Product
        ↓
Faster Product Delivery
        ↓
Greater Product Portfolio Potential
```

Its value increases when reusable capabilities are actually reused.

Unused abstractions do not create platform leverage.

---

# Infrastructure Independence

The strategy should avoid unnecessary dependence on a single infrastructure provider.

This does not require absolute provider neutrality.

Instead:

```text
Business semantics
→ remain independent

Provider connectivity
→ remains isolated where practical
```

Changing infrastructure may still require engineering work.

The objective is controlled coupling rather than unrealistic zero-cost portability.

---

# AI-Assisted Development Strategy

AI-assisted development is an important force multiplier for the platform.

Its effectiveness depends on:

- explicit architecture;
- strong documentation;
- clear ownership;
- predictable source structure;
- implementation tasks with defined boundaries;
- traceable decisions.

AI agents should implement approved architecture.

They must not become the source of architecture by accident.

---

# Runtime AI Strategy

Runtime AI should emerge from real product requirements.

Domains own:

```text
why AI is used

what AI output means

how AI affects business state
```

Infrastructure owns:

```text
provider connectivity
```

Reusable AI capabilities may later become Platform Core when their semantics are genuinely reusable across products.

---

# Success Criteria

Platform strategy is succeeding when:

- new products require less repeated foundation work;
- reusable capabilities are actually reused;
- Domain-specific behavior remains isolated;
- Core does not accumulate speculative business logic;
- architectural decisions become more predictable;
- new products can adopt existing Identity, tenancy and authorization capabilities;
- infrastructure changes have controlled impact;
- engineering quality remains consistent;
- AI-assisted implementation requires less architectural correction;
- maintenance effort grows slower than the product portfolio.

---

# Failure Indicators

The strategy is failing when:

- every new product rebuilds authentication or tenancy;
- Domain entities appear inside Core without semantic justification;
- Core becomes a collection of unrelated utilities;
- Shared becomes a dumping ground for business logic;
- Domains depend directly on each other;
- provider SDKs spread throughout business code;
- speculative modules are created before requirements exist;
- architecture delays product validation indefinitely;
- documentation describes capabilities that implementation does not provide.

---

# Long-Term Goal

Create a portfolio of specialized SaaS products supported by a progressively stronger reusable foundation.

The desired outcome is:

```text
More Products
+
More Proven Reuse
+
Stable Architectural Boundaries
=
Increasing Platform Leverage
```

Every new product should provide both:

```text
Customer Value

and

Platform Learning
```

The platform becomes stronger through validated reuse.

---

# Final Principle

Platform Core is not the product that replaces every product.

Platform Core is the reusable SaaS foundation that makes successive products cheaper, faster and safer to build.

Products solve market problems.

Domains preserve business-specific meaning.

Platform Core accumulates proven reusable capabilities.

Architecture decides ownership.

Real products validate the strategy.