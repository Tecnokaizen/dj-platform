# Platform Core Documentation

This repository contains the documentation for Platform Core and the business Domains built on top of it.

Platform Core is a reusable SaaS foundation designed to support multiple business applications without changing the underlying architecture.

---

# Documentation Structure

```
docs/

README.md
INDEX.md

adr/

architecture/

domains/

business/
```

---

# Architecture

The **architecture** folder contains the reusable Platform Core documentation.

Topics include:

- Core Philosophy
- Domains
- Architecture
- Identity
- Data
- Security
- API
- Deployment
- Technology Stack
- Development Conventions

Platform documentation is business agnostic.

---

# Domains

Every business application is implemented as an independent Domain.

Current domains:

```
docs/domains/

dj/
```

Each Domain owns its own:

- Vision
- PRD
- Architecture
- Database
- AI
- Business documentation

Platform Core never contains business logic.

---

# ADR

Architectural Decision Records document important technical decisions made during the evolution of the platform.

Examples:

- Authentication
- Database
- Storage
- Organizations
- Billing

---

# Business

Reserved for business documentation that is independent from the platform implementation.

Examples:

- Pricing
- Monetization
- Marketing
- Go-To-Market
- Competitor Analysis

---

# Philosophy

Platform Core provides reusable capabilities.

Domains provide business knowledge.

The Core should never depend on any Domain.

Domains may use Platform Core but remain independent from one another.