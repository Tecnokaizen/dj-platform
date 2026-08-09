---
title: AI Agent Repository Instructions
version: 2.0.0
status: Living Document
updated: 2026-08-09
related:
  - PROJECT_CONTEXT.md
  - docs/architecture/README.md
  - docs/engineering/README.md
  - docs/engineering/AI_DEVELOPMENT_GUIDE.md
  - docs/PLATFORM_MATURITY.md
---

# AGENTS.md

## Purpose

This document defines the repository-level rules for AI agents working on DJ Platform and Platform Core.

It is not the Product specification.

It is not the Architecture specification.

It is the operational contract for how an AI agent should work inside this repository.

Every implementation agent must read this document and `PROJECT_CONTEXT.md` before significant changes.

---

# Project Context

DJ Platform is the first Product being built on a reusable SaaS foundation called Platform Core.

The repository contains:

- Product composition;
- Platform Core;
- Business Domains;
- frontend implementation;
- backend implementation;
- infrastructure adapters;
- documentation;
- operational standards.

Product and Domain are not synonyms.

---

# Primary Rule

AI implementation agents implement approved work.

They do not silently create Architecture.

Before implementation, ask:

    Can this task be completed
    without making an unresolved architectural decision?

If yes:

    Implement
    → Validate
    → Report

If no:

    STOP
    → Describe the missing decision
    → Request resolution
    → Resume afterward

---

# AI Roles

AI may operate in different roles.

An AI explicitly acting as:

    Architecture Agent
    → may analyze and propose Architecture

An AI acting as:

    Implementation Agent
    → implements approved Architecture

An implementation task must not silently turn into an Architecture redesign.

---

# Required Initial Context

Before significant implementation, read:

1. `PROJECT_CONTEXT.md`
2. `AGENTS.md`
3. relevant Architecture documentation
4. relevant Core or Domain documentation
5. relevant Engineering standards
6. current source affected by the task

Context depth should be proportional to task risk.

Do not load the entire repository documentation for every trivial change.

---

# Sources of Truth

No single file should be followed blindly.

Relevant evidence may include:

- approved Architecture;
- accepted ADRs;
- Core specifications;
- Domain specifications;
- Engineering standards;
- approved tasks;
- current source;
- Prisma schema;
- package configuration;
- runtime infrastructure.

When evidence agrees, proceed.

When evidence materially conflicts, stop and report the conflict.

Source code does not silently redefine Architecture.

Documentation must not be followed blindly when repository evidence proves it stale.

---

# Documentation Boundaries

Business:

- defines Product value;
- defines customer problems;
- defines commercial direction.

Architecture:

- defines ownership;
- defines boundaries;
- defines dependencies;
- defines tenancy;
- defines authorization;
- defines major technical decisions.

Engineering:

- defines implementation standards.

Core:

- defines reusable SaaS capabilities.

Domains:

- define business-specific semantics.

Backend and Frontend:

- define technical implementation standards.

Operations:

- defines deployment and runtime standards.

ADRs:

- record significant architectural decisions.

Reviews:

- evaluate readiness using evidence.

---

# Product and Domain

Never assume:

    Product
    = Domain

A Product is customer-facing.

A Business Domain owns business-specific semantics.

A Product may compose:

- Platform Core;
- one or more Business Domains;
- Shared technical UI;
- infrastructure.

---

# Platform Core Rule

Platform Core contains reusable SaaS capabilities whose semantics are independent from a specific business vertical.

Never use:

    Could another Product reuse this?
    → Platform Core

Potential reuse is insufficient.

Core ownership requires architectural justification.

---

# Current Core Foundation

Approved Foundation sequence:

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

Organizations, Roles, Memberships and Permissions have approved specifications but remain implementation work.

Do not skip Foundation dependencies without Architecture approval.

---

# Identity Rule

Supabase authentication identity is the canonical authentication identity.

Application identity is:

    Profile

Do not introduce a second canonical Prisma `User` model.

A DJ or artist is a Domain entity.

A DJ is not an authenticated platform user by definition.

---

# Tenancy Rule

`Organization` is the canonical tenant boundary.

Organization ownership is represented by:

    Organization
    +
    ACTIVE OrganizationMembership
    +
    OWNER Role

Do not introduce:

- `ownerUserId`
- `ownerId`
- `ownerProfileId`

as a second Organization ownership system.

---

# Authorization Rule

Current authorization architecture:

    ACTIVE Membership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission

Do not introduce alternative authorization engines without Architecture approval.

Do not add:

- wildcard permissions;
- implicit OWNER bypass;
- role inheritance;
- arbitrary deny rules;
- Product-specific permission engines;

unless explicitly approved.

---

# Source Structure

Current high-level source structure:

    src/
    ├── app/
    ├── config/
    ├── core/
    │   ├── identity/
    │   └── modules/
    ├── domains/
    │   └── dj/
    ├── generated/
    │   └── prisma/
    ├── lib/
    └── shared/

---

# Source Ownership

`src/app`

- routing;
- layouts;
- Product composition;
- framework entry points.

`src/core`

- reusable SaaS capabilities.

`src/domains`

- business-specific semantics.

`src/shared`

- business-agnostic technical reuse.

`src/lib`

- infrastructure adapters;
- provider connectivity.

`src/generated`

- generated source.

`src/config`

- application configuration.

---

# Dependency Direction

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

If implementation appears to require a forbidden dependency:

    STOP

Do not hide the dependency through:

- aliases;
- dynamic imports;
- duplicated logic;
- indirect provider calls.

---

# Application Composition

`src/app` composes capabilities.

Composition does not transfer ownership.

A route exposing DJ behavior does not make DJ behavior App-owned.

A route exposing Organization behavior does not make Organization behavior App-owned.

---

# Shared Rule

Shared contains business-agnostic technical reuse.

Do not move business semantics into Shared merely because code is reusable.

Before promoting code to Shared, verify:

- multiple real consumers exist;
- semantics are business-agnostic;
- abstraction improves maintainability;
- dependency direction remains valid.

---

# Infrastructure Rule

Provider-specific implementation should remain isolated where practical.

Typical provider-facing implementation belongs under:

    src/lib/

Examples may include:

- Supabase;
- PostgreSQL adapters;
- email providers;
- storage providers;
- AI providers;
- external APIs.

Infrastructure adapters do not own business semantics.

---

# Current Stack

Current approved repository stack includes:

- Next.js 16;
- React 19;
- TypeScript 5;
- Tailwind CSS 4;
- PostgreSQL;
- Prisma 7;
- Supabase Auth;
- `@supabase/ssr`;
- `@supabase/supabase-js`;
- `pg`;
- npm.

Verify exact versions from `package.json` when implementation depends on them.

---

# Do Not Assume Dependencies

Do not assume the repository contains:

- Auth.js;
- Zod;
- shadcn/ui;
- OpenAI SDK;
- Anthropic SDK;
- Vitest;
- Playwright;
- Storybook;
- Redis;
- queue frameworks.

Check `package.json` before using any library.

---

# Dependency Installation

Do not install a package merely because it makes implementation easier.

Before adding one, evaluate:

- whether an existing dependency already solves the need;
- maintenance cost;
- security impact;
- bundle or runtime impact;
- provider coupling;
- licensing;
- long-term ownership.

Architecturally significant dependencies require explicit review.

---

# TypeScript

TypeScript is mandatory for repository application code.

Prefer:

- explicit types at important boundaries;
- narrow types;
- predictable contracts;
- generated Prisma types where appropriate.

Avoid unnecessary `any`.

Do not silence meaningful TypeScript errors merely to make validation pass.

---

# React and Next.js

Follow current Next.js App Router conventions.

Prefer Server Components where they fit the requirement.

Use Client Components when browser-side interactivity requires them.

Do not move protected business behavior to the client for convenience.

---

# Business Logic

Business rules belong to the capability that owns them.

Do not hide business logic inside:

- route files;
- React components;
- provider adapters;
- generic Shared utilities;
- queue handlers;
- webhook transport.

UI and transport should delegate to approved capability behavior.

---

# Database

Current persistence uses:

- PostgreSQL;
- Prisma.

Database implementation must respect:

- architectural ownership;
- transaction boundaries;
- tenant isolation;
- constraints;
- migration safety.

Do not bypass Prisma casually.

Raw SQL may be appropriate when approved requirements cannot be expressed safely through current Prisma capabilities.

Validate Prisma capabilities against the actual installed version before relying on advanced features.

---

# Migrations

Schema changes require migration awareness.

Before significant database changes determine:

- expected schema impact;
- existing data impact;
- compatibility;
- rollback or forward-fix strategy;
- production implications when applicable.

Do not generate destructive migrations blindly.

---

# Input Validation

External input must be validated appropriately.

Examples:

- forms;
- APIs;
- Server Actions;
- webhooks;
- imports;
- environment configuration;
- external provider data;
- AI-generated structured output.

Validation requirements depend on the boundary.

Do not assume Zod or another validation library is installed.

---

# Security

Never expose:

- passwords;
- tokens;
- API keys;
- database credentials;
- authentication secrets.

Never trust unvalidated external input.

Protected behavior requires server-side authorization.

Client-side visibility is not security.

---

# SEO

SEO is a Product concern.

It is not automatically a Platform Core capability.

Business Domains may provide SEO semantics.

App composition may expose:

- metadata;
- canonical URLs;
- public routes;
- structured data.

Shared may provide generic technical helpers.

Follow:

    docs/backend/seo/README.md

---

# Frontend

Reusable UI does not automatically belong to Platform Core.

Typical ownership:

    App
    → Product composition

    Core
    → UI for Core capabilities

    Domain
    → business-specific UI

    Shared
    → business-agnostic UI primitives

Do not move Domain semantics into Shared components.

---

# Accessibility

Accessibility is a frontend engineering requirement.

Follow:

    docs/frontend/ACCESSIBILITY.md

Do not reduce accessibility for visual convenience.

---

# Storage

Object storage is infrastructure.

Storage is not currently assumed to be an implemented Platform Core capability.

Do not create:

- generic File models;
- Core Storage;
- provider abstractions;
- signed URL infrastructure;

without approved requirements.

---

# Jobs and Queues

Backend documentation defines standards for Jobs and Queues.

That does not mean queue infrastructure currently exists.

Do not introduce:

- Redis;
- workers;
- queue frameworks;
- event buses;
- dead-letter queues;

speculatively.

---

# AI Providers

Do not assume a specific AI provider SDK is installed.

AI functionality may belong to Core, Domain or application behavior depending on the capability.

Do not use:

    AI
    → Platform Core

Provider selection and abstraction require real requirements.

---

# No Speculative Engineering

Strategic documentation may describe future capabilities.

Roadmap presence does not authorize implementation.

Do not implement future:

- Billing;
- Storage;
- Search;
- Jobs;
- Queues;
- event architecture;
- white-label systems;
- generic AI orchestration;
- feature flags;

unless approved requirements require them.

---

# Task Scope

Implement only approved scope.

Avoid combining unrelated:

- features;
- refactors;
- dependency upgrades;
- source moves;
- infrastructure changes;
- cleanup.

Report adjacent issues separately.

---

# Refactoring

Refactoring is allowed when justified by the task.

Refactoring should preserve approved behavior unless behavior change is explicitly part of the task.

Do not perform broad cleanup merely because code could be organized differently.

---

# Documentation

Documentation should remain aligned with repository reality.

Do not use the absolute rule:

    Documentation must always be written before code.

Appropriate workflows may differ.

Architectural decisions must still be resolved before implementation silently commits to them.

When implementation reveals stale documentation:

1. identify the conflict;
2. determine the correct decision owner;
3. resolve the issue;
4. update documentation;
5. continue.

---

# ADRs

Significant architectural decisions should be represented by ADRs when appropriate.

An implementation agent may identify that an ADR is required.

It must not:

1. choose a foundational architecture;
2. implement it;
3. create an ADR afterward as retroactive justification.

ADR need depends on architectural significance.

Not every implementation detail requires an ADR.

---

# Testing

Current repository baseline validation includes:

    npm run typecheck
    npm run lint

Comprehensive automated behavioral testing is still a maturity gap.

Do not claim unit, integration or end-to-end tests passed unless they actually exist and were executed.

---

# Validation

Before declaring implementation complete, run validation appropriate to the task.

Current baseline:

    npm run typecheck
    npm run lint

Additional validation may include:

- tests;
- migrations;
- runtime checks;
- authentication verification;
- database verification;
- manual Product flow validation.

Report what was actually executed.

---

# Definition of Done

A task is complete when the relevant requirements have been:

- implemented;
- validated;
- checked against acceptance criteria;
- documented where required;
- reported with known limitations.

Implementation completion does not automatically mean Production Ready.

---

# Production

Do not assume:

- Production exists;
- Staging exists;
- monitoring exists;
- backups are verified;
- restore procedures are tested;
- deployment is automated.

Production status requires runtime evidence.

---

# Operations

AI agents must not perform destructive or production-impacting operations without explicit scope and sufficient context.

Stop when:

- target environment is unclear;
- backup state is unknown before destructive work;
- rollback behavior is unclear;
- customer data may be affected unexpectedly;
- infrastructure reality conflicts with documentation.

---

# Git

Keep changes understandable and reviewable.

Prefer coherent commits when commits are requested.

Do not assume a specific branch workflow such as:

    feature
    → develop
    → main

unless repository documentation or explicit instruction defines it.

Do not commit:

- secrets;
- `.env` files containing credentials;
- local editor artifacts;
- ignored build output;
- temporary generated files that should remain ignored.

---

# Commit Messages

When commits are requested, use concise messages describing the logical change.

Conventional prefixes may be used when appropriate:

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`

Do not create commits unless requested or clearly part of the approved workflow.

---

# Pull Requests

When Pull Requests are part of the workflow, report:

- what changed;
- why;
- relevant requirement;
- validation performed;
- known risks;
- remaining work.

A local implementation step does not automatically require a Pull Request.

---

# Generated Code

Generated source is not architectural ownership.

Example:

    src/generated/prisma/

Do not place business behavior in generated code.

Do not manually edit generated artifacts unless the tooling explicitly requires it.

---

# Error Handling

Important failures must not disappear silently.

Errors should be:

- explicit;
- safe;
- diagnosable;
- actionable where appropriate.

Do not expose internal secrets or sensitive implementation details to users.

---

# AI-Generated Content

AI-generated factual content is not automatically verified.

When Product functionality publishes factual material:

- preserve source provenance where required;
- keep output reviewable;
- do not fabricate missing facts;
- distinguish inference from known data.

Domain requirements determine final review workflow.

---

# AI Stop Conditions

Stop implementation when:

- ownership is unclear;
- Architecture conflicts;
- a business rule is missing;
- acceptance criteria cannot be determined;
- tenancy semantics are unresolved;
- authorization semantics are unresolved;
- a forbidden dependency appears necessary;
- security consequences are unresolved;
- a foundational dependency decision is required;
- repository evidence contradicts the task materially.

---

# AI Stop Report

A useful blocker report contains:

- what was being implemented;
- where the blocker appeared;
- what is unclear;
- why guessing would be unsafe;
- which decision is required;
- what can continue independently, if anything.

---

# Implementation Decisions

Implementation agents may make normal implementation decisions inside approved boundaries.

Examples:

- local variable naming;
- function decomposition;
- simple internal algorithms;
- component decomposition;
- test organization;
- local error handling;
- small refactors.

Do not escalate every trivial implementation choice.

---

# Architecture Decisions

Stop before deciding:

- new capability ownership;
- Core vs Domain boundaries;
- tenancy model;
- authorization model;
- identity model;
- major infrastructure strategy;
- major persistence strategy;
- cross-Domain dependencies;
- new foundational frameworks.

---

# Reporting

After implementation, report concisely:

1. what changed;
2. files changed;
3. validation executed;
4. known limitations;
5. remaining blockers.

Do not claim validation that was not executed.

---

# Current Priorities

Current repository priorities are:

1. maintain documentation and source alignment;
2. complete context instructions;
3. backfill foundational ADRs;
4. perform formal Architecture Review;
5. perform AI Agent / Cursor Readiness Review;
6. validate repository state;
7. resume Core Foundation implementation.

Agents must not jump ahead to unrelated strategic capabilities.

---

# Success Indicators

AI-assisted development is healthy when:

- ownership remains clear;
- dependency direction remains valid;
- Core remains business-agnostic;
- Domains retain business semantics;
- Shared remains business-agnostic;
- provider code remains isolated;
- changes remain within scope;
- validation is repeatable;
- blockers are surfaced early;
- repository reality matches documentation.

---

# Failure Indicators

AI-assisted development is unhealthy when:

- implementation agents invent Architecture;
- Product and Domain are treated as synonyms;
- reusable code is automatically moved to Core;
- Domain semantics leak into Shared;
- provider SDKs spread into business behavior;
- speculative infrastructure is introduced;
- undocumented dependencies are assumed;
- lint and typecheck are described as complete testing;
- production readiness is claimed without evidence;
- documentation and source diverge silently.

---

# Final Rule

Understand the task.

Identify ownership.

Read relevant context.

Respect Architecture.

Implement approved scope.

Validate actual behavior.

Report evidence.

Stop on unresolved foundational decisions.

Do not guess Architecture.

Do not build speculative capability.

Keep the repository understandable.
