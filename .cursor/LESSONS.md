# DJ Platform — Lessons Learned

> Living knowledge base.
>
> This document captures architectural decisions, mistakes, best practices and conventions discovered during development.
>
> Every significant lesson must be recorded here.
>
> Never remove old lessons.
>
> If a rule changes, add a new entry explaining why.

---

# 2026-08-04

## Foundation

### L001 — Use Prisma Migrate

Always use:

```bash
prisma migrate dev
```

Never use:

```bash
prisma db push
```

except for prototypes explicitly approved.

Reason:

- migrations are versioned
- reproducible
- production-safe

---

### L002 — Local database for development

Development always uses:

Docker Desktop

↓

PostgreSQL Local

Production uses:

Coolify

↓

PostgreSQL

Never expose production databases to local development.

---

### L003 — Cursor workflow

Cursor should not begin significant implementation without understanding the task and relevant context.

Normal workflow:

1. Read project context.
2. Read the task and acceptance criteria.
3. Inspect relevant documentation and source.
4. Identify ownership and architectural boundaries.
5. Produce a plan proportional to the task.
6. Check implementation readiness.
7. Implement approved scope.
8. Run relevant validation.

Do not request approval again when the task and required decisions are already approved.

Stop only when a real architectural, business or safety decision remains unresolved.

---

### L004 — Architecture and implementation roles

Cursor normally operates as an implementation agent.

Implementation agents implement approved Architecture and must not silently redefine it.

Architecture may be analyzed or proposed by an AI agent only when that agent is explicitly operating in an Architecture role.

Role boundaries must remain explicit.

Do not redesign architecture while implementing tasks.

---

### L005 — Prisma and persistence boundaries

Prisma access must respect capability ownership and server-side boundaries.

Do not introduce a Repository Pattern merely because persistence exists.

Repository abstractions may be used when they provide demonstrated value and match the owning capability.

Prisma must not be accessed directly from browser-side UI code.

Server-side Actions, services or other capability code may coordinate persistence according to current repository conventions.

Avoid arbitrary database access that bypasses:

- capability ownership
- tenant boundaries
- authorization
- transaction requirements

Do not bypass Prisma casually.

Raw SQL requires a demonstrated need and appropriate review.

---

### L006 — Environment variables

Environment variables must be handled deliberately.

Before introducing or using an environment abstraction:

- inspect the current repository implementation
- distinguish public and private variables
- never expose secrets to client bundles
- avoid scattering environment access unnecessarily
- validate required configuration at an appropriate boundary

Do not assume:

- `src/lib/env` exists
- Zod is installed
- a specific validation library has been approved

Follow the current source and package configuration.

---

### L007 — Quality gates

Current baseline validation is:

npm run typecheck

npm run lint

Additional validation depends on the task and may include:

- npm run build
- automated tests
- migrations
- runtime verification
- authentication or Product flow checks

Run only relevant available checks.

Never claim validation that was not executed.

---

### L008 — AI philosophy

Artificial Intelligence assists.

Humans decide.

Every AI-generated content must be reviewable before publication.

Never auto-publish generated knowledge.

---

### L009 — UX philosophy

Every screen must answer:

"How can AI save time here?"

If AI adds no value, reconsider the feature.

---

## Pending lessons

This section intentionally remains empty.

Future milestones will add:

- imports
- AI
- search
- playlists
- authentication
- performance
- caching
- testing