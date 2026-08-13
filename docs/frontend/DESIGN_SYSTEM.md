---
title: Design System
version: 2.0.0
status: Living Document
owner: Frontend
updated: 2026-08-09
related:
  - README.md
  - COMPONENTS.md
  - THEMES.md
  - ACCESSIBILITY.md
  - ../architecture/TECH_STACK.md
  - ../architecture/SOURCE_STRUCTURE.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Design System

## Purpose

This document defines frontend standards for visual consistency, reusable UI primitives and interaction presentation across Products.

The Design System supports:

- consistency;
- accessibility;
- maintainability;
- responsive behavior;
- reusable technical UI;
- predictable interaction patterns.

The Design System is a frontend engineering system.

It is not automatically a Platform Core capability.

---

# Core Principle

Separate:

    Business Capability
        ↓
    Product Experience
        ↓
    UI Composition
        ↓
    Design System Primitives

Platform Core and Business Domains own capability semantics.

App composition creates Product experiences.

The Design System provides business-agnostic visual and interaction foundations.

---

# Design System Is Not Platform Core

Do not use:

    Reusable Component
    → Platform Core

or:

    Shared Visual Standard
    → Platform Core

Visual reuse is not the same as reusable SaaS capability ownership.

Business-agnostic reusable UI generally belongs to Shared frontend code.

Architecture determines ownership when a component represents actual Core or Domain behavior.

---

# Design System Is More Than a Component Library

The Design System may include:

- design tokens;
- visual principles;
- accessibility rules;
- reusable primitives;
- component variants;
- interaction patterns;
- responsive conventions;
- documentation.

A component library may implement part of the Design System.

It does not define the complete system by itself.

---

# Current Technology

Current repository frontend technology includes:

- React;
- Next.js;
- TypeScript;
- Tailwind CSS.

Do not assume additional frontend libraries are installed without checking repository evidence.

In particular, this document does not imply that the repository currently uses:

- shadcn/ui;
- Storybook;
- Radix UI;
- Zod;
- React Hook Form;
- Vitest;
- Playwright;
- visual regression tooling.

Before using a dependency, inspect:

- `package.json`;
- current source;
- current configuration.

---

# Source Ownership

Typical frontend ownership follows:

    src/app/
    → Product composition
    → routes
    → layouts
    → framework entry points

    src/core/
    → UI representing reusable Core capabilities

    src/domains/
    → UI representing business-specific capabilities

    src/shared/
    → reusable business-agnostic UI primitives

Design System primitives should normally remain business-agnostic.

---

# Shared UI

Shared UI may contain reusable primitives such as:

- Button;
- Input;
- Select;
- Dialog;
- Modal;
- Card;
- Badge;
- Tabs;
- Table primitives;
- Spinner;
- Alert;
- Tooltip;
- navigation primitives;
- layout utilities.

These components must not contain hidden Product or Domain semantics.

---

# Core UI

A Platform Core capability may contain UI specific to that capability.

Examples may include:

- Organization management;
- Membership management;
- Role management;
- Profile management.

Core UI may consume Shared Design System primitives.

The component remains Core-owned because its capability semantics belong to Core, not because it uses reusable styling.

---

# Domain UI

Business Domains may contain UI whose meaning depends on Domain behavior.

Example:

    DJ Domain
    → Artist Card
    → Festival Editor
    → Session Interface

Domain UI may consume Shared primitives.

Domain semantics must not be moved into Shared merely to increase reuse.

---

# Product Composition

Products compose Core, Domain and Shared UI.

Product-level experience may define:

- shell;
- navigation;
- route composition;
- branding;
- public presentation;
- authenticated presentation.

Product composition does not transfer capability ownership.

---

# Design Principles

Interfaces should generally be:

- understandable;
- predictable;
- accessible;
- responsive;
- maintainable;
- appropriately reusable;
- visually coherent.

Consistency should support usability.

Consistency should not prevent Product differentiation where real requirements justify it.

---

# Simplicity

Prefer simple components and interaction patterns.

Avoid:

- unnecessary variants;
- premature abstraction;
- excessive configuration;
- visual complexity without Product value.

A generic component with dozens of options may be harder to maintain than several focused components.

---

# Design Tokens

Design tokens may centralize visual decisions that benefit from consistency.

Typical categories include:

- color;
- spacing;
- typography;
- radius;
- border;
- elevation;
- motion;
- breakpoints;
- layering.

Tokens should represent useful shared concepts.

Do not create global tokens for every isolated visual value.

---

# Semantic Tokens

Prefer semantic meaning where practical.

Examples:

- primary;
- secondary;
- accent;
- background;
- surface;
- foreground;
- muted;
- border;
- success;
- warning;
- error.

Semantic tokens make theming easier than components depending directly on arbitrary literal values.

---

# Hardcoded Visual Values

Avoid unnecessary hardcoded visual values when an established token exists.

This does not mean all values require tokens.

Local styling may remain local when reuse provides no meaningful benefit.

---

# Layout

Layout is primarily application composition.

The Design System may provide generic layout primitives such as:

- containers;
- stacks;
- grids;
- spacing utilities;
- responsive primitives.

Product layouts belong to App composition.

Shared layout primitives do not make Product layouts part of Platform Core.

---

# Typography

Typography should support:

- readability;
- hierarchy;
- accessibility;
- Product identity;
- supported languages;
- responsive behavior.

Product branding may influence typography.

Business Domains should not own typography merely because they provide content.

---

# Color

Colors should support semantic meaning and accessibility.

Possible semantic uses include:

- actions;
- status;
- validation;
- warning;
- error;
- success;
- selection.

Color must not be the only indicator of important state.

---

# Spacing

Consistent spacing improves visual rhythm and comprehension.

Prefer established spacing conventions where they exist.

Do not create arbitrary new spacing systems inside individual Domains.

Local exceptions are acceptable when justified by real interface requirements.

---

# Borders and Radius

Border and radius conventions may help preserve visual consistency.

Their use should remain presentation-focused.

They must not influence capability behavior.

---

# Elevation and Shadows

Elevation may communicate:

- overlay;
- hierarchy;
- focus;
- separation.

Avoid decorative elevation that reduces clarity.

---

# Motion

Motion may:

- communicate state;
- explain transitions;
- reinforce cause and effect.

Motion should remain purposeful.

Avoid unnecessary animation.

Respect reduced-motion preferences where appropriate.

---

# Components

Components should have clear responsibilities.

Prefer components that are:

- composable;
- predictable;
- accessible;
- understandable;
- testable.

Reusability is valuable when repeated behavior or presentation genuinely exists.

Reusability is not a goal by itself.

---

# Component Variants

Variants should represent meaningful presentation differences.

Examples may include:

- size;
- emphasis;
- state;
- visual intent.

Avoid variants that encode hidden Product or Domain business behavior.

---

# Component APIs

Component interfaces should remain understandable.

Avoid:

- excessive boolean flags;
- implicit state;
- hidden side effects;
- Product-specific props inside generic Shared components.

If a component requires substantial Domain knowledge, it probably belongs in that Domain.

---

# Component Behavior

Component behavior should be separated from business capability semantics where appropriate.

Example:

    Shared Dialog
    → handles modal interaction

    Delete Artist Dialog
    → belongs to DJ Domain
    → owns artist-specific action semantics

Reusing the Dialog does not move Delete Artist behavior into Shared.

---

# Forms

Form primitives may belong to Shared UI.

Business form semantics remain with the owning Core capability or Domain.

Generic form components should not contain business validation rules.

Form standards are documented in:

    docs/frontend/FORMS.md

---

# Navigation Components

Shared may provide generic:

- menu primitives;
- tabs;
- breadcrumb UI;
- sidebar primitives.

Product navigation structure belongs to App composition.

Domain-specific destinations remain Domain-aware.

Navigation standards are documented in:

    docs/frontend/NAVIGATION.md

---

# Accessibility

Accessibility is part of frontend engineering.

Components should consider:

- semantic HTML;
- labels;
- keyboard interaction;
- focus management;
- contrast;
- screen readers;
- reduced motion;
- touch targets.

Accessibility is not an optional visual enhancement.

Detailed standards live in:

    docs/frontend/ACCESSIBILITY.md

---

# Responsive Design

Components should behave appropriately across supported viewports.

Responsive behavior should be intentional.

Avoid duplicating complete components solely for desktop and mobile unless requirements justify it.

---

# Themes

Themes control presentation.

They may influence:

- colors;
- typography;
- surfaces;
- branding;
- visual density.

Themes must not redefine business behavior.

Theme standards live in:

    docs/frontend/THEMES.md

---

# Product Branding

Product branding may include:

- logo;
- favicon;
- Product colors;
- typography;
- imagery;
- illustrations.

Branding normally belongs to Product presentation.

It should not be assigned automatically to Platform Core or Business Domains.

---

# Business Domain Visual Identity

A Domain may require specialized visual treatment when its Product experience genuinely requires it.

That does not create a separate Domain-wide theme system by default.

Domain-specific visuals should still use Shared primitives where appropriate.

---

# Visual Consistency

The Design System provides the primary engineering reference for visual consistency.

It is not the source of truth for:

- Product behavior;
- business rules;
- Domain semantics;
- Core ownership;
- authorization;
- tenancy.

Visual consistency must remain inside its proper boundary.

---

# Empty States

Empty-state presentation should explain relevant Product state clearly.

It may include:

- explanation;
- contextual guidance;
- an available next action.

Business-specific empty-state meaning belongs to the owning capability.

Shared may provide generic Empty State presentation primitives.

---

# Loading States

Loading UI should communicate progress without misleading users.

Shared may provide:

- Spinner;
- Skeleton;
- Progress;
- generic loading placeholders.

The meaning of the operation being loaded remains with the owning capability.

---

# Error Presentation

Shared may provide generic error presentation.

Core and Business Domains retain ownership of error semantics.

Error UI must not expose sensitive implementation details.

---

# Icons

Icons should:

- reinforce meaning;
- remain consistent;
- remain recognizable;
- support accessibility where needed.

Do not use icon-only actions without accessible labeling when meaning would otherwise be unclear.

---

# Content Density

Different Product areas may require different information density.

Operational dashboards and public editorial experiences do not necessarily require identical presentation.

Consistency should preserve interaction principles without forcing every Product into the same visual density.

---

# Design System Evolution

New components or patterns should be introduced when real implementation needs justify them.

Do not create speculative components for hypothetical future Products.

A component may begin locally and move to Shared only after meaningful reuse is demonstrated.

Moving a component to Shared is a technical reuse decision.

It does not make it part of Platform Core.

---

# Component Promotion

Before moving a component into Shared, consider:

- whether multiple real consumers exist;
- whether semantics are business-agnostic;
- whether APIs remain understandable;
- whether reuse reduces meaningful duplication;
- whether abstraction introduces coupling.

Potential future reuse alone is insufficient.

---

# External Component Libraries

External UI libraries may be introduced when approved requirements justify them.

Before adding one, evaluate:

- current stack;
- accessibility;
- maintenance;
- bundle impact;
- customization requirements;
- compatibility;
- dependency cost.

Do not add a component library simply because it is commonly used with Next.js.

---

# shadcn/ui

`shadcn/ui` may be evaluated in the future if it provides value to the Product and current frontend architecture.

It is not currently assumed to be installed or adopted.

No implementation agent should generate shadcn-specific code without verifying repository dependencies and an approved implementation decision.

---

# Storybook

Storybook or equivalent component documentation may become useful as the Shared UI library grows.

It is not currently assumed to exist.

Do not introduce it solely because this Design System document exists.

---

# Visual Regression Testing

Automated visual regression testing may become valuable when UI maturity justifies it.

It is not currently assumed to be implemented.

Tool selection requires Engineering evaluation.

---

# Current vs Future

This document defines frontend standards.

It does not prove the repository currently contains:

- a complete component library;
- shadcn/ui;
- Storybook;
- visual regression testing;
- automated Design System documentation;
- multi-brand themes;
- white-label support;
- complete design-token automation.

Implementation status must be verified from repository evidence.

---

# AI Development Rules

AI implementation agents must not:

- assume shadcn/ui is installed;
- introduce a UI library without approval;
- treat reusable UI as Platform Core;
- move Domain semantics into Shared;
- invent Product branding;
- create speculative components for future Products;
- create excessive Design System abstractions;
- bypass established accessibility requirements;
- infer implementation from this document alone.

When UI ownership is unclear:

1. identify the capability being represented;
2. identify whether its semantics are Core, Domain or Product-specific;
3. determine whether reusable presentation belongs in Shared;
4. inspect repository reality;
5. request Architecture clarification when ownership remains unresolved.

---

# Success Indicators

The Design System is healthy when:

- Shared UI remains business-agnostic;
- Product branding remains Product-aware;
- Core UI represents genuine Core capabilities;
- Domain UI retains Domain semantics;
- accessibility is consistent;
- visual tokens are introduced where useful;
- component APIs remain understandable;
- reuse follows demonstrated need;
- repository implementation matches documented technology.

---

# Failure Indicators

The Design System is unhealthy when:

- every reusable component becomes Platform Core;
- Product branding is placed in Core;
- Domain semantics leak into Shared components;
- undocumented libraries are treated as installed;
- speculative components accumulate;
- accessibility is inconsistent;
- component APIs become excessively generic;
- Design System rules begin defining business behavior.

---

# Final Principle

The Design System provides visual and interaction consistency.

Products own their experience and branding.

Platform Core owns reusable SaaS capability semantics.

Business Domains own business-specific semantics.

Shared owns business-agnostic reusable UI primitives.

Reusable UI does not automatically belong to Platform Core.

A component library does not define the architecture.

Verify repository reality before using frontend technologies.

Build Design System capabilities from demonstrated Product needs.
