---
title: Theme Standards
version: 2.0.0
status: Living Document
owner: Frontend
updated: 2026-08-09
related:
  - README.md
  - DESIGN_SYSTEM.md
  - COMPONENTS.md
  - ACCESSIBILITY.md
  - ../architecture/SOURCE_STRUCTURE.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Theme Standards

## Purpose

This document defines frontend engineering standards for visual themes and Product branding.

Themes affect presentation.

They must not redefine business behavior, capability ownership, authorization or Domain semantics.

Theme implementation does not automatically belong to Platform Core.

---

# Core Principle

Separate:

    Product Experience
        ↓
    Visual Theme
        ↓
    Design Tokens
        ↓
    UI Components

Themes control visual presentation.

Components provide interface behavior.

Platform Core and Business Domains retain ownership of the capabilities represented by those components.

---

# Themes Are Not Platform Core

Do not use:

    Shared Theme
    → Platform Core

or:

    Multiple Products use the same theme
    → Core capability

Themes are frontend presentation concerns.

Theme-related implementation may belong to:

- Product composition;
- Shared UI;
- frontend configuration;
- a future approved branding capability.

Architecture determines ownership when additional capability semantics are required.

---

# Product Branding

Branding normally belongs to the Product experience.

Product branding may include:

- logo;
- favicon;
- typography;
- colors;
- imagery;
- illustrations;
- icon treatment;
- visual tone.

A Business Domain should not own branding merely because Product screens represent that Domain.

---

# Business Domains

Business Domains own business semantics.

Themes must not redefine:

- Domain entities;
- workflows;
- business rules;
- validation;
- authorization;
- resource lifecycle.

Domain UI may consume Product and Shared visual primitives without becoming responsible for the theme system.

---

# Platform Core

Platform Core owns reusable SaaS capability semantics.

A Core capability may use the active Product theme when rendered.

That does not make Theme management a Core responsibility.

Core UI should remain compatible with the approved frontend visual system.

---

# Shared UI

Shared UI may contain business-agnostic presentation primitives and design tokens.

Examples may include:

- color tokens;
- spacing tokens;
- typography tokens;
- border tokens;
- radius tokens;
- elevation tokens;
- reusable component variants.

Shared UI must remain free from Product and Domain business semantics.

---

# Theme Responsibilities

A theme may define:

- color palette;
- typography;
- spacing;
- border radius;
- shadows;
- surfaces;
- icon presentation;
- branding assets;
- visual density;
- component presentation variants.

A theme must not redefine component business behavior.

---

# Design Tokens

Prefer reusable design tokens over scattered visual constants.

Possible semantic tokens may include:

- primary;
- secondary;
- success;
- warning;
- error;
- background;
- surface;
- border;
- foreground;
- muted;
- accent.

Token names should describe intended meaning rather than one specific literal value where practical.

---

# Hardcoded Values

Avoid unnecessary hardcoded visual values when an established design token exists.

This does not mean every CSS value must become a global token.

Create tokens when reuse, consistency or theming justifies them.

Do not create excessive token abstraction for isolated styling.

---

# Component Behavior

Theme changes should normally preserve:

- component functionality;
- interaction semantics;
- validation behavior;
- authorization behavior;
- keyboard behavior;
- accessibility.

Presentation may change.

Capability behavior should not.

---

# Light and Dark Appearance

A Product may support:

- light appearance;
- dark appearance;
- system preference.

Support should be driven by Product requirements.

Do not assume every Product requires all appearance modes.

---

# Appearance State

If appearance switching is implemented, its state should have a clear owner.

Possible strategies may include:

- browser preference;
- local preference;
- Profile preference;
- Product configuration.

Do not introduce persistence or Profile fields without an approved requirement.

---

# Accessibility

Theme implementation must preserve accessibility.

Consider:

- contrast;
- focus visibility;
- readable typography;
- color independence;
- disabled states;
- interactive states;
- error states.

Branding must not override accessibility requirements.

---

# Color

Color should not be the only mechanism used to communicate important meaning.

Examples include:

- validation errors;
- status;
- selection;
- warnings;
- success.

Use additional semantic indicators when necessary.

---

# Typography

Typography should remain readable and consistent.

Product branding may define typography choices.

Consider:

- hierarchy;
- readability;
- supported languages;
- loading performance;
- fallback fonts.

Typography must not introduce unnecessary Product instability.

---

# Responsive Themes

Themes may adapt presentation across viewport sizes.

Responsive behavior should not require independent business implementations.

The same capability should normally preserve meaning across devices.

---

# Product Variants

Multiple Products may use different visual identities while sharing:

- Platform Core;
- Shared technical UI;
- infrastructure;
- engineering standards.

Example:

    DJ Platform
    → DJ-specific Product branding

    Copy Platform
    → Copy-specific Product branding

Different Product appearance does not require different Core implementations.

---

# Domain Variants

Avoid creating separate themes merely for each Business Domain.

Domain-specific visual treatment may be appropriate when Product design requires it.

That treatment should not create a separate architectural ownership system.

---

# White Label

White-label support may become a Product requirement in the future.

It may involve:

- customer logos;
- organization branding;
- custom colors;
- custom domains;
- branded communication.

White-label capability is not currently implied merely by this document.

Do not build generic white-label infrastructure speculatively.

---

# Organization Branding

Some future Products may allow Organizations to customize branding.

That would require explicit decisions about:

- configuration ownership;
- tenant boundaries;
- permissions;
- storage;
- validation;
- fallback behavior.

Do not infer Organization branding from the existence of tenancy.

---

# Theme Configuration

Theme configuration should remain explicit and understandable.

Avoid:

- duplicated configuration;
- hidden visual overrides;
- Product rules buried inside generic components;
- uncontrolled runtime styling.

Product-specific configuration should remain identifiable as Product-specific.

---

# Theme Switching

When runtime theme switching is required, it should avoid unnecessary disruption.

Consider:

- page reloads;
- visual flashing;
- server/client consistency;
- persisted preference;
- system preference changes.

Implementation should follow the current frontend framework and Product requirements.

---

# Assets

Theme and branding assets may include:

- logos;
- icons;
- illustrations;
- background media;
- favicons.

Asset ownership and storage strategy should follow the relevant Product and infrastructure decisions.

Do not create generic storage infrastructure solely because themes use assets.

---

# Performance

Theme implementation should avoid unnecessary:

- large assets;
- duplicated CSS;
- runtime style generation;
- blocking font loads;
- excessive client-side JavaScript.

Performance decisions should be measured against real Product behavior.

---

# Design System Relationship

Themes and Design System are related but not identical.

The Design System may define:

- UI primitives;
- interaction patterns;
- reusable visual contracts.

Themes may define:

- visual values;
- branding;
- appearance variants.

A Theme should not fork component behavior.

---

# Current Technology

Theme implementation must follow the actual frontend stack present in the repository.

Before implementation, inspect:

- `package.json`;
- current CSS configuration;
- existing components;
- current App structure.

Do not assume a specific theme library or Design System package exists without repository evidence.

---

# Current vs Future

This document defines frontend standards.

It does not prove that the repository currently contains:

- a complete theme engine;
- light/dark switching;
- Profile theme preferences;
- multi-brand themes;
- Organization branding;
- white-label support;
- seasonal themes;
- accessibility presets;
- automatic contrast adaptation.

These capabilities require approved Product requirements and implementation evidence.

---

# AI Development Rules

AI implementation agents must not:

- treat Themes as a Platform Core capability automatically;
- assign Product branding to a Business Domain without justification;
- invent Organization branding;
- create speculative white-label infrastructure;
- assume appearance switching exists;
- introduce theme libraries without approval;
- hardcode Product semantics into Shared visual primitives;
- change component behavior through theme configuration;
- reduce accessibility for branding;
- infer implementation from this document alone.

If theme ownership is unclear:

1. identify the Product requirement;
2. determine whether the concern is visual or behavioral;
3. identify whether implementation belongs to App, Shared, Core or Domain;
4. check repository reality;
5. request clarification when Product or Architecture decisions are missing.

---

# Success Indicators

Theme implementation is healthy when:

- Product branding remains Product-aware;
- Shared visual primitives remain business-agnostic;
- Core and Domain behavior remains unchanged by themes;
- accessibility is preserved;
- design tokens are used where they provide real value;
- Product variants do not duplicate business logic;
- speculative branding infrastructure is avoided;
- implementation status matches repository evidence.

---

# Failure Indicators

Theme implementation is unhealthy when:

- Platform Core becomes the owner of all branding;
- every Business Domain receives its own theme architecture;
- themes alter capability behavior;
- accessibility is sacrificed for branding;
- theme switching is implemented without a requirement;
- Organization branding appears merely because Organizations exist;
- visual constants are duplicated uncontrollably;
- future white-label ideas are presented as implemented.

---

# Final Principle

Themes control presentation.

Products own their visual identity.

Platform Core owns reusable SaaS capability semantics.

Business Domains own business-specific behavior.

Shared may provide business-agnostic visual primitives and tokens.

Themes must not redefine capability ownership or behavior.

Branding requirements drive theme complexity.

Build only the theming capabilities justified by real Product needs.
