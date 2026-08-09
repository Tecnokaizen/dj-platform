# DJ Platform — Authentication Architecture

**Status:** Living Document
**Product:** DJ Platform
**Scope:** Authentication, application identity and Product access boundaries
**Stack:** Next.js App Router, Supabase Auth, PostgreSQL, Prisma, TypeScript

---

# 1. Purpose

This document defines the authentication architecture currently used by DJ Platform.

It describes:

- authentication identity;
- application identity;
- Supabase client boundaries;
- session handling;
- authenticated Product routes;
- the separation between authentication and authorization;
- current implementation state;
- security rules that must remain valid as Platform Core evolves.

This document does not define Product-specific role models.

Authorization capabilities such as Organizations, Memberships, Roles and Permissions belong to Platform Core.

---

# 2. Architectural Principles

DJ Platform follows these principles:

- Supabase Auth is the canonical authentication identity provider.
- `Profile` is the canonical application identity.
- A DJ or Artist is not an authenticated User identity.
- Authentication and authorization are separate concerns.
- Product routes must enforce access server-side.
- Client-side visibility is not an authorization mechanism.
- Supabase provider details remain behind infrastructure adapters.
- Core and Domain code must not depend directly on browser-only authentication state.
- Future Product routes must not be treated as implemented merely because they appear in roadmap documentation.

---

# 3. Identity Model

Authentication identity originates from:

    Supabase Auth
    └── auth.users

Application identity is represented by:

    Platform Core
    └── Profile

Conceptually:

    auth.users
        │
        └── Profile

`auth.users` is managed by Supabase Auth.

Prisma does not own or recreate Supabase internal Auth tables.

DJ Platform must not introduce a second canonical Prisma `User` model.

---

# 4. Profile

`Profile` represents application-level information associated with an authenticated identity.

Profile data may include Product-facing attributes such as:

- display name;
- DJ name;
- experience level;
- profile metadata.

The exact persistence model is defined by the active Prisma schema.

`Profile` does not replace Supabase authentication identity.

It extends application identity.

---

# 5. Authentication and Authorization

Authentication answers:

    Who is this authenticated identity?

Authorization answers:

    What may this identity do?

These concerns must remain separate.

Authentication currently belongs to:

    Supabase Auth
        +
    Platform Core Identity

Authorization evolves through Platform Core capabilities:

    Organizations
        ↓
    Roles
        ↓
    Memberships
        ↓
    Permissions

Organizations, Roles, Memberships and Permissions are specified capabilities but must not be considered implemented until corresponding source and persistence exist.

The DJ Domain must not create its own competing:

- User model;
- Role model;
- Membership model;
- Permission system;
- organization ownership system.

---

# 6. Ownership of DJ Entities

A DJ or Artist is a DJ Domain entity.

It is not:

- an authentication identity;
- a Profile;
- an Organization;
- a Membership;
- a Role.

One authenticated Profile may eventually interact with many DJ Domain entities without making those entities authentication identities.

---

# 7. Supabase Infrastructure Boundary

Supabase integration currently lives under:

    src/lib/supabase/

Current infrastructure files include:

    src/lib/supabase/client.ts
    src/lib/supabase/server.ts
    src/lib/supabase/proxy.ts

These files are infrastructure adapters.

They may depend on Supabase SDKs and runtime-specific APIs.

Core application logic should consume the appropriate adapter rather than reimplementing Supabase connectivity.

---

# 8. Browser Client

Browser-side Supabase access belongs in:

    src/lib/supabase/client.ts

Browser code may use public Supabase configuration required by the client SDK.

Browser code must never receive privileged server credentials.

Client-side session state may improve UX, but it is not sufficient to authorize protected operations.

---

# 9. Server Client

Server-side Supabase access belongs in:

    src/lib/supabase/server.ts

Current Core Identity services and actions use this server adapter.

Examples include:

- login;
- registration;
- logout;
- current profile resolution;
- profile updates;
- authentication callback handling.

Server-side authentication checks are authoritative for protected application behavior.

---

# 10. Session Proxy

Session support is implemented through:

    src/lib/supabase/proxy.ts

and exposed to Next.js through:

    src/proxy.ts

The proxy participates in Supabase session handling and global authentication-related redirects.

It must not become a speculative inventory of Product routes that do not yet exist.

Route protection must remain aligned with actual application structure.

---

# 11. Authenticated Product Boundary

Current authenticated Product pages live under:

    src/app/(private)/

Current implemented private pages include:

    /dashboard
    /profile

The current private layout is:

    src/app/(private)/layout.tsx

It resolves the current Profile server-side.

If no authenticated application identity is available, the request is redirected to:

    /login

This layout is the current Product-level authentication boundary for pages inside the `(private)` route group.

---

# 12. Public Authentication Routes

Current authentication pages include:

    /login
    /register

Current authentication callback:

    /auth/callback

These routes are implemented.

Routes such as:

    /forgot-password

must not be described as implemented until corresponding source exists.

Password recovery may be added later as a separate approved capability.

---

# 13. Future Product Routes

Product concepts such as:

- library;
- playlists;
- imports;
- settings;
- administration;
- public Artist pages;
- festivals;
- rankings;
- articles;

may exist in Product requirements or roadmap documentation.

Their existence in Product vision does not imply that corresponding application routes are currently implemented.

Authentication rules should be introduced when those routes actually exist.

---

# 14. Administrative Access

Administrative access must not be implemented through a DJ-specific persisted field such as:

    role == ADMIN

or a historical DJ Domain `UserRole`.

Future administrative authorization must use approved Platform Core authorization capabilities.

Conceptually:

    authenticated Profile
        ↓
    Organization Membership
        ↓
    Role
        ↓
    Permission

Administrative UI must check the required authorization capability rather than relying only on route naming.

An `/admin` path is not itself an authorization model.

---

# 15. Current Authentication Methods

The active authentication implementation supports the methods actually present in current source and runtime configuration.

Email-based authentication is currently part of the implemented flow.

Additional providers such as:

- Google;
- GitHub;
- Apple;
- other OAuth providers;

must not be considered implemented until configured, exercised and verified.

Provider support should be added based on demonstrated Product need.

---

# 16. Session Resolution

Application code requiring the authenticated identity should use the Core Identity boundary rather than duplicating authentication logic.

Current Profile resolution is implemented under:

    src/core/identity/profile/services/get-current-profile.ts

Conceptually:

    Request
        ↓
    Supabase server client
        ↓
    Supabase Auth identity
        ↓
    Profile resolution
        ↓
    Product behavior

Failure to resolve an authenticated Profile must be handled explicitly.

---

# 17. Login

Login behavior belongs to:

    src/core/identity/auth/

Infrastructure connectivity belongs to:

    src/lib/supabase/

The separation is:

    Product / App
        ↓
    Core Identity action
        ↓
    Supabase infrastructure adapter
        ↓
    Supabase Auth

Business or Product UI must not reimplement Supabase authentication mechanics independently.

---

# 18. Registration

Registration follows the same boundary:

    Product / App
        ↓
    Core Identity registration
        ↓
    Supabase Auth
        ↓
    Profile lifecycle

Authentication identity and application Profile must remain logically distinct even when created as part of one Product flow.

Partial failures must be handled deliberately.

---

# 19. Logout

Logout invalidates the current authentication session through the Supabase infrastructure boundary.

After logout, private Product routes must no longer resolve an authenticated Profile.

---

# 20. Environment Configuration

Current Supabase public configuration includes environment values used by the Supabase client infrastructure, including:

    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY

Environment values must be supplied through runtime configuration.

Secrets must not be committed to source control.

Server-only credentials must not be exposed through `NEXT_PUBLIC_*`.

The existence of a possible Supabase credential does not imply that the application currently requires or uses it.

---

# 21. Privileged Supabase Clients

The current authentication architecture does not assume that an application-wide privileged Admin Supabase client exists.

A future server-only privileged client may be introduced only when a demonstrated requirement needs it.

If introduced:

- credentials must remain server-only;
- usage must be narrowly scoped;
- authorization invariants must not be bypassed casually;
- audit requirements must be considered;
- the capability must be documented explicitly.

A `service_role` credential must never be exposed to the browser.

---

# 22. Row Level Security

RLS is part of the broader Supabase security strategy, but its existence in architecture documentation must not be confused with verified database state.

The current initial Prisma migration does not establish RLS policies.

Therefore:

- RLS must not be claimed as currently verified protection;
- server-side authorization remains mandatory;
- future RLS policies must be implemented and validated explicitly;
- `RLS.md` describes design intent, not runtime proof.

Database security claims require evidence from the actual database environment.

---

# 23. Storage and Realtime

Supabase may provide capabilities such as:

- Storage;
- Realtime.

DJ Platform must not treat these capabilities as implemented merely because Supabase supports them.

They should be adopted only when Product requirements demonstrate a need and implementation is verified.

Authentication architecture must not depend on Storage or Realtime by default.

---

# 24. Data Protection

Protected data must not rely solely on:

- hidden UI;
- client-side route guards;
- disabled controls;
- JavaScript state;
- route naming.

Sensitive operations require server-side authentication and, when applicable, authorization.

Tenant-aware operations must also enforce tenant membership and permissions once those Platform Core capabilities are implemented.

---

# 25. Account Deletion

Account deletion is not currently defined as an implemented end-to-end capability by this document.

A future account deletion workflow must define explicitly:

- Supabase Auth identity deletion;
- Profile handling;
- owned Product data;
- Organization implications;
- membership implications;
- retention requirements;
- audit requirements;
- external storage implications if Storage is later adopted.

Deletion behavior must not be inferred from the historical authentication design.

---

# 26. Audit

Authentication-sensitive actions may require auditability as Platform Core evolves.

Audit requirements must be introduced according to demonstrated security and operational needs.

The DJ Domain must not create an independent authentication audit architecture that conflicts with Platform Core.

---

# 27. Current Source Structure

Current relevant source is:

    src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/
    │   │   └── register/
    │   ├── (private)/
    │   │   ├── dashboard/
    │   │   ├── profile/
    │   │   └── layout.tsx
    │   └── auth/
    │       └── callback/
    ├── core/
    │   └── identity/
    │       ├── auth/
    │       └── profile/
    ├── lib/
    │   └── supabase/
    │       ├── client.ts
    │       ├── proxy.ts
    │       └── server.ts
    └── proxy.ts

This structure reflects current implementation.

Future Core modules or Product routes should be added only when implementation begins.

---

# 28. Current Implementation State

Currently implemented:

- Supabase Auth integration;
- application Profile;
- login;
- registration;
- logout;
- authentication callback;
- server-side current Profile resolution;
- private Product layout;
- dashboard;
- profile page;
- Supabase browser/server/proxy infrastructure.

Specified but not yet implemented as complete Platform Core capabilities:

- Organizations;
- Roles;
- Memberships;
- Permissions.

Not assumed implemented:

- admin authorization;
- OAuth providers not verified in runtime;
- password recovery route;
- RLS enforcement;
- Storage-backed Product features;
- Realtime-dependent Product features;
- account deletion workflow.

---

# 29. Evolution Rules

Authentication changes must respect the following process:

1. identify the Product requirement;
2. distinguish authentication from authorization;
3. determine whether the change belongs to Identity, another Platform Core capability, Product composition or infrastructure;
4. avoid adding Domain-specific identity systems;
5. update architecture when behavior materially changes;
6. implement using the approved boundary;
7. validate source behavior;
8. verify runtime behavior before declaring operational guarantees.

---

# 30. Related Documents

Platform architecture:

- `../../../architecture/IDENTITY.md`
- `../../../architecture/TENANCY.md`
- `../../../architecture/SECURITY.md`
- `../../../architecture/CORE.md`

DJ Domain persistence:

- `DATA_MODEL.md`
- `ERD.md`
- `RLS.md`

Active source:

- `../../../../src/core/identity/`
- `../../../../src/lib/supabase/`
- `../../../../src/app/(private)/`
- `../../../../src/proxy.ts`

Active persistence:

- `../../../../prisma/schema.prisma`

---

# Final Principle

Supabase Auth authenticates identities.

`Profile` represents application identity.

Platform Core owns reusable authorization capabilities.

DJ Domain entities do not become authentication identities.

Product routes enforce access server-side.

Documentation describes intended architecture; runtime claims require implementation evidence.
