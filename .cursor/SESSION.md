# SESSION.md

> Current continuation context for AI implementation agents.
>
> This file is versioned intentionally so a new Cursor or AI session can
> resume work without reconstructing the repository state from memory.
>
> Update it when the active milestone, implementation state or immediate
> next steps materially change.

---

## Session Information

Date:

2026-08-09

Repository:

`dj-platform`

Current Phase:

Repository Foundation Consolidation

Current Objective:

Finish aligning repository-level AI context and Cursor instructions before
creating foundational ADRs and performing formal readiness reviews.

Branch:

Verify with:

    git branch --show-current

Do not rely on this file for branch truth.

---

## Current State

Major documentation areas consolidated:

- `docs/architecture/` ✅
- `docs/business/` ✅
- `docs/engineering/` ✅
- `docs/backend/` ✅
- `docs/frontend/` ✅
- `docs/operations/` ✅

Repository context consolidated:

- `PROJECT_CONTEXT.md` ✅
- `AGENTS.md` ✅

Cursor context consolidated so far:

- `.cursor/LESSONS.md` ✅
- `.cursor/RULES.md` ✅
- `.cursor/WORKFLOW.md` ✅
- `.cursor/CHECKLIST.md` ✅
- `.cursor/README.md` ✅

Current file under consolidation:

- `.cursor/SESSION.md`

Still pending:

- `.cursor/prompts/` review
- final `.cursor/` audit
- remaining repository-level context audit
- foundational ADR backfill
- formal Architecture Review
- formal Cursor / AI Agent Readiness Review
- final repository validation
- consolidation commit

---

## Product and Architecture Context

DJ Platform is the first Product built on Platform Core.

Platform Core contains reusable SaaS capabilities.

Business Domains contain Product-specific semantics.

Product is not equivalent to Domain.

Current Core Foundation sequence:

    Identity
        ↓
    Organizations
        ↓
    Roles
        ↓
    Memberships
        ↓
    Tenancy Integration
        ↓
    Permissions

Identity foundation already exists in source.

Organizations, Roles, Memberships and Permissions are specified but remain
implementation work.

---

## Current Source Structure

    src/
    ├── app/
    ├── config/
    ├── core/
    │   ├── identity/
    │   └── modules/
    ├── domains/
    │   └── dj/
    ├── generated/
    │   └── prisma/
    ├── lib/
    └── shared/

Key dependency rules:

    app
    → core / domains / shared

    domains
    → core / shared / lib

    core
    → shared / lib

    lib
    → generated / external providers

Forbidden:

    core
    → domains

    shared
    → core

    shared
    → domains

    Domain A
    → Domain B

---

## Identity and Tenancy

Supabase Auth is the canonical authentication identity.

Application identity is represented by:

    Profile

Do not create a second canonical Prisma `User`.

Organization is the canonical tenant.

Ownership is represented by:

    Organization
    +
    ACTIVE OrganizationMembership
    +
    OWNER Role

Do not introduce:

- `ownerUserId`
- `ownerId`
- `ownerProfileId`

as an alternative ownership model.

---

## Current Stack Reality

Current repository stack includes:

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- PostgreSQL
- Prisma 7
- Supabase Auth
- `@supabase/ssr`
- `@supabase/supabase-js`
- `pg`
- npm

Do not assume:

- Auth.js
- Zod
- shadcn/ui
- OpenAI SDK
- Anthropic SDK
- Vitest
- Playwright
- Redis
- queue infrastructure

Verify `package.json` before using dependencies.

---

## Validation Baseline

Current baseline:

    npm run typecheck
    npm run lint

These checks have passed previously after the Core identity source refactor.

They are not equivalent to comprehensive automated testing.

Additional validation must be selected according to the task.

Do not assume:

- build was executed;
- unit tests exist;
- integration tests exist;
- end-to-end tests exist.

---

## Infrastructure Reality

Current infrastructure direction:

- VPS
- Coolify
- PostgreSQL
- Supabase self-hosted
- Docker-based services where appropriate

Development infrastructure exists and is still evolving.

Supabase self-hosted infrastructure has been under active validation.

Do not infer that every Supabase service is healthy from deployment
configuration alone.

Staging is not assumed.

Production is not verified.

The Product is not currently considered Production Ready.

---

## Current Decisions

Established architectural decisions include:

- Platform Core and Domain separation
- Product is not Domain
- Core promotion requires demonstrated architectural justification
- Supabase Auth plus Profile identity model
- Organization as tenant
- Membership plus OWNER Role as ownership model
- Roles before Memberships in Foundation implementation
- explicit permission catalog
- `src/lib` for infrastructure adapters
- no root `src/types`
- no `src/infrastructure`
- generated Prisma client remains under `src/generated/prisma`

These decisions still need foundational ADR backfill where appropriate.

---

## Known Open Architecture Questions

Do not resolve these implicitly during implementation:

- role of previous OWNER during ownership transfer
- exact database enforcement of one active OWNER per Organization
- invitation uniqueness implementation
- future Storage architecture
- future AI provider architecture
- future Search architecture
- future Jobs / Queue architecture
- future Billing architecture

---

## Immediate Next Steps

After this file is validated:

1. review `.cursor/prompts/`
2. run final `.cursor/` audit
3. inspect remaining repository-level context files
4. backfill foundational ADRs
5. create formal Architecture Review
6. create formal Cursor / AI Agent Readiness Review
7. perform final repository validation
8. prepare the consolidation commit
9. resume approved Core Foundation implementation

Do not jump directly into speculative Product features.

---

## Implementation Readiness Rule

Before coding ask:

    Can the implementation agent execute this task
    without making an unresolved architectural decision?

If yes:

    Implement
    → Validate
    → Review

If no:

    STOP
    → Resolve the missing decision
    → Update context when required
    → Resume

---

## Current Blockers

No implementation blocker is being resolved in this session.

The current work is repository and agent-context consolidation.

Architecture questions listed above remain intentionally open until their
corresponding decision point.

---

## Git State

Do not create the final consolidation commit yet.

Before committing:

- finish documentation/context consolidation;
- complete ADR backfill;
- complete formal reviews;
- inspect `git status`;
- run relevant repository validation;
- review the final diff.

`.cursor/SESSION.md` is intentionally versionable.

Do not add it back to `.gitignore`.

---

## Lessons

Permanent implementation lessons belong in:

    .cursor/LESSONS.md

Do not duplicate stable lessons indefinitely in this file.

`SESSION.md` should retain only enough current state to resume work safely.

---

## Final Principle

This file records where work currently stands.

It does not define Architecture.

It does not override specifications.

It does not prove runtime state.

Resume from evidence.

Respect approved boundaries.

Finish consolidation before returning to implementation.
