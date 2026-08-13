# ADR-006 — Authorization and Permission Model

**Status:** Accepted
**Date:** 2026-08-09
**Decision Type:** Foundation Architecture

**Subsequent decision:** ADR-009 requires the dedicated persisted
`organizations.transfer_ownership` Permission and an ACTIVE OWNER actor.

## Context

Platform Core requires a reusable authorization model that works independently from any particular Product or business Domain.

Authentication alone answers who the current Profile is.

Membership answers which Organization that Profile belongs to.

Role provides a reusable authorization grouping.

Permission defines the individual capability being authorized.

Earlier approaches risked embedding authorization directly into:

- authentication identity;
- Product-specific User roles;
- UI visibility;
- route names;
- direct boolean flags such as `isAdmin`.

Those approaches would create fragmented and Product-specific authorization systems.

## Decision

Platform Core authorization uses explicit Permissions assigned to Roles.

Canonical ownership is:

    Permissions
    ├── Permission
    └── RolePermission

    Roles
    └── Role

    Memberships
    └── OrganizationMembership

Authorization is evaluated conceptually as:

    authenticated Profile
        ↓
    active OrganizationMembership
        ↓
    Role
        ↓
    RolePermission
        ↓
    Permission
        ↓
    authorized operation

Authentication, tenancy membership and authorization remain separate concerns.

## Permission

`Permission` represents a stable authorization capability.

Permissions use semantic keys.

Examples:

    organizations.read
    organizations.update
    organizations.transfer_ownership

    memberships.read
    memberships.suspend
    memberships.restore
    memberships.remove
    memberships.change_role

    invitations.read
    invitations.create
    invitations.revoke
    invitations.resend

Permission keys describe capabilities rather than UI controls.

## Permission Ownership

Permission definitions belong to Platform Core Permissions.

Product UI does not own Permission semantics.

Domains must not create competing authorization catalogs for Core tenancy behavior.

A Domain may require Domain-specific authorization later, but such permissions must still integrate through an approved authorization boundary rather than creating a second unrelated system.

## RolePermission

`RolePermission` explicitly maps a Role to a Permission.

Conceptually:

    Role
        ↓
    RolePermission
        ↓
    Permission

Permissions are not inferred solely from Role names.

The Role-to-Permission relationship must remain explicit.

## Deny by Default

Authorization follows a deny-by-default principle.

If the required Permission cannot be proven for the active tenant context, the operation must not proceed.

Absence of an explicit deny rule does not imply authorization.

Conceptually:

    permission confirmed
    → allow

    permission absent / unresolved
    → deny

## Authentication Is Not Authorization

A valid Supabase session does not imply permission to perform an Organization operation.

Likewise:

    authenticated Profile
    ≠ Organization member

    Organization member
    ≠ authorized for every action

Authorization requires the complete relevant context.

## Tenant Context

Organization-scoped authorization requires an explicit Organization context.

Conceptually:

    Profile
        +
    Organization
        ↓
    active Membership
        ↓
    Role
        ↓
    Permission

A client-provided Organization identifier must be validated server-side.

Authorization must not trust client state as proof of tenant membership.

## Membership State

Only Membership states approved as active for authorization may participate in normal tenant access.

Suspended, removed or otherwise inactive Memberships must not retain permissions merely because they still have a Role reference.

Membership lifecycle semantics are owned by Memberships.

## Initial Permission Catalog

The initial approved Core tenancy catalog is:

    organizations.read
    organizations.update
    organizations.transfer_ownership

    memberships.read
    memberships.suspend
    memberships.restore
    memberships.remove
    memberships.change_role

    invitations.read
    invitations.create
    invitations.revoke
    invitations.resend

This catalog is intentionally limited to demonstrated Foundation needs.

New Permissions must be introduced deliberately.

## Initial Role Matrix

The initial authorization mapping is:

### OWNER

Explicitly receives all Permissions in the initial catalog.

### ADMIN

Receives all initial Permissions except:

    organizations.transfer_ownership

### MANAGER

Receives:

    organizations.read
    memberships.read

### MEMBER

Receives:

    organizations.read

### VIEWER

Receives:

    organizations.read

This matrix is an explicit Foundation decision.

It must not be reconstructed from assumptions during implementation.

## OWNER Is Not Implicit Superuser

OWNER is a canonical Role.

OWNER does not receive unknown future Permissions automatically.

When a new Permission is introduced, its RolePermission mappings must be explicitly decided.

Therefore:

    add new Permission
    ≠ automatically grant to OWNER

This rule prevents silent authorization expansion.

## ADMIN Is Not Ownership

ADMIN does not imply Organization ownership.

In particular, the initial ADMIN Role does not receive:

    organizations.transfer_ownership

Ownership remains represented by an active OWNER Membership.

## Permission Evaluation

Authorization checks should answer a specific capability question.

Prefer:

    can actor perform `memberships.remove` in Organization X?

over vague checks such as:

    is actor admin?

Role names are useful for grouping Permissions.

Permission checks define the actual authorization contract.

## Server-Side Enforcement

Permission-sensitive behavior must be enforced server-side.

UI behavior may improve usability by hiding or disabling unavailable actions.

UI state is not authorization.

The following are insufficient on their own:

- hidden buttons;
- disabled controls;
- client-side guards;
- route names;
- client session state.

## Application Boundaries

Authorization may be required from:

- Server Components;
uture background jobs.

Transport layers should remain thin.

They should resolve or pass the relevant actor and tenant context into the approved authorization/service boundary.

## Core Services

Core services that mutate tenant state must enforce required Permissions before performing privileged operations.

Authorization checks must not be duplicated inconsistently throughout Product UI.

Shared authorization helpers may be introduced when demonstrated implementation needs justify them.

## Ownership-Sensitive Permissions

Ownership-changing operations require explicit authorization.

Ownership transfer requires:

    organizations.transfer_ownership

Even a correctly authorized transfer must also preserve the tenancy invariant:

    exactly one active OWNER

Permission checks and data invariants are complementary.

Authorization does not replace transactional consistency.

## Membership Permissions

Membership operations use explicit capabilities such as:

    memberships.read
    memberships.suspend
    memberships.restore
    memberships.remove
    memberships.change_role

The actor must be authorized in the relevant Organization.

The operation must additionally preserve ownership and membership invariants.

## Invitation Permissions

Invitation operations use explicit capabilities such as:

    invitations.read
    invitations.create
    invitations.revoke
    invitations.resend

An invitation Permission does not automatically authorize unrelated Membership mutations.

## Role Changes

Role changes require:

    memberships.change_role

Role changes involving OWNER must additionally preserve ownership invariants.

An implementation must not interpret `memberships.change_role` as permission to destroy the sole-owner invariant.

## Permissions and Product UI

Products may present authorization differently.

Examples:

- an admin settings page;
- contextual action menus;
- simplified mobile UI;
- operational dashboards.

Presentation differences do not alter Permission semantics.

Product code must not introduce alternate permission names merely for UI convenience.

## Permissions and Domains

Core tenancy Permissions remain business-agnostic.

Examples of inappropriate Core Permission semantics would include Product-specific concepts such as:

    dj.publish_set
    print_job.approve
    festival.edit_lineup

unless a future architectural decision explicitly introduces Domain authorization integration.

Domain-specific authorization must not contaminate the initial Core tenancy catalog.

## Persistence

Permissions and RolePermission mappings belong to the persistence model of the Permissions capability.

Exact Prisma implementation must follow:

- approved Permissions specifications;
- ADR-007;
- migration safety rules.

Specification does not imply current runtime implementation.

## Seeding

Canonical Roles and Permissions may require controlled bootstrap data.

Seed or bootstrap behavior must be:

- deterministic;
- idempotent where appropriate;
- aligned with approved semantic keys;
- reviewed alongside schema and migration behavior.

Historical Product-specific role seeds must not be revived.

## Caching

Authorization decisions must not be cached in a way that allows stale permissions to outlive relevant membership or role changes.

Any future authorization caching requires explicit invalidation semantics and demonstrated performance need.

No cache layer is assumed by this ADR.

## RLS

Row Level Security may provide complementary database enforcement.

RLS does not replace the Platform Core Permission model.

Conversely, the Permission model does not prove that RLS exists.

Current runtime guarantees must be based on actual implementation evidence.

## Auditing

Security-sensitive actions may require audit events.

Examples include:

- ownership transfer;
- role changes;
- membership removal;
- permission administration.

Audit architecture must be introduced deliberately and must not be invented inside individual Domain workflows.

## Permission Evolution

Adding a new Permission requires explicit review of:

1. semantic ownership;
2. Permission key;
3. affected operations;
4. RolePermission mappings;
5. UI implications where relevant;
6. migration or bootstrap implications;
7. tests.

New Permissions must not silently inherit from historical Role assumptions.

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

Therefore the Permission catalog and Role matrix are approved architecture, not yet verified runtime behavior.

Implementation must not be described as Production Ready until corresponding source, persistence and validation exist.

## Implementation Requirements

An implementation agent must not independently:

- add new canonical Roles;
- add new Permission keys;
- change the approved Role matrix;
- grant every future Permission automatically to OWNER;
- make ADMIN equivalent to OWNER;
- authorize from UI state alone;
- create Product-specific tenancy authorization inside Core;
- bypass ownership invariants because the actor has a Permission.

Architectural changes must be surfaced for approval.

## Rejected Alternatives

### Authentication implies authorization

Rejected because authenticated identity does not determine tenant capabilities.

### Role name checks everywhere

Rejected because Permissions define the actual capabilities and Role checks create brittle authorization coupling.

### `isAdmin` boolean

Rejected because it creates a parallel authorization system and does not scale to explicit capabilities.

### OWNER automatically gets all future Permissions

Rejected because new Permissions must not silently widen authorization.

### ADMIN equals OWNER

Rejected because administrative capability and Organization ownership have different semantics.

### UI-only permission enforcement

Rejected because authorization requires server-side enforcement.

### RLS as the only authorization model

Rejected because Product/Core authorization semantics still require explicit actor, tenant, Role and Permission reasoning.

## Consequences

### Positive

- explicit authorization contracts;
- business-agnostic Core permissions;
- reusable Role mappings;
- ownership remains distinct from administration;
- permission expansion is deliberate;
- authorization checks can be tested by capability;
- Products can vary presentation without redefining security semantics.

### Costs

- Permission resolution requires tenant and Membership context;
- RolePermission bootstrap must be maintained;
- new capabilities require explicit mapping decisions;
- server-side services must perform authorization checks consistently.

These costs are accepted in exchange for predictable and auditable authorization behavior.

## Related Decisions

- ADR-001 — Platform Core and Domain Boundary
- ADR-002 — Identity Source of Truth
- ADR-004 — Tenancy and Organization Model
- ADR-005 — Roles, Memberships and Ownership Model
- ADR-007 — Prisma and Data Access Conventions

## Related Specifications

- `docs/core/modules/roles/`
- `docs/core/modules/memberships/`
- `docs/core/modules/permissions/`
- `docs/core/modules/organizations/`
- `docs/architecture/SECURITY.md`
- `docs/architecture/TENANCY.md`

## Final Rule

Authentication identifies the Profile.

Membership establishes tenant belonging.

Role groups authorization capabilities.

Permission defines what may be done.

Authorization is deny by default.

RolePermission mappings are explicit.

OWNER does not automatically receive future Permissions.
