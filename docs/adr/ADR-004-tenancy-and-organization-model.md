# ADR-004 — Tenancy and Organization Model

**Status:** Accepted
**Date:** 2026-08-09
**Decision Type:** Foundation Architecture

## Context

Platform Core must support Products that operate with isolated organizational contexts.

Future Products may represent very different businesses:

- DJ Platform;
- Copy Platform;
- operational SaaS products;
- future vertical applications.

Tenant semantics therefore cannot belong to a particular business Domain.

The platform needs a canonical tenant boundary that can be reused without importing DJ-specific, copy-shop-specific or other vertical semantics.

It must also support:

- multiple people belonging to the same tenant;
- one Profile belonging to multiple tenants when Product requirements need it;
- role-based membership;
- invitations;
- tenant-aware authorization;
- future ownership transfer;
- reliable tenant isolation.

## Decision

`Organization` is the canonical tenant boundary in Platform Core.

Conceptually:

    Platform Core
    │
    ├── Identity
    │    └── Profile
    │
    └── Organizations
         └── Organization

Profiles belong to Organizations through Memberships rather than through direct ownership fields.

Conceptually:

    Profile
        │
        └── OrganizationMembership
                │
                └── Organization

`Organization` owns tenant identity.

`OrganizationMembership` owns belonging.

## Organization Ownership

Organization ownership is not represented by a direct field such as:

    ownerUserId
    ownerId
    ownerProfileId

Ownership is represented through the membership and role model:

    Organization
        +
    ACTIVE OrganizationMembership
        +
    OWNER Role

This is the canonical ownership model.

There must not be a competing ownership mechanism stored directly on `Organization`.

## Sole Active Owner Invariant

Every operational Organization must have exactly one active OWNER membership.

Conceptually:

    Organization
        └── exactly one
            ACTIVE Membership
                └── OWNER Role

This is a critical tenancy invariant.

Operations that could violate it must be designed transactionally.

Examples include:

- Organization creation;
- ownership transfer;
- membership suspension;
- membership removal;
- role changes.

## Organization Creation

Organization creation is not complete until its initial OWNER membership exists.

The canonical workflow is:

    Authenticated Profile
        ↓
    Resolve canonical OWNER Role
        ↓
    BEGIN TRANSACTION
        ↓
    Create Organization
        ↓
    Create ACTIVE OrganizationMembership
        │
        ├── Profile
        ├── Organization
        └── OWNER Role
        ↓
    COMMIT

If the Organization or initial OWNER membership cannot be created, the transaction must fail as a unit.

An ownerless operational Organization must not be produced by a successful creation workflow.

## Capability Ownership

Tenancy responsibilities are intentionally separated.

### Organizations

Owns:

- Organization identity;
- tenant lifecycle;
- Organization-level business-agnostic metadata;
- tenant boundary semantics.

### Memberships

Owns:

- Profile membership in an Organization;
- membership lifecycle;
- membership status;
- invitations;
- belonging relationships.

### Roles

Owns:

- canonical Role definitions;
- OWNER and other reusable role semantics.

### Permissions

Owns:

- authorization capabilities;
- permission catalog;
- Role-to-Permission relationships.

Organization does not absorb these responsibilities merely because they participate in tenancy.

## Profile and Organization Cardinality

The architecture supports:

    Profile
        → zero, one or many Organizations

and:

    Organization
        → one or many Profiles through Memberships

Product behavior may initially expose a simpler experience.

That does not change the underlying tenancy model.

A direct one-to-one `Profile.organizationId` relationship must not replace Memberships as the canonical belonging model.

## Organization and Product Semantics

`Organization` is business-agnostic.

It must not encode concepts such as:

- DJ agency;
- record label account;
- copy shop;
- print center;
- marketing agency;
- customer company type;

as mandatory Platform Core semantics.

A Product or Domain may interpret an Organization within its own business context.

Core tenancy remains neutral.

## Tenant Context

Tenant-aware operations require an explicit Organization context.

An authenticated Profile alone does not imply permission inside every Organization.

Conceptually:

    authenticated Profile
        ↓
    selected / resolved Organization
        ↓
    active Membership
        ↓
    Role
        ↓
    Permissions
        ↓
    authorized operation

Tenant context must not be inferred solely from client-provided identifiers without server-side validation.

## Tenant Isolation

Data belonging to an Organization must be accessed within the approved tenant context.

Tenant isolation may be enforced through multiple complementary mechanisms, including:

- server-side authorization;
- scoped queries;
- database constraints;
- RLS when implemented and verified;
- tests;
- transactional invariants.

RLS must not be treated as verified protection merely because it exists in the architecture roadmap.

Server-side tenant validation remains mandatory.

## Implemented Membership-Based RLS Boundary

Stage 2 implements the initial tenant RLS boundary for Supabase client roles.
The reusable database predicate is:

    auth.uid() = Profile.id
        +
    OrganizationMembership.status = ACTIVE
        +
    Organization.status = ACTIVE

The predicate is implemented by a hardened `SECURITY DEFINER` helper in the
non-exposed `private` schema. Its search path is empty, every referenced object
is schema-qualified and execution is granted only to `authenticated`.

The initial client contract is deliberately read-only:

- `authenticated` may select active Organizations to which it has an active
  Membership;
- `authenticated` may select only its own active Membership rows in active
  Organizations;
- `anon` has no access to tenant foundation tables;
- neither client role may insert, update or delete Organizations, Memberships
  or Invitations;
- Organization Invitations remain server-only because row policies cannot
  protect secret columns such as `token_hash`.

This boundary proves tenant belonging only. It does not grant administrative
capability, expose tenant-wide Membership lists or replace server-side
Permissions. Trusted server connections remain responsible for authorized
mutations and must continue validating tenant context.

## Organization Identifiers

Organizations use internally controlled identifiers according to ADR-003.

Organization names and slugs are not canonical tenant identity.

Therefore:

    Organization UUID
    → persistence identity

    Organization name
    → mutable business-facing attribute

    Organization slug
    → presentation / routing identifier when used

Authorization must rely on stable internal identity.

## Invitations

Invitations are part of Memberships rather than Organizations.

Conceptually:

    Organization
        ↓
    OrganizationInvitation
        ↓
    acceptance
        ↓
    OrganizationMembership

Invitation acceptance must validate:

- invitation state;
- target Organization;
- authenticated identity;
- expiration or revocation state when applicable;
- duplicate membership conditions;
- resulting Role.

Exact invitation flows are defined by the Memberships capability.

## Roles Dependency

Memberships require canonical Roles.

Therefore the Foundation implementation sequence is:

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

Roles precede Memberships because a Membership references a canonical Role.

Organizations itself does not need to own Role semantics.

## Database Enforcement

The sole active OWNER invariant must be protected deliberately.

A simple partial unique index cannot directly express:

    exactly one active Membership
    whose referenced Role has semantic key OWNER
    per Organization

when OWNER semantics live in the separate Role table.

Therefore the initial implementation must not claim database-level enforcement that does not actually exist.

Until stronger database enforcement is explicitly designed and verified, the invariant requires:

- transactional application services;
- validated role resolution;
- guarded membership mutations;
- tests;
- explicit review of ownership-changing operations.

A PostgreSQL trigger or constraint-trigger approach may be considered later if demonstrated requirements justify stronger database enforcement.

That future mechanism requires separate architectural and migration review.

## Ownership Transfer

Ownership transfer is a tenancy-sensitive operation.

It must preserve:

    exactly one active OWNER

before and after the operation.

A valid transfer must be atomic.

The exact role assigned to the previous OWNER after transfer remains a separate design decision and must not be invented by an implementation agent.

Ownership transfer therefore requires an approved workflow before implementation.

## Organization Deletion

Organization deletion or archival has tenant-wide consequences.

A Product must not implement destructive Organization deletion without defining:

- membership consequences;
- owned data consequences;
- retention;
- audit requirements;
- billing consequences when billing exists;
- recovery or irreversible deletion behavior.

Organization lifecycle should prefer explicit state transitions where Product requirements require retention.

Exact lifecycle persistence belongs to the Organizations specification and implementation.

## Product Independence

Platform Core tenancy must remain reusable across Products.

DJ Platform may initially make limited or no visible use of Organizations.

Another Product may make Organization tenancy central to every workflow.

This difference does not require separate tenancy architectures.

The same Core Organization capability should be reusable where semantics genuinely match.

## Current Implementation State

Current source implements Platform Core Identity.

Organizations has approved specifications but is not currently implemented in source.

Therefore:

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

Empty source directories are not required to represent these future modules.

## Implementation Readiness

An implementation agent may implement Organizations only from the approved Organizations specification and related ADRs.

It must not independently decide:

- a competing owner field;
- direct Profile-to-Organization ownership;
- business-specific Organization types in Core;
- a different tenant entity;
- ownership-transfer semantics;
- a second membership system.

Architectural uncertainty must be surfaced rather than silently resolved in code.

## Rejected Alternatives

### Profile owns Organization through `ownerProfileId`

Rejected because ownership belongs to the Membership + Role model and direct ownership would create a competing system.

### Organization stores `ownerUserId`

Rejected because authentication identity and application tenancy have separate ownership concerns.

### One Organization directly stored on Profile

Rejected because it prevents reusable many-to-many membership semantics and bypasses Memberships.

### Product-specific tenant models

Rejected because tenancy is a reusable Platform Core capability.

### Organization owns roles and permissions directly

Rejected because Roles and Permissions are separate Core capabilities with their own ownership.

### RLS alone guarantees tenancy

Rejected because RLS is complementary enforcement and must be implemented and verified before runtime guarantees can be claimed.

## Consequences

### Positive

- one canonical tenant abstraction;
- reusable tenancy across Products;
- no duplicated ownership mechanism;
- multiple memberships are naturally supported;
- ownership participates in the same authorization model;
- tenant authorization can evolve without changing authentication identity;
- business-specific semantics remain outside Core.

### Costs

- Organization creation requires transactional coordination with Memberships and Roles;
- tenancy-sensitive operations require explicit Organization context;
- ownership transfer requires careful invariant preservation;
- stronger database enforcement may require PostgreSQL-specific mechanisms later.

These costs are accepted because they preserve a coherent multi-tenant architecture.

## Related Decisions

- ADR-001 — Platform Core and Domain Boundary
- ADR-002 — Identity Source of Truth
- ADR-003 — Internal Identifier Strategy
- ADR-005 — Roles, Memberships and Ownership Model
- ADR-006 — Authorization and Permission Model
- ADR-007 — Prisma and Data Access Conventions

## Related Specifications

- `docs/core/modules/organizations/`
- `docs/core/modules/roles/`
- `docs/core/modules/memberships/`
- `docs/core/modules/permissions/`
- `docs/architecture/TENANCY.md`

## Final Rule

`Organization` is the canonical Platform Core tenant.

Profiles belong to Organizations through Memberships.

Ownership is represented by exactly one active OWNER Membership.

Do not introduce a competing owner field or Product-specific tenancy model.
