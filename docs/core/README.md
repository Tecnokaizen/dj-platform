# Platform Core Modules

## Purpose

This directory contains the functional specifications for reusable Platform Core modules.

Architecture documentation explains how the platform is built.

Core module documentation explains what each reusable capability does.

Business-specific functionality belongs to Domains.

---

# Core Modules

Current modules:

- Organizations
- Memberships
- Roles
- Permissions
- Notifications
- Audit
- Settings
- Billing
- Storage

Additional modules may be introduced as Platform Core evolves.

---

# Documentation Structure

Each Core module should contain, when applicable:

```text
SPEC.md
DATA_MODEL.md
FLOWS.md
API.md
PRISMA.md
TASKS.md
```

## SPEC.md

Defines the functional responsibility of the module.

## DATA_MODEL.md

Defines entities, relationships and constraints.

## FLOWS.md

Defines user flows and system workflows.

## API.md

Defines the public interfaces exposed by the module.

## PRISMA.md

Defines persistence decisions and Prisma implementation.

## TASKS.md

Defines implementation tasks and acceptance criteria.

---

# Module Lifecycle

Every Core module follows the same lifecycle:

1. Functional Specification
2. Data Model
3. Flows
4. Public Interfaces
5. Persistence Design
6. Implementation Tasks
7. Implementation
8. Testing
9. Documentation Review

Documentation always precedes implementation.

---

# Dependency Rules

Core modules may depend on other Core modules when explicitly documented.

Dependencies must remain directional and acyclic.

Business Domains may consume Core modules.

Core modules must never depend on Domains.

---

# Design Principles

Every Core module should be:

- Business agnostic
- Reusable
- Independently testable
- Secure by default
- Well documented
- Stable through clear public interfaces

---

# Current Roadmap

Initial Platform Core modules:

```text
Organizations
Roles
Memberships
Permissions
Notifications
Audit
Settings
Billing
Storage
```

Organizations establishes the canonical tenant boundary. Roles and Memberships provide the authorization position and tenant relationship required for tenancy, while Permissions completes fine-grained authorization after Tenancy Integration.
