---
id: M2-002
title: Design System Foundation
status: Blocked
depends_on:
  - M2-001
---

# Objective

Create the visual foundation of DJ Platform: dark-first, elegant, accessible and prepared for dense data interfaces.

# Visual direction

Inspired by Linear, Notion, Airtable, Spotify and Discogs.

Avoid generic admin templates, gaming aesthetics, excessive neon, low contrast and decorative animation.

# Scope

Install and configure shadcn/ui, Lucide, class-variance-authority, clsx and tailwind-merge.

Create shared component groups for:

- ui
- feedback
- forms
- data display
- navigation

Create design tokens for surfaces, borders, typography, accent, success, warning, danger, AI states, focus, radius and shadows.

# Required components

Button, Input, Textarea, Select, Checkbox, Badge, Card, Tabs, Dialog, Dropdown Menu, Tooltip, Skeleton, Empty State, Alert, Progress, Table shell, Avatar and Separator.

# Deliverable

Create /design-system as a visual showcase route.

# Acceptance criteria

- WCAG 2.2 AA target.
- visible keyboard focus.
- responsive.
- reduced-motion support.
- no inline styles.
- lint, typecheck, build and tests pass.
