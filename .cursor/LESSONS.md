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

Cursor must never start coding immediately.

Always:

1. Read project context.
2. Read task.
3. Produce implementation plan.
4. Wait for approval.
5. Implement.
6. Run quality checks.

---

### L004 — Architecture decisions belong to ChatGPT

Cursor implements.

ChatGPT defines architecture.

Do not redesign architecture while implementing tasks.

---

### L005 — Repository Pattern

Only repositories may access Prisma.

No direct Prisma usage inside:

- Components
- Actions
- Hooks
- Services

unless explicitly approved.

---

### L006 — Environment variables

Never use:

process.env

outside:

src/lib/env

except unavoidable configuration files.

Always use:

env

validated with Zod.

---

### L007 — Quality gates

Every completed task must finish with:

npm run lint

npm run typecheck

npm run build

before commit.

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