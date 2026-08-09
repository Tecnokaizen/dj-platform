---
title: Component Standards
version: 1.0.0
status: Living Document
owner: Frontend
updated: 2026-08-08
related:
  - DESIGN_SYSTEM.md
  - ../architecture/CONVENTIONS.md
  - ../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Component Standards

## Purpose

This document defines how UI components should be designed, implemented and maintained across Platform Core.

Components are the building blocks of every Business Domain.

Consistency is more valuable than quantity.

---

# Philosophy

Components should be:

- small
- reusable
- composable
- predictable
- testable

Every component should have one primary responsibility.

---

# Responsibilities

Components are responsible for:

- presentation
- interaction
- accessibility
- composition

Components are not responsible for:

- business rules
- persistence
- authorization
- external integrations

---

# Component Hierarchy

```text
Design Tokens

↓

Primitive Components

↓

Shared Components

↓

Feature Components

↓

Screens

↓

Pages
```

Every layer builds on the previous one.

---

# Primitive Components

Primitive components provide the basic UI building blocks.

Examples:

- Button
- Input
- Label
- Card
- Badge
- Avatar
- Dialog
- Tooltip

They should remain business agnostic.

---

# Shared Components

Shared components combine primitives into reusable patterns.

Examples:

- Search Bar
- Data Table
- Empty State
- Pagination
- Filter Panel
- Loading State
- Confirmation Dialog

These components may be reused by multiple Domains.

---

# Feature Components

Feature components belong to a specific Domain.

Examples:

- DJ Card
- Playlist Table
- Organization Switcher
- Copy Order Status

Feature components should not be promoted into Platform Core unless they become reusable.

---

# Component Composition

Prefer composition over inheritance.

Small reusable components are easier to maintain.

Avoid deeply nested component hierarchies.

---

# Props

Props should be:

- explicit
- typed
- documented
- minimal

Avoid large configuration objects when simpler props improve readability.

---

# State

Keep state as close as possible to where it is needed.

Avoid unnecessary global state.

Business state belongs outside presentation components.

---

# Side Effects

Components should avoid side effects whenever possible.

External communication belongs to:

- hooks
- services
- server actions

Presentation should remain predictable.

---

# Styling

Styling should follow the Design System.

Avoid inline styles unless justified.

Use design tokens consistently.

---

# Accessibility

Every component should support:

- keyboard navigation
- visible focus
- semantic HTML
- screen readers
- sufficient contrast

Accessibility is mandatory.

---

# Loading States

Interactive components should communicate:

- loading
- disabled
- success
- error

Users should always understand the current state.

---

# Error States

Components should gracefully handle missing or invalid data.

Avoid blank interfaces.

Provide meaningful feedback.

---

# Performance

Prefer:

- memoization only when measured
- lazy loading when appropriate
- virtualization for large datasets

Optimize only after measurement.

---

# Documentation

Reusable components should include:

- purpose
- props
- examples
- accessibility notes

Documentation improves reuse.

---

# Testing

Components should be tested for:

- rendering
- interaction
- accessibility
- edge cases

Business logic should be tested outside UI components.

---

# AI Development Rules

AI coding agents must not:

- create duplicate components
- introduce business logic into shared UI
- bypass the Design System
- invent inconsistent naming
- create oversized components

When unsure, prefer composition.

---

# Forbidden Practices

Never:

- duplicate existing components
- hardcode visual styles
- mix business logic with presentation
- bypass accessibility
- introduce hidden side effects

---

# Final Principle

Components present information.

Business logic belongs elsewhere.

Reusable components make reusable products.