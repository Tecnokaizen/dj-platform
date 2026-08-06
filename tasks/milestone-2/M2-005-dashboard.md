---
id: M2-005
title: Operational Dashboard
status: Blocked
depends_on:
  - M2-003
  - M2-004
---

# Objective

Create a useful dashboard backed by real PostgreSQL data.

# Metrics

- total DJs
- published DJs
- draft DJs
- genres
- tracks
- festivals
- pending imports
- invalid rows
- pending AI reviews
- possible duplicates

# Sections

Metric cards, completion overview, recent activity, review queue, import summary, quick actions and data-quality warnings.

# Architecture

Server Component page, dashboard service and repository. No Prisma calls in the page. Handle an empty database gracefully.

# Acceptance criteria

- all metrics come from PostgreSQL.
- no fake AI results.
- no N+1 queries.
- responsive.
- lint, typecheck, build and tests pass.
