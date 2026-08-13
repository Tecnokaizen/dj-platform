---
title: Roles Specification
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../organizations/SPEC.md
  - ../organizations/DATA_MODEL.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/CORE.md
  - ../../../architecture/SECURITY.md
---

# Roles Specification

## Purpose

The Roles module defines reusable authorization roles used across Platform Core.

Roles provides stable role identities that may be assigned to Organization Memberships.

The module answers one question:

```text
What role does this Membership have?
```

It does not answer:

```text
What is this user allowed to do?
```

Permission evaluation belongs to the Permissions module.

---

# Core Principle

Roles represents authorization position.

Permissions represents authorization capability.

Conceptually:

```text
Profile
   ↓
OrganizationMembership
   ↓
Role
   ↓
Permissions
```

Each responsibility has a distinct owner.

---

# Architectural Ownership

Platform authorization is divided across several Core modules.

```text
Identity
│
└── Profile

Organizations
│
└── Organization

Memberships
│
└── OrganizationMembership

Roles
│
└── Role

Permissions
│
└── Permission
```

Roles owns:

```text
Role
Role identity
Role key
Role metadata
System role definitions
Role lifecycle where applicable
```

Roles does not own:

```text
OrganizationMembership
Membership lifecycle
Permission
Permission evaluation
Organization ownership persistence
User identity
Invitations
```

---

# Initial Scope

The first Roles implementation provides a small set of canonical Platform Core roles.

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

These roles are reusable across Organizations.

The initial implementation does not provide custom Organization-specific roles.

---

# Why Roles Are Global Initially

The initial platform needs a stable authorization vocabulary before Memberships can be implemented.

A global canonical Role catalog provides:

- predictable role identifiers;
- consistent Organization behavior;
- simple Membership relationships;
- reusable authorization semantics;
- stable seeds;
- less migration complexity;
- no temporary enum or duplicated role system.

Conceptually:

```text
Role
     ├── OWNER
     ├── ADMIN
     ├── MANAGER
     ├── MEMBER
     └── VIEWER
```

Organizations reuse these definitions.

---

# Organization Relationship

Roles do not belong directly to Organizations in the initial model.

Instead:

```text
Organization
      ↓
OrganizationMembership
      ↓
Role
```

The same canonical Role may therefore be referenced by Memberships belonging to many Organizations.

Example:

```text
Organization A
    ↓
Membership
    ↓
ADMIN

Organization B
    ↓
Membership
    ↓
ADMIN
```

Both Memberships reference the same canonical ADMIN Role definition.

---

# Default Roles

## OWNER

Canonical key:

```text
OWNER
```

Represents the unique ownership role of an Organization.

Expected characteristics:

- Highest Organization authority.
- Exactly one active OWNER Membership per operational Organization.
- Required for Organization ownership.
- Ownership transfer must be explicit.
- OWNER Membership cannot be removed without valid ownership transfer.

The Organizations module defines the exactly-one-owner invariant.

Roles defines the canonical OWNER role.

Memberships stores which Membership has that Role.

---

## ADMIN

Canonical key:

```text
ADMIN
```

Represents broad administrative responsibility without Organization ownership.

Typical use:

- Organization administration.
- Member administration where permitted.
- Settings administration where permitted.
- Broad Domain administration.

Exact capabilities are defined by Permissions.

ADMIN is not equivalent to OWNER.

---

## MANAGER

Canonical key:

```text
MANAGER
```

Represents operational management responsibility.

Typical use:

- Manage operational workflows.
- Manage selected resources.
- Coordinate members or processes where permitted.

Exact capabilities are defined by Permissions.

---

## MEMBER

Canonical key:

```text
MEMBER
```

Represents a normal authenticated Organization participant.

Typical use:

- Access standard tenant functionality.
- Create or modify resources where permitted.
- Participate in Domain workflows.

Exact capabilities are defined by Permissions.

---

## VIEWER

Canonical key:

```text
VIEWER
```

Represents read-oriented Organization access.

Typical use:

- View authorized tenant resources.
- Avoid normal mutation capabilities.

Exact capabilities are defined by Permissions.

---

# Role Hierarchy

The default roles have an intuitive authority ordering:

```text
OWNER

↓

ADMIN

↓

MANAGER

↓

MEMBER

↓

VIEWER
```

However, this hierarchy must not become the sole permission engine.

Do not assume:

```text
ADMIN > MANAGER
```

automatically means every ADMIN permission is inherited from MANAGER through application code.

Canonical capabilities belong to Permissions.

Role hierarchy may assist presentation or policy reasoning but must not replace explicit permission definitions.

---

# Role Identity

Each Role must have a stable internal identifier.

Platform identifier strategy:

```text
UUID
```

Each Role also has a stable machine-readable key.

Examples:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

The UUID is the persistence identifier.

The key is the stable semantic identifier.

---

# Role Key

Role keys must be:

- unique;
- stable;
- uppercase;
- machine readable;
- independent from translated display labels.

Example:

```text
OWNER
```

Display name:

```text
Owner
```

or localized equivalent:

```text
Propietario
```

Application logic should not depend on localized role names.

---

# Role Name

Role name is a human-readable label.

Examples:

```text
Owner
Admin
Manager
Member
Viewer
```

The display name may eventually be localized.

The canonical role key remains stable.

---

# Role Description

Roles may provide a human-readable description.

For Roles Foundation, canonical `Role.description` is `null`.
Human-readable description copy is deferred until explicitly approved.

Illustrative example only (not Foundation seed metadata):

```text
Owner

Has ultimate administrative responsibility for the Organization.
```

Descriptions are informational.

Permission enforcement must not depend on description text.

---

# System Roles

The initial roles are system-defined.

Conceptually:

```text
isSystem = true
```

System roles:

- are created by Platform Core;
- use canonical keys;
- must not be silently renamed at the semantic level;
- must not be deleted while required by the platform;
- may be referenced across Organizations.

---

# Role Lifecycle

The initial system roles are effectively permanent platform reference data.

Normal application operations must not delete:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

If role retirement becomes necessary in the future, it requires:

- impact analysis;
- Membership reassignment strategy;
- Permission migration;
- documentation update;
- migration plan.

---

# Membership Relationship

Memberships owns:

```text
OrganizationMembership
```

Roles owns:

```text
Role
```

Conceptually:

```text
OrganizationMembership
        ↓
roleId
        ↓
Role
```

An active Membership must reference a valid Role.

The exact Membership persistence relationship is defined in the Memberships module.

---

# Active Membership Rule

The intended tenancy model requires:

```text
ACTIVE Membership
        ↓
Valid Role
```

An active Membership without a valid Role is not an approved production state.

This rule is one reason Roles must be specified before Memberships.

---

# OWNER Relationship

Organization ownership is represented through:

```text
OrganizationMembership
        +
OWNER Role
```

Roles does not own the Organization ownership invariant.

Responsibilities:

```text
Organizations
→ exactly one active owner requirement

Memberships
→ membership relationship and state

Roles
→ canonical OWNER definition
```

---

# Ownership Transfer

Roles participates in ownership transfer by providing the canonical OWNER Role.

Conceptual workflow:

```text
Current OWNER Membership
        ↓
Target Membership
        ↓
Resolve OWNER Role
        ↓
Assign OWNER to Target
        ↓
Downgrade Previous Owner
```

Membership mutation belongs to Memberships.

Transaction orchestration belongs to the tenancy workflow.

Roles does not directly transfer Organization ownership.

---

# Permissions Relationship

Roles and Permissions are intentionally separate.

Conceptually:

```text
Role
  ↓
Permission Assignment
  ↓
Permission
```

Roles owns:

```text
Role
```

Permissions owns:

```text
Permission
Permission evaluation
Role-to-Permission authorization mapping
```

The exact persistence ownership of Role-to-Permission assignments must be finalized in the Permissions specification.

Roles must not create a competing permission system.

---

# Domain Permissions

Business Domains may require permissions specific to their workflows.

Examples:

```text
Domain A

RESOURCE_CREATE
RESOURCE_UPDATE
RESOURCE_DELETE
```

```text
Domain B

ORDER_MANAGE
CUSTOMER_VIEW
```

Those permissions may eventually be assigned to Platform Roles through the Permissions capability.

Domains do not create competing copies of Platform Core Roles unless future architecture explicitly introduces Domain-specific role types.

---

# Custom Roles

Custom Organization-specific Roles are explicitly deferred.

Examples of future requirements could include:

```text
DESIGNER
PRODUCTION_MANAGER
EDITOR
ACCOUNTANT
```

Platform Core must not implement custom roles until a real product requirement validates the need.

A future custom-role architecture may require:

- Organization-scoped Role records;
- custom Role keys;
- Permission assignment UI;
- role duplication rules;
- role templates;
- role lifecycle rules.

Such a change requires explicit architecture review.

---

# Global vs Organization Roles

Initial architecture:

```text
Global System Roles
```

Not:

```text
Organization-Owned Custom Roles
```

Therefore the initial `Role` model does not require:

```text
organizationId
```

If Organization-scoped Roles are introduced later, the schema must evolve deliberately.

Do not add nullable `organizationId` preemptively.

---

# Role Assignment

Roles does not own assignment persistence.

A Role becomes assigned through:

```text
OrganizationMembership.roleId
```

owned by Memberships.

Therefore Roles may:

- provide Role lookup;
- provide Role validation;
- resolve canonical roles;
- expose available Roles.

Roles must not:

- mutate Memberships directly as its primary responsibility;
- decide who may assign a Role;
- persist membership state.

---

# Role Assignment Authorization

Who may assign or change Roles is an authorization question.

It depends on:

```text
Membership
Role
Permission
Organization context
```

This behavior belongs to the cross-module authorization workflow.

Roles provides role semantics, not authorization policy by itself.

---

# Role Lookup

The module should support stable Role resolution.

Examples:

```text
getRoleById

getRoleByKey

listSystemRoles
```

A canonical Role should normally be resolved through its stable key when required by platform workflows.

Example:

```text
getRoleByKey("OWNER")
```

---

# Seed Requirement

System Roles must exist before Memberships relying on them become operational.

Therefore Roles requires deterministic seed data.

Required initial seed:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Seed behavior must be:

- idempotent;
- deterministic;
- safe to rerun;
- independent from Business Domain data.

---

# Missing Role Handling

If a required canonical Role is missing:

```text
OWNER
```

for example, the platform must fail safely.

It must not:

- create an arbitrary temporary Role;
- fall back to another Role silently;
- store a string in Membership as a substitute;
- bypass the role relationship.

Missing required system roles represent a platform configuration error.

---

# Role Mutation

Initial system Roles should not require normal CRUD UI.

The first implementation may support primarily:

```text
Read
Resolve
Seed
Validate
```

Normal user-facing creation or deletion of Roles is outside initial scope.

---

# Role Updates

Changing canonical system Role semantics requires caution.

The following should not be casually editable:

```text
key
system status
canonical meaning
```

Human-readable metadata such as description may evolve.

Any change affecting authorization semantics requires review.

---

# Security

Role data is security-relevant.

Applications must not trust:

```text
client-provided roleId
client-provided role key
client-provided role name
```

without server-side validation.

Role assignment and authorization decisions must occur server side.

---

# Tenant Isolation

Roles themselves are global system reference data in the initial architecture.

Therefore:

```text
Role
```

is not tenant-owned.

However, assignment of a Role through Membership is tenant-specific.

Conceptually:

```text
Global Role
      ↓
Tenant-specific Membership
```

Tenant isolation remains enforced through the Membership and Organization relationship.

---

# Public Capabilities

The Roles module may expose:

```text
getRole

getRoleByKey

listRoles

listSystemRoles

resolveRequiredRole
```

Role mutation APIs are not required initially.

Detailed contracts belong in:

```text
API.md
```

---

# Events

The initial Roles module does not require an event-heavy architecture.

Possible future events may include:

```text
role.created
role.updated
role.retired
```

System seed creation does not necessarily require business events.

Role assignment events belong primarily to Memberships or authorization/audit workflows.

---

# Audit

Role-definition changes may eventually require audit records.

Examples:

```text
System Role metadata changed
Custom Role created
Custom Role retired
```

The Audit module owns AuditEvent persistence.

The initial immutable system Role catalog minimizes this requirement.

---

# Non-Goals

The initial Roles module does not provide:

```text
Custom Organization Roles

Permission Engine

Membership Management

User Management

Invitation Management

Organization Ownership Persistence

Domain Business Roles

Role Administration UI
```

These concerns either belong elsewhere or are deferred.

---

# Dependencies

Roles depends on:

```text
Prisma
PostgreSQL
Platform identifier strategy
```

Roles does not require Organizations to store its initial global system Role definitions.

Memberships depends on Roles for valid active role assignment.

Permissions will later integrate with Roles.

---

# Implementation Order

Recommended tenancy foundation sequence:

```text
Identity
    ✅
     ↓
Organizations
    ✅ specification
     ↓
Roles
     ← current
     ↓
Memberships
     ↓
Tenancy Integration
     ↓
Permissions
```

Roles precedes Memberships because active Memberships require a valid canonical Role.

---

# Future Evolution

Possible future Roles capabilities include:

- Custom Organization Roles.
- Role templates.
- Role cloning.
- Role retirement.
- Organization-specific Role names.
- Domain-aware Role presets.
- Fine-grained Permission assignment.
- White-label role terminology.

These capabilities require validated product demand.

---

# Definition of Ready

Roles is ready for implementation when:

- Canonical system roles are approved.
- Role ownership is unambiguous.
- UUID strategy is confirmed.
- Global initial Role scope is approved.
- Membership relationship is understood.
- OWNER semantics are approved.
- Permission ownership remains separate.
- Seed strategy is approved.
- Custom roles are explicitly deferred.
- DATA_MODEL, FLOWS, API, PRISMA and TASKS agree with this specification.

---

# Definition of Done

Roles Foundation is complete when:

- Role persistence exists.
- Canonical system Roles exist.
- UUID strategy is preserved.
- Role keys are unique.
- Seed is idempotent.
- Roles can be resolved by ID and key.
- OWNER can be reliably resolved.
- No Membership persistence exists inside Roles.
- No Permission engine exists inside Roles.
- No speculative Organization-specific Role system exists.
- Tests cover canonical Role behavior.
- Prisma validation passes.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.

---

# Final Principle

Roles defines who a Membership is acting as.

Memberships owns the assignment.

Permissions defines what that Role may do.

Organizations defines the tenant where that authority applies.

Keep those responsibilities separate.