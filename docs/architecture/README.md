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
8. TENANCY.md
9. DATA.md
10. SECURITY.md

## Infrastructure

11. API.md
12. CACHE.md
13. DEPLOYMENT.md
14. TECH_STACK.md
15. PRISMA_IMPLEMENTATION.md

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

Business Domains consume Platform Core without creating direct Domain-to-Domain dependencies. Platform Core may evolve when product requirements reveal genuinely reusable SaaS capabilities.

---

# Architectural Decision Records

Significant new architectural decisions should normally be documented as ADRs before implementation. Established decisions that predate ADR formalization should be backfilled.

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
