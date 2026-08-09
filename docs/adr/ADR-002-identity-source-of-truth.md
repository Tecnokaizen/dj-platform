# ADR-002 — Identity Source of Truth

**Status:** Accepted
**Date:** 2026-08-09
**Decision Type:** Foundation Architecture

## Context

DJ Platform uses Supabase Auth for authentication.

Earlier iterations of the project included or considered application-level `User` models with fields such as roles, status and administrative identity.

That approach risks creating multiple competing sources of truth for identity:

- Supabase `auth.users`;
- Prisma `User`;
- Product-specific DJ or Artist entities;
- application Profile data.

The architecture requires one canonical authentication identity while still allowing the application to store Product-facing profile information.

Identity must also remain reusable across future Products through Platform Core rather than being owned by the DJ Domain.

## Decision

Supabase Auth is the canonical source of truth for authentication identity.

Conceptually:

    Supabase Auth
    └── auth.users
         │
         └── Profile

`auth.users` owns authentication identity.

`Profile` represents application identity and Product-facing information associated with the authenticated identity.

The application must not introduce a second canonical Prisma `User` model.

## Authentication Identity

Supabase Auth owns concerns such as:

- authenticated user identity;
- authentication credentials;
- authentication provider identity;
- session lifecycle;
- authentication tokens;
- provider-specific authentication metadata.

Prisma must not recreate or duplicate Supabase internal Auth tables as application-owned models.

## Application Identity

Platform Core Identity owns the application-facing `Profile`.

`Profile` may contain application attributes such as:

- display name;
- DJ name;
- experience level;
- preferences or metadata that belong to application identity.

Profile is not the authentication provider.

Profile extends authenticated identity into the application.

Conceptually:

    Authentication identity
        ↓
    Profile
        ↓
    Product behavior

## Profile Identifier

The Profile identifier must maintain a stable relationship with the authenticated Supabase identity.

The exact persistence mapping is defined by the active Prisma schema and approved Identity architecture.

Application code must resolve authentication identity through the approved Identity boundary rather than creating competing identity records.

## DJ and Artist Identity

A DJ is not a user.

An Artist is not a user.

DJ Domain entities describe musical or editorial subjects.

They must not be reused as authentication identities merely because they may represent people.

Conceptually:

    Profile
    → authenticated application identity

    Artist
    → DJ Domain musical entity

A Profile may interact with, follow, own data related to or eventually be associated with Artist entities without making them the same entity.

## Authorization Separation

Authentication identity does not directly define authorization.

Authorization belongs to Platform Core capabilities including:

- Organizations;
- Memberships;
- Roles;
- Permissions.

Therefore fields such as:

- `role`;
- `isAdmin`;
- `organizationRole`;
- `permissions`;

must not become competing authentication identity semantics unless explicitly owned by the relevant Core capability.

Administrative status is authorization, not authentication identity.

## Product Independence

Identity belongs to Platform Core.

It must remain independent from DJ-specific semantics.

Future Products may reuse the same Identity capability without introducing separate authentication systems for each Domain.

Product-specific profile extensions must not redefine the canonical authentication identity.

## Source Boundaries

Current Identity implementation lives under:

    src/core/identity/
    ├── auth/
    └── profile/

Supabase connectivity lives under:

    src/lib/supabase/

Product composition lives under:

    src/app/

DJ Domain code must not own authentication infrastructure.

## Authentication Flow

Conceptually:

    Request
        ↓
    Supabase infrastructure adapter
        ↓
    Supabase Auth
        ↓
    authenticated auth.users identity
        ↓
    Platform Core Profile resolution
        ↓
    Product behavior

Application features should consume the resolved application identity through Core Identity services rather than repeatedly implementing raw authentication logic.

## Registration

Registration may create or connect:

    Supabase Auth identity
        +
    Profile

These operations are related but represent different ownership concerns.

Failure handling must account for partial creation when the workflow spans multiple systems or persistence operations.

## Login

Login authenticates against Supabase Auth.

Product code must not authenticate against a parallel Prisma credential store.

## Logout

Logout invalidates the Supabase authentication session.

Product-level authenticated access must no longer resolve a valid current Profile after logout.

## External Providers

Additional authentication providers may be supported through Supabase Auth.

Adding Google, GitHub, Apple or another provider does not change the identity source-of-truth decision.

Provider availability must not be claimed until configuration and runtime behavior are verified.

## Data Access

Application code must not use Supabase `auth.users` as a replacement for application Profile semantics.

Conversely, Profile must not become a shadow authentication database.

Authentication-sensitive operations should use the approved Identity services and infrastructure adapters.

## Rejected Alternatives

### Prisma User as canonical authentication identity

Rejected because it would duplicate Supabase Auth identity and create synchronization problems.

### DJ or Artist as authenticated identity

Rejected because musical entities and application identities have different semantics and lifecycles.

### Product-specific authentication systems

Rejected because Identity is a reusable Platform Core capability.

### Role stored directly as authentication identity

Rejected because authentication and authorization are separate concerns.

### Client-side session state as identity authority

Rejected because protected behavior requires server-side identity verification.

## Consequences

### Positive

- one canonical authentication source;
- no duplicate Prisma User identity;
- clearer separation between authentication and application profile;
- reusable Identity capability across Products;
- DJ Domain remains independent from authentication;
- authorization can evolve separately through Platform Core.

### Costs

- application flows may need to resolve both authenticated identity and Profile;
- workflows spanning Supabase Auth and application persistence require deliberate failure handling;
- authorization cannot be inferred from authentication identity alone.

These costs are accepted in exchange for clear ownership and reduced identity duplication.

## Current Application

Current source implements:

- Supabase authentication integration;
- login;
- registration;
- logout;
- authentication callback;
- Profile resolution;
- Profile updates;
- private Product access based on resolved application identity.

Relevant source includes:

    src/core/identity/auth/
    src/core/identity/profile/
    src/lib/supabase/
    src/app/auth/callback/
    src/app/(private)/

The active Prisma schema contains `Profile` and does not define a canonical application `User` model.

## Related Decisions

- ADR-001 — Platform Core and Domain Boundary
- ADR-003 — Internal Identifier Strategy
- ADR-004 — Tenancy and Organization Model
- ADR-005 — Roles, Memberships and Ownership Model
- ADR-006 — Authorization and Permission Model

## Final Rule

Supabase Auth owns authentication identity.

Platform Core `Profile` owns application identity.

DJ Domain entities are not authentication identities.

Authorization remains a separate Platform Core concern.

Do not introduce a second canonical Prisma `User`.
