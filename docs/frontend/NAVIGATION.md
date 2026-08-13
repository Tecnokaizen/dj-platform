---
title: Navigation Standards
version: 2.0.0
status: Living Document
owner: Frontend
updated: 2026-08-09
related:
  - ROUTING.md
  - DESIGN_SYSTEM.md
  - ../architecture/SOURCE_STRUCTURE.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
  - README.md
---

# Navigation Standards

## Purpose

This document defines frontend navigation standards for Products built on the platform.

Navigation helps users understand:

- where they are;
- where they can go;
- what context they are operating in;
- which actions are available.

Navigation is primarily Product and application composition.

It does not automatically belong to Platform Core.

---

# Core Principle

Keep these concerns separate:

    Capability Ownership
        ↓
    Product Composition
        ↓
    Navigation Presentation

Platform Core and Business Domains may expose capabilities.

The App layer composes those capabilities into the Product navigation experience.

Navigation does not transfer capability ownership.

---

# Navigation Is Not Platform Core

Do not use:

    Global Navigation
    → Platform Core

or:

    Reusable Menu
    → Platform Core

Navigation reuse and SaaS capability ownership are different concerns.

Navigation may involve:

- App composition;
- Shared UI;
- Core capability destinations;
- Business Domain destinations;
- Product-specific destinations.

Architecture determines ownership of the underlying capabilities.

---

# Application Composition

The App layer normally composes final Product navigation.

It may combine:

- authenticated application areas;
- public Product areas;
- tenant context;
- Core capability destinations;
- Domain destinations;
- Product-specific actions.

Composition does not make those capabilities part of App.

---

# Navigation Hierarchy

Navigation hierarchy should reflect actual Product structure.

A SaaS Product may include:

    Product
        ↓
    Organization
        ↓
    Section
        ↓
    Resource
        ↓
    Action

A public content Product may instead include:

    Product
        ↓
    Domain Section
        ↓
    Resource
        ↓
    Related Resource

No single hierarchy should be imposed on every Product.

---

# Core Capability Destinations

Platform Core capabilities may contribute destinations when relevant to the Product.

Examples may include:

- Profile;
- Organizations;
- Memberships;
- Roles;
- Permissions.

Their business meaning remains owned by Platform Core.

The App decides how and where they appear in Product navigation.

---

# Business Domain Destinations

Business Domains may contribute destinations representing Domain-owned behavior.

DJ Platform examples may include:

- DJs;
- Artists;
- Sessions;
- Playlists;
- Rankings;
- Festivals;
- Articles.

Copy Platform examples may eventually include:

- Orders;
- Customers;
- Production;
- Deliveries;
- Reports.

Domain destinations remain independent in business meaning.

App composition determines their Product presentation.

---

# Product-Specific Navigation

Some navigation may exist only because a specific Product requires it.

Product-specific navigation does not need to become:

- Platform Core;
- Shared;
- another Business Domain.

Product composition may remain Product-specific when that is the correct ownership.

---

# Context Awareness

Navigation may adapt to context such as:

- authenticated Profile;
- current Organization;
- active Membership;
- Role;
- Permissions;
- current Product section;
- current resource;
- current workflow.

Context-aware navigation must use approved application state.

It must not invent alternate identity, tenancy or authorization systems.

---

# Organization Context

Tenant-aware Products may display Organization context.

Organization context must follow the approved tenancy model.

Navigation must not infer ownership from:

- arbitrary URL state;
- client-only flags;
- undocumented local storage;
- UI assumptions.

Tenant context should come from approved Core and application services.

---

# Permission-Based Navigation

Navigation visibility may depend on permissions.

This improves usability by hiding or disabling actions users cannot perform.

It does not provide security.

Protected operations still require server-side authorization.

Navigation must follow the approved authorization model:

    ACTIVE Membership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission

---

# Navigation Is Not Authorization

Never use:

    Hidden Menu Item
    = Secure Capability

A user may still attempt to access:

- a route directly;
- an API;
- a Server Action;
- another application entry point.

Backend authorization remains authoritative for protected behavior.

---

# Primary Navigation

Primary navigation should expose the destinations most important to the Product.

It should be:

- understandable;
- relatively stable;
- appropriately scoped;
- consistent with user goals.

The contents of primary navigation are Product decisions.

They are not automatically defined by Platform Core.

---

# Secondary Navigation

Secondary navigation may represent contextual destinations such as:

- tabs;
- resource sections;
- sub-navigation;
- contextual actions;
- local workflows.

Secondary navigation should support the current task without competing unnecessarily with primary navigation.

---

# Resource Navigation

Complex resources may have their own navigation.

Example:

    Organization
    → Overview
    → Members
    → Roles
    → Settings

or:

    Festival
    → Overview
    → Artists
    → Sessions
    → Articles

Resource navigation should reflect real capability structure.

---

# Breadcrumbs

Breadcrumbs may help communicate hierarchy.

Example:

    Organizations
    >
    Acme Ltd.
    >
    Members

or:

    Festivals
    >
    Festival Name
    >
    Artists

Breadcrumbs should reflect actual Product structure.

They should not invent business hierarchy.

They do not necessarily replace primary navigation.

---

# Menus

Menus should remain:

- understandable;
- predictable;
- logically grouped;
- accessible.

Avoid unnecessary deep nesting.

Menu complexity should reflect actual Product complexity.

---

# Active State

Navigation should communicate the current location when useful.

Active-state behavior may depend on:

- current route;
- nested route;
- selected resource;
- Product section.

Avoid ambiguous states where multiple unrelated destinations appear active.

---

# Navigation and Routing

Routing and navigation are related but separate.

Routing defines reachable application locations.

Navigation presents selected destinations to users.

Not every route must appear in navigation.

Not every navigation action must represent a simple route transition.

Routing standards live in:

    docs/frontend/ROUTING.md

---

# Navigation Data

Navigation definitions should remain understandable and explicit.

Depending on Product requirements, navigation may be:

- statically composed;
- capability-aware;
- permission-aware;
- tenant-aware;
- partially data-driven.

Do not build a generic navigation registry unless requirements justify it.

---

# Shared Navigation Components

Shared UI may provide business-agnostic navigation primitives such as:

- menu components;
- navigation lists;
- breadcrumb primitives;
- tabs;
- sidebar primitives;
- mobile navigation primitives.

Shared components must not contain hidden Product or Domain destination definitions.

---

# Domain Navigation Components

A Business Domain may own navigation UI when the navigation itself depends on Domain semantics.

Example:

    DJ Domain
    → Artist Resource Navigation

That navigation may reuse Shared primitives.

Domain-specific destination logic should remain in the Domain.

---

# Core Navigation Components

A Core capability may own navigation related specifically to that Core capability.

Example:

    Organization Management
    → Members
    → Roles
    → Permissions

This does not make the entire Product navigation a Core responsibility.

---

# Search

Search may support navigation when Product requirements justify it.

Possible search experiences may include:

- resource search;
- Domain search;
- Product-wide search;
- command search.

Do not assume a global search capability exists.

Search ownership depends on the data and semantics being searched.

A future cross-Product search capability requires architectural evaluation.

---

# Command Palette

A command palette may eventually improve navigation for complex Products.

It is not currently assumed to exist.

Do not implement one merely because it appears in frontend documentation.

---

# Recent Resources

Recent-resource navigation may be useful in some Products.

It requires explicit decisions about:

- what counts as recent;
- where state is stored;
- tenant boundaries;
- user privacy;
- retention.

Do not implement speculative recent-resource tracking.

---

# Favorites

Favorites or pinned destinations may become useful.

They require explicit Product requirements and ownership.

Do not create a generic Favorites Core capability solely for navigation convenience.

---

# Mobile Navigation

Mobile navigation should reflect device constraints.

Consider:

- touch targets;
- limited viewport;
- hierarchy depth;
- discoverability;
- keyboard behavior where relevant;
- accessibility.

Desktop navigation should not simply be copied into a smaller viewport without evaluation.

---

# Responsive Navigation

Responsive behavior may change navigation presentation while preserving capability meaning.

For example:

Desktop:

    Sidebar + Header

Mobile:

    Compact Header + Drawer

Presentation may change.

Navigation semantics should remain coherent.

---

# Accessibility

Navigation must consider:

- semantic landmarks;
- keyboard navigation;
- focus management;
- screen-reader labels;
- active-state communication;
- touch targets;
- contrast.

Accessibility requirements apply regardless of Product or Domain ownership.

---

# Empty States

Empty Product states should generally provide a useful path forward when an action exists.

Examples may include:

- create first resource;
- return to parent section;
- switch Organization;
- learn why no content exists.

Not every empty state requires an action.

Avoid artificial actions merely to eliminate visual emptiness.

---

# Dead Ends

Critical workflows should avoid unintended dead ends.

Users should normally be able to:

- understand the current state;
- navigate back;
- move to a relevant next destination;
- recover from recoverable errors.

This is a Product usability concern, not a Platform Core ownership rule.

---

# Performance

Navigation should remain responsive.

Avoid unnecessary:

- provider calls;
- repeated permission requests;
- duplicated data fetching;
- large client-side navigation payloads.

Performance optimization should follow measured Product needs.

---

# Navigation Loading

Navigation should not unnecessarily block the primary Product experience.

Where navigation depends on:

- Profile;
- Organization;
- Membership;
- Permissions;
- Product configuration;

data loading should use approved application patterns.

Avoid inconsistent menu flashing where practical.

---

# Error Handling

Navigation failures should not hide critical Product functionality silently.

If navigation data cannot load:

- preserve safe fallbacks where possible;
- avoid exposing unauthorized destinations;
- provide recoverable error behavior;
- record useful diagnostics where appropriate.

---

# Current vs Future

This document defines standards.

It does not prove the repository currently contains:

- a complete global navigation system;
- a generic navigation registry;
- global search;
- a command palette;
- recent resources;
- favorites;
- personalized shortcuts;
- AI-assisted navigation;
- contextual recommendations.

These capabilities require approved Product requirements and implementation evidence.

---

# AI-Assisted Navigation

AI may eventually assist navigation through:

- recommendations;
- command interpretation;
- contextual suggestions;
- natural-language search.

AI-assisted navigation is not currently implied by this document.

Such capabilities require Product, Architecture and security evaluation.

---

# AI Development Rules

AI implementation agents must not:

- treat Product navigation as Platform Core ownership;
- invent global navigation structure;
- invent Product hierarchy;
- bypass authorization;
- infer permissions from UI state;
- put Domain destinations into Shared components;
- create speculative global search;
- create speculative command palettes;
- create speculative favorites or recent-resource systems;
- infer implementation from this document alone.

If navigation requirements are unclear:

1. identify the Product experience being composed;
2. identify the capability or Domain destination;
3. identify authorization and tenant context;
4. determine whether the implementation belongs to App, Core, Domain or Shared;
5. request clarification when Product or Architecture decisions are missing.

---

# Success Indicators

Navigation is healthy when:

- Product structure is understandable;
- capability ownership remains intact;
- App composes the final experience;
- Core destinations represent genuine Core capabilities;
- Domain destinations remain Domain-owned;
- Shared primitives remain business-agnostic;
- permission-based visibility improves UX without replacing security;
- responsive navigation remains coherent;
- accessibility is preserved;
- implementation status matches repository evidence.

---

# Failure Indicators

Navigation is unhealthy when:

- Platform Core owns every Product menu;
- navigation becomes a second authorization system;
- Domain destinations are hardcoded into Shared;
- Product hierarchy is forced into one universal model;
- speculative global search infrastructure appears;
- hidden navigation is treated as security;
- mobile navigation duplicates desktop behavior without evaluation;
- future navigation ideas are presented as implemented capabilities.

---

# Final Principle

App composition defines the Product navigation experience.

Platform Core provides reusable SaaS capabilities.

Business Domains provide business-specific destinations.

Shared provides business-agnostic navigation primitives.

Navigation does not transfer capability ownership.

Navigation visibility does not replace authorization.

Product structure determines hierarchy.

Build navigation around real Product requirements.
