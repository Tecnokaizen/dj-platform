# ADR-005 — Roles, Memberships and Ownership Model

**Status:** Accepted
**Date:** 2026-08-09
**Decision Type:** Foundation Architecture

## Context

Platform Core needs a reusable model for representing:

- who belongs to an Organization;
- which Role a member has;
- how Organization ownership is represented;
- how invitations become memberships;
- how membership lifecycle changes affect tenancy invariants.

These concerns must remain independent from individual Products and business Domains.

Earlier architectural approaches could have represented ownership through direct fields on Organization or authorization through Product-specific role attributes.

That would create competing tenancy and authorization systems.

The platform instead requires one coherent relationship between:

    Profile
    Organization
    Membership
    Role

## Decision

Platform Core separates responsibility across three capabilities:

    Roles
    Memberships
    Organizations

Their ownership is:

    Roles
    └── Role

    Memberships
    ├── OrganizationMembership
    └── OrganizationInvitation

    Organizations
    └── Organization

Ownership is represented through Membership + OWNER Role.

There is no separate owner field on Organization.

## Role

`Role` represents a canonical authorization role definition.

Roles belong to the Platform Core Roles capability.

A Role defines reusable authorization semantics.

Role identity must not depend on Product-specific labels or UI text.

Initial canonical role semantics include:

    OWNER
    ADMIN
    MANAGER
    MEMBER
    VIEWER

These roles do not belong to the DJ Domain.

Products may choose how prominently they expose them, but Product composition must not redefine their canonical meaning silently.

## Role Identity

Role persistence uses an internally controlled identifier.

Role semantics must also have a stable canonical key or equivalent approved identifier.

Application behavior must not determine privileged semantics by comparing translated display labels.

Conceptually:

    Role
    ├── internal identity
    ├── canonical semantic key
    └── presentation metadata

The active persistence design must follow the approved Roles specification.

## Membership

`OrganizationMembership` represents the relationship between a Profile and an Organization.

Conceptually:

    Profile
        │
        └── OrganizationMembership
                ├── Organization
                ├── Role
                └── membership state

Membership belongs to Platform Core Memberships.

It does not belong to:

- Identity;
- Organizations;
- the DJ Domain;
- Product UI.

## Membership Meaning

An authenticated Profile is not automatically a member of an Organization.

Membership must be resolved explicitly.

Conceptually:

    authenticated Profile
        ↓
    OrganizationMembership
        ↓
    Organization

Tenant access must not be inferred merely from authentication.

## Membership Role

Each active Membership references its canonical Role according to the approved Memberships data model.

Role semantics are owned by Roles, not duplicated inside Memberships.

Memberships consume Role definitions.

Therefore the implementation sequence remains:

    Identity
        ↓
    Organizations
        ↓
    Roles
        ↓
    Memberships

Roles precede Memberships because Memberships require canonical Role references.

## Ownership

Organization ownership is a specialized Membership state.

The canonical ownership model is:

    Organization
        +
    ACTIVE OrganizationMembership
        +
    OWNER Role

Every operational Organization must have exactly one active OWNER membership.

This invariant must hold before and after any successful tenancy mutation.

## No Competing Owner Fields

The following patterns are rejected as canonical Organization ownership:

    ownerId
    ownerUserId
    ownerProfileId
    createdBy == owner

Creation metadata may exist for audit or provenance if separately justified.

It must not become a second ownership mechanism.

## Initial Owner Creation

Organization creation and initial ownership creation form one logical operation.

Canonical flow:

    Authenticated Profile
        ↓
    Resolve OWNER Role
        ↓
    BEGIN
        ↓
    Create Organization
        ↓
    Create ACTIVE Membership
        ├── Profile
        ├── Organization
        └── OWNER Role
        ↓
    COMMIT

Successful Organization creation must not leave the Organization without its OWNER.

## Owner Protection

Operations that would remove the only active OWNER must be rejected unless they are part of an approved ownership-transfer workflow.

This includes attempts to:

- remove the sole OWNER membership;
- suspend the sole OWNER membership;
- assign the sole OWNER a non-OWNER Role;
- otherwise deactivate the sole OWNER relationship.

Implementation must not rely on UI restrictions for this invariant.

Server-side services must enforce it.

## Ownership Transfer

Ownership transfer must be atomic.

Conceptually:

    Current OWNER
        +
    Target active Membership
        ↓
    BEGIN
        ↓
    Promote target to OWNER
        ↓
    change previous OWNER according to approved transfer policy
        ↓
    verify exactly one active OWNER
        ↓
    COMMIT

The exact Role assigned to the previous OWNER is intentionally not decided by this ADR.

That remains an explicit open design decision.

An implementation agent must not invent that behavior.

## Membership Lifecycle

Membership lifecycle may include states defined by the approved Memberships specification.

Lifecycle operations may include:

- creation;
- suspension;
- restoration;
- removal;
- role change.

Every mutation must preserve:

- tenant integrity;
- membership uniqueness rules;
- ownership invariants;
- authorization requirements.

## Membership Removal

Removing a Membership must not leave invalid tenant state.

In particular:

    sole active OWNER
    → cannot be removed directly

A transfer or other approved ownership-preserving workflow must occur first.

## Membership Suspension

Suspending a Membership changes its ability to participate in active tenant access.

Therefore:

    sole active OWNER
    → cannot be suspended directly

Owner-sensitive membership state transitions require ownership invariant validation.

## Role Change

Changing a Membership Role is an authorization-sensitive operation.

It must validate:

- actor authorization;
- target Membership;
- target Organization;
- target Role;
- ownership consequences.

A direct Role update must not bypass the sole-owner invariant.

## Invitations

`OrganizationInvitation` belongs to Memberships.

An invitation represents a pending path toward Organization membership.

Conceptually:

    Organization
        ↓
    OrganizationInvitation
        ↓
    accepted
        ↓
    OrganizationMembership

Invitations do not themselves grant active Membership access.

## Invitation Acceptance

Invitation acceptance must not blindly create duplicate Memberships.

The workflow must validate the relevant invitation and tenant state before creating or activating membership.

Exact invitation persistence and uniqueness rules are defined by the Memberships specification.

Where database capabilities cannot express a required conditional uniqueness rule directly through the current Prisma model, the implementation must not invent unsupported Prisma syntax.

Any raw SQL or PostgreSQL-specific enforcement requires deliberate review.

## Roles and Permissions

Roles do not own permission logic directly inside Memberships.

Authorization composition is:

    OrganizationMembership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission

Ownership is therefore compatible with the general authorization model.

OWNER is a Role with explicit authorization semantics, not a special authentication identity.

## Permission Evolution

The OWNER Role must not automatically receive every future Permission merely because the Permission was added.

Permission mappings remain explicit.

Changes to the Permission catalog require deliberate RolePermission decisions.

This prevents authorization expansion from occurring implicitly.

## Product Independence

Roles and Memberships remain business-agnostic.

Platform Core Roles must not become concepts such as:

- DJ;
- promoter;
- print operator;
- designer;
- sales representative;

unless demonstrated cross-Product semantics justify a Core role.

Domain- or Product-specific responsibilities should remain outside canonical Core Roles when their semantics are business-specific.

## Membership and Product UI

UI labels and workflows may vary between Products.

The underlying Membership model remains canonical.

Product composition may:

- hide advanced roles;
- simplify organization switching;
- present invitation workflows differently.

Product UI must not introduce a parallel membership store or authorization model.

## Authorization Boundary

Membership mutation is not authorized merely because the actor belongs to the same Organization.

The actor must hold the Permission required by the operation once Permissions is implemented.

Examples include:

    memberships.read
    memberships.suspend
    memberships.restore
    memberships.remove
    memberships.change_role

    invitations.read
    invitations.create
    invitations.revoke
    invitations.resend

Ownership transfer requires:

    organizations.transfer_ownership

Exact authorization mapping belongs to ADR-006 and the Permissions specification.

## Database Enforcement

Membership uniqueness and ownership invariants should use database enforcement where it can be represented safely.

However, the semantic OWNER condition depends on the referenced Role.

Therefore a simple partial unique index over Membership rows cannot by itself express:

    one active Membership
    per Organization
    whose referenced Role semantically equals OWNER

when Role meaning is stored separately.

The implementation must not falsely claim that this invariant is fully database-enforced unless that mechanism actually exists.

Initial enforcement requires:

- transactional services;
- canonical Role resolution;
- ownership-aware mutations;
- tests.

Stronger PostgreSQL enforcement may be introduced later through an explicitly reviewed mechanism.

## Transactions

Transactions are required when a workflow must preserve multiple related invariants atomically.

Examples include:

- Organization + initial OWNER creation;
- ownership transfer;
- invitation acceptance when multiple persistence changes must succeed together;
- membership changes whose intermediate state could violate ownership.

Transaction boundaries belong around the complete invariant-preserving workflow.

They must not be split arbitrarily across independent persistence calls.

## Current Implementation State

Current state:

    Identity
    → implemented

    Organizations
    → specified, pending implementation

    Roles
    → specified, pending implementation

    Memberships
    → specified, pending implementation

    Permissions
    → specified, pending implementation

Roles and Memberships are therefore architectural commitments, not current runtime capabilities.

Implementation agents must not infer production behavior from specifications alone.

## Rejected Alternatives

### Owner stored directly on Organization

Rejected because it creates a second ownership system outside Memberships and Roles.

### Role enum embedded directly in Membership

Rejected as the canonical architecture because Roles owns reusable Role definitions and Permissions need explicit Role relationships.

### Membership owned by Identity

Rejected because Identity determines who the Profile is, not which tenants it belongs to.

### Product-specific memberships

Rejected because organizational belonging is a reusable Platform Core capability.

### OWNER as a separate user type

Rejected because ownership is authorization within a tenant, not authentication identity.

### UI-only owner protection

Rejected because tenancy invariants require server-side enforcement.

### Automatic OWNER permission expansion

Rejected because new Permissions must not silently broaden authorization.

## Consequences

### Positive

- one canonical membership model;
- ownership uses the same Role system as authorization;
- no competing Organization owner field;
- reusable multi-tenant semantics;
- explicit invitation ownership;
- clear dependency between Roles and Memberships;
- ownership-sensitive mutations can be tested consistently.

### Costs

- Organization creation spans multiple Core capabilities;
- owner-sensitive mutations require transactional services;
- permission evaluation requires Role relationships;
- exact database enforcement of sole OWNER may require PostgreSQL-specific work later.

These costs are accepted in exchange for coherent tenancy semantics.

## Related Decisions

- ADR-001 — Platform Core and Domain Boundary
- ADR-002 — Identity Source of Truth
- ADR-003 — Internal Identifier Strategy
- ADR-004 — Tenancy and Organization Model
- ADR-006 — Authorization and Permission Model
- ADR-007 — Prisma and Data Access Conventions

## Related Specifications

- `docs/core/modules/organizations/`
- `docs/core/modules/roles/`
- `docs/core/modules/memberships/`
- `docs/core/modules/permissions/`
- `docs/architecture/TENANCY.md`

## Final Rule

Roles own Role definitions.

Memberships own belonging and invitations.

Organizations own tenant identity.

Ownership is exactly one active OWNER Membership per operational Organization.

Do not introduce a competing ownership or membership system.
