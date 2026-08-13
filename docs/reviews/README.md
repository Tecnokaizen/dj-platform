---
title: Architecture Reviews
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ../architecture/README.md
  - ../architecture/DECISIONS.md
---

# Architecture Reviews

Current versioned reviews:

- `ARCHITECTURE_REVIEW_V1.md` — historical pre-implementation snapshot;
- `ARCHITECTURE_REVIEW_V2.md` — Platform Core Foundation closure;
- `ARCHITECTURE_REVIEW_V2_ADDENDUM.md` — post-closeout audit remediation record;
- `SECURITY_REVIEW_V1.md` — Platform Core Foundation security review;
- `SECURITY_REVIEW_V1_ADDENDUM.md` — post-closeout security remediation record;
- `CURSOR_READINESS_V1.md` — historical agent-readiness snapshot.

## Purpose

This directory contains formal reviews performed throughout the evolution of the platform.

Reviews evaluate whether documentation, architecture, implementation and operational reality remain aligned with the approved platform design.

Reviews are evidence-based snapshots in time.

They are not Living Architecture documents and must not be rewritten later merely to match a newer project state.

---

# Review Types

Review types may include:

- Architecture Review
- Platform Core Review
- Engineering Review
- Security Review
- Domain Review
- Implementation Review
- Production Readiness Review
- AI Agent / Cursor Readiness Review

Additional review types may be introduced when a real review need exists.

Do not create speculative reviews solely to fill a documentation structure.

---

# Review Lifecycle

A formal review follows this lifecycle:

1. Observation
2. Analysis
3. Findings
4. Recommendations
5. Approved Actions
6. Verification

A review records what was observed and concluded at the time it was performed.

Implementation plans belong in specifications, tasks, roadmaps or issue tracking rather than inside the review itself.

---

# Evidence

Review conclusions must be supported by observable project evidence.

Evidence may include:

- architecture documentation
- Core specifications
- Domain documentation
- source code
- database schema
- project configuration
- dependency manifests
- automated validation
- infrastructure configuration
- deployment state
- operational verification

The required evidence depends on the scope of the review.

Documentation alone cannot prove that an implementation capability exists.

Source code alone cannot prove that production infrastructure is operational.

Infrastructure presence alone cannot prove that an application capability has adopted it.

---

# Review Status

Reviews should distinguish clearly between concepts such as:

- Observed
- In Progress
- Ready
- Approved
- Conditional
- Blocked
- Superseded

Status language must describe reality rather than intention.

A review must not declare a capability Ready or Approved merely because implementation is planned.

---

# Historical Integrity

Once a formal review has been versioned as a project snapshot, its original findings should normally remain unchanged.

If project reality changes, create a new review.

Example:

`ARCHITECTURE_REVIEW_V1.md`

followed later by:

`ARCHITECTURE_REVIEW_V2.md`

An older review may be marked Superseded when a newer review replaces its conclusions, but its historical findings should remain available.

---

# Architecture Reviews

Architecture Reviews verify areas such as:

- ownership boundaries
- dependency direction
- Identity architecture
- tenancy
- authorization
- persistence
- Platform Core boundaries
- Domain independence
- infrastructure assumptions
- unresolved architecture decisions

Architecture Reviews do not substitute for ADRs.

ADRs record architectural decisions and their reasoning.

Reviews verify the state and consistency of the architecture.

---

# AI Agent Readiness Reviews

AI Agent or Cursor Readiness Reviews answer a specific question:

Can an implementation agent execute the approved work without having to make architectural decisions?

A positive readiness decision requires, at minimum:

- clear architecture boundaries
- explicit capability ownership
- current source structure
- implementation sequence
- target module specification
- engineering rules
- task definition
- known blockers identified
- unresolved architecture questions excluded from implementation scope

AI agents implement approved architecture.

They do not silently resolve architectural ambiguity.

---

# Production Readiness Reviews

Production readiness requires evidence beyond source implementation.

Depending on the product, verification may include:

- deployment
- environment isolation
- database migration strategy
- backups
- restore testing
- health/readiness verification
- logging
- monitoring
- security controls
- secrets management
- operational procedures

Production readiness must never be inferred solely from documentation maturity.

---

# Review Naming

Versioned reviews should use explicit names.

Examples:

`ARCHITECTURE_REVIEW_V1.md`

`ARCHITECTURE_REVIEW_V2.md`

`CURSOR_READINESS_V1.md`

`PRODUCTION_READINESS_V1.md`

The version identifies the review snapshot.

It does not represent the version of Platform Core itself.

---

# Principles

Reviews should be:

- objective
- evidence-based
- scoped
- actionable
- repeatable
- historically traceable

Reviews describe reality.

They expose gaps without silently solving them.

Approved actions resulting from a review are implemented through the appropriate architecture, specification, task or operational process.

---

# Current Review State

No formal versioned review currently exists in this directory.

Architecture and documentation consolidation is still in progress.

Formal Architecture Review and AI Agent / Cursor Readiness Review should be performed after the relevant documentation and implementation baseline has been consolidated and verified.

---

# Final Principle

Architecture improves through review.

Reviews preserve evidence.

Decisions belong to Architecture and ADRs.

Implementation belongs to engineering.

Readiness must be demonstrated, not assumed.
