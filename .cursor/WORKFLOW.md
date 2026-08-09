# Cursor Workflow

This workflow defines the normal execution sequence for implementation tasks.

It complements `AGENTS.md` and `.cursor/RULES.md`.

---

## Standard Workflow

1. Understand the task and acceptance criteria.
2. Read the relevant repository context.
3. Identify capability ownership and architectural boundaries.
4. Inspect the current source affected by the task.
5. Produce a plan proportional to the task.
6. Determine whether implementation is ready.
7. Implement only the approved scope.
8. Run relevant validation.
9. Review the resulting diff and behavior.
10. Update documentation when required.
11. Summarize changes, validation and limitations.
12. Suggest a commit message when useful or requested.

---

## Readiness Check

Before implementation ask:

    Can this task be completed
    without making an unresolved architectural
    or business decision?

If yes:

    Proceed

If no:

    STOP
    → Report the blocker
    → Request the required decision
    → Resume after resolution

Do not request approval again merely because a plan exists when the task and architecture are already approved.

---

## Planning Depth

Planning should be proportional to risk.

Small, local changes may require only a short implementation plan.

Larger changes may require:

- affected files;
- ownership;
- dependency impact;
- data impact;
- migration impact;
- security impact;
- validation strategy.

Avoid unnecessary ceremony for trivial changes.

---

## Implementation

During implementation:

- stay within scope;
- respect source boundaries;
- preserve dependency direction;
- avoid speculative infrastructure;
- avoid unrelated cleanup;
- surface newly discovered blockers.

If implementation reveals that the approved plan is architecturally invalid, stop rather than silently redesign it.

---

## Validation

Current baseline:

    npm run typecheck
    npm run lint

Additional validation depends on the task and may include:

- build;
- automated tests;
- migrations;
- database checks;
- authentication checks;
- runtime verification;
- Product flow validation.

Run what is relevant and actually available.

Never report a check as passed unless it was executed.

---

## Completion Report

Report:

1. what changed;
2. files changed;
3. validation executed;
4. known limitations;
5. unresolved blockers.

When appropriate, suggest a concise commit message.

Do not commit unless the task or approved workflow requires it.

---

## Final Principle

Understand.

Verify ownership.

Plan proportionally.

Implement approved scope.

Validate.

Report evidence.

Stop when a real decision is missing.
