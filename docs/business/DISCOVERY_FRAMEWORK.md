---
title: Discovery Framework
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
  - ROADMAP.md
  - ../architecture/DOMAINS.md
  - ../architecture/PLATFORM_CORE_SPEC.md

---

# Discovery Framework

## Purpose

This document defines the framework used to transform real business problems into validated Product requirements and, when justified, permanent software.

Discovery reduces business and implementation risk by understanding and validating how a business actually operates before committing to unnecessary architecture.

Discovery is not simply preparation for development.

Discovery is a decision-making process.

---

# Core Principle

Do not begin with:

```text
What software should we build?
```

Begin with:

```text
What business problem should we understand?
```

The objective is to move from assumption to evidence.

---

# Framework

A typical Discovery engagement may evolve through:

```text
Business Problem
        ↓
Discovery
        ↓
Business Analysis
        ↓
Process Mapping
        ↓
Prototype when useful
        ↓
Validation
        ↓
Product Definition
        ↓
Domain Boundary
        ↓
Reuse and Architecture Evaluation
        ↓
Implementation Decision
        ↓
Production Implementation when justified
        ↓
Continuous Learning
```

This is a framework, not a mandatory fixed pipeline.

Different projects may require different levels of depth at each stage.

A Discovery process that concludes that software should not be built can still be successful.

Avoiding unnecessary implementation is valuable.

---

# Phase 1 — Business Problem

## Objective

Define the real problem before proposing a solution.

Questions may include:

- What is difficult today?
- What creates delays?
- Where are errors produced?
- Which tasks are repetitive?
- Which activities depend on individual memory?
- Where is information lost?
- Which processes lack visibility?
- Which recurring costs are excessive?
- What prevents the business from scaling?
- Which customer interactions create friction?

The problem should be described in business language before being translated into software requirements.

---

# Phase 2 — Discovery

## Objective

Understand how the business actually operates.

Discovery may include:

- interviews;
- observation;
- existing process review;
- existing software;
- spreadsheets;
- Airtable bases;
- forms;
- email;
- messaging systems;
- customer requests;
- internal documents;
- reports;
- operational data;
- employee knowledge;
- manual procedures.

The purpose is to collect evidence.

Document reality, including manual workarounds, exceptions and unofficial communication.

---

# Phase 3 — Business Analysis

## Objective

Transform collected evidence into a coherent business model.

Identify:

```text
Actors
Entities
Processes
Information
Decisions
Rules
Dependencies
Exceptions
Pain Points
Constraints
```

The output should explain the business clearly enough that later Product and Domain decisions do not depend on hidden assumptions.

Business concepts identified here are not automatically database tables or software modules.

---

# Phase 4 — Process Mapping

## Objective

Represent important workflows explicitly.

Example:

```text
Customer Request
        ↓
Order Intake
        ↓
Information Validation
        ↓
Production
        ↓
Quality Control
        ↓
Delivery
        ↓
Completion
```

Process mapping should identify:

- states;
- transitions;
- actors;
- responsibilities;
- inputs;
- outputs;
- decisions;
- bottlenecks;
- exceptions;
- automation opportunities.

A business workflow describes what the business does.

It does not automatically define software architecture.

---

# Phase 5 — Prototype

## Objective

Validate assumptions using the lowest-cost practical solution.

A prototype may use:

- Airtable;
- spreadsheets;
- forms;
- dashboards;
- automation tools;
- low-code platforms;
- simple scripts;
- manual processes supported by structured data.

The prototype exists to learn.

Use the cheapest solution capable of validating the important question.

A prototype may temporarily accept manual operations, simplified permissions, incomplete UX, limited scalability or higher third-party recurring costs when those compromises accelerate learning.

---

# Prototype Is Not Production

A successful prototype proves that a workflow may be useful.

It does not prove that the prototype technology or data structure is suitable for production.

Preferred transition:

```text
Prototype
        ↓
Real Usage
        ↓
Observed Behavior
        ↓
Validated Business Knowledge
        ↓
Product Definition
        ↓
Permanent Architecture
```

Do not reproduce prototype structures blindly in permanent source code.

The Discovery Framework is not tied to Airtable or any particular vendor.

The tool should serve the Discovery question.

---

# Phase 6 — Validation

## Objective

Determine whether the proposed workflow creates real value.

Possible evidence includes:

- reduced processing time;
- fewer errors;
- improved visibility;
- faster customer response;
- reduced manual coordination;
- higher operational capacity;
- lower recurring cost;
- easier onboarding;
- improved reporting;
- better user adoption;
- willingness to pay.

Validation should answer:

```text
Does this solve the original problem?

Does it improve the workflow materially?

Do users actually adopt it?

Which parts fail?

Is the improvement economically meaningful?

Is permanent software justified?
```

Possible decisions include proceeding, refining the prototype, running more validation, keeping an existing solution, pausing or rejecting the opportunity.

Software development is one possible outcome, not the default outcome.

---

# Phase 7 — Product Definition

## Objective

Transform validated business knowledge into Product requirements.

A Product requirement should describe:

- problem;
- target users;
- desired outcome;
- validated workflows;
- important business rules;
- required information;
- constraints;
- success criteria.

The Product definition describes what should create customer value.

It does not determine architectural ownership automatically.

---

# Product and Domain

A Product is a customer-facing offering.

A Domain owns business-specific software behavior.

Therefore:

```text
Product
≠ Domain
```

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

Discovery defines Product needs.

Architecture determines where their software capabilities belong.

---

# Phase 8 — Domain Boundary

## Objective

Identify the business-specific behavior revealed by Discovery.

Examples:

```text
DJ Playlist
→ DJ Domain

Print Production Job
→ Copy Domain

Keyword Ranking
→ SEO Domain
```

Domain ownership may include:

- business entities;
- business rules;
- workflows;
- lifecycle semantics;
- Domain-specific validation;
- business-specific permissions;
- Domain-specific integrations;
- business-specific AI behavior.

Business meaning comes before reuse.

Similar implementation patterns do not prove identical business semantics.

---

# Phase 9 — Reuse and Architecture Evaluation

## Objective

Determine whether validated requirements reveal genuinely reusable platform capabilities.

Do not use:

```text
Can another Product use this?

Yes
→ Platform Core
```

That rule is insufficient.

Instead ask:

1. What owns the semantic meaning?
2. Is the behavior independent of a specific business vertical?
3. Does an existing Platform Core capability already solve it?
4. Does another real Product require equivalent semantics?
5. Would centralizing it reduce meaningful duplication?
6. Would Core ownership remain cohesive?
7. Would extraction introduce Domain assumptions into Core?

Possible ownership outcomes are:

```text
Business Domain
Platform Core
Shared
Infrastructure
Application Composition
```

Architecture determines ownership.

Discovery provides evidence.

---

# Platform Core Extraction

Platform Core extraction is not a mandatory Discovery phase.

It is a possible architectural outcome.

A reusable capability may evolve through:

```text
Validated Product Requirement
        ↓
Business Meaning Identified
        ↓
Domain Requirement
        ↓
Equivalent Need Appears Elsewhere
        ↓
Semantic Comparison
        ↓
Architecture Review
        ↓
Reusable Capability Confirmed
        ↓
Platform Core Specification
        ↓
Implementation
```

The important principle is demonstrated reuse, not possible reuse.

Current Foundation architecture includes:

```text
Identity
Organizations
Roles
Memberships
Permissions
```

Potential future reusable capabilities may include:

```text
Notifications
Audit
Billing
Settings
Storage
```

Planned capabilities are not automatically implemented capabilities.

---

# No Forced Platform Improvement

A Discovery engagement does not need to produce new Platform Core code.

Possible successful outcomes include:

```text
Validated Product
+
Existing Core Is Sufficient
+
New Domain Behavior
```

or:

```text
Discovery
+
No Product Built
+
Important Business Knowledge Learned
```

Platform learning does not require permanent platform modification.

---

# Phase 10 — Implementation Decision

## Objective

Decide whether permanent software should be built.

The decision should consider:

- validated customer value;
- technical feasibility;
- business viability;
- implementation cost;
- expected recurring revenue;
- operational cost;
- maintenance burden;
- strategic fit;
- existing alternatives;
- reusable platform leverage.

Possible decisions include:

```text
Build Custom Product
Extend Existing Product
Integrate Existing Software
Continue Low-Code Solution
Keep Manual Process
Do Not Proceed
```

The correct solution is the one that creates sufficient value, not necessarily the one that produces the most code.

---

# Phase 11 — Production Implementation

## Objective

Implement the approved permanent architecture.

Production implementation should use:

```text
Approved Product Requirements
+
Approved Domain Boundaries
+
Approved Architecture
+
Existing Platform Core
+
Approved Infrastructure
```

Implementation agents should not reinterpret Discovery independently.

Permanent software should account for requirements such as maintainability, security, observability, data integrity, authorization, tenancy, operational reliability, deployment, backup, testing and documentation.

Completing source code does not mean a Product is production-ready.

Production readiness requires evidence appropriate to the Product and environment.

---

# Phase 12 — Continuous Learning

## Objective

Continue learning after implementation.

Real usage generates evidence that Discovery could not predict completely.

Observe:

- adoption;
- workflow changes;
- exceptions;
- performance;
- support requests;
- operational cost;
- user behavior;
- business outcomes;
- missing capabilities.

Continuous improvement should return to evidence before changing Domain or Platform behavior.

---

# Discovery Outputs

A Discovery engagement may produce:

- business problem definition;
- stakeholder understanding;
- process maps;
- business entities;
- business rules;
- exception catalogue;
- pain point analysis;
- prototype;
- usage evidence;
- validation results;
- Product requirements;
- Domain requirements;
- architecture questions;
- implementation priorities;
- lessons learned.

Not every engagement requires every artifact.

---

# Knowledge Does Not Automatically Become Software

Avoid this automatic rule:

```text
Knowledge
→ Documentation
→ Software
```

Use:

```text
Knowledge
        ↓
Evaluation
        ↓
Documentation when relevant
        ↓
Decision
        ↓
Software when justified
```

Some knowledge may demonstrate that software should not be built.

---

# Relationship with Platform Core

Discovery may reveal reusable platform needs.

However:

```text
Discovery Requirement
≠ Platform Core Requirement
```

Platform Core ownership requires architecture evaluation.

Platform Core captures reusable SaaS capabilities whose semantics are independent of a specific business vertical.

---

# Relationship with Business Domains

Discovery is one of the primary sources of Domain knowledge.

Validated business-specific concepts should remain in the appropriate Domain.

Domains preserve business meaning.

---

# Discovery and Copy Platform

Copy Platform is an example of an operational Discovery path.

A possible progression is:

```text
Real Copy Shop
        ↓
Business Discovery
        ↓
Process Mapping
        ↓
Operational Prototype
        ↓
Real Staff Usage
        ↓
Workflow Validation
        ↓
Product Definition
        ↓
Copy Domain
        ↓
Reuse Evaluation
        ↓
Permanent SaaS Decision
```

Airtable or similar tooling may be useful during the prototype stage.

Its purpose is to understand the business and validate workflows.

It does not dictate the final production architecture.

---

# Discovery and DJ Platform

DJ Platform provides a different type of product validation.

Its evolution may validate requirements involving:

- DJ workflows;
- music discovery;
- content;
- structured music data;
- playlists;
- editorial workflows;
- search;
- SEO-oriented content;
- AI-assisted features.

Different Products reveal different platform requirements.

That diversity helps validate architecture.

---

# Commercial Discovery

Discovery may also validate the commercial model.

Questions may include:

- Who pays?
- What problem are they paying to remove?
- How much recurring cost can the Product replace?
- What implementation fee is acceptable?
- Is ongoing maintenance required?
- What support level is expected?
- Is subscription appropriate?
- Is implementation plus maintenance more appropriate?
- What alternatives already exist?
- What is the customer's willingness to switch?

Software viability depends on economic evidence as well as technical feasibility.

---

# Success Indicators

The framework is succeeding when:

- uncertainty decreases;
- business processes become explicit;
- real problems are distinguished from assumptions;
- prototypes generate useful evidence quickly;
- invalid ideas are rejected early;
- Product requirements become clearer;
- Domain boundaries reflect real business meaning;
- Platform Core evolves only from justified reuse;
- implementation risk decreases;
- customer outcomes improve.

---

# Failure Indicators

The framework is failing when:

- software architecture is decided before understanding the problem;
- prototypes are treated automatically as final products;
- low-code structures are copied directly into permanent architecture without evaluation;
- every customer requirement becomes a Core requirement;
- Product and Domain are treated as synonyms;
- hypothetical reuse drives abstraction;
- Discovery always ends in software development;
- implementation begins while major business rules remain unknown;
- customer-specific behavior leaks into Platform Core;
- no validation evidence exists.

---

# Decision Boundaries

Business Discovery determines:

- what the problem is;
- who experiences it;
- how the business works;
- which workflows matter;
- which assumptions require validation;
- whether meaningful value exists.

Product Strategy determines:

- whether the opportunity deserves Product investment;
- who the Product targets;
- how it fits the portfolio;
- its commercial potential.

Architecture determines:

- Domain boundaries;
- Platform Core ownership;
- Shared ownership;
- Infrastructure ownership;
- tenancy;
- authorization;
- data architecture;
- dependency direction.

Engineering implements approved decisions.

---

# AI Agent Rules

AI agents working from Discovery documentation must not:

- convert every Discovery finding into a software feature;
- interpret prototypes as production architecture;
- treat prototype schemas as final data models;
- create Platform Core modules because reuse seems possible;
- create Domains without approved Product requirements;
- treat Product and Domain as identical;
- invent missing business rules;
- infer validation where no evidence exists;
- interpret future Product ideas as implementation tasks;
- silently resolve architectural ownership.

If important information is missing:

```text
STOP
        ↓
Report Missing Information
        ↓
Business or Architecture Evaluation
        ↓
Decision
        ↓
Resume
```

---

# Long-Term Objective

Create a repeatable system for converting business uncertainty into validated knowledge and valuable software.

The desired progression is:

```text
Less Assumption
        ↓
More Evidence
        ↓
Better Product Decisions
        ↓
Better Domain Models
        ↓
Less Implementation Waste
        ↓
Reusable Platform Capabilities When Justified
        ↓
Faster Future Products
```

Discovery should improve both business decisions and software quality.

---

# Final Principle

Understand the real business before designing permanent software.

Prototype when experimentation is cheaper than implementation.

Validate with evidence.

Accept that the correct decision may be not to build.

Define the Product from validated customer value.

Preserve business-specific meaning inside Domains.

Promote capabilities into Platform Core only after demonstrated reusable need.

Let Architecture decide ownership.

Let Engineering implement approved decisions.

Continue learning from real usage.