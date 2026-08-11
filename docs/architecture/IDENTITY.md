---
title: Identity Architecture
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-12
related:
  - ARCHITECTURE.md
  - CORE.md
  - TENANCY.md
  - API.md
  - DATA.md
  - SECURITY.md
  - PRISMA_IMPLEMENTATION.md
  - ../core/README.md
---

# Identity Architecture

## Purpose

This document defines how Platform Core represents application identity and authentication.

Identity answers one fundamental question:

```text
Who is the actor?
```

Identity does not own:

```text
tenant membership

Roles

Permissions

Organization ownership

business-specific identities
```

Those concerns belong to their respective architectural owners.

---

# Identity Ownership

Identity is a foundational Platform Core capability.

Canonical source structure:

```text
src/core/identity/
├── auth/
└── profile/
```

Identity is intentionally separate from normal functional modules under:

```text
src/core/modules/
```

Do not create:

```text
src/core/modules/identity/
```

or:

```text
src/core/modules/profiles/
```

without an explicit architectural decision.

---

# Identity Model

The canonical identity model is:

```text
Supabase auth.users
        ↓
Profile
```

Supabase Authentication owns authentication identity.

Platform Core `Profile` represents that authenticated identity inside the application.

There is no second canonical application `User` entity.

---

# Authentication Identity

The canonical authentication source is:

```text
Supabase auth.users
```

Supabase manages authentication concerns such as:

```text
authentication credentials

authentication sessions

authentication provider identity

email-based authentication state
```

Platform Core does not duplicate those responsibilities in Prisma.

---

# No Duplicate User Model

Do not create a Prisma model such as:

```text
User

AppUser

PlatformUser

CoreUser
```

to represent the same identity already represented by:

```text
Supabase auth.users
```

The approved model remains:

```text
Supabase auth.users
        ↓
Profile
```

A future change to this identity strategy requires explicit architecture review and migration planning.

---

# Profile

`Profile` is the application representation of an authenticated identity.

It belongs to:

```text
Identity
```

and is implemented under:

```text
src/core/identity/profile/
```

Profile may contain application-level information such as:

```text
display name

avatar metadata

language

timezone

application preferences
```

when those fields are actually required.

---

# Profile Is Not Authentication

Profile does not own:

```text
password

authentication session

refresh token

authentication provider credentials
```

Those concerns remain with the authentication provider.

Profile represents application identity, not authentication infrastructure.

---

# Profile Is Not a Tenant

Profile does not define tenant access.

Incorrect:

```text
Profile
→ Organization access
```

Correct:

```text
Profile
        ↓
OrganizationMembership
        ↓
Organization
```

Tenant belonging is owned by Memberships.

---

# Profile Does Not Store Role

Do not store:

```text
Profile.roleId
```

or equivalent tenant Role information directly on Profile.

A Profile may participate in multiple Organizations and hold a different Role in each.

Canonical relationship:

```text
Profile
        ↓
OrganizationMembership
        ↓
Role
```

Role assignment belongs to Membership.

---

# Profile Does Not Store Permissions

Do not store:

```text
Profile.permissions

Profile.permissionsJson

Profile.permissionFlags
```

as the Foundation authorization model.

Permission authorization is resolved through:

```text
ACTIVE OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

---

# Authentication

Authentication determines whether an actor has successfully proven an identity.

Current authentication implementation uses:

```text
Supabase Authentication
```

with server-side integration through the approved Supabase SSR architecture.

---

# Current Authentication Methods

Current implemented authentication methods include:

```text
Email + Password

Email Magic Link
```

Magic Link is not a future-only capability.

It is part of the current authentication implementation.

---

# Current Authentication Flows

Current application flows include:

```text
registration

login

Magic Link request

authentication callback

logout
```

These flows are implemented through the Identity authentication boundary.

Transport details belong to:

```text
docs/architecture/API.md
```

---

# Authentication Architecture

Conceptually:

```text
Client
        ↓
Next.js authentication entry point
        ↓
Identity Auth capability
        ↓
Supabase Auth adapter
        ↓
Supabase auth.users / session
```

Application code should not scatter authentication-provider behavior across unrelated modules.

---

# Server-Side Authentication

Security-sensitive authentication state must be resolved server-side.

Do not trust client assertions such as:

```text
authenticated = true

userId = "..."

profileId = "..."
```

as proof of identity.

The server must resolve the authenticated identity through the approved authentication provider/session.

---

# Authentication Context

A resolved authentication context may conceptually provide information such as:

```text
authentication user ID

authenticated email

authentication session state
```

Only the minimum information required by the operation should be propagated.

Authentication context is not tenant authorization context.

---

# Current Profile Resolution

After authentication, application workflows may resolve the corresponding:

```text
Profile
```

Conceptually:

```text
Supabase Auth Identity
        ↓
Profile Resolution
        ↓
Application Identity
```

The Profile relationship to the authentication identity must remain unambiguous and canonical.

---

# Registration

Registration establishes authentication identity and the corresponding application identity according to the approved implementation.

Conceptually:

```text
Registration Request
        ↓
Input Validation
        ↓
Supabase Authentication
        ↓
Authenticated Identity
        ↓
Profile initialization / resolution
```

Registration does not automatically create:

```text
Organization

Membership

Role assignment

tenant Permission
```

unless an explicitly approved onboarding workflow coordinates those operations.

---

# Login

Login authenticates an existing identity.

Conceptually:

```text
Credentials
        ↓
Supabase Authentication
        ↓
Authenticated Session
        ↓
Profile Resolution
```

Login does not itself grant access to any Organization.

---

# Magic Link

Magic Link provides passwordless email authentication.

Conceptually:

```text
Email
        ↓
Magic Link Request
        ↓
Supabase
        ↓
Email Link
        ↓
Authentication Callback
        ↓
Authenticated Session
```

The callback establishes authentication state.

Normal tenant authorization still requires tenant context after authentication.

---

# Authentication Callback

Authentication callbacks are transport boundaries used to complete provider authentication flows.

Callback handling must:

```text
validate provider flow

establish approved session state

avoid leaking sensitive tokens

redirect only through approved application behavior
```

Provider-specific mechanics remain behind the Identity authentication boundary.

---

# Logout

Logout invalidates or clears the current authentication session according to the approved Supabase session behavior.

Logout belongs to Identity.

It does not delete:

```text
Profile

OrganizationMembership

Organization

business data
```

---

# Sessions

Authentication sessions are managed primarily by the authentication provider.

Application code should avoid creating a second competing session system.

The application may consume session information required to establish authenticated identity.

---

# Session Principle

Sessions should contain or expose only what is necessary for authentication and session operation.

Do not treat the authentication session as a permanent cache of:

```text
complete Profile

Organization list

Membership list

Role hierarchy

Permission tree

business data
```

Tenant and authorization state should be resolved from canonical application data when required.

---

# Authorization Changes and Sessions

A Role or Permission change should not require trusting stale authorization data stored in the browser session.

Normal protected operations resolve authorization server-side.

Therefore:

```text
Role change
Permission change
Membership suspension
Membership removal
```

must affect authorization through canonical application state rather than depending on client session claims.

---

# Session Security

Session handling must follow the approved Supabase SSR and security architecture.

Security requirements include:

```text
secure cookie handling

server-side identity resolution

safe callback processing

no token leakage

no client authority over authenticated identity
```

Detailed security rules belong to:

```text
docs/architecture/SECURITY.md
```

---

# Identity Versus Tenancy

Identity and Tenancy are separate architectural concerns.

Identity answers:

```text
Who is the actor?
```

Tenancy answers:

```text
In which Organization context is the actor operating?
```

The same Profile may participate in multiple Organizations.

---

# Tenant Relationship

Normal tenant participation is represented through:

```text
Profile
        ↓
OrganizationMembership
        ↓
Organization
```

Identity does not own `OrganizationMembership`.

Memberships owns it.

---

# Identity Versus Role

Identity does not determine Role directly.

Incorrect:

```text
Profile
→ ADMIN
```

Correct:

```text
Profile
        ↓
OrganizationMembership
        ↓
Role
```

This permits the same Profile to hold different Roles in different Organizations.

---

# Identity Versus Permission

Authentication does not imply authorization.

Incorrect:

```text
Authenticated
→ allowed
```

Normal protected tenant flow:

```text
Authenticated Identity
        ↓
Profile
        ↓
ACTIVE OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

Identity establishes only the first part of this chain.

---

# Identity Versus Business Identity

An authenticated Profile is not automatically a business entity.

Examples:

```text
Profile
≠ Employee

Profile
≠ Customer

Profile
≠ DJ Artist

Profile
≠ Salesperson

Profile
≠ Supplier
```

A Domain may associate one of its own business entities with a Profile when its business model requires it.

The Domain entity remains owned by the Domain.

---

# Example: Copy Domain

A future Copy Domain may contain:

```text
Employee
Customer
Operator
```

These are business concepts.

They must not be collapsed automatically into:

```text
Profile
```

even if some of those entities are associated with authenticated users.

---

# Example: DJ Domain

A DJ or Artist is not automatically an authenticated Platform user.

Correct:

```text
Profile
→ application identity
```

```text
Artist / DJ
→ DJ Domain entity
```

A relationship may be created between them when product requirements justify it.

They remain separate concepts.

---

# Organizations

Organizations is a separate Platform Core module.

It owns:

```text
Organization
```

Identity may participate in workflows involving Organizations.

Identity does not own Organization data.

Detailed Organization behavior belongs to:

```text
docs/core/modules/organizations/
```

---

# Memberships

Memberships is a separate Platform Core module.

It owns:

```text
OrganizationMembership

OrganizationInvitation
```

Identity provides the authenticated Profile required by Membership workflows.

Identity does not own Membership lifecycle.

---

# Roles

Roles is a separate Platform Core module.

It owns:

```text
Role
```

Identity does not define or assign tenant Roles.

Role assignment occurs through Membership.

---

# Permissions

Permissions is a separate Platform Core module.

It owns:

```text
Permission

RolePermission
```

Identity does not own the authorization catalog or RolePermission policy.

---

# Invitations

Organization invitations belong to Memberships.

Identity participates only where authentication identity is required.

For example, invitation acceptance conceptually requires:

```text
valid Invitation
+
authenticated identity
+
matching recipient identity
```

Memberships owns:

```text
invitation lifecycle

token validation behavior

membership creation / restoration behavior
```

Identity owns authentication of the recipient.

---

# Invitation Acceptance

Invitation acceptance is a bootstrap flow.

The recipient may not yet have a Membership.

Therefore it does not require a pre-existing tenant Permission.

Conceptually:

```text
Invitation
        ↓
Authenticated matching identity
        ↓
Memberships acceptance rules
        ↓
Membership creation / restoration
```

---

# Email Identity Matching

When Membership invitation behavior depends on email identity, normalization rules must remain compatible with the Identity authentication model.

Memberships owns invitation recipient data.

Identity owns authenticated identity.

Neither module should create a second competing email identity system.

Identity exposes a narrow lookup from normalized canonical Auth email to
`Profile.id`. The lookup uses the nullable `Profile.authEmailNormalized`
projection maintained from `auth.users.email` by Supabase database triggers.

The projection is not a second email authority:

```text
auth.users.email
        ↓ canonical source
trim + lowercase
        ↓ derived lookup projection
Profile.authEmailNormalized
```

Required properties:

- unique when present;
- `NULL` for identities without an email or Profiles without a matching Auth
  identity;
- never writable by authenticated application clients;
- never accepted as authentication proof;
- never exposed as a normal Membership or Profile DTO field;
- resolved through Identity-owned, server-only services, including a
  transaction-scoped variant when a consumer must revalidate inside a database
  transaction.

Supabase-triggered insert and email-change synchronization owns the projection.
Application registration and Profile-edit forms do not write it.

## Profile Column Update Boundary

RLS determines which Profile rows an authenticated caller may update; column
privileges determine which attributes they may change. The current client-edit
surface is limited to:

```text
display_name
dj_name
bio
preferred_language
```

The database owns `updated_at`. Authenticated clients must not update identity
keys, `is_admin`, timestamps or the Auth email projection. Expanding the
editable set requires explicit Identity and security review.

---

# Authorization

Authorization is not owned entirely by Identity.

Platform Core separates:

```text
Identity
→ authentication

Memberships
→ tenant belonging

Roles
→ authorization position

Permissions
→ capability authorization

Core module / Domain
→ resource and lifecycle validity
```

This separation must remain explicit.

---

# Protected Tenant Operation

Canonical normal flow:

```text
Authentication
        ↓
Profile
        ↓
Trusted Tenant Context
        ↓
ACTIVE Membership
        ↓
Role
        ↓
Permission
        ↓
Owning Service
        ↓
Resource / Business Invariants
```

Identity owns authentication and Profile resolution.

It does not own the entire flow.

---

# Server-Side Enforcement

Authentication is always verified server-side for security-sensitive operations.

Client-side state may improve UX.

It is not authority.

Never trust:

```text
client user ID

client Profile ID

client authentication flag

client Role

client Permission list
```

without server-side resolution.

---

# Row Level Security

RLS is not owned by Identity alone.

RLS may use:

```text
auth.uid()
```

as part of identifying the database actor.

Tenant isolation then follows the approved tenant and Membership model.

Conceptually:

```text
auth.uid()
        ↓
application identity relationship
        ↓
Organization Membership
        ↓
tenant row isolation
```

Exact RLS policies depend on the protected tables and documented tenancy architecture.

---

# RLS Is Not Permission Authorization

RLS and Permissions solve different problems.

Conceptually:

```text
Identity
→ who is the database/application actor?
```

```text
RLS
→ which tenant rows may be accessed?
```

```text
Permissions
→ which application capability may be performed?
```

```text
Owning Service
→ is the operation valid?
```

Do not collapse these responsibilities.

---

# Profile Self-Service

Profile self-service is an Identity capability.

Examples may include:

```text
view own Profile

update approved Profile fields
```

Profile self-service does not require inventing a tenant Permission when the operation concerns only the authenticated actor's own application Profile.

Input validation and ownership checks remain server-side.

---

# Authentication Errors

Identity may define stable authentication-related errors.

Examples may include:

```text
AUTHENTICATION_REQUIRED

INVALID_CREDENTIALS

AUTHENTICATION_FAILED
```

Exact errors should match implementation and approved application contracts.

Do not expose provider internals unnecessarily.

---

# Profile Errors

Identity may define application-profile errors such as:

```text
PROFILE_NOT_FOUND

PROFILE_UPDATE_FAILED
```

where required.

Transport layers map these errors to UI or HTTP responses.

---

# Provider Errors

Raw authentication-provider errors must not become public application contracts by default.

Preferred:

```text
provider error
        ↓
Identity mapping
        ↓
safe application error
```

Internal diagnostic information may be logged safely where appropriate.

---

# Authentication Provider Boundary

Supabase is the current authentication provider.

Application code should depend on approved Identity capabilities rather than spreading provider SDK usage throughout:

```text
Domains

Core modules

UI components
```

Provider-specific integration belongs behind the appropriate technical boundary.

---

# Replaceability

Authentication provider replaceability is a design objective, not a claim that replacement is cost-free.

Current architecture intentionally uses Supabase capabilities.

A future provider migration would require deliberate implementation and potentially data migration.

Identity boundaries should reduce unnecessary coupling without hiding useful provider capabilities.

---

# OAuth and Additional Providers

Potential future authentication methods may include:

```text
Google OAuth

GitHub OAuth

Apple OAuth

Enterprise SSO
```

These are not part of the current approved implementation merely because Supabase can support them.

Each additional authentication method requires a real product requirement and implementation decision.

---

# Multi-Factor Authentication

MFA is a future security capability unless and until explicitly implemented.

Potential methods may include:

```text
TOTP

recovery codes

provider-supported MFA
```

Do not document MFA as active security protection before implementation exists.

---

# MFA and Roles

A future security policy may require stronger authentication for sensitive tenant operations or Roles.

For example:

```text
OWNER

ADMIN
```

may warrant stronger authentication requirements.

Such a policy requires explicit Security and Identity architecture before implementation.

Do not encode it implicitly in the Role model.

---

# Account Suspension

Authentication-account suspension and Organization Membership suspension are separate concepts.

Conceptually:

```text
Authentication account state
→ Identity concern
```

```text
Organization Membership SUSPENDED
→ Memberships concern
```

Suspending a Membership in one Organization must not automatically redefine the Profile's identity or participation in other Organizations.

---

# Account Deletion

Authentication identity deletion is a high-impact lifecycle operation.

It may affect:

```text
Profile

Memberships

owned Organizations

audit requirements

Domain references
```

Do not implement account deletion as a simple authentication-provider delete call without a documented cross-module lifecycle policy.

Account deletion requires explicit specification before implementation.

---

# Profile Deletion

Profile deletion must not be treated independently from authentication identity and referenced application data.

The lifecycle requires explicit architecture before implementation.

Do not introduce hard delete behavior merely because the database permits it.

---

# Session Invalidation

Session invalidation behavior must match the capabilities of the authentication provider and approved security policy.

Examples that may justify session revocation include:

```text
credential compromise

explicit logout

security incident

authentication-account suspension

high-risk authentication changes
```

Do not claim global session invalidation exists until implementation supports it.

---

# Membership Changes Do Not Define Identity

Events such as:

```text
Role changed

Membership suspended

Membership removed
```

change tenant authorization.

They do not inherently delete or invalidate the authenticated Profile.

Authorization must reflect the canonical Membership and Permission state on subsequent protected operations.

---

# Audit

Identity-related security events may require auditability.

Potential events include:

```text
authentication success

authentication failure

logout

Magic Link request

password reset

security-sensitive Profile change

MFA change when introduced
```

Membership and Role events remain owned semantically by their respective modules.

A future Audit Core module may provide the shared recording capability.

---

# Audit Ownership

Example:

```text
Membership Removed
```

is a Memberships event.

Example:

```text
Role Changed
```

is a Memberships / Roles-related authorization event according to the owning workflow.

Example:

```text
Authentication Failed
```

is an Identity event.

The Audit infrastructure may record them without becoming the owner of their semantics.

---

# Sensitive Authentication Data

Never intentionally log:

```text
passwords

access tokens

refresh tokens

Magic Link secrets

session secrets

provider secrets
```

Authentication-sensitive logging must follow the Security architecture.

---

# Domain Integration

Domains may consume Identity capabilities.

Valid:

```text
Domain
        ↓
Identity
```

Examples:

```text
require authenticated Profile

resolve current Profile
```

Domains must not create a competing authentication system.

---

# Domain Identity Mapping

A Domain may associate a Domain entity with Profile.

Example:

```text
Profile
        ↓
DJ Domain relation
        ↓
Artist
```

or:

```text
Profile
        ↓
Copy Domain relation
        ↓
Employee
```

if required by the product.

The Domain association must not redefine Profile itself.

---

# No Domain Authentication

Forbidden:

```text
DJ Domain Authentication

Copy Domain Authentication

SEO Domain Authentication
```

when those systems duplicate Platform Core Identity.

Domains consume the shared authentication capability.

---

# Bootstrap Flows

Identity participates in several flows that occur before tenant authorization exists.

Examples:

```text
registration

login

Magic Link authentication

Profile self-service

initial Organization onboarding

invitation acceptance
```

These flows must use their approved authorization rules.

Do not invent fake Memberships or Permissions simply to make them resemble normal tenant requests.

---

# Organization Bootstrap

Identity provides the authenticated Profile required to start Organization onboarding.

Conceptually:

```text
Authenticated Profile
        ↓
Organizations / cross-module onboarding
        ↓
Organization
+
initial OWNER Membership
```

Identity does not own the Organization or Membership created by the workflow.

---

# Current Source Ownership

Current Identity source structure:

```text
src/core/identity/
├── auth/
│   ├── actions/
│   └── components/
└── profile/
    ├── actions/
    ├── components/
    └── services/
```

The exact internal structure may evolve as implementation grows.

Architectural ownership must remain:

```text
auth
→ authentication behavior

profile
→ application Profile behavior
```

---

# Identity API Principle

Identity exposes application capabilities.

Examples may include:

```text
login

logout

register

requestMagicLink

resolve current authenticated identity

resolve current Profile

update current Profile
```

These capabilities do not all require HTTP endpoints.

Transport strategy follows:

```text
docs/architecture/API.md
```

---

# Identity Data Principle

Authentication provider data and application Profile data must not be casually merged.

Conceptually:

```text
Supabase auth.users
→ authentication identity

Profile
→ application identity
```

Application code should use the appropriate source for the question being answered.

---

# Identity Security Boundary

Identity is security-sensitive.

Changes affecting:

```text
authentication mapping

Profile identity mapping

session handling

provider callbacks

credential behavior

account lifecycle
```

require deliberate review.

AI implementation agents must not silently change these contracts.

---

# AI Agent Rules

AI coding agents must not:

```text
create a second Prisma User model

create a separate Profiles module

store Role on Profile

store Permissions on Profile

treat authentication as tenant authorization

move Membership lifecycle into Identity

move invitation lifecycle into Identity

hard-code tenant Roles into authentication sessions

trust client identity claims

invent OAuth providers

claim MFA is implemented when it is not

change Supabase identity mapping without architecture review

delete authentication identities without lifecycle specification
```

If implementation requires a new Identity decision:

```text
STOP
        ↓
Report
        ↓
Architecture decision
        ↓
Documentation update
        ↓
Resume implementation
```

---

# Identity Validation Checklist

Before implementing an Identity change, verify:

```text
1. Is this authentication or application Profile behavior?

2. Does Identity actually own the capability?

3. Is a second User representation being introduced?

4. Does the change affect Supabase auth.users mapping?

5. Does the change affect session behavior?

6. Does the change affect tenant access?

7. Is tenant behavior incorrectly being moved into Identity?

8. Does the change require Membership, Role or Permission coordination?

9. Does it alter account lifecycle?

10. Does it require a Security or ADR decision?
```

---

# Forbidden Identity Practices

Do not:

```text
create duplicate authenticated-user models

create a separate Profiles Core module

store tenant Role directly on Profile

store tenant Permissions directly on Profile

treat Profile as Organization Membership

treat authentication as authorization

create Invitation as an Identity entity

create Organization as an Identity entity

make Role or Permission ownership part of Identity

persist authentication secrets in Profile

trust client authentication state

store full Permission trees in the browser session as authority

invalidate identity merely because one Membership is removed

allow a Domain to implement competing authentication

document future authentication capabilities as already implemented

silently change authentication provider semantics
```

---

# Current Implementation Status

The current Identity foundation includes:

```text
Supabase Authentication

Email + Password authentication

Email Magic Link authentication

authentication callback handling

logout

server-side authentication integration

Profile application capability

authenticated Profile retrieval

Profile update capability
```

This document must distinguish current implementation from future architecture.

Potential future authentication capabilities remain future until actually implemented and verified.

---

# Future Identity Capabilities

Potential future capabilities may include:

```text
OAuth providers

Enterprise SSO

SCIM

MFA

device/session management

advanced account security policies

identity-provider administration
```

These capabilities are not automatically required by Platform Core Foundation.

They should be introduced only when product or security requirements justify them.

---

# Final Principle

Identity proves who the actor is.

Supabase `auth.users` is the canonical authentication identity source.

Profile is the canonical application representation of that identity.

Profile is not a tenant.

Profile is not a Role.

Profile is not a Permission set.

Organizations owns the tenant.

Memberships owns belonging.

Roles owns authorization positions.

Permissions owns capability authorization.

Domains own business identities.

Authentication must remain server-resolved and security-sensitive.

Identity establishes the actor.

It does not establish what that actor may do inside every tenant.
