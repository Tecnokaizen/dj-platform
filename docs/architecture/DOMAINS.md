# Domains

## Purpose

A Domain represents a complete business application built on top of Platform Core.

Platform Core provides reusable capabilities.

Domains provide business logic.

Every product built on the platform is implemented as a Domain.

---

# Philosophy

The platform separates generic capabilities from business knowledge.

```
Platform Core
        │
        ▼
Shared Layer
        │
        ▼
Business Domains
```

The Core never contains business entities.

Domains never contain platform infrastructure.

---

# What is a Domain?

A Domain encapsulates everything related to a specific business.

Examples:

- DJ Platform
- Copy Platform
- CRM Platform
- SEO Platform
- Restaurant Platform

Every Domain owns:

- Business entities
- Business rules
- Domain services
- Domain UI
- Domain documentation

---

# Domain Independence

Domains are isolated.

A Domain:

- may use Platform Core
- may use Shared
- may NOT depend on another Domain

Allowed:

```
DJ Domain
    │
    ▼
Platform Core
```

Not allowed:

```
DJ Domain
    │
    ▼
Copy Domain
```

Business domains must remain independent.

---

# Standard Domain Structure

Every Domain follows the same structure.

```
domains/

<domain>/

    actions/

    components/

    services/

    repositories/

    schemas/

    validators/

    hooks/

    types/
```

Additional folders may be added when justified.

---

# Domain Responsibilities

A Domain owns:

Business entities

Business workflows

Business validation

Business services

Business documentation

Business UI

Everything related to the industry belongs here.

---

# What does NOT belong to a Domain

A Domain must never implement:

Authentication

Authorization

Profiles

Organizations

Billing

Notifications

Storage

Platform Settings

Those responsibilities belong to Platform Core.

---

# Communication with Platform Core

Domains interact with the Core through its public services.

Examples:

Authentication

Profile

Organization

Storage

Notifications

Domains never access Core internals directly.

---

# Shared Layer

Domains may use the Shared layer.

Examples:

UI Components

Utilities

Hooks

Validators

Types

Icons

Providers

Shared contains reusable code only.

Shared contains no business logic.

---

# Documentation

Each Domain maintains its own documentation.

Example:

```
docs/

domains/

    dj/

        PRD.md

        VISION.md

        architecture/

        database/
```

Platform documentation remains under:

```
docs/architecture/
```

---

# Lifecycle of a New Domain

Every new business application follows the same process.

1. Create the Domain folder.
2. Define the Product Vision.
3. Write the PRD.
4. Define the Domain Data Model.
5. Implement services.
6. Implement UI.
7. Integrate with Platform Core.
8. Document the Domain.

---

# Design Principles

Every Domain should be:

Independent

Replaceable

Documented

Testable

Reusable

Business-focused

A Domain should never duplicate capabilities already provided by Platform Core.

---

# Examples

Example 1

Platform Core

↓

DJ Platform

↓

Artists

Tracks

Playlists

Imports

---

Example 2

Platform Core

↓

Copy Platform

↓

Customers

Orders

Production

Deliveries

---

Example 3

Platform Core

↓

CRM Platform

↓

Companies

Contacts

Deals

Tasks

---

# Long-term Vision

Platform Core should support multiple Domains without modification.

Adding a new business application should only require creating a new Domain.

The Core remains unchanged.

The business changes.