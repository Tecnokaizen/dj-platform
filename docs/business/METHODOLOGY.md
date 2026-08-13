---
title: Business Methodology
version: 2.0.0
status: Living Document
owner: Business Strategy
updated: 2026-08-09
related:
  - README.md
  - VISION.md
  - PLATFORM_STRATEGY.md
  - PRODUCTS.md
  - DISCOVERY_FRAMEWORK.md
  - ROADMAP.md
  - ../architecture/DOMAINS.md
  - ../architecture/PLATFORM_CORE_SPEC.md
---

# Business Methodology

## Purpose

This document defines the methodology used to transform real business problems into validated software products and, when justified, reusable Platform Core capabilities.

The objective is not simply to build software.

The objective is to understand businesses deeply enough to:

- identify real problems;
- understand operational workflows;
- validate assumptions;
- design valuable products;
- preserve business-specific knowledge inside Domains;
- identify genuinely reusable SaaS capabilities;
- reduce repeated engineering effort over time.

Software is an outcome of validated understanding.

Platform Core is an outcome of demonstrated reuse.

---

# Philosophy

Technology is not the starting point.

The starting point is:

```text
Business Reality
```

The methodology prioritizes:

```text
Understand
        ↓
Validate
        ↓
Model
        ↓
Decide Ownership
        ↓
Implement
        ↓
Measure
        ↓
Learn
```

The platform should evolve from evidence rather than speculation.

---

# Core Methodology Principle

Do not begin with:

```text
What software should we build?
```

Begin with:

```text
What problem actually exists?

Who experiences it?

How is it solved today?

Where does time, money or information get lost?

Which parts repeat?

Which parts are genuinely valuable to improve?
```

Only after understanding these questions should permanent software architecture be committed.

---

# Methodology Is Not a Fixed Pipeline

The methodology provides a repeatable framework.

It is not a rigid sequence that every project must follow identically.

Different engagements may require:

- more discovery;
- less prototyping;
- deeper process mapping;
- technical feasibility validation;
- market validation;
- operational experimentation;
- direct implementation when requirements are already proven.

The sequence should adapt to uncertainty.

The greater the uncertainty, the more discovery and validation should precede permanent implementation.

---

# High-Level Method

A typical evolution is:

```text
Business Problem
        ↓
Discovery
        ↓
Business Understanding
        ↓
Process Mapping
        ↓
Prototype when useful
        ↓
Validation
        ↓
Product Requirement
        ↓
Domain Boundary
        ↓
Architecture Evaluation
        ↓
Implementation
        ↓
Measurement
        ↓
Reusable Learning
        ↓
Platform Evolution when justified
```

Not every project must reach every stage.

A project may stop after validation if the business opportunity is not strong enough.

That is a valid outcome.

---

# Phase 1 — Business Problem

The first objective is to define the actual problem.

Questions may include:

- What is currently difficult?
- What creates delays?
- What requires repeated manual work?
- Where do errors occur?
- Which information is duplicated?
- Which processes depend excessively on individual memory?
- Which tasks are difficult to monitor?
- Which activities create recurring operational cost?
- Which customer interactions generate friction?
- Which processes prevent growth?

Avoid translating the problem immediately into technical features.

---

# Phase 2 — Discovery

Discovery gathers evidence about how the business really operates.

Possible inputs include:

- interviews;
- observation;
- existing spreadsheets;
- Airtable bases;
- email workflows;
- WhatsApp conversations;
- forms;
- customer requests;
- existing software;
- reports;
- files;
- manual procedures;
- employee knowledge;
- historical operational data.

Discovery should capture reality rather than the idealized process.

---

# Phase 3 — Business Understanding

Discovery information must be transformed into a coherent operating model.

The objective is to understand:

```text
Actors
Processes
Information
Decisions
Exceptions
Dependencies
Pain Points
Business Rules
```

At this stage, the team should be able to explain how the business works without depending on undocumented assumptions.

---

# Phase 4 — Process Mapping

Relevant workflows should be mapped explicitly.

Example:

```text
Customer Request
        ↓
Order Intake
        ↓
Validation
        ↓
Production
        ↓
Quality Control
        ↓
Delivery
        ↓
Completion
```

Process mapping should reveal:

- states;
- transitions;
- responsibilities;
- bottlenecks;
- repeated work;
- missing information;
- failure points;
- automation opportunities;
- reporting needs.

Process maps describe business behavior.

They are not automatically software architecture.

---

# Phase 5 — Prototype

A prototype may be used when it is the fastest way to validate the workflow.

Possible prototype technologies include:

- Airtable;
- spreadsheets;
- forms;
- low-code tools;
- automation platforms;
- lightweight internal dashboards;
- manual workflows supported by structured data.

The prototype exists to answer business questions.

It does not need to represent the final production architecture.

---

# Prototype Principle

Use the cheapest tool that can validate the important assumption.

Do not build permanent infrastructure merely to discover whether the workflow is useful.

A prototype may intentionally accept limitations such as:

- manual steps;
- temporary automation;
- limited permissions;
- simplified interfaces;
- restricted scalability;
- higher recurring tool cost.

Those limitations are acceptable during validation when they accelerate learning.

---

# Prototype Is Not Production Architecture

A successful prototype does not automatically become the final product.

The transition should be:

```text
Prototype
        ↓
Observed Usage
        ↓
Validated Workflow
        ↓
Extract Business Knowledge
        ↓
Define Permanent Product Architecture
```

Do not copy temporary low-code structures blindly into the production data model.

The production architecture should model the validated business semantics.

---

# Phase 6 — Validation

Validation determines whether the proposed workflow actually creates value.

Evidence may include:

- reduced processing time;
- fewer errors;
- better visibility;
- improved coordination;
- lower recurring cost;
- reduced administrative effort;
- better customer experience;
- faster onboarding;
- increased throughput;
- user adoption;
- willingness to pay.

Validation should answer:

```text
Does this solve a real problem?

Is the improvement meaningful?

Will people actually use it?

Is the solution economically viable?
```

---

# Validation Before Permanent Complexity

Unvalidated assumptions should not create permanent architecture unnecessarily.

Prefer:

```text
Assumption
→ Experiment
→ Evidence
→ Decision
```

over:

```text
Assumption
→ Architecture
→ Large Implementation
→ Discover It Was Wrong
```

---

# Phase 7 — Product Requirement

Once the workflow is validated, convert business learning into product requirements.

A Product requirement describes:

- user problem;
- actors;
- expected outcomes;
- workflows;
- important rules;
- required information;
- constraints;
- success criteria.

A Product requirement does not automatically determine architectural ownership.

That requires a separate evaluation.

---

# Product and Domain

A Product is the customer-facing offering.

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

The methodology must preserve this distinction.

---

# Phase 8 — Domain Boundary

Business-specific knowledge should be assigned to the appropriate Domain.

Examples:

```text
Playlist publication
→ DJ Domain
```

```text
Print production workflow
→ Copy Domain
```

```text
Keyword ranking analysis
→ SEO Domain
```

The Domain owns:

- business entities;
- business rules;
- business workflows;
- lifecycle semantics;
- Domain validation;
- Domain-specific UI;
- Domain-specific permissions;
- business-specific AI behavior.

---

# Domain First for Business Meaning

When behavior exists because of a specific business vertical, the default owner is the Domain.

Do not move it into Platform Core simply because it might eventually be reused.

Example:

```text
Copy Order Production State
```

belongs to Copy Domain even if another future product also has something called a workflow state.

Similar terminology does not prove identical semantics.

---

# Phase 9 — Reuse Evaluation

After identifying the business behavior, evaluate whether any capability is genuinely reusable.

Ask:

1. Is the capability independent of a specific business vertical?
2. Does another real product require the same semantics?
3. Is the capability already provided by Platform Core?
4. Would Core ownership reduce duplication?
5. Would Core remain cohesive?
6. Would moving it into Core introduce business-specific assumptions?

Potential reuse alone is insufficient.

---

# Reuse Decision

Do not use:

```text
Reusable?
→ Platform Core
```

Use:

```text
What owns the meaning?
        ↓
Is the meaning business-specific?
        ↓
Yes → Domain

No
        ↓
Is the capability genuinely reusable?
        ↓
Yes → Architecture Evaluation
```

Possible owners include:

```text
Platform Core
Business Domain
Shared
Infrastructure
Application Composition
```

Architecture determines the final ownership.

---

# Platform Core Extraction

A reusable capability may be extracted into Platform Core when demonstrated product needs justify it.

Example:

```text
Product A Requirement
        ↓
Domain Implementation
        ↓
Product B Reveals Equivalent Need
        ↓
Semantic Comparison
        ↓
Architecture Review
        ↓
Reusable Capability Identified
        ↓
Platform Core Specification
        ↓
Implementation
```

Extraction is deliberate.

It is not automatic duplication cleanup.

---

# Current Platform Core Foundation

Current reusable Foundation architecture includes:

```text
Identity
Organizations
Roles
Memberships
Permissions
```

Planned reusable capabilities may later include:

```text
Notifications
Audit
Billing
Settings
Storage
```

Future Domains may reveal additional reusable needs.

Those needs require architecture review before becoming Core.

---

# Real Businesses Drive Platform Evolution

Real customer work is one of the strongest sources of platform learning.

A customer engagement may reveal:

- missing Core capabilities;
- unnecessary abstractions;
- better workflows;
- new Domain requirements;
- operational requirements;
- monetization opportunities;
- automation opportunities;
- product opportunities.

However:

```text
Customer Requirement
≠ automatic Core requirement
```

The requirement must still pass architectural ownership evaluation.

---

# Customer Engagement

A customer project can create several kinds of value simultaneously:

```text
Customer Outcome
+
Business Knowledge
+
Product Learning
+
Domain Knowledge
+
Potential Reusable Capability
```

The customer remains the primary beneficiary of the engagement.

Platform learning is a strategic secondary benefit.

---

# Learning Without Forced Reuse

Every project should create learning.

Not every project must create new Platform Core code.

A successful Domain implementation may confirm that the existing Core is already sufficient.

That is valuable evidence.

Platform stability is also a positive outcome.

---

# Documentation

Validated knowledge should be documented before it becomes permanent architectural behavior.

Relevant documentation may include:

- business discovery;
- workflows;
- product requirements;
- Domain specifications;
- architecture decisions;
- data models;
- implementation tasks.

Documentation should capture decisions that future developers and AI agents need to understand.

---

# Documentation and Prototypes

The rule:

```text
Documentation before implementation
```

applies primarily to permanent implementation and architectural decisions.

Discovery prototypes may intentionally precede complete documentation because their purpose is to generate knowledge.

The proper sequence may be:

```text
Prototype
→ Learn
→ Validate
→ Document
→ Permanent Implementation
```

This distinction prevents documentation-first discipline from slowing experimentation unnecessarily.

---

# Engineering Handoff

Engineering begins after the required business and architectural decisions are sufficiently clear.

A typical handoff includes:

- objective;
- scope;
- ownership;
- approved architecture;
- data model where required;
- business rules;
- acceptance criteria;
- known blockers;
- implementation tasks.

Engineering implements the approved solution.

Engineering does not silently decide unresolved architecture.

---

# AI-Assisted Development

AI agents can accelerate:

- implementation;
- refactoring;
- validation;
- documentation maintenance;
- test creation;
- repetitive engineering work.

Their effectiveness depends on:

- explicit context;
- stable architecture;
- clear task boundaries;
- documented ownership;
- current source structure;
- known constraints.

AI agents should implement architecture.

They should not become accidental architects.

---

# AI Stop Rule

If an AI implementation agent discovers an unresolved architectural decision:

```text
STOP
        ↓
Report
        ↓
Architecture Evaluation
        ↓
Decision
        ↓
Documentation
        ↓
Resume
```

This protects the platform from architecture created implicitly during coding.

---

# Continuous Learning

Every implementation should generate feedback.

Questions include:

- What worked?
- What failed?
- Which assumptions were wrong?
- Which rules were missing?
- Which workflows changed?
- Which abstractions were unnecessary?
- Which capabilities were genuinely reusable?
- Which knowledge belongs only to this Domain?
- Which operational problems appeared?
- What should be simplified?

Learning should update the appropriate documentation.

---

# Continuous Improvement Loop

The methodology creates a feedback loop:

```text
Business
        ↓
Discovery
        ↓
Product
        ↓
Implementation
        ↓
Real Usage
        ↓
Learning
        ↓
Domain Improvement
or
Platform Improvement
        ↓
Next Product
```

Each cycle should increase knowledge.

It does not need to increase architectural complexity.

---

# Platform Evolution

Platform Core is not permanently complete.

It may evolve as real products reveal reusable requirements.

However, the objective is not:

```text
Every Product
→ More Core
```

The preferred outcome is:

```text
Every Product
→ More Knowledge
        ↓
Core changes only when reuse is demonstrated
```

A stable Core that does not need modification is often a sign of good architecture.

---

# Second Product Validation

The second real product has special strategic value.

It tests whether Platform Core is genuinely reusable beyond assumptions derived from the first Domain.

A second product may reveal:

- hidden DJ-specific assumptions;
- missing reusable capabilities;
- overly generic abstractions;
- missing operational requirements;
- opportunities to simplify architecture.

Platform reuse becomes more credible when tested by multiple real products.

---

# Business Methodology and Copy Platform

An operational product such as Copy Platform can follow this methodology particularly well.

A typical path may be:

```text
Real Copy Shop
        ↓
Business Discovery
        ↓
Process Mapping
        ↓
Operational Prototype
        ↓
Workflow Validation
        ↓
Reusable / Domain Separation
        ↓
Copy Domain
        ↓
Production SaaS
```

The prototype may use low-code tooling during discovery.

The final production architecture may use Platform Core plus Copy Domain.

The prototype technology does not dictate the permanent product architecture.

---

# Business Methodology and DJ Platform

DJ Platform provides a different validation profile.

It can test the platform against requirements such as:

- content;
- structured music data;
- search;
- editorial workflows;
- playlists;
- public discovery;
- AI-assisted capabilities;
- SEO-oriented content.

Different Domains validate different dimensions of Platform Core.

This diversity is valuable.

---

# Business Methodology and Product Portfolio

Future products should not be selected only because they are technically possible.

Selection criteria may include:

- validated customer pain;
- market size;
- willingness to pay;
- competitive opportunity;
- access to customers;
- implementation cost;
- strategic fit;
- reuse potential;
- operational feasibility.

Platform capability is an advantage.

It is not sufficient business justification by itself.

---

# Economic Principle

The business methodology should improve both customer outcomes and engineering economics.

Conceptually:

```text
Validated Business Knowledge
        ↓
Better Product Decisions
        ↓
Less Waste
        ↓
Reusable Engineering Where Appropriate
        ↓
Lower Repeated Development Cost
```

Reuse creates economic leverage only when it solves real needs.

---

# Success Definition

Success is not measured by:

- lines of code;
- number of modules;
- number of abstractions;
- number of products listed in a roadmap.

Success is measured by:

- customer outcomes;
- validated product value;
- reusable knowledge;
- reusable software where justified;
- lower repeated engineering cost;
- faster future development;
- maintainable architecture;
- reduced operational friction;
- sustainable revenue potential.

---

# Failure Indicators

The methodology is failing when:

- coding begins before the problem is understood;
- prototypes are treated automatically as production architecture;
- every reusable-looking behavior is moved into Core;
- Product and Domain are treated as synonyms;
- hypothetical future products drive current architecture;
- validated business rules remain undocumented;
- Core grows faster than demonstrated reuse;
- Domains become coupled;
- implementation agents silently make architecture decisions;
- software is built without measurable business value.

---

# Decision Boundaries

Business decides:

- which problem matters;
- who the customer is;
- what value should be created;
- which workflows require improvement;
- which opportunities deserve validation.

Architecture decides:

- where capabilities belong;
- which behavior belongs to Core;
- which behavior belongs to Domains;
- persistence boundaries;
- dependency direction;
- tenancy;
- authorization;
- technical architecture.

Engineering decides implementation details within approved architectural boundaries.

---

# Methodology Outputs

Depending on the project, the methodology may produce:

```text
Discovery Notes
Process Maps
Business Rules
Prototype
Validation Evidence
Product Requirements
Domain Specification
Architecture Decisions
Implementation Tasks
Operational Requirements
Lessons Learned
```

Not every project requires every artifact.

Artifacts exist to reduce uncertainty, not to satisfy bureaucracy.

---

# AI Agent Rules

AI agents using this methodology must not:

- interpret every reusable-looking requirement as Platform Core;
- treat prototypes as production architecture;
- invent Domain boundaries without approval;
- treat Product and Domain as identical;
- convert business ideas directly into source code;
- create speculative modules;
- create speculative Domains;
- bypass discovery evidence;
- silently change architecture;
- assume a customer-specific workflow is globally reusable;
- treat future roadmap items as implementation tasks.

When ownership is unclear:

```text
STOP
→ Report
→ Architecture Evaluation
→ Decision
→ Resume
```

---

# Long-Term Objective

Create a repeatable method for turning real business knowledge into valuable, maintainable software.

The methodology should allow the organization to become progressively better at:

- understanding businesses;
- identifying valuable problems;
- validating solutions cheaply;
- designing focused products;
- preserving Domain knowledge;
- recognizing reusable SaaS capabilities;
- reducing repeated engineering effort;
- building successive products faster.

Every project should increase knowledge.

Some projects will also improve Platform Core.

That improvement must come from demonstrated reuse rather than obligation.

---

# Final Principle

Understand before committing.

Validate before scaling.

Prototype when it accelerates learning.

Document validated knowledge.

Keep business-specific meaning inside Domains.

Promote capabilities into Platform Core only when reuse is demonstrated.

Let Architecture decide ownership.

Let Engineering implement approved decisions.

Measure success through customer value, reusable knowledge and sustainable software.

Learn.

Improve.

Repeat.