# Documentation Guide

Welcome to the DJ Platform documentation.

This directory contains the complete knowledge base of the project.

The documentation is organized by domains rather than by chronology.

Every contributor—human or AI—should consult the relevant documentation before implementing new functionality.

---

# Documentation Principles

The documentation is considered part of the product.

Code and documentation evolve together.

If implementation changes but documentation does not, the task is incomplete.

---

# Reading Order

New contributors should follow this order.

1. `/PROJECT_CONTEXT.md`
2. `/AGENTS.md`
3. `/README.md`
4. `/docs/foundation/`
5. `/docs/architecture/`
6. `/docs/domain/`
7. `/docs/frontend/`
8. `/docs/backend/`
9. `/docs/seo/`
10. `/docs/operations/`

---

# Documentation Domains

## Foundation

Defines the product itself.

Includes:

- Vision
- PRD
- Roadmap
- Glossary

---

## Architecture

Explains how the system is built.

Includes:

- System Architecture
- Tech Stack
- Database
- APIs
- Authentication
- Deployment
- Architectural Decisions

---

## Domain

Defines the business entities.

Examples:

- DJ
- Genre
- Festival
- Ranking
- Track
- Playlist
- Label

---

## Frontend

Documents:

- Design System
- Components
- Pages
- UI patterns
- Accessibility

---

## Backend

Documents:

- Services
- Validation
- Importers
- AI integrations
- Business logic

---

## SEO

Contains:

- URL Strategy
- Metadata
- Structured Data
- Internal Linking
- Content Strategy

---

## Operations

Contains:

- Deployment
- Monitoring
- Security
- Backups
- Maintenance

---

## ADR

Architecture Decision Records.

Every important technical decision must be documented before implementation.

Examples:

- Why Prisma was selected.
- Why PostgreSQL was selected.
- Why Coolify was selected.

---

# Documentation Rules

Every document should:

- solve one problem
- have a single responsibility
- avoid duplication
- reference related documents
- remain concise when possible

---

# Naming Convention

Use:

UPPER_CASE.md

Examples:

```
PRD.md

VISION.md

DATABASE.md

AUTH.md
```

Avoid:

```
prd-final.md

new-document.md

document-v2.md
```

Versioning belongs inside the document, not in the filename.

---

# Ownership

Documentation belongs to the project.

Not to a developer.

Not to an AI.

Every contributor is responsible for keeping it accurate.

---

# Documentation Workflow

```
Idea

↓

Documentation

↓

Review

↓

Architecture

↓

Implementation

↓

Testing

↓

Deployment
```

Implementation never comes first.

---

# Golden Rule

If a future developer cannot understand the project by reading this documentation, then the documentation is incomplete.