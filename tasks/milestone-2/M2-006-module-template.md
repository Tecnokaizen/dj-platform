---
id: M2-006
title: Reusable Module Template
status: Blocked
depends_on:
  - M2-001
  - M2-005
---

# Objective

Create a minimal reusable template for future domain modules.

# Structure

```text
src/modules/_template/
├── actions/
├── components/
├── repositories/
├── schemas/
├── services/
├── types/
├── validators/
├── README.md
└── index.ts
```

# Rules

- Actions: framework boundary, auth, validation, service call and cache invalidation.
- Components: presentation only.
- Repositories: only layer accessing Prisma.
- Services: business use cases and transactions.
- Schemas: Zod contracts.
- Validators: business rules.
- Types: module-owned public types.

# Acceptance criteria

- no fake business implementation.
- dependency direction documented.
- suitable to copy for the DJ module.
- lint, typecheck and build remain green.
