---
title: Frontend Engineering Handbook
version: 2.0.0
status: Living Document
owner: Engineering
updated: 2026-08-09
related:
  - ../architecture/README.md
  - ../architecture/SOURCE_STRUCTURE.md
  - ../engineering/README.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Frontend Engineering Handbook

## Purpose

This directory defines frontend engineering standards for Products built on the platform.

Frontend documentation explains how approved Architecture and Product behavior should be represented in user interfaces.

It applies to:

- application composition;
- Platform Core user interfaces;
- Business Domain interfaces;
- shared technical UI;
- public Product experiences.

Frontend documentation does not redefine architectural ownership.

---

# Core Principle

Frontend location does not determine business ownership.

A user interface may represent:

- a Platform Core capability;
- a Business Domain capability;
- application composition;
- shared technical UI.

The capability behind the interface retains its architectural owner.

---

# Frontend Is Not Platform Core

Do not use:

    Reusable UI
    → Platform Core

or:

    Used by multiple Products
    → Platform Core

UI reuse and SaaS capability ownership are different concerns.

Reusable technical UI generally belongs to Shared.

Business-specific UI belongs with its Domain.

UI representing a Core capability may live with that Core capability.

Application-level composition belongs to the App layer.

---

# Documentation Boundary

Architecture defines:

- capability ownership;
- Platform Core boundaries;
- Business Domain boundaries;
- dependency direction;
- tenancy;
- authorization;
- source ownership.

Frontend Engineering defines:

- component implementation;
- visual consistency;
- accessibility;
- forms;
- routing implementation;
- navigation implementation;
- themes;
- responsive behavior;
- user interaction patterns.

Product and Domain documentation define business behavior.

---

# Current Documents

This directory contains:

- `ACCESSIBILITY.md`
- `COMPONENTS.md`
- `DESIGN_SYSTEM.md`
- `FORMS.md`
- `NAVIGATION.md`
- `ROUTING.md`
- `THEMES.md`

These documents define frontend engineering concerns.

Their existence does not imply that every described capability is already implemented.

---

# Source Ownership

Frontend implementation must respect the current high-level source structure:

    src/
    ├── app/
    ├── config/
    ├── core/
    │   ├── identity/
    │   └── modules/
    ├── domains/
    ├── generated/
    ├── lib/
    └── shared/

Typical frontend ownership:

    src/app/
    → routes
    → layouts
    → application composition
    → framework entry points

    src/core/
    → UI belonging to reusable Core capabilities

    src/domains/
    → UI belonging to business-specific capabilities

    src/shared/
    → reusable business-agnostic UI and technical helpers

Physical location should reflect architectural ownership.

---

# Application Composition

The App layer composes capabilities into Products.

It may coordinate:

- routing;
- layouts;
- navigation;
- page composition;
- Product-level shells;
- public experiences;
- authenticated experiences.

Composition does not transfer ownership.

A route using a Domain capability does not make that capability part of App.

---

# Platform Core UI

Platform Core capabilities may expose UI when users need to interact with them.

Examples may include:

- authentication;
- profile;
- organization management;
- membership management;
- role management;
- permissions administration.

These interfaces belong to their Core capability because the underlying behavior belongs to Core.

Core does not own unrelated Product UI merely because it is reusable.

---

# Business Domain UI

Business Domains own interfaces whose meaning depends on business-specific behavior.

Example:

    DJ Domain
    → Artist interfaces
    → Festival interfaces
    → Playlist interfaces
    → Session interfaces

Domain UI may reuse Shared components.

Shared components must not absorb Domain semantics.

---

# Shared UI

Shared UI contains reusable technical presentation with no Product-specific business meaning.

Examples may include:

- buttons;
- dialogs;
- inputs;
- generic cards;
- loaders;
- generic table primitives;
- generic layout helpers;
- reusable accessibility utilities.

Shared UI must not depend on Core or Business Domains.

---

# Component Principle

Components should have clear responsibilities.

Prefer components that are:

- understandable;
- composable;
- accessible;
- predictable;
- testable;
- appropriately reusable.

Do not force reuse when abstraction makes a component harder to understand.

---

# Business Logic

UI components should not become hidden owners of business rules.

Business rules belong to the capability that owns them.

UI may:

- collect input;
- present state;
- trigger approved actions;
- display validation;
- represent business outcomes.

UI should not duplicate server-side invariants.

---

# Data Access

Frontend components should not depend directly on:

- database clients;
- Prisma internals;
- infrastructure providers;
- provider SDKs.

Data access should follow approved application and capability interfaces.

Framework server-side components may call approved services where Architecture allows it.

---

# Routing

Routing is primarily application composition.

Routes expose Product capabilities.

Routes do not automatically belong to Platform Core.

A route may represent:

- a Core capability;
- a Business Domain;
- Product composition;
- a public resource.

Routing details are defined further in `ROUTING.md`.

---

# Navigation

Navigation is Product composition informed by available capabilities and authorization.

Platform Core may provide reusable authorization or tenancy information.

Business Domains may contribute Product-specific destinations.

App composition determines the final navigation experience.

Navigation does not automatically belong to Platform Core.

---

# Design System

A Design System may provide reusable visual standards and technical UI primitives.

It is a frontend engineering concern.

It is not automatically a Platform Core business capability.

Design System implementation must not introduce business semantics into Shared UI.

Current repository reality must be checked before assuming any particular component library is installed.

---

# Themes

Themes control presentation.

They should not redefine:

- business rules;
- authorization;
- Domain behavior;
- Core behavior.

Product branding may differ between Products without duplicating business logic.

Theme implementation is defined further in `THEMES.md`.

---

# Forms

Forms translate user input into approved application actions.

Form implementation should separate:

- presentation;
- client-side interaction;
- validation feedback;
- business processing.

Client validation improves user experience.

Server-side validation remains authoritative for protected business operations.

---

# Accessibility

Accessibility is an engineering requirement across Products.

It is not optional Product decoration.

Components and interactions should consider:

- keyboard navigation;
- semantic HTML;
- focus behavior;
- labels;
- screen readers;
- contrast;
- responsive behavior.

Detailed standards live in `ACCESSIBILITY.md`.

---

# Responsive Design

Product interfaces should adapt appropriately to supported viewport sizes and devices.

Responsive behavior should be driven by actual Product requirements.

Avoid creating multiple independent implementations of the same functionality solely for different screen sizes unless justified.

---

# Loading and Error States

User interfaces should represent relevant states explicitly.

Possible states include:

- loading;
- empty;
- success;
- validation failure;
- authorization failure;
- dependency failure;
- unavailable content.

Do not leave important failure states implicit.

---

# Authorization in UI

Frontend authorization improves user experience but does not replace server-side authorization.

UI may hide or disable actions based on approved authorization information.

Protected actions must still be authorized at the backend capability boundary.

---

# Tenancy in UI

Tenant-aware interfaces must follow the approved Organization and Membership model.

Frontend code must not create an independent concept of tenant ownership.

Organization context should come from approved application services and Core capabilities.

---

# Current Technology

Current frontend implementation uses the repository's approved Next.js, React and TypeScript stack.

Styling follows the current project configuration.

Do not assume additional UI frameworks, component libraries, form libraries or testing tools are installed without verifying `package.json` and source.

---

# Current vs Future

Frontend documentation may describe desired standards before all supporting infrastructure exists.

Do not infer that the repository currently contains:

- a complete Design System;
- Storybook;
- shadcn/ui;
- automated visual testing;
- Playwright;
- Vitest;
- multi-brand themes;
- complete accessibility automation;

unless repository evidence confirms it.

Documentation defines standards.

Source and runtime evidence establish implementation status.

---

# AI Development Rules

AI implementation agents must not:

- treat all reusable UI as Platform Core;
- move Domain semantics into Shared components;
- invent new UI frameworks without approval;
- assume libraries are installed without checking;
- create global navigation ownership inside Core;
- create global routing ownership inside Core;
- duplicate backend business rules in UI;
- bypass server-side authorization;
- infer implementation from documentation alone.

If UI ownership is unclear:

1. identify the capability being represented;
2. identify who owns its business meaning;
3. identify whether the UI is Domain, Core, Shared or App composition;
4. request Architecture clarification when ownership remains unresolved.

---

# Success Indicators

Frontend architecture is healthy when:

- UI ownership reflects capability ownership;
- Shared remains business-agnostic;
- Domain behavior remains inside Domains;
- Core UI represents genuine Core capabilities;
- App composes Products without absorbing capability ownership;
- navigation and routing remain Product-aware;
- accessibility is considered consistently;
- business rules are not duplicated unnecessarily;
- implementation status matches repository evidence.

---

# Failure Indicators

Frontend architecture is unhealthy when:

- every reusable component becomes Platform Core;
- Shared contains hidden Product behavior;
- navigation is globally hardcoded in Core;
- routes are treated as Core ownership;
- Domain semantics leak into generic components;
- UI becomes the only authorization layer;
- undocumented libraries are assumed to exist;
- future Design System ideas are presented as implemented.

---

# Final Principle

Products define experiences.

Platform Core provides reusable SaaS capabilities.

Business Domains provide business-specific behavior.

App composes those capabilities into Products.

Shared provides business-agnostic technical UI.

Frontend Engineering implements the experience without redefining ownership.

Reusable UI does not automatically belong to Platform Core.
