---
title: AI Development Guide
version: 2.0.0
status: Living Document
owner: Engineering
updated: 2026-08-09
related:
  - README.md
  - ../architecture/README.md
  - ../business/README.md
  - ../reviews/README.md
  - ../PLATFORM_MATURITY.md
---

# AI Development Guide

## Purpose

This document defines how AI implementation agents must work inside the repository.

The objective is not to maximize code generation.

The objective is to produce correct, maintainable and verifiable implementation while preserving approved architectural boundaries.

AI coding agents are implementation agents.

They do not make unresolved architectural decisions during implementation.

---

# Core Principle

The expected relationship is:

    Business
    → defines value and Product requirements

    Architecture
    → defines ownership and system boundaries

    Engineering
    → defines implementation standards

    Implementation Agent
    → executes approved work

    Review
    → verifies evidence

AI implementation agents operate inside this model.

---

# Implementation Agents Are Not Architecture Owners

An implementation agent must not silently decide:

- capability ownership;
- Platform Core boundaries;
- Domain boundaries;
- tenancy architecture;
- authorization architecture;
- identity architecture;
- major persistence strategy;
- dependency direction;
- new foundational abstractions;
- major infrastructure strategy.

If implementation requires one of these decisions, the agent must stop and report the blocker.

---

# Architecture Roles and AI

AI may assist with architectural analysis when explicitly operating in an Architecture role.

That is different from an AI coding agent implementing an approved task.

The rule is role-based:

    Architecture Agent or Architect
    → may analyze and propose architecture

    Implementation Agent
    → implements approved architecture

An implementation session must not become an architecture session implicitly.

---

# Before Writing Code

Before implementarstand the requested objective;
2. identify the architectural owner;
3. read the documentation relevant to that capability;
4. inspect the current source affected by the task;
5. identify constraints and acceptance criteria;
6. confirm that no unresolved architectural decision is required;
7. identify how the change will be validated.

Do not begin by generating code from the task title alone.

---

# Context Is Risk-Based

AI agents do not need to read the entire repository before every small change.

Required context should be proportional to the task.

A local implementation may require:

- the current task;
- the owning module specification;
- relevant Engineering standards;
- affected source files.

A change affecting foundational architecture may additionally require:

- Architecture documentation;
- ADRs;
- Core specifications;
- Domain documentation;
- Security documentation;
- Data architecture;
- tenancy or authorization documentation.

Read enough context to implement safely.

Do not load unrelated documentation merely for completeness.

---

# Recommended Reading Order

For architecture-sensitive work, use approximately:

    Approved Task
        ↓
    Owning Capability Documentation
        ↓
    Relevant Architecture
        ↓
    Relevant Business or Domain Requirements
        ↓
    Relevant Engineering Standards
        ↓
    Current Source
        ↓
    Validation Requirements

The exact reading set depends on the task.

---

# Sources of Truth

No single documentation file should be treated blindly as absolute truth.

Relevant evidence may include:

- approved Architecture documents;
- accepted ADRs;
- Core specifications;
- Domain specifications;
- Engineering standards;
- approved implementation tasks;
- current source;
- current database schema;
- current package configuration;
- validated runtime behavior.

When these agree, implementation can proceed.

When they conflict, stop and report the conflict.

Do not silently choose whichever source is easiest to implement.

---

# Documentation and Source Conflict

If documentation and source disagree:

1. identify the exact conflict;
2. determine whether source is outdated or documentation is outdated;
3. determine whether the difference affects Architecture or behavior;
4. request the appropriate decision when necessary;
5. update the authoritative documentation if approved;
6. then implement the corrected behavior.

Source code must not silently redefine Architecture.

Documentation must not be followed blindly when repository evidence proves it stale.

---

# Product and Domain

AI agents must preserve:

    Product
    ≠ Domain

A Product is customer-facing.

A Business Domain owns business-specific behavior.

Platform Core owns reusable SaaS capabilities whose semantics are independent of a particular business vertical.

Never treat Product names as automatic Domain creation instructions.

---

# Platform Core

Platform Core contains reusable SaaS capabilities.

Current Foundation architecture includes:

    Identity
    Organizations
    Roles
    Memberships
    Permissions

Tenancy Integration connects the Foundation capabilities into the tenant model.

Planned future capabilities must not be treated as implemented capabilities.

---

# Core Promotion Rule

Never use:

    Could another Product use this?
    → Platform Core

Potential reuse is insufficient.

Before proposing Core ownership, evaluate:

- who owns the semantic meaning;
- whether the behavior is independent of a business vertical;
- whether reuse is demonstrated by real requirements;
- whether an existing Core capability already solves the problem;
- whether Core ownership reduces duplication without introducing business coupling.

Architecture decides final ownership.

Implementation agents do not promote behavior into Core automatically.

---

# Business Domains

Domains own business-specific:

- entities;
- rules;
- workflows;
- lifecycle semantics;
- validation;
- permissions meaning;
- integrations when business-specific;
- AI behavior when business-specific.

Domains may consume Platform Core capabilities.

Domains must not depend directly on other Domains.

---

# Source Ownership

Current high-level source structure:

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

Ownership:

- `app` → application composition and routing;
- `core` → reusable SaaS capabilities;
- `domains` → business-specific behavior;
- `shared` → business-agnostic technical reuse;
- `lib` → infrastructure adapters and provider connectivity;
- `generated` → generated artifacts;
- `config` → application configuration.

---

# Dependency Rules

Allowed:

    app
    → core / domains / shared

    domains
    → core / shared / lib

    core
    → shared / lib

    lib
    → generated / external providers

Forbidden:

    core
    → domains

    shared
    → core

    shared
    → domains

    Domain A
    → Domain B

If implementation appears to require a forbidden dependency, stop.

Do not work around the rule with aliases, dynamic imports or duplicated logic.

---

# Identity Rule

Supabase authentication identity is the canonical authentication identity.

Application `Profile` represents application identity.

Do not introduce a second canonical Prisma `User` model.

A DJ is not equivalent to an authenticated platform user.

---

# Tenancy Rule

`Organization` is the canonical tenant boundary.

Ownership is represented through:

    Organization
    +
    ACTIVE Membership
    +
    OWNER Role

Do not create a competing ownership field such as:

    ownerUserId
    ownerId
    ownerProfileId

Organization creation and ownership must follow the approved Core architecture.

---

# Authorization Rule

Initial authorization architecture is:

    ACTIVE Membership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission

Do not introduce:

- wildcard permission systems;
- implicit OWNER bypass;
- alternative Product-specific authorization engines;
- role inheritance;
- deny rules;
- arbitrary permission overrides;

unless Architecture explicitly approves them.

Domain permission keys may use the Core authorization engine.

Domain meaning remains in the Domain.

---

# Core Foundation Implementation Sequence

Current approved sequence:

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

Implementation agents should not reorder Foundation dependencies without an approved architectural reason.

---

# Implementation Scope

AI agents should implement only approved scope.

Avoid:

- unrelated cleanup;
- speculative abstractions;
- opportunistic framework migration;
- unnecessary dependency upgrades;
- unrelated source movement;
- future feature implementation;
- architecture redesign during feature work.

If an adjacent problem is discovered, report it separately.

---

# Small Changes

Prefer small, reviewable changes.

A focused implementation is easier to:

- understand;
- validate;
- review;
- revert;
- debug;
- compare against acceptance criteria.

Large changes require stronger justification and validation.

---

# Refactoring

Refactoring is allowed when required by approved work.

It should improve one or more of:

- readability;
- maintainability;
- correctness;
- consistency;
- testability;
- dependency compliance.

Refactoring must not silently alter business behavior or Architecture.

Do not refactor for stylistic preference alone.

---

# New Dependencies

Do not add packages automatically.

Before introducing a dependency, determine:

- whether an existing package already solves the need;
- whether the platform already provides the capability;
- maintenance burden;
- security implications;
- package maturity;
- runtime or bundle impact;
- provider coupling;
- licensing implications.

Architecturally significant dependencies require explicit approval.

---

# No Speculative Engineering

Strategic documentation may mention future capabilities.

That does not authorize implementation.

Do not create:

- future Core modules;
- future Domains;
- generic Billing;
- event buses;
- queue infrastructure;
- marketplace infrastructure;
- advanced AI orchestration;
- feature flag systems;
- storage abstractions;

merely because they appear in Roadmaps or strategy documents.

Implement approved needs only.

---

# Documentation During Implementation

Documentation should evolve when implementation changes approved behavior, implementation contracts or operational knowledge.

Do not use the rigid rule:

    Documentation always before code

Appropriate workflows may include:

    Approved Specification
    → Implementation
    → Validation
    → Documentation Update

or:

    Prototype
    → Learning
    → Decision
    → Documentation
    → Permanent Implementation

The correct sequence depends on the type of work.

Architectural decisions must still be resolved before an implementation agent silently commits to them.

---

# Testing

Implementation should be designed to be testable.

Prefer:

- deterministic behavior;
- explicit inputs and outputs;
- isolated business rules;
- controlled infrastructure boundaries;
- observable failures.

Avoid hidden side effects where practical.

---

# Current Validation

Current repository validation includes:

    npm run typecheck
    npm run lint

These commands must be run when relevant to the change.

Passing them does not prove complete correctness.

They do not replace automated behavioral testing.

---

# Automated Testing

Automated testing is a pending platform maturity capability.

As the testing foundation grows, tests should protect:

- Core invariants;
- tenancy;
- authorization;
- Domain behavior;
- critical user flows;
- migrations;
- integration boundaries.

Do not claim test coverage that does not exist.

---

# Validation Evidence

At completion, an AI agent should report relevant evidence.

Examples:

- files changed;
- commands executed;
- typecheck result;
- lint result;
- test result;
- migration result;
- known limitation;
- remaining blocker.

Do not report success without validating the relevant behavior.

---

# Acceptance Criteria

Acceptance criteria should describe observable completion.

Prefer:

    Creating an Organization through the approved onboarding flow
    creates an ACTIVE OWNER Membership in the same transaction.

Avoid:

    Feature works.

    Code completed.

    Looks correct.

Implementation agents should validate against acceptance criteria rather than against their own generated code.

---

# Error Handling

Important failures must not be silently swallowed.

Errors should be:

- explicit;
- actionable;
- safe;
- observable when appropriate.

User-facing errors must not expose secrets or sensitive implementation details.

Business failures and infrastructure failures should remain distinguishable when behavior depends on that distinction.

---

# Security

Security is part of implementation.

AI agents must respect:

- authentication;
- authorization;
- tenant isolation;
- input validation;
- data integrity;
- secrets management;
- least privilege;
- safe errors;
- provider configuration.

Security-sensitive shortcuts require review.

---

# Generated Code

Generated source is not architectural ownership.

For example:

    src/generated/

may contain generated Prisma artifacts.

Do not place business behavior there or treat generated structure as the Domain model.

---

# Git Changes

Each commit should represent a coherent logical change when commits are part of the implementation workflow.

Do not interpret this as:

    code and documentation can never share a commit

Code, tests and documentation may belong in the same commit when they represent one logical change.

Avoid mixing unrelated:

- features;
- refactors;
- dependency upgrades;
- infrastructure changes;
- cleanup.

---

# Pull Requests

When Pull Requests are used, the implementation should make clear:

- what changed;
- why it changed;
- which approved requirement it satisfies;
- how it was validated;
- what remains pending.

Not every local implementation step requires a Pull Request.

---

# ADRs

When implementation reveals a significant architectural decision:

1. stop;
2. describe the decision required;
3. request Architecture evaluation;
4. create or update an ADR when appropriate;
5. wait for the decision;
6. resume implementation.

An implementation agent must not choose the architecture first and write an ADR afterward as retroactive justification.

---

# Stop Conditions

Stop implementation when:

- ownership is unclear;
- specifications conflict;
- an architectural decision is missing;
- a business rule is missing;
- acceptance criteria cannot be determined;
- implementation requires a forbidden dependency;
- security implications are unresolved;
- tenancy semantics are unresolved;
- authorization semantics are unresolved;
- required source context is unavailable;
- implementation would exceed approved scope materially.

---

# Stop Report

A useful blocker report contains:

- what was being implemented;
- where the blocker appeared;
- what is unclear;
- why guessing would be unsafe;
- which decision is required;
- what work can continue independently, if any.

The objective is to make architectural resolution fast.

---

# AI Decision Rule

When uncertain, distinguish between:

    Implementation Detail

and:

    Architecture or Business Decision

For a normal implementation detail:

- choose the simplest solution consistent with repository conventions;
- implement;
- validate.

For Architecture or Business uncertainty:

- stop;
- report;
- request a decision.

Do not escalate trivial implementation choices unnecessarily.

Do not guess on foundational decisions.

---

# Implementation Readiness

Before starting significant work ask:

- Is the objective clear?
- Is scope clear?
- Is ownership clear?
- Are relevant rules documented?
- Are acceptance criteria clear?
- Are dependency boundaries clear?
- Is validation possible?
- Can implementation proceed without making architectural decisions?

If yes, implement.

If no, resolve the missing decision first.

---

# Completion Rule

Implementation is complete only when the relevant work has been:

1. implemented;
2. validated;
3. checked against acceptance criteria;
4. documented where required;
5. reported with remaining limitations.

Implementation completion does not automatically mean Production Ready.

---

# Production Readiness

Production readiness may additionally require:

- automated testing;
- migration verification;
- environment validation;
- security review;
- deployment verification;
- backups;
- monitoring;
- operational procedures;
- readiness review.

AI agents must not infer Production readiness from successful local implementation.

---

# Continuous Improvement

Every implementation should produce useful evidence and learning.

It does not need to modify:

- Platform Core;
- Architecture;
- Engineering standards;
- documentation;

merely to qualify as an improvement.

A correct implementation that requires no architectural changes may be evidence that existing boundaries are working well.

---

# AI Agent Readiness

The long-term objective is not maximum AI autonomy.

The objective is reliable AI-assisted engineering.

The key question is:

    Can the implementation agent execute approved work
    without making architectural decisions?

Better documentation, clearer architecture, stronger tests and narrower tasks should progressively increase that reliability.

---

# Success Indicators

AI-assisted development is succeeding when:

- agents respect ownership;
- changes remain within approved scope;
- architecture is not silently modified;
- validation is consistently executed;
- blockers are surfaced early;
- speculative engineering decreases;
- corrections after implementation decrease;
- tests protect important invariants;
- source and documentation remain aligned.

---

# Failure Indicators

AI-assisted development is failing when:

- agents invent architecture;
- roadmap ideas become source code automatically;
- Product and Domain are treated as synonyms;
- Domain behavior leaks into Core;
- forbidden dependencies appear;
- alternative identity or tenancy models appear;
- tests or validation are skipped;
- stale documentation is followed blindly;
- source silently overrides documented architecture;
- production readiness is claimed without evidence.

---

# Final Principle

AI accelerates engineering.

Approved Architecture defines boundaries.

Business requirements define value.

Implementation agents execute approved work.

Evidence validates completion.

Unresolved architecture is reported, not guessed.

Potential reuse does not automatically create Platform Core.

Future Roadmap ideas do not automatically create implementation tasks.

Build the approved scope.

Validate it.

Report what remains.
