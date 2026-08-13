---
title: Engineering Handbook
version: 2.0.0
status: Living Document
owner: Engineering
updated: 2026-08-09
related:
  - ../architecture/README.md
  - ../business/README.md
  - ../reviews/README.md
  - AI_DEVELOPMENT_GUIDE.md
---

# Engineering Handbook

## Purpose

This directory defines the engineering standards used to implement the platform.

It applies equally to:

- human developers;
- AI coding agents;
- technical reviewers;
- future contributors.

Engineering documentation explains how approved Product and Architecture decisions should be implemented safely and consistently.

Engineering does not redefine Business Strategy or Architecture.

---

# Documentation Boundaries

The platform documentation has distinct responsibilities.

Business:

- defines why a Product exists;
- defines what customer value should be created.

Architecture:

- defines where responsibilities belong;
- defines system boundaries;
- defines dependency direction;
- defines ownership;
- defines major technical constraints.

Engineering:

- defines how approved Architecture is implemented.

Core module TASKS:

- define approved implementation work for Core capabilities.

Domain documentation:

- defines business-specific behavior and requirements.

Reviews:

- provide evidence-based evaluation of Architecture and readiness.

These responsibilities must remain separate.

---

# Engineering Principle

Engineering implements approved decisions.

Engineering must not silently create Architecture.

When implementation reveals an unresolved architectural question:

1. stop implementation;
2. document the question;
3. request Architecture evaluation;
4. record the approved decision;
5. update documentation when required;
6. resume implementation.

This applies to both humans and AI agents.

---

# Architecture Is Upstream

Before implementing work that affects architectural boundaries, Engineering should consult the relevant Architecture documentation.

Important areas include:

- Platform Core boundaries;
- Domain boundaries;
- Identity;
- tenancy;
- Roles;
- Memberships;
- Permissions;
- data ownership;
- source structure;
- API conventions;
- security;
- infrastructure boundaries.

Engineering may discover problems in Architecture.

It may not resolve those problems implicitly through code.

---

# Business Is Upstream

Engineering should not infer Product requirements from technical possibility.

A capability should not be implemented merely because:

- the framework supports it;
- a library makes it easy;
- an AI agent suggests it;
- another SaaS commonly includes it;
- it appears in a future Roadmap section.

Implementation requires an approved need.

---

# Product and Domain

Engineering must preserve the distinction:

    Product
    ≠ Domain

A Product is the customer-facing application or service.

A Business Domain owns Product-specific business behavior.

Platform Core owns reusable SaaS capabilities whose semantics are independent of a specific business vertical.

Engineering must not create direct Domain-to-Domain dependencies.

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

Responsibilities:

- `app` owns application composition and routing.
- `core` owns reusable SaaS capabilities.
- `domains` owns business-specific behavior.
- `shared` owns business-agnostic technical reuse.
- `lib` owns infrastructure adapters and provider connectivity.
- `generated` contains generated artifacts.
- `config` owns application configuration.

Implementation must respect these ownership boundaries.

---

# Dependency Direction

Approved dependencies:

- `app` may depend on `core`, `domains` and `shared`.
- `domains` may depend on `core`, `shared` and `lib`.
- `core` may depend on `shared` and `lib`.
- `lib` may depend on generated code anddomains`;
- `shared` to `core`;
- `shared` to `domains`;
- Domain A directly to Domain B.

Application composition may coordinate approved capabilities without transferring ownership.

---

# Engineering Decision Boundary

## Business Strategy Decides

Business Strategy determines:

- customer problems;
- Product opportunities;
- value propositions;
- commercial hypotheses;
- Product priorities;
- market validation.

## Architecture Decides

Architecture determines:

- capability ownership;
- Platform Core boundaries;
- Domain boundaries;
- dependency direction;
- tenancy;
- authorization;
- data ownership;
- infrastructure boundaries;
- major architectural patterns.

## Engineering Decides

Engineering determines implementation details inside approved boundaries.

Examples include:

- function decomposition;
- naming within conventions;
- internal algorithms;
- local refactoring;
- error-handling implementation;
- test implementation;
- provider adapter implementation;
- code organization inside an approved capability.

Engineering decisions must not contradict Architecture.

---

# Implementation Readiness

Before implementation begins, work should be sufficiently defined.

A prepared task should normally identify:

- objective;
- scope;
- architectural owner;
- affected capability;
- relevant documentation;
- constraints;
- expected behavior;
- acceptance criteria;
- validation steps;
- known blockers.

Documentation depth should reflect risk and architectural impact.

The primary readiness question is:

    Can the implementation agent execute the approved work
    without making architectural decisions?

If the answer is no, the task is not ready.

The missing Business or Architecture decision must be resolved first.

---

# AI Agents

AI coding agents are implementation agents.

They may:

- implement approved tasks;
- create tests;
- perform constrained refactors;
- update implementation documentation;
- identify inconsistencies;
- identify missing requirements;
- report architectural questions;
- run validation commands;
- propose implementation alternatives within approved boundaries.

They must not independently redefine foundational Architecture.

---

# AI Stop Rule

An AI agent must stop when it encounters:

- unclear ownership;
- conflicting Architecture documents;
- missing business rules;
- unresolved tenancy behavior;
- unresolved authorization behavior;
- unclear Domain boundaries;
- a required architectural decision;
- a change that would introduce forbidden dependencies;
- a requirement that contradicts approved documentation.

Expected behavior:

1. stop;
2. describe the blocker;
3. explain why implementation cannot proceed safely;
4. request the appropriate Business or Architecture decision.

Guessing is not acceptable.

---

# Human and AI Quality Standard

Human-written and AI-generated code are subject to the same engineering standard.

AI-generated code is not considered correct merely because it:

- compiles;
- looks plausible;
- follows common framework patterns;
- was generated by a capable model.

It must satisfy the same:

- Architecture;
- business rules;
- validation;
- testing;
- security;
- review requirements.

---

# Small and Reviewable Changes

Prefer small, coherent implementation steps.

Avoid combining unrelated work such as:

- feature implementation;
- Architecture refactor;
- dependency upgrade;
- source reorganization;
- unrelated cleanup;

unless explicitly approved as one coordinated change.

Smaller changes are easier to validate, review, revert and understand.

---

# Refactoring

Refactoring must preserve approved behavior unless behavioral change is explicitly part of the task.

Before broad refactoring, determine:

- what problem is being solved;
- which boundaries are affected;
- whether Architecture changes;
- what validation protects existing behavior.

Do not perform speculative cleanup merely because code could be organized differently.

---

# Infrastructure Providers

Provider-specific implementation should remain isolated where practical.

Examples include:

- authentication providers;
- database clients;
- storage providers;
- email services;
- AI providers;
- external APIs.

Business behavior should not depend unnecessarily on provider SDK semantics.

Infrastructure isolation should be pragmatic rather than absolute.

---

# Security

Security is an implementation requirement, not a later cleanup phase.

Engineering must respect:

- authentication boundaries;
- authorization checks;
- tenant isolation;
- input validation;
- secrets management;
- safe provider configuration;
- least privilege;
- safe error handling;
- data integrity.

Security-sensitive shortcuts require explicit review.

---

# Identity

Authentication identity and application identity remain distinct.

The authentication provider owns canonical authentication identity.

Application `Profile` represents application identity inside the platform.

Engineering must not introduce a second canonical Prisma `User` model.

---

# Tenancy

`Organization` is the canonical tenant boundary.

Engineering must not create competing tenancy concepts.

Tenant-aware behavior must use the approved Organization and Membership architecture.

Ownership is represented through:

- Organization;
- ACTIVE Membership;
- OWNER Role.

Do not introduce `ownerUserId`, `ownerId` or `ownerProfileId` as a second Organization ownership system.

---

# Authorization

Authorization must follow the approved model:

    ACTIVE Membership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission

Do not introduce alternative authorization systems inside Products or Domains.

Domain-specific permission keys may use the Core authorization engine.

Domain-specific business meaning remains in the Domain.

---

# Core Foundation Sequence

Current approved Foundation implementation order:

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

Engineering tasks should respect this dependency order unless Architecture explicitly approves a change.

---

# Validation

Implementation is not complete until appropriate validation succeeds.

Current repository validation includes:

    npm run typecheck
    npm run lint

These checks are important.

They are not equivalent to comprehensive automated testing.

---

# Testing

Automated testing is an important platform maturity requirement.

Testing should progressively cover:

- Core invariants;
- tenancy;
- authorization;
- Domain behavior;
- critical application flows;
- data migrations;
- infrastructure boundaries;
- regression-sensitive behavior.

The automated testing foundation is still evolving.

Do not claim production confidence from lint and type checking alone.

---

# Acceptance Criteria

Implementation tasks should define observable completion conditions.

Good acceptance criteria describe behavior and can be verified independently.

Example:

    When an Organization is created through the approved onboarding flow,
    an ACTIVE Membership using the OWNER Role is created in the same transaction.

Weak acceptance criteria include:

- code looks good;
- feature completed;
- works as expected.

---

# Validation Evidence

Where practical, implementation work should record:

- commands executed;
- test results;
- migration results;
- known limitations;
- remaining blockers.

Assertions without validation are insufficient.

---

# Implementation Does Not Equal Production

Completed code does not automatically mean Production Ready.

Production readiness may additionally require:

- automated tests;
- migration verification;
- deployment verification;
- security review;
- backup validation;
- monitoring;
- operational procedures;
- environment validation;
- readiness review.

Engineering documentation must distinguish implementation completion from production readiness.

---

# Reviews

Formal reviews live under `docs/reviews/`.

Reviews are evidence-based snapshots.

Potential reviews include:

- Architecture Review;
- AI Agent / Cursor Readiness Review;
- Production Readiness Review.

Engineering must not treat readiness as proven merely because documentation exists.

---

# Engineering Documentation

Current Engineering documents:

- `README.md`
- `AI_DEVELOPMENT_GUIDE.md`

Potential future documents may include:

- `CODE_REVIEW_GUIDE.md`
- `TESTING_GUIDE.md`
- `RELEASE_GUIDE.md`
- `GIT_WORKFLOW.md`
- `CI_CD_GUIDE.md`

Their appearance here does not authorize automatic creation.

They should be introduced when real engineering needs justify them.

---

# Engineering Standards vs Implementation Tasks

This directory defines standards.

It must not become the Product backlog.

For Core modules, implementation tasks may live in:

    docs/core/modules/<module>/TASKS.md

Domain implementation tasks should remain associated with their Domain or approved implementation planning.

---

# Documentation Conflicts

When documentation sources disagree:

1. stop;
2. identify the conflict;
3. determine the appropriate decision owner;
4. resolve the decision;
5. update documentation;
6. resume implementation.

Do not silently make source code the new Architecture.

---

# ADRs

Architecturally significant decisions should be represented by ADRs when appropriate.

Engineering agents may identify the need for an ADR.

They must not invent an architectural decision and document it afterward as though it had already been approved.

---

# Git Discipline

Changes should remain understandable and reviewable.

Prefer commits representing coherent units of work.

Avoid combining unrelated modifications in the same implementation step.

Do not commit:

- secrets;
- local environment files;
- editor artifacts;
- temporary generated files;
- build artifacts that should remain ignored.

Repository-specific Git workflow may be documented separately when required.

---

# Dependency Discipline

Do not add a dependency merely because it simplifies a local implementation.

Before adding one, consider:

- existing platform capability;
- maintenance burden;
- package maturity;
- security impact;
- runtime or bundle impact;
- provider coupling;
- licensing;
- long-term ownership.

Architecturally significant dependencies require explicit evaluation.

---

# No Speculative Engineering

Do not implement future capabilities merely because they appear in strategic documentation.

Examples include:

- future Core modules;
- future Domains;
- marketplace infrastructure;
- generic billing;
- queue systems;
- event architecture;
- AI orchestration;
- storage abstractions;
- feature flags.

Implement them only when approved requirements justify them.

---

# Simplicity

Prefer the simplest implementation that satisfies:

- approved requirements;
- architectural boundaries;
- expected scale;
- security;
- maintainability;
- validation needs.

Simplicity does not mean bypassing Architecture.

It means avoiding unnecessary complexity inside correct boundaries.

---

# Engineering Success Indicators

Engineering is succeeding when:

- implementation matches approved Architecture;
- source ownership remains clear;
- Domain boundaries remain clean;
- Core remains business-agnostic;
- changes are small and reviewable;
- validation is repeatable;
- critical invariants are tested;
- architectural questions are surfaced rather than guessed;
- AI-generated work requires progressively less correction;
- documentation and source remain synchronized.

---

# Engineering Failure Indicators

Engineering is failing when:

- implementation agents invent Architecture;
- Product and Domain are treated as synonyms;
- Core depends on Domains;
- Domains depend directly on other Domains;
- Shared contains hidden business logic;
- provider SDKs spread into business behavior;
- major changes lack validation;
- lint and typecheck are treated as full testing;
- speculative modules are implemented;
- documentation and source diverge silently;
- production readiness is claimed without evidence;
- unrelated changes are bundled into implementation tasks.

---

# AI Agent Rules

AI agents working on this repository must:

- read relevant documentation before implementation;
- respect source ownership;
- respect dependency direction;
- implement only approved scope;
- preserve Product and Domain separation;
- preserve Core and Domain boundaries;
- validate changes;
- report blockers;
- stop on unresolved Architecture.

AI agents must not:

- create Architecture implicitly;
- create speculative Core capabilities;
- create speculative Domains;
- introduce alternative identity systems;
- introduce alternative tenancy systems;
- introduce alternative authorization systems;
- create direct Domain-to-Domain dependencies;
- treat Roadmap items as implementation tasks;
- claim production readiness without evidence.

---

# Final Engineering Rule

Before implementation ask:

- Is the objective clear?
- Is ownership clear?
- Is Architecture clear?
- Is scope clear?
- Are acceptance criteria clear?
- Can the work be validated?
- Can implementation proceed without making architectural decisions?

If yes:

1. implement;
2. validate;
3. review.

If no:

1. stop;
2. resolve the missing decision;
3. then implement.

---

# Final Principle

Business defines value.

Architecture defines boundaries.

Engineering implements approved solutions.

Humans and AI follow the same quality standard.

Implementation must produce evidence.

Unresolved Architecture must be surfaced, not guessed.

Build only what is justified.

Keep changes understandable.

Validate before declaring completion.
