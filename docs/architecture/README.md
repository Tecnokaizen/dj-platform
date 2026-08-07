# Platform Core Architecture

This directory contains the architectural documentation for Platform Core.

Platform Core is a reusable SaaS foundation designed to support multiple business applications while remaining completely independent from any specific business domain.

Business-specific documentation belongs under:

```text
docs/domains/
```

---

# Reading Order

## Foundation

1. CORE.md
2. DOMAINS.md
3. ARCHITECTURE.md

## Development

4. PROJECT_STRUCTURE.md
5. SOURCE_STRUCTURE.md
6. CONVENTIONS.md

## Core Capabilities

7. IDENTITY.md
8. DATA.md
9. SECURITY.md

## Infrastructure

10. API.md
11. CACHE.md
12. DEPLOYMENT.md
13. TECH_STACK.md
14. PRISMA_IMPLEMENTATION.md

---

# Supporting Documents

- PLATFORM_CORE_SPEC.md
- DECISIONS.md

---

# Architecture Principles

Platform Core follows these principles:

- Business-Agnostic Core
- Domain-Driven Design
- Server-First Architecture
- Documentation First
- AI-Assisted Development
- Separation of Responsibilities

Business Domains extend Platform Core without modifying its architecture.

---

# Architectural Decision Records

Long-term architectural decisions should be documented as ADRs before implementation.

See:

```text
docs/adr/
```

---

# Documentation Ownership

Platform-wide documentation belongs here.

Business documentation belongs under:

```text
docs/domains/<domain>/
```