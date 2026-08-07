# Platform Core

## Purpose

Platform Core is the reusable foundation that powers every SaaS product built within this ecosystem.

It provides the common capabilities required by any business application while remaining completely independent from any specific industry or business domain.

Platform Core is not a product.

It is the operating system on which products are built.

---

# Philosophy

The platform follows one fundamental principle:

> Business logic belongs to Domains.
>
> Reusable capabilities belong to the Core.

The Core must never contain business-specific concepts.

Examples of business concepts are:

- Tracks
- Orders
- Customers
- Products
- Invoices
- Playlists

Those entities belong to their corresponding Domain.

---

# Responsibilities

Platform Core is responsible for:

- Identity
- Authentication
- Authorization
- Profiles
- Organizations
- Memberships
- Roles
- Permissions
- Settings
- Dashboard
- Storage
- Notifications
- Billing
- Audit
- Feature Flags
- Integrations

Every domain may use these services.

The Core never depends on a Domain.

---

# Architecture

The platform is divided into three layers.

```
Platform Core
        │
        ▼
Shared Layer
        │
        ▼
Business Domains
```

Dependencies are always one-directional.

```
Domain
   │
   ▼
Shared
   │
   ▼
Core
```

The reverse dependency is never allowed.

---

# What belongs to the Core

Examples:

- User authentication
- User profile
- Session management
- Role management
- Organizations
- Team invitations
- Billing
- Notifications
- Global dashboard
- Platform settings

---

# What does NOT belong to the Core

Examples:

- Music tracks
- Artists
- Playlists
- Orders
- Print jobs
- SEO keywords
- Products

Those concepts are implemented inside Domains.

---

# Multi-domain philosophy

Every business application is implemented as a Domain.

Examples:

```
Platform Core

↓

DJ Platform

↓

Track
```

```
Platform Core

↓

Copy Platform

↓

Order
```

```
Platform Core

↓

SEO Platform

↓

Keyword
```

The Core remains exactly the same.

Only the Domain changes.

---

# Design principles

Platform Core follows these principles.

## Business agnostic

The Core never knows the business.

---

## Reusable

Every feature implemented in the Core should be reusable by any Domain.

---

## Independent

Domains never depend on other Domains.

---

## Extensible

Adding a new Domain should require little or no modification to the Core.

---

## Secure by default

Security is implemented in the Core, not duplicated across Domains.

---

## Documentation first

Every capability must be specified before implementation.

---

# Long-term vision

The objective of Platform Core is to become the reusable foundation for multiple SaaS products.

The first implementation is DJ Platform.

Future implementations may include:

- Copy Platform
- CRM Platform
- SEO Platform
- Restaurant Platform
- ERP Platform

without changing the Core architecture.