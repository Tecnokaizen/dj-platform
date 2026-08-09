---
title: Routing Standards
version: 2.0.0
status: Living Document
owner: Frontend
updated: 2026-08-09
related:
  - ../architecture/PROJECT_STRUCTURE.md
  - ../architecture/SOURCE_STRUCTURE.md
  - ../architecture/CONVENTIONS.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
  - README.md
  - NAVIGATION.md
  - ../backend/seo/README.md
---

# Routing Standards

## Purpose

This document defines frontend routing standards for Products built on the platform.

Routing is application composition.

Routes expose approved Platform Core and Business Domain capabilities through Product-specific URLs.

Routing does not transfer ownership of the underlying capability.

---

# Core Principle

Keep these concerns separate:

    Capability Ownership
        ↓
    Product Composition
        ↓
    Route Exposure

A Business Domain may own the meaning of a resource.

Platform Core may own a reusable SaaS capability.

The App layer composes those capabilities into routes.

---

# Route Ownership

The Next.js route tree belongs primarily to application composition.

In the current source architecture:

    src/app/
    → route definitions
    → layouts
    → route groups
    → framework entry points
    → Product composition

Routes may expose:

- Platform Core capabilities;
- Business Domain capabilities;
- Product-level pages;
- public resources;
- authenticated application areas.

The existence of a route does not change capability ownership.

---

# Route Examples

A route exposing a Core capability may look like:

    /profile
    /organizations
    /organizations/{slug}/members

The route belongs to Product composition.

Profile, Organization or Membership behavior remains owned by the relevant Core capability.

A route exposing Domain behavior may look like:

    /djs
    /djs/{slug}
    /festivals
    /playlists/{slug}

The route belongs to Product composition.

DJ-specific semantics remain owned by the DJ Domain.

---

# Do Not Treat Routes as Core Ownership

Do not use:

    Global route
    → Platform Core

or:

    Reused route pattern
    → Platform Core

Routing reuse and SaaS capability ownership are different concerns.

---

# Next.js App Router

The current platform uses the Next.js App Router.

Routing should follow framework conventions where practical.

Avoid custom routing abstractions unless a demonstrated requirement justifies them.

---

# Resource-Oriented URLs

Public resource URLs should normally represent resources.

Prefer:

    /articles
    /articles/{slug}

rather than:

    /getArticle
    /loadArticle

Actions belong to application behavior rather than URL verbs in most public resource routing.

---

# URL Design

Public URLs should normally be:

- stable;
- readable;
- deterministic;
- understandable;
- appropriate for Product requirements.

SEO-sensitive public routes should also consider discoverability and canonical behavior.

---

# Internal Identifiers

Avoid exposing internal identifiers unnecessarily.

Public identifiers may use:

- slugs;
- public IDs;
- stable external identifiers;
- database identifiers when requirements justify them.

Do not impose slug-only routing universally.

The correct public identifier depends on the Product and resource.

---

# Dynamic Segments

Dynamic route parameters should have clear meaning.

Examples:

    /djs/{slug}

    /organizations/{organizationId}

The correct parameter depends on whether the route is:

- public;
- internal;
- tenant-aware;
- SEO-sensitive;
- operational.

Do not expose implementation details without a reason.

---

# Nested Routes

Nested routes should represent useful Product or resource relationships.

Example:

    /organizations/{organizationId}/members

or:

    /festivals/{slug}/artists

Avoid unnecessary nesting that makes URLs harder to understand or maintain.

---

# Route Groups

Next.js Route Groups may organize application implementation without changing public URLs.

They may be useful for:

- authenticated areas;
- public areas;
- admin composition;
- shared layouts;
- Product-level organization.

Route Groups are implementation structure.

They are not architectural ownership boundaries by themselves.

---

# Layouts

Layouts belong to application composition unless a specific capability owns a reusable UI element represented inside them.

Layouts may compose:

- Product shells;
- navigation;
- tenant context;
- authentication state;
- shared UI;
- Core UI;
- Domain UI.

A shared layout does not automatically belong to Platform Core.

---

# Product Shells

Different Products may require different application shells.

Examples may include:

- public content Product;
- authenticated SaaS dashboard;
- administration interface;
- operational workspace.

Product shell differences should not require duplicating underlying Core or Domain behavior.

---

# Loading States

Routes should provide meaningful loading behavior where asynchronous rendering makes it useful.

Loading UI should:

- communicate progress;
- preserve layout stability where practical;
- avoid misleading users;
- remain consistent with the Product experience.

Not every route requires a custom loading screen.

---

# Error States

Error handling may include:

- not found;
- unauthorized;
- forbidden;
- validation failure;
- dependency failure;
- unexpected application failure.

Application composition may provide shared error presentation.

Core and Domain capabilities determine the meaning of their own failures.

Do not make Platform Core the automatic owner of every error page.

---

# Not Found

Public resources should return appropriate not-found behavior when the requested resource does not exist or is not publicly available.

Not-found behavior must not expose private resource existence unnecessarily.

---

# Authorization

Protected routes require server-side authorization for protected operations and resources.

Client-side route guards or UI checks may improve user experience.

They do not replace backend authorization.

---

# Authentication

Authentication-sensitive routing must follow the approved Identity architecture.

Authentication identity comes from the configured authentication provider.

Application identity is represented by `Profile`.

Routing must not introduce an alternative user identity model.

---

# Tenancy

Tenant-aware routes must follow the approved Organization and Membership model.

A route may include tenant context explicitly:

    /organizations/{organizationId}/...

or application context may resolve the current Organization through another approved mechanism.

Routing must not invent a second tenancy model.

---

# Route Authorization and Membership

Access to tenant-aware routes may depend on:

    Profile
        ↓
    ACTIVE Membership
        ↓
    Organization
        ↓
    Role / Permissions

The route itself does not define authorization semantics.

It consumes approved authorization behavior.

---

# Navigation

Routing and navigation are related but separate.

Routing defines reachable application locations.

Navigation determines which destinations are presented to users.

A valid route does not need to appear in navigation.

Navigation standards are defined in:

    docs/frontend/NAVIGATION.md

---

# Metadata

Route-level metadata is application composition.

Business Domains may provide semantic metadata inputs.

Core capabilities may provide semantic inputs for Core-owned resources.

Shared utilities may assist with generic formatting.

Final metadata composition may occur at the application route level.

Metadata does not automatically require Platform Core SEO infrastructure.

Follow:

    docs/backend/seo/README.md

---

# Canonical URLs

Public routes may require canonical URLs.

Canonical behavior should align with:

- actual Product routing;
- public resource identity;
- localization;
- publication state.

Canonical generation does not automatically belong to Platform Core.

---

# URL Changes

Public URL changes should be intentional.

When relevant, consider:

- redirects;
- existing inbound links;
- bookmarks;
- SEO impact;
- canonical changes;
- analytics;
- external references.

Do not change established public URLs as incidental refactoring.

---

# Redirects

Redirects may be required for:

- slug changes;
- legacy routes;
- route restructuring;
- Product migrations;
- renamed resources.

Redirect behavior belongs to application routing unless another approved capability owns the underlying policy.

Do not create a generic redirect platform without demonstrated requirements.

---

# Internationalization

If Product requirements include localization, routing may support:

- locale segments;
- localized slugs;
- alternate public URLs;
- locale-specific metadata.

Routing must follow the approved Product localization strategy.

Do not build localization infrastructure speculatively.

---

# Public and Private Routes

Routes may be:

- public;
- authenticated;
- tenant-scoped;
- role-restricted;
- permission-restricted;
- internal;
- administrative.

Visibility and authorization are different concerns.

Hiding a route from navigation does not secure it.

---

# Domain Routes

Domain-specific routes expose Domain-owned behavior.

Example:

    DJ Domain
        ↓
    Artist Resource
        ↓
    /djs/{slug}

The route belongs to application composition.

Artist semantics remain in the DJ Domain.

Do not move Domain business rules into route files merely because the route exposes the resource.

---

# Core Capability Routes

Core capability routes expose reusable SaaS behavior.

Example:

    Organizations Core Module
        ↓
    Organization Management UI
        ↓
    /organizations

Organization semantics remain in Core.

The App layer exposes the capability through the Product.

---

# Route Files

Route files should remain focused on composition.

They may:

- resolve route parameters;
- call approved services;
- compose UI;
- enforce route-level access;
- configure metadata;
- handle framework concerns.

They should not become hidden owners of business logic.

---

# Server and Client Boundaries

Next.js routing may involve Server Components and Client Components.

Use Client Components when browser-side interactivity requires them.

Keep server-capable behavior on the server where practical.

Do not move protected business operations to the client merely for convenience.

---

# Performance

Routing implementation should consider:

- server rendering;
- caching;
- data loading;
- route transitions;
- payload size;
- unnecessary client-side JavaScript.

Performance decisions should reflect actual Product requirements and measurable behavior.

---

# Testing

Routing tests should progressively cover important behavior such as:

- public routes;
- protected routes;
- tenant access;
- redirects;
- not-found behavior;
- dynamic parameters;
- canonical behavior when relevant;
- critical navigation integrity.

Testing depth depends on Product risk and current testing maturity.

---

# Current vs Future

This document defines standards.

It does not prove the repository currently contains:

- complete public DJ routing;
- complete tenant routing;
- internationalized routing;
- redirect management infrastructure;
- automated routing tests;
- full SEO route coverage.

Implementation status must be verified from source and runtime evidence.

---

# AI Development Rules

AI implementation agents must not:

- treat routes as Platform Core ownership;
- move Domain semantics into route files;
- create undocumented route hierarchies;
- invent public URL strategy;
- change public URLs incidentally;
- bypass server-side authorization;
- invent tenant routing semantics;
- assume localization exists;
- create speculative routing abstractions;
- infer implementation from this document alone.

If route ownership or public URL behavior is unclear:

1. identify the capability being exposed;
2. identify its architectural owner;
3. identify Product routing requirements;
4. determine the correct App composition;
5. request clarification when a Product or Architecture decision is missing.

---

# Success Indicators

Routing is healthy when:

- App composition owns route exposure;
- Core and Domain semantics remain with their owners;
- public URLs are predictable;
- protected routes enforce server-side security;
- tenancy follows Organization and Membership;
- route files remain thin;
- metadata reflects real resource semantics;
- URL changes are deliberate;
- implementation status matches repository evidence.

---

# Failure Indicators

Routing is unhealthy when:

- Platform Core becomes the owner of all routes;
- layouts are treated as Core solely because they are shared;
- Domain business logic accumulates in route files;
- UI route guards become the only security layer;
- public URLs change during unrelated refactors;
- tenant identity is inferred from arbitrary route state;
- metadata contradicts Product routing;
- undocumented route abstractions appear.

---

# Final Principle

The App layer composes routes.

Platform Core owns reusable SaaS capability semantics.

Business Domains own business-specific semantics.

Routes expose those capabilities through Products.

Routing does not transfer capability ownership.

Public URLs are Product contracts and should change deliberately.

Protected routes require server-side security.

Build routing around approved Product and Architecture decisions.
