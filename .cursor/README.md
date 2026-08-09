# Cursor Development Kit

This directory contains repository-specific instructions and working context for Cursor and compatible AI implementation agents.

It complements:

- `PROJECT_CONTEXT.md`
- `AGENTS.md`
- repository documentation

It does not replace Architecture, Core specifications, Domain specifications or Engineering standards.

---

## Location

`.cursor/` must remain at the repository root:

    dj-platform/
    └── .cursor/

Agents must operate inside the current repository root.

Do not rely on a machine-specific absolute path.

---

## Files

`RULES.md`

Concise execution rules for implementation agents.

`WORKFLOW.md`

Normal task execution lifecycle.

`CHECKLIST.md`

Definition of Done and validation checklist.

`LESSONS.md`

Repository-specific lessons learned from previous implementation work.

`SESSION.md`

Current working-session context and continuation state.

`prompts/`

Reusable prompts for constrained implementation activities such as:

- bug fixes;
- migrations;
- modules;
- refactors;
- reviews;
- tests.

---

## Authority

`.cursor/` is execution guidance.

It must remain consistent with:

    Approved Architecture
        ↓
    Core / Domain Specifications
        ↓
    Engineering Standards
        ↓
    AGENTS.md
        ↓
    .cursor execution guidance

If `.cursor/` conflicts materially with approved repository documentation or current repository reality:

1. stop;
2. identify the conflict;
3. resolve the authoritative decision;
4. update the stale instruction.

Do not follow stale Cursor instructions blindly.

---

## Repository Scope

Agents must not operate outside the repository unless the task explicitly requires external infrastructure, another repository or an external service.

Never modify unrelated files or systems merely because they are accessible.

---

## Final Principle

`.cursor/` helps implementation agents work consistently.

Architecture defines boundaries.

Specifications define capability behavior.

Engineering defines implementation standards.

Cursor executes approved work within those boundaries.
