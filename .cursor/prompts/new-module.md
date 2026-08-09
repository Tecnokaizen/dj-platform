# New Module

Use this prompt when implementing a new module or capability.

Before implementation:

1. Read `PROJECT_CONTEXT.md`.
2. Read `AGENTS.md`.
3. Read the requested task and acceptance criteria.
4. Read relevant Architecture documentation.
5. Read the relevant Core or Domain specification.
6. Inspect the current source structure.

Determine:

- capability ownership;
- architectural boundaries;
- dependencies;
- affected files;
- validation strategy;
- relevant risks.

Ask:

    Can this module be implemented
    without making an unresolved architectural
    or business decision?

If yes:

    Produce a proportional implementation plan
    and proceed within the approved scope.

If no:

    STOP
    → identify the missing decision
    → explain why guessing would be unsafe
    → request resolution

Do not create a module merely because code may be reusable.

Respect dependency direction:

    app
    → core / domains / shared

    domains
    → core / shared / lib

    core
    → shared / lib

    lib
    → generated / external providers

Never silently decide:

- Core vs Domain ownership;
- tenancy architecture;
- identity architecture;
- authorization architecture;
- cross-Domain dependencies;
- foundational infrastructure.

Keep implementation limited to the requested capability.

Validate using the checks relevant to the task.

Current baseline:

    npm run typecheck
    npm run lint

Report:

- what changed;
- files changed;
- validation executed;
- known limitations;
- unresolved blockers.
