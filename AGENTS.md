# AGENTS.md

> Master instructions for every AI agent working on DJ Platform.

---

# Purpose

This document defines how AI agents and human contributors must work inside this repository.

Its purpose is **not** to explain the product.

Its purpose is to define:

- how decisions are made
- how code is written
- how documentation evolves
- how architecture is protected
- how quality is maintained

Every AI agent must read this document before making changes.

---

# Project Mission

DJ Platform is an AI-native editorial platform focused on Electronic Dance Music.

The platform combines:

- structured data
- editorial content
- search
- rankings
- relationships
- discovery
- automation

The project prioritizes long-term maintainability over implementation speed.

---

# Source of Truth

The project follows a strict hierarchy.

```
User decision
        ↓
Architecture Decision Records (ADR)
        ↓
Product Documentation
        ↓
AGENTS.md
        ↓
Implementation
```

AI agents must never contradict higher levels.

---

# Repository Structure

```
docs/
tasks/
assets/
database/
scripts/
templates/
tests/
ai/
.cursor/
```

Every folder has a specific purpose.

Agents must respect the existing structure.

---

# Development Philosophy

The project follows these principles.

1. Documentation First

Implementation never precedes architecture.

---

2. AI Assisted

AI accelerates development.

AI does not replace engineering decisions.

---

3. Small Iterations

Large uncontrolled changes are forbidden.

Prefer many small improvements.

---

4. Predictability

Readable code is preferred over clever code.

---

5. Simplicity

Avoid unnecessary abstractions.

---

6. Scalability

Every important decision should support future growth.

---

# Decision Hierarchy

AI agents MAY decide:

- refactoring
- naming improvements
- formatting
- documentation updates
- reusable utilities
- internal optimizations

AI agents MUST NOT decide:

- authentication providers
- database technology
- deployment strategy
- SEO strategy
- routing architecture
- business rules
- domain model
- monetization
- licensing

Unless an ADR explicitly allows it.

---

# Mandatory Workflow

Every task follows the same lifecycle.

```
Understand

↓

Read documentation

↓

Plan

↓

Implement

↓

Validate

↓

Document

↓

Finish
```

Never skip documentation.

---

# Documentation Rules

Before implementing a feature, verify whether documentation already exists.

If documentation is missing:

Stop.

Do not invent product requirements.

---

Whenever implementation changes architecture, documentation must be updated first.

---

# Coding Principles

The project values:

Correctness

↓

Maintainability

↓

Readability

↓

Performance

↓

Speed

Never reverse this order.

---

# Architecture Rules

Business logic must remain independent.

Avoid tightly coupled components.

Prefer composition.

Keep responsibilities isolated.

Avoid circular dependencies.

---

# TypeScript

Mandatory.

Strict mode.

No `any`.

No ignored errors.

Prefer explicit types at boundaries.

---

# React

Prefer Server Components.

Use Client Components only when required.

Keep components focused.

Separate UI from business logic.

---

# Database

PostgreSQL.

Prisma ORM.

Never bypass Prisma unless documented.

Schema changes require migrations.

---

# Validation

Every external input must be validated.

Examples:

- forms
- APIs
- environment variables
- imports
- AI responses

Preferred validation library:

Zod.

---

# AI Generated Content

AI generated text is never considered verified.

Generated content must remain reviewable.

AI must never invent facts.

When uncertain:

State uncertainty.

Never fabricate information.

---

# SEO

SEO is part of the architecture.

Every public page must consider:

- metadata
- canonical
- structured data
- internal linking
- accessibility
- performance

SEO cannot be added later.

---

# Accessibility

Target:

WCAG 2.2 AA

Accessibility is not optional.

---

# Security

Never expose:

- secrets
- tokens
- credentials
- API keys

Never trust client input.

Validate everything.

---

# Git Workflow

Never commit directly to:

main

Development flow:

```
feature/*
        ↓
develop
        ↓
main
```

Commits must remain small and focused.

---

# Commit Messages

Preferred format.

```
feat:
fix:
docs:
refactor:
test:
chore:
```

Examples.

```
feat: add DJ profile model

docs: update architecture

fix: correct ranking pagination
```

---

# Testing

Before considering a task complete.

Minimum:

- lint
- typecheck
- unit tests

If tests cannot be executed:

Explicitly state it.

Never claim tests passed without running them.

---

# Performance

Measure first.

Optimize second.

Avoid premature optimization.

---

# Forbidden Actions

Never:

- rewrite architecture
- change stack
- delete documentation
- remove tests
- install dependencies without justification
- expose secrets
- ignore lint errors
- ignore TypeScript errors
- publish AI-generated facts without review

---

# ADR Compliance

Major decisions require an Architecture Decision Record.

Examples:

- database
- authentication
- deployment
- storage
- routing
- SEO
- infrastructure

If no ADR exists:

Stop.

Request a decision.

---

# Communication Style

When completing a task, report:

1. What changed

2. Files modified

3. Decisions taken

4. Risks

5. Remaining work

Never hide uncertainty.

---

# Definition of Done

A task is complete only if:

✓ Scope implemented

✓ Documentation updated

✓ Code reviewed

✓ Lint passes

✓ Typecheck passes

✓ Tests executed (or limitation documented)

✓ No secrets committed

✓ Repository remains buildable

---

# Continuous Improvement

If an agent identifies:

- duplicated documentation
- inconsistent naming
- architectural drift
- outdated files

It should propose improvements.

It must not silently apply large structural changes.

---

# Final Rule

This repository is intended to live for many years.

Every decision should optimize for long-term maintainability rather than short-term speed.

When in doubt:

Choose the solution that a new developer will understand in six months.