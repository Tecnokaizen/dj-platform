# PROJECT_CONTEXT

> Executive summary for AI agents and developers.

Last Updated: 2026-08-03

---

# Project

Name

DJ Platform

Repository

dj-platform

Status

Planning & Architecture Phase

Current Sprint

Sprint 00 — Foundation

---

# Mission

DJ Platform is an AI-native editorial platform focused on Electronic Dance Music.

The goal is to build the most complete knowledge platform for DJs by combining:

- structured data
- editorial content
- rankings
- genres
- festivals
- sessions
- relationships
- discovery
- AI-assisted workflows

---

# Current Phase

The project is **NOT** in development.

The current objective is:

- define architecture
- define product
- define domain
- define database
- define workflows
- define documentation

Implementation has not started.

---

# Current Stack

Frontend

- Next.js

Backend

- Next.js

Language

- TypeScript

Database

- PostgreSQL

ORM

- Prisma

Authentication

- Auth.js

Validation

- Zod

Infrastructure

- Docker
- Coolify

AI

Primary

- OpenAI

Secondary

- Anthropic

---

# Documentation Structure

```
docs/

foundation/
architecture/
domain/
frontend/
backend/
seo/
operations/
adr/
```

---

# Repository Structure

```
assets/
database/
docs/
prisma/
public/
scripts/
src/
tasks/
templates/
tests/
ai/
.cursor/
```

---

# Current Documentation

Completed

- README
- AGENTS
- PROJECT_CONTEXT

In Progress

- Vision
- PRD

Pending

- Architecture
- Database
- API
- Domain
- Design System
- SEO
- Deployment
- ADR

---

# Development Rules

Always read:

1. PROJECT_CONTEXT.md

2. AGENTS.md

3. Relevant documentation

before changing anything.

---

# Decision Hierarchy

Product Owner

↓

ADR

↓

Documentation

↓

AGENTS

↓

Implementation

---

# Coding Philosophy

The project values

Correctness

↓

Maintainability

↓

Readability

↓

Scalability

↓

Performance

↓

Speed

---

# AI Philosophy

AI assists development.

AI never replaces engineering decisions.

AI must not invent product requirements.

AI must not modify architecture without approval.

---

# Current Priorities

Priority 1

Complete Foundation documentation.

Priority 2

Define Architecture.

Priority 3

Define Domain Model.

Priority 4

Define Database.

Priority 5

Initialize project.

---

# Current Sprint

Sprint 00

Objectives

- Documentation
- Architecture
- Repository organization
- Coding standards
- Development workflow

Deliverables

- README
- PROJECT_CONTEXT
- AGENTS
- Vision
- PRD
- Roadmap
- ADR foundation

---

# Known Decisions

Architecture

Pending

Database

PostgreSQL

ORM

Prisma

Deployment

Coolify

Authentication

Auth.js

Language

TypeScript

Package Manager

Pending

Testing

Pending

Storage

Pending

---

# Next Document

docs/foundation/VISION.md

---

# Long-Term Vision

The repository should become self-explanatory.

A new developer or AI agent should understand the project in less than five minutes by reading:

1. PROJECT_CONTEXT.md

2. AGENTS.md

3. README.md

4. The relevant documentation for the task.

If additional explanations are required, documentation is considered incomplete.