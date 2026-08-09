# Definition of Done

Use this checklist before marking an implementation task complete.

Not every item requires the same depth for every task.

---

## Scope

- Task scope implemented
- Acceptance criteria checked
- No unrelated changes introduced
- No unresolved architectural decision silently assumed

---

## Architecture

- Capability ownership respected
- Dependency direction respected
- Core and Domain boundaries preserved
- No speculative infrastructure introduced
- No new foundational decision made without approval

---

## Code

- Types are appropriate for the changed boundaries
- Meaningful TypeScript errors are not suppressed
- Business logic remains in the owning capability
- Generated code has not been manually modified without reason
- No secrets or credentials introduced

---

## Baseline Validation

- `npm run typecheck` passes
- `npm run lint` passes

If either command cannot be executed, document the reason.

---

## Additional Validation

Run when relevant:

- `npm run build`
- automated tests
- migration validation
- database checks
- authentication checks
- runtime verification
- Product flow verification

Do not mark an unexecuted check as passed.

---

## Documentation

- Documentation updated when the change affects documented behavior
- Repository reality and documentation remain aligned
- Newly discovered architectural conflicts are reported rather than hidden

---

## Completion Report

Report:

- what changed
- files changed
- validation executed
- known limitations
- unresolved blockers

---

## Final Check

Implementation complete does not mean Production Ready.

Mark the task complete only when the approved scope is implemented and the relevant evidence supports completion.
