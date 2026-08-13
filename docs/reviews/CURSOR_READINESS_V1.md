# Cursor Readiness Review V1

**Status:** Approved
**Date:** 2026-08-09
**Repository:** `dj-platform`
**Target Milestone:** Organizations Foundation
**Review Type:** Implementation Agent Readiness

---

# 1. Purpose

This review determines whether Cursor or another implementation agent can begin the approved Organizations Foundation milestone without silently making architectural decisions.

It evaluates:

- repository context;
- architectural authority;
- task boundaries;
- source ownership;
- Core specifications;
- Prisma conventions;
- Identity dependencies;
- tenancy constraints;
- validation expectations;
- known deferred decisions.

This review does not approve later Core milestones automatically.

---

# 2. Readiness Question

The governing question is:

> Can an implementation agent execute Organizations Foundation from the approved repository context without inventing foundational architecture?

Review conclusion:

**Yes.**

Organizations Foundation is ready for implementation.

---

# 3. Architectural Authority

Cursor has an explicit hierarchy of architectural context.

Foundation decisions are recorded in:

    docs/adr/

Current accepted ADRs are:

1. ADR-001 — Platform Core and Domain Boundary
2. ADR-002 — Identity Source of Truth
3. ADR-003 — Internal Identifier Strategy
4. ADR-004 — Tenancy and Organization Model
5. ADR-005 — Roles, Memberships and Ownership Model
6. ADR-006 — Authorization and Permission Model
7. ADR-007 — Prisma and Data Access Conventions
8. ADR-008 — Deployment and Infrastructure Strategy

Architecture is further defined under:

    docs/architecture/

Implementation agents must not override accepted ADRs through local implementation choices.

---

# 4. Repository Context

Cursor has current repository-level context through:

    AGENTS.md
    PROJECT_CONTEXT.md
    README.md
    docs/INDEX.md
    docs/README.md
    .cursor/README.md
    .cursor/RULES.md
    .cursor/WORKFLOW.md
    .cursor/CHECKLIST.md
    .cursor/SESSION.md
    .cursor/LESSONS.md

These files establish:

- architectural ownership;
- implementation-agent responsibilities;
- dependency direction;
- current source state;
- validation expectations;
- prohibition against speculative engineering.

## Finding

**READY**

Repository context is sufficient for implementation-agent orientation.

---

# 5. Target Capability

The next approved implementation target is:

    Organizations Foundation

Organizations belongs to:

    Platform Core

It does not belong to:

    DJ Domain
    Shared
    Infrastructure
    Product UI

The future implementation location is:

    src/core/modules/organizations/

The directory should be created when implementation begins.

Empty placeholder source directories are not required in advance.

## Finding

**READY**

Capability ownership and source location are explicit.

---

# 6. Organizations Specification

Organizations has a complete specification package:

    docs/core/modules/organizations/
    ├── SPEC.md
    ├── DATA_MODEL.md
    ├── FLOWS.md
    ├── API.md
    ├── PRISMA.md
    └── TASKS.md

These documents define the implementation contract for the capability.

Cursor should use `TASKS.md` as implementation sequencing guidance while preserving the contracts defined by the complete specification package.

## Finding

**READY**

Organizations has sufficient specification depth to begin implementation.

---

# 7. Identity Dependency

Identity is already implemented under:

    src/core/identity/
    ├── auth/
    └── profile/

Supabase Auth is the canonical authentication identity.

`Profile` is application identity.

Organizations must integrate with `Profile`.

Organizations must not introduce:

    User
    OrganizationUser
    ownerUserId
    ownerProfileId

as competing identity or ownership mechanisms.

## Finding

**READY**

Identity dependency is implemented and architecturally defined.

---

# 8. Organization Model

`Organization` is the canonical Platform Core tenant.

Organizations owns tenant identity.

Organization must remain business-agnostic.

Core Organization semantics must not encode Product-specific concepts such as:

- DJ agency;
- record label account;
- copy shop;
- print center;
- other vertical-specific organization types.

## Finding

**READY**

Organization semantics are sufficiently constrained.

---

# 9. Ownership Model

Organization ownership is not represented through a direct Organization field.

Canonical ownership is:

    Organization
    +
    ACTIVE OrganizationMembership
    +
    OWNER Role

Therefore Cursor must not introduce:

    ownerId
    ownerUserId
    ownerProfileId

as canonical ownership fields.

Organizations Foundation may implement Organization persistence before Memberships is implemented.

It must not invent temporary ownership semantics merely because later Core modules are not yet present.

## Finding

**READY**

Ownership architecture is explicit.

---

# 10. Implementation Sequence

Approved Foundation sequence is:

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

Current state:

    Identity
    → implemented

    Organizations
    → next implementation milestone

    Roles
    → specified, not implemented

    Memberships
    → specified, not implemented

    Permissions
    → specified, not implemented

Cursor must not implement later modules opportunistically unless an Organizations task explicitly requires an approved prerequisite change.

## Finding

**READY**

Milestone boundary is clear.

---

# 11. Prisma Boundary

Active Prisma persistence definition is:

    prisma/schema.prisma

Migration history lives under:

    prisma/migrations/

Generated Prisma client lives under:

    src/generated/prisma/

Application Prisma infrastructure is architecturally reserved for:

    src/lib/prisma/

when actual runtime integration requires it.

Cursor must not manually edit generated Prisma files.

## Finding

**READY**

Persistence boundaries are explicit.

---

# 12. Data Access Conventions

Repository Pattern is not mandatory.

Cursor must not introduce repository abstractions automatically.

Persistence abstractions should be added only when demonstrated implementation complexity justifies them.

Direct server-side Prisma access from an appropriate capability service may be acceptable if it preserves architectural ownership.

Business logic must not be placed in generic infrastructure adapters.

## Finding

**READY**

Cursor does not need to invent a persistence abstraction strategy.

---

# 13. Transactions

Cursor must use transactions when Organizations workflows require atomic multi-record invariants.

Organizations Foundation itself must not prematurely implement later Membership ownership workflows.

When Organization creation is later integrated with Roles and Memberships, the approved atomic flow is:

    Profile
        ↓
    resolve OWNER Role
        ↓
    BEGIN
        ↓
    create Organization
        ↓
    create ACTIVE OWNER Membership
        ↓
    COMMIT

Cursor must not split that future invariant across unrelated persistence operations.

## Finding

**READY**

Transaction expectations are already decided.

---

# 14. Identifier Strategy

Principal application entities use internally controlled identifiers.

UUID is the default strategy unless the approved Organizations specification explicitly requires otherwise.

Names and slugs must not become canonical tenant identity.

## Finding

**READY**

Cursor does not need to choose an identifier strategy.

---

# 15. Authorization Boundary

Organizations Foundation must not invent authorization behavior that belongs to later Core capabilities.

Authorization architecture is:

    Profile
        ↓
    Membership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission

Permissions are specified but not yet implemented.

Cursor must not add:

    isAdmin
    organizationRole
    permissions[]

to Profile or Organization as shortcuts.

## Finding

**READY**

Authorization ownership is explicit and outside current milestone scope unless an approved task says otherwise.

---

# 16. Source Dependency Rules

Allowed high-level dependencies are:

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

Organizations implementation belongs under Core and must not depend on DJ Domain code.

## Finding

**READY**

Dependency direction is explicit.

---

# 17. Product Independence

Organizations must remain reusable outside DJ Platform.

Cursor must not infer DJ-specific requirements merely because the repository is named `dj-platform`.

Repository name does not change Core semantics.

## Finding

**READY**

Product/Core separation is explicit.

---

# 18. Validation Baseline

Current repository baseline validation is:

    npm run typecheck
    npm run lint

Both currently pass after Foundation consolidation work.

Prisma changes may additionally require, depending on the task:

- Prisma schema validation;
- Prisma client generation;
- migration generation;
- migration inspection;
- database connectivity;
- development migration execution;
- runtime verification.

Cursor must report what was actually executed.

It must not claim tests or runtime verification that did not occur.

## Finding

**READY**

Validation expectations are explicit.

---

# 19. Testing Expectations

Testing requirements should follow implemented behavior.

Organizations Foundation should add tests where its implemented invariants or service behavior justify them.

Cursor must not fabricate a test infrastructure claim if no relevant test runner or setup exists.

If introducing new test infrastructure becomes necessary, that should be treated as a deliberate engineering change rather than silently assumed.

## Finding

**READY**

Testing expectations are proportionate and evidence-based.

---

# 20. Infrastructure Constraints

Cursor must not introduce speculative infrastructure during Organizations Foundation.

Do not add without demonstrated need:

- Redis;
- cache framework;
- queue framework;
- OpenAI SDK;
- Anthropic SDK;
- Realtime dependency;
- Storage dependency;
- additional auth provider;
- new hosting architecture.

## Finding

**READY**

Infrastructure scope is constrained.

---

# 21. Deferred Decisions

The following decisions remain explicitly deferred.

## 21.1 Previous OWNER Role After Ownership Transfer

Does not block Organizations Foundation.

Cursor must not implement ownership transfer until the decision is resolved.

## 21.2 Strong Database Enforcement of Sole OWNER

Does not block Organizations Foundation.

Cursor must not invent PostgreSQL triggers or unsupported Prisma index behavior during this milestone.

## 21.3 Invitation Conditional Uniqueness

Does not block Organizations Foundation.

This decision becomes relevant during Membership invitation implementation.

## Finding

**NON-BLOCKING**

Deferred decisions are isolated from the current milestone.

---

# 22. Cursor Must Not Decide

During Organizations Foundation, Cursor must not independently decide:

- a new tenant model;
- an Organization owner field;
- Product-specific Organization semantics;
- a new User model;
- a new canonical Role;
- a new Permission;
- ownership-transfer behavior;
- database triggers for sole OWNER;
- a mandatory Repository Pattern;
- a new infrastructure provider;
- a new caching layer;
- a queue framework;
- an AI provider;
- a Product route unrelated to the milestone.

If implementation appears to require one of these decisions:

    STOP
        ↓
    document the uncertainty
        ↓
    request architectural decision
        ↓
    continue after approval

---

# 23. Cursor May Decide

Cursor may make normal implementation decisions that do not alter approved architecture.

Examples include:

- local function naming;
- internal helper extraction;
- file decomposition inside the Organizations capability;
- straightforward TypeScript types;
- error-message wording;
- implementation details directly implied by the specification;
- formatting and lint-compatible code structure.

These decisions must remain within the approved contracts.

---

# 24. Required Implementation Inputs

Before beginning Organizations Foundation, Cursor should read:

1. `AGENTS.md`
2. `PROJECT_CONTEXT.md`
3. `.cursor/RULES.md`
4. `.cursor/WORKFLOW.md`
5. `.cursor/SESSION.md`
6. `docs/adr/ADR-001-platform-core-domain-boundary.md`
7. `docs/adr/ADR-002-identity-source-of-truth.md`
8. `docs/adr/ADR-003-internal-identifier-strategy.md`
9. `docs/adr/ADR-004-tenancy-and-organization-model.md`
10. `docs/adr/ADR-005-roles-memberships-ownership-model.md`
11. `docs/adr/ADR-006-authorization-permission-model.md`
12. `docs/adr/ADR-007-prisma-data-access-conventions.md`
13. `docs/core/modules/organizations/SPEC.md`
14. `docs/core/modules/organizations/DATA_MODEL.md`
15. `docs/core/modules/organizations/FLOWS.md`
16. `docs/core/modules/organizations/API.md`
17. `docs/core/modules/organizations/PRISMA.md`
18. `docs/core/modules/organizations/TASKS.md`

ADR-008 should also be consulted if implementation touches deployment or infrastructure.

---

# 25. Approved Implementation Scope

Cursor is approved to implement Organizations Foundation according to:

    docs/core/modules/organizations/TASKS.md

within the accepted architectural constraints.

This approval does not automatically authorize implementation of:

- Roles;
- Memberships;
- Permissions;
- ownership transfer;
- invitation workflows;
- billing;
- Product-specific Organization workflows.

Those remain separate milestones.

---

# 26. Readiness Matrix

| Area | Status |
|---|---|
| Repository context | READY |
| Architecture authority | READY |
| ADR baseline | READY |
| Organizations specification | READY |
| Identity dependency | READY |
| Tenant semantics | READY |
| Ownership model | READY |
| Identifier strategy | READY |
| Prisma conventions | READY |
| Data-access policy | READY |
| Dependency direction | READY |
| Validation baseline | READY |
| Infrastructure constraints | READY |
| Deferred decisions | NON-BLOCKING |
| Foundational blockers | NONE |

---

# 27. Blocking Findings

**None identified for Organizations Foundation.**

---

# 28. Approved Actions

After final repository validation and Foundation consolidation commit:

1. begin Organizations Foundation;
2. create `src/core/modules/organizations/` when implementation requires it;
3. follow Organizations `TASKS.md`;
4. preserve accepted ADRs;
5. update Prisma only as required by approved Organizations persistence design;
6. create and inspect required migrations;
7. run applicable validation;
8. report implementation evidence;
9. stop for any genuinely new architectural decision.

---

# 29. Review Verdict

**APPROVED**

Cursor is ready to implement Organizations Foundation.

The implementation agent has enough approved context to execute the milestone without inventing foundational architecture.

Final repository validation and the consolidation commit should occur before implementation resumes.

---

# Final Principle

Cursor implements approved architecture.

Cursor may make ordinary implementation decisions.

Cursor must not silently become the architect when a new foundational decision appears.

For Organizations Foundation, the repository is implementation-ready.
