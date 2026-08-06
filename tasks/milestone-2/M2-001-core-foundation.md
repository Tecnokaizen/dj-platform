---
id: M2-001
title: Core Foundation
status: Ready
priority: Critical
---

# Objective

Implement the reusable server-side foundation required by all future modules.

# Required reading

- AGENTS.md
- PROJECT_CONTEXT.md
- docs/architecture/ARCHITECTURE.md
- docs/architecture/DATABASE.md
- docs/architecture/API.md
- docs/architecture/SECURITY.md
- docs/architecture/PRISMA_IMPLEMENTATION.md

# Scope

Create:

```text
src/lib/
├── env/
│   ├── schema.ts
│   └── index.ts
├── prisma/
│   ├── client.ts
│   └── index.ts
├── logger/
│   ├── logger.ts
│   └── index.ts
├── errors/
│   ├── app-error.ts
│   ├── error-codes.ts
│   ├── error-response.ts
│   └── index.ts
├── validation/
│   ├── parse-input.ts
│   └── index.ts
└── utils/
    ├── cn.ts
    ├── normalize-text.ts
    ├── slugify.ts
    └── index.ts
```

# Requirements

- Validate environment variables with Zod.
- Export a typed env object.
- Use Prisma 7 with @prisma/adapter-pg.
- Create a singleton Prisma client.
- Create a structured logger abstraction without adding a logging dependency.
- Create AppError and standard error codes.
- Create a safe API error mapper.
- Create a generic Zod parsing helper.
- Add cn, normalizeText and slugify utilities.
- No any.
- No direct process.env outside the env module, except unavoidable config files.
- No Prisma access outside repositories after this task.

# Tests

Add Vitest if no runner exists. Test env validation, slugify, normalizeText, parseInput and error mapping.

# Acceptance criteria

- npm run lint passes.
- npm run typecheck passes.
- npm run build passes.
- tests pass.
- Prisma client instantiates against the local database.
- no secrets are logged or committed.

# Cursor instruction

Before modifying files, provide:

1. Implementation plan.
2. Dependencies and justification.
3. Files to create or modify.
4. Risks.
