# Project Structure

## Purpose

This document defines the directory structure of Platform Core.

Every repository built on this architecture must follow the same organization.

The goal is consistency, scalability and maintainability.

---

# Root Structure

```
src/

app/

core/

shared/

domains/

generated/

lib/
```

---

# app/

Contains the application entry points.

Responsibilities:

- Routing
- Layouts
- Pages
- Route groups
- Metadata

Contains no business logic.

---

# core/

Contains reusable platform capabilities.

Examples:

Authentication

Profiles

Organizations

Roles

Permissions

Settings

Dashboard

Billing

Notifications

Storage

The Core is business agnostic.

---

# shared/

Contains reusable technical resources.

Examples:

Components

UI

Hooks

Utilities

Providers

Validators

Types

Icons

Constants

Shared contains no business logic.

---

# domains/

Contains every business application.

Each Domain owns its business.

Example:

```
domains/

dj/

copy/

crm/
```

Domains may depend on Core and Shared.

Domains never depend on other Domains.

---

# generated/

Contains generated code.

Examples:

Prisma Client

Generated Types

Never edit manually.

---

# lib/

Contains infrastructure integrations.

Examples:

Supabase

Prisma

Redis

External SDKs

Infrastructure only.

---

# Documentation

Documentation mirrors the source code.

```
docs/

architecture/

domains/

business/
```

---

# Naming Rules

Folders use:

kebab-case

Modules use:

singular names

Examples:

profile

organization

notification

Avoid:

profiles

notifications

organizations

unless representing collections.

---

# Dependency Rules

Allowed:

Domain

↓

Shared

↓

Core

↓

Infrastructure

Not allowed:

Core

↓

Domain

---

# Rule of Thumb

When creating a new feature ask:

Is it reusable by every SaaS?

↓

YES

↓

Core

---

Is it reusable by every Domain?

↓

YES

↓

Shared

---

Is it specific to one business?

↓

YES

↓

Domain