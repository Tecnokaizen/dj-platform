# Cursor Rules

These are concise execution rules for Cursor and other implementation agents.

They complement `AGENTS.md`.

If this file conflicts with approved Architecture or `AGENTS.md`, stop and report the conflict.

---

## Before Coding

For significant work:

1. Read `PROJECT_CONTEXT.md`.
2. Read `AGENTS.md`.
3. Read `docs/INDEX.md` when navigation context is needed.
4. Read the task and its acceptance criteria.
5. Read the relevant Architecture, Core or Domain documentation.
6. Inspect the current source affected by the task.

Do not load unrelated documentation unnecessarily.

---

## Architecture

Do not silently change Architecture.

Stop when implementation requires an unresolved decision about:

- Core vs Domain ownership;
- tenancy;
- identity;
- authorization;
- cross-Domain dependencies;
- major persistence strategy;
- infrastructure strategy;
- foundational frameworks.

---

## Source Boundaries

Respect:

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

Do not hide forbidden dependencies through indirection.

---

## TypeScript

Prefer explicit and narrow types at important boundaries.

Avoid unnecessary `any`.

Never use `any`, type assertions or ignored errors merely to silence a TypeScript problem.

---

## Prisma

Use Prisma according to the owning capability and current repository conventions.

Do not introduce a repository layer merely to satisfy an assumed pattern.

Do not bypass Prisma casually.

Raw SQL requires a demonstrated need and appropriate review.

Validate advanced Prisma capabilities against the installed version.

---

## Environment Variables

Handle environment variables deliberately.

- protect secrets;
- distinguish server and client exposure;
- avoid unnecessary scattered access;
- validate required configuration at an appropriate boundary.

Do not assume `src/lib/env` or Zod exists.

---

## Dependencies

Justify every new dependency.

Check `package.json` before assuming a library exists.

Do not install infrastructure or frameworks speculatively.

---

## Scope

Implement only approved task scope.

Do not combine unrelated:

- features;
- refactors;
- dependency upgrades;
- source moves;
- infrastructure changes.

Report adjacent opportunities separately.

---

## Validation

Current baseline:

    npm run typecheck
    npm run lint

Run additional validation when relevant to the task, including:

- `npm run build`;
- tests;
- migrations;
- runtime checks;
- authentication checks;
- Product flow verification.

Never claim a validation step was successful unless it was actually executed.

---

## Completion

Before marking work complete:

- verify acceptance criteria;
- run relevant validation;
- report files changed;
- report known limitations;
- report unresolved blockers.

Implementation completion does not imply Production Ready.

---

## Final Rule

Understand ownership.

Respect Architecture.

Implement approved scope.

Validate real behavior.

Stop instead of guessing foundational decisions.
