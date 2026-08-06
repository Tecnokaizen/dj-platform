---
id: M2-003
title: Application Layout
status: Blocked
depends_on:
  - M2-002
---

# Objective

Build the SaaS application shell.

# Scope

Create:

```text
src/app/(admin)/layout.tsx
src/app/(admin)/dashboard/page.tsx
src/shared/components/layout/
```

Include:

- collapsible sidebar
- mobile navigation
- sticky top bar
- breadcrumbs
- global search trigger
- user menu placeholder
- theme switcher
- notifications placeholder
- skip link

# Navigation

Dashboard, DJs, Tracks, Genres, Labels, Festivals, Rankings, Playlists, AI Imports, Media, Review Queue and Settings.

# Acceptance criteria

- typed navigation configuration.
- no business data hardcoded in layout components.
- responsive and keyboard accessible.
- lint, typecheck, build and tests pass.
