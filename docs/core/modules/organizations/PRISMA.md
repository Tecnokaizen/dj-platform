---
title: Organizations Prisma Implementation
version: 1.1.0
status: Draft
owner: Platform Core
updated: 2026-08-08
related:
  - SPEC.md
  - DATA_MODEL.md
  - FLOWS.md
  - API.md
  - TASKS.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/DATA.md
---

# Organizations Prisma Implementation

## Purpose

This document defines the Prisma persistence implementation for the Platform Core Organizations module.

It translates the Organizations data model into persistence rules compatible with:

- PostgreSQL
- Prisma
- Supabase
- Platform Core Identity
- Multi-tenancy
- Future Memberships
- Future Roles
- Future Permissions

This document owns only persistence decisions belonging to Organizations.

It does not define persistence owned by Memberships, Roles or Permissions.

---

# Scope

The Organizations module owns:

```text
Organization
OrganizationStatus
```

The Organizations module does not own:

```text
OrganizationMembership
MembershipStatus
Role
Permission
OrganizationInvitation
OrganizationSettings
AuditEvent
BillingAccount
```

Those entities belong to their respective Platform Core modules.

Conceptually:

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

Cross-module relationships are permitted.

Cross-module ownership is not.

---

# Current Persistence Architecture

Platform Core currently uses:

```text
Application
        ↓
Organizations Service
        ↓
Prisma Runtime Adapter
        ↓
Prisma Client
        ↓
PostgreSQL
```

Supabase provides:

```text
Authentication
PostgreSQL
Row Level Security capabilities
```

Prisma remains the primary application persistence layer.

---

# Existing Identity Integration

Platform Core already provides authenticated identities through:

```text
Supabase Auth
```

Canonical identity source:

```text
auth.users
```

Application-level profile data is represented by:

```text
Profile
```

Conceptually:

```text
auth.users
    ↓
Profile
```

Organizations must reuse this existing identity architecture.

Do not introduce:

```text
User
PlatformUser
OrganizationUser
AccountUser
```

as duplicate Prisma identity models.

Any future change to identity ownership requires an ADR.

---

# Organizations and Identity

An authenticated identity does not automatically belong to an Organization.

Valid state:

```text
Authenticated Profile
        ↓
No Membership
        ↓
No Organization Context
```

Organization access is established through the Memberships module.

Conceptually:

```text
Profile
    ↓
OrganizationMembership
    ↓
Organization
```

The Membership relationship is not persisted by the Organizations module.

---

# Identifier Strategy

The active application schema uses UUID identifiers.

Organizations must follow the same strategy.

Recommended pattern:

```prisma
id String @id @default(uuid()) @db.Uuid
```

Foreign keys referencing Organization must use compatible UUID types.

Example:

```prisma
organizationId String @map("organization_id") @db.Uuid
```

Do not introduce CUID identifiers into Organizations.

Any platform-wide identifier change requires:

- ADR
- Migration strategy
- Referential-integrity review
- Compatibility review

---

# OrganizationStatus

Initial Organization lifecycle states:

```prisma
enum OrganizationStatus {
  ACTIVE
  SUSPENDED
  ARCHIVED
}
```

Meaning:

```text
ACTIVE
Normal Organization operation.

SUSPENDED
Organization retained but normal tenant operations restricted.

ARCHIVED
Organization inactive and retained for historical or recovery purposes.
```

Permanent deletion is not represented as a normal lifecycle state.

---

# Organization Model

Recommended initial Prisma model:

```prisma
model Organization {
  id         String             @id @default(uuid()) @db.Uuid
  name       String
  slug       String             @unique
  status     OrganizationStatus @default(ACTIVE)
  logoUrl    String?            @map("logo_url")
  locale     String             @default("es")
  timezone   String             @default("UTC")
  createdAt  DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  archivedAt DateTime?          @map("archived_at") @db.Timestamptz(6)

  @@index([status])
  @@map("organizations")
}
```

This is the Organizations-owned persistence model.

Exact string lengths may be introduced before migration if required by established schema conventions.

Do not add speculative fields.

---

# Future Membership Relation

When the Memberships module is implemented, Prisma may require an inverse relation on Organization.

Conceptually:

```prisma
memberships OrganizationMembership[]
```

This relation may eventually appear physically inside the `Organization` Prisma model because Prisma maintains relations inside a shared schema.

That does not transfer ownership of `OrganizationMembership` to Organizations.

The rule remains:

```text
Organization
→ Organizations owns it

OrganizationMembership
→ Memberships owns it
```

Physical schema location does not determine architectural ownership.

---

# Membership Persistence Boundary

This document must not define the complete Prisma model for:

```text
OrganizationMembership
```

That model belongs to:

```text
docs/core/modules/memberships/PRISMA.md
```

once the Memberships module is specified.

Organizations may rely conceptually on Memberships but must not create a temporary competing implementation.

---

# MembershipStatus Boundary

Organizations does not own:

```text
MembershipStatus
```

Membership lifecycle belongs to the Memberships module.

Organizations may react to membership state when authorizing Organization operations, but it must not define or persist membership state.

---

# Roles Boundary

Roles are owned by the Roles module.

Organizations must not define:

```text
Role
RoleType
RolePermission
OrganizationRole
```

as temporary Organizations-owned models.

Organization ownership depends conceptually on an OWNER role, but the canonical role representation must be defined by the Roles module.

---

# Permissions Boundary

Permissions are owned by the Permissions module.

Organizations must not embed permission definitions into:

```text
Organization
```

or into Organization persistence.

Authorization may eventually follow:

```text
Profile
    ↓
OrganizationMembership
    ↓
Role
    ↓
Permission
```

but those relationships remain independently owned.

---

# Ownership Representation

Every Organization must eventually have exactly one active owner.

Ownership is represented conceptually through:

```text
OrganizationMembership
        +
OWNER Role
```

Do not add:

```text
ownerId
ownerUserId
ownerProfileId
```

to `Organization`.

Doing so would create a second source of truth.

---

# Ownership Dependency

The Organization table alone cannot represent ownership.

Therefore:

```text
Organization persistence
```

can be implemented independently, but:

```text
complete Organization creation
```

cannot be considered production-complete until Memberships and Roles exist.

This distinction is intentional.

---

# Organization Creation

The final Platform Core Organization creation flow requires multiple modules.

Conceptually:

```text
Authenticated Profile
        ↓
BEGIN TRANSACTION
        ↓
Create Organization
        ↓
Resolve OWNER Role
        ↓
Create OWNER Membership
        ↓
COMMIT
```

If any required step fails:

```text
ROLLBACK
```

An Organization must not become an operational tenant without its required ownership relationship.

---

# Organizations-Only Implementation Phase

Before Memberships and Roles are implemented, Organizations may safely implement:

```text
OrganizationStatus

Organization model

Prisma runtime access

Organization reads

Organization lifecycle persistence

Slug generation and validation

Organization tests
```

The following must not be faked:

```text
OWNER role

Membership persistence

Permission persistence

Ownership transfer

Invitation persistence
```

Temporary authorization systems are prohibited.

---

# Owner Invariant

Final tenancy architecture requires:

```text
Exactly one active OWNER
per active Organization
```

This is a cross-module invariant involving:

```text
Organizations
Memberships
Roles
```

Organizations defines the Organization-level requirement.

Memberships and Roles provide the persisted relationships required to satisfy it.

---

# Database Enforcement of Ownership

Do not assume that a simple Prisma unique constraint can enforce the complete OWNER invariant.

If Membership references Role through:

```text
roleId
```

the OWNER semantic belongs to a related Role record.

PostgreSQL cannot enforce a cross-table semantic invariant through an ordinary partial unique index alone.

Possible future enforcement mechanisms may include:

- Transactional service logic
- Database constraints where expressible
- Carefully reviewed database triggers
- Schema designs approved by ADR

The exact database enforcement strategy must be decided after Memberships and Roles schemas are finalized.

Until then:

```text
Do not invent an ownership column solely to simplify the constraint.
```

Application transactions and tests remain mandatory.

---

# Organization Naming

Prisma model:

```text
Organization
```

Database table:

```text
organizations
```

Mapping:

```prisma
@@map("organizations")
```

Application fields use:

```text
camelCase
```

Database columns may use:

```text
snake_case
```

Example:

```prisma
archivedAt DateTime? @map("archived_at") @db.Timestamptz(6)
```

---

# Slug

Organization slug is intended to provide a stable human-readable identifier where needed.

Example:

```text
example-studio
```

Persistence requirement:

```prisma
slug String @unique
```

The database unique constraint is authoritative.

Application validation should normalize slugs before persistence.

Recommended characteristics:

- Lowercase
- URL safe
- Predictable
- Human readable
- Non-empty
- Globally unique under the current architecture

A race condition during slug creation must be handled through the database uniqueness constraint.

---

# Slug Conflict Handling

Application flow:

```text
Requested Name
      ↓
Generate Slug
      ↓
Validate
      ↓
Attempt Persistence
      ↓
Unique Conflict?
      ↓
Return Stable Application Error
```

Do not rely solely on a pre-insert uniqueness query.

The database remains the final concurrency boundary.

---

# Organization Name

`name` is required.

It is not globally unique.

Multiple Organizations may legitimately share the same human-readable name.

Example:

```text
Studio
Studio
Studio
```

Their slugs and UUID identifiers distinguish them.

---

# Locale

Initial field:

```prisma
locale String @default("es")
```

Locale represents Organization-level preference.

Examples:

```text
es
en
it
fr
```

Application validation should determine supported locale values.

Do not create a database enum unless the supported locale strategy requires one.

---

# Timezone

Initial field:

```prisma
timezone String @default("UTC")
```

Application values should use IANA timezone identifiers.

Examples:

```text
Europe/Madrid
Europe/London
America/New_York
```

Timezone validation belongs to the application layer.

The database stores the selected identifier.

---

# Logo Reference

Initial field:

```prisma
logoUrl String? @map("logo_url")
```

Organizations stores only the asset reference.

Binary object handling belongs to the Storage capability.

Organizations must not implement:

- File upload providers
- Object storage clients
- Signed URLs
- Bucket management

---

# Timestamps

Organization uses:

```text
createdAt
updatedAt
archivedAt
```

Recommended PostgreSQL type:

```text
TIMESTAMPTZ
```

Prisma representation:

```prisma
createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
updatedAt  DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
archivedAt DateTime? @map("archived_at") @db.Timestamptz(6)
```

---

# Organization Status Rules

Expected lifecycle:

```text
ACTIVE
   │
   ├──→ SUSPENDED
   │        │
   │        └──→ ACTIVE
   │
   └──→ ARCHIVED
            │
            └──→ ACTIVE
```

Status changes are application operations.

Organizations services perform persistence operations through the approved Prisma runtime adapter.

Services decide whether a transition is permitted.

---

# archivedAt Consistency

Expected invariant:

```text
status = ARCHIVED
→ archivedAt != null
```

and:

```text
status != ARCHIVED
→ archivedAt = null
```

The service layer must maintain this invariant.

A PostgreSQL CHECK constraint may later enforce it if migration review confirms the implementation is appropriate.

Do not rely solely on UI behavior.

---

# Suspend Organization

Persistence behavior:

```text
status = SUSPENDED
archivedAt = null
```

Suspension retains all Organization data.

Suspension is not archival.

---

# Reactivate Organization

From:

```text
SUSPENDED
```

to:

```text
ACTIVE
```

Persistence behavior:

```text
status = ACTIVE
archivedAt = null
```

---

# Archive Organization

Persistence behavior:

```text
status = ARCHIVED
archivedAt = current timestamp
```

Normal Organization archival must not delete related tenant data.

---

# Restore Organization

Persistence behavior:

```text
status = ACTIVE
archivedAt = null
```

Restoration authorization belongs to the service/application layer.

---

# Permanent Deletion

Permanent deletion is exceptional.

It must not be the default Organization lifecycle operation.

Before implementation, deletion behavior must define:

- Domain data handling
- Membership handling
- Billing implications
- Audit implications
- Backup implications
- Legal or retention requirements
- Referential actions

Until those requirements are approved, archival is the preferred deactivation mechanism.

---

# Referential Actions

Organizations will eventually be referenced by entities owned by:

```text
Memberships
Settings
Billing
Audit
Business Domains
```

Referential actions must be selected by the owner of each relationship in coordination with Organizations.

Do not globally assume:

```text
onDelete: Cascade
```

for Organization relationships.

An Organization may own a large amount of tenant data.

Destructive cascades require explicit architectural review.

---

# Membership Referential Actions

When Memberships is implemented, it will define the relationship from:

```text
OrganizationMembership
→ Organization
```

The Memberships module owns the foreign key and its referential action.

Organizations may document required lifecycle behavior but must not own Membership persistence.

---

# Profile Referential Actions

Organizations does not directly require a Profile foreign key.

The relationship:

```text
Profile
→ OrganizationMembership
→ Organization
```

belongs primarily to Memberships.

Any inverse Prisma relation added to `Profile` should be specified by the Memberships implementation.

Organizations must not modify Profile merely to create a direct user-to-Organization relationship.

---

# Roles Referential Actions

Role-to-Membership referential behavior belongs to:

```text
Roles
Memberships
```

Organizations should not decide destructive Role deletion behavior.

Roles assigned to memberships should generally not disappear silently.

Exact lifecycle rules belong to the Roles specification.

---

# Multi-Tenancy

Organization is the primary tenant boundary.

Tenant-owned entities should normally reference:

```text
organizationId
```

Example:

```prisma
organizationId String @map("organization_id") @db.Uuid
```

Tenant ownership must be explicit.

Do not derive tenant ownership only from:

- Current URL
- Browser state
- Client state
- Selected UI Organization

---

# Tenant Query Principle

Tenant-aware persistence should eventually follow:

```text
Authenticated Profile
        ↓
Validated Membership
        ↓
Organization Context
        ↓
Tenant-Scoped Organization Query
```

Authentication alone is insufficient.

---

# Row Level Security

Supabase Row Level Security may provide an additional tenant isolation boundary.

Final Organization access policies depend on Memberships.

Conceptually:

```text
auth.uid()
    ↓
Profile
    ↓
OrganizationMembership
    ↓
organization_id
```

Therefore the final tenant-aware Organization RLS policy must not be invented before Memberships persistence is defined.

---

# Organizations-Only RLS Phase

During an Organizations-only persistence phase:

- Do not create permissive temporary tenant policies.
- Do not pretend authentication is equivalent to Organization membership.
- Do not expose Organization records broadly through Supabase APIs.
- Document any temporary server-only access model explicitly.

Final Organization RLS is part of the tenancy foundation, not Organizations in isolation.

---

# RLS Responsibility

RLS complements application authorization.

It does not replace:

```text
Membership validation
Role validation
Permission checks
Service-layer business rules
```

Platform security must not depend on one layer alone.

---

# Grants

PostgreSQL grants and RLS are separate security mechanisms.

RLS policies do not automatically provide correct table privileges.

Required roles and grants must be explicitly reviewed before production.

Use least privilege.

---

# Service Role

Administrative platform workflows may require elevated database access.

Supabase `service_role` access:

- Must remain server side.
- Must never reach browser code.
- Must not be used as a substitute for authorization.
- Must be isolated.
- Must be auditable where appropriate.

Organizations services should use normal application access whenever possible.

---

# Persistence Structure

Organizations implementation lives under:

```text
src/core/modules/organizations/
```

Possible implementation directories:

```text
organizations/

├── actions/
├── components/
├── schemas/
├── services/
├── types/
└── validators/
```

Only directories required by real implementation should be created.

Prisma runtime infrastructure belongs under:

```text
src/lib/prisma/
```

Do not create empty architecture ceremony.

---

# Organizations Persistence Access

Organizations capability services own Organization-specific persistence semantics.

They may perform operations such as:

```text
findById
findBySlug
create
update
updateStatus
archive
restore
deletePermanent
```

through the approved Prisma runtime adapter.

Only implement operations required by approved tasks.

A Repository abstraction is optional and must only be introduced when demonstrated complexity justifies it.

---

# Persistence Responsibilities

Organizations services may:

- Read Organizations.
- Create Organizations.
- Update persisted Organization fields.
- Persist lifecycle changes.
- Execute Organization-specific database queries.
- Participate in transactions where required.

Organizations persistence behavior must not:

- Authorize users implicitly.
- Decide Membership rules.
- Assign Roles.
- Evaluate Permissions outside the approved authorization boundary.
- Create invitation workflows.
- Perform billing behavior.
- Emit unrelated external notifications.
- Implement Domain behavior.

The Prisma runtime adapter under `src/lib/prisma/` owns Prisma Client construction and runtime reuse only.

It must not own Organizations business semantics.

---

# Service Responsibilities

Organization services own Organization workflows.

Examples:

```text
createOrganization
updateOrganization
suspendOrganization
reactivateOrganization
archiveOrganization
restoreOrganization
```

Services may coordinate other Core modules when those modules exist.

Cross-module orchestration does not transfer persistence ownership.

---

# createOrganization Service

The final service contract may remain:

```text
createOrganization()
```

even though it coordinates several modules.

Final implementation concept:

```text
Organization Service
       │
       ├── Prisma runtime adapter
       │
       ├── Roles capability
       │
       └── Memberships capability
```

The implementation must preserve atomicity.

Until Roles and Memberships exist, the production-complete `createOrganization()` workflow is blocked.

---

# Query Scoping

Organization reads fall into different categories.

Direct platform lookup:

```text
findById
findBySlug
```

User-accessible listing:

```text
listForCurrentUser
```

The latter depends on Memberships.

Organizations must not recreate membership query logic merely to implement user-specific Organization lists.

---

# Active Organization

Active Organization is application context.

It is not equivalent to:

```text
Organization.status = ACTIVE
```

These concepts are different.

```text
Organization status
→ lifecycle state

Active Organization context
→ currently selected tenant for a user/session
```

Persistence of active tenant selection, if required, must be designed separately.

---

# Indexes

Initial Organizations indexes:

```prisma
slug String @unique

@@index([status])
```

The unique slug constraint provides its own supporting index in PostgreSQL.

Avoid creating redundant indexes without evidence.

Future indexes should follow actual query patterns.

---

# Index Review

Before adding an index, identify:

```text
Which query needs this index?
```

Do not add speculative indexes because a field appears important.

Monitor real query behavior after implementation.

---

# Migration Strategy

Initial Organizations-owned migration should introduce:

```text
OrganizationStatus
organizations
```

Recommended migration name:

```text
add_platform_organizations
```

It must not introduce Organizations-owned versions of:

```text
organization_memberships
roles
permissions
```

---

# Tenancy Foundation Migration Sequence

The broader tenancy foundation requires:

```text
Identity
    ↓
Organizations
    ↓
Roles
    ↓
Memberships
    ↓
Permissions
```

The exact implementation order between Roles and Memberships must be confirmed by their specifications.

Critical rule:

```text
Do not introduce a temporary nullable role system merely to make Memberships compile.
```

If active Memberships require a valid Role, their schema should wait until the Roles contract is defined.

---

# Shared Prisma Schema

The current project uses a shared:

```text
prisma/schema.prisma
```

Therefore models owned by different Core modules and Domains physically coexist in one Prisma schema.

This does not mean they share architectural ownership.

Example:

```text
prisma/schema.prisma

Organization
OrganizationMembership
Role
Track
Playlist
```

may eventually coexist physically.

Architecturally they remain owned by different modules and Domains.

---

# Supabase Migration Additions

Prisma cannot express every PostgreSQL or Supabase feature.

Reviewed migration SQL may eventually add:

- RLS enablement
- RLS policies
- PostgreSQL grants
- CHECK constraints
- Specialized indexes
- Security-related SQL

Raw SQL must remain inside reviewed migration history.

Do not manually mutate production schema outside the deployment process.

---

# Prisma Validation Workflow

After changing Organization persistence:

```bash
npx prisma format
npx prisma validate
npx prisma generate
```

Then:

```bash
npm run typecheck
npm run lint
```

Migration SQL must be reviewed before completion.

---

# Migration Review Checklist

Review:

- UUID types
- Table name
- Column names
- Defaults
- Enum creation
- Unique slug constraint
- Status index
- Timestamp types
- Nullable fields
- Referential changes
- Destructive SQL
- Existing data impact

A successful Prisma command does not replace architectural review.

---

# Seed Strategy

Organizations itself requires no mandatory seed data for its initial persistence model.

Do not seed:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

from the Organizations module.

Default Role persistence belongs to the Roles module.

This prevents Organizations from becoming the accidental owner of authorization data.

---

# Existing User Migration

Existing authenticated Profiles may have no Organization.

That is valid.

Do not automatically create Organizations during migration.

Do not automatically assign tenant ownership.

Expected state:

```text
Existing Profile
      ↓
No Membership
      ↓
No Organization
```

Onboarding may later allow the user to create or join an Organization explicitly.

---

# Existing Domain Data

Introducing Organizations does not automatically assign existing Domain data to tenants.

If existing Domain entities later become tenant-owned, that requires a separate migration strategy.

Do not populate:

```text
organizationId
```

using assumptions.

Tenant ownership must reflect actual product requirements.

---

# Organization Creation Transaction

Final Organization onboarding requires an atomic transaction spanning Organizations and Memberships.

Conceptually:

```text
BEGIN

Create Organization

Resolve OWNER Role

Create OWNER Membership

COMMIT
```

If:

```text
Membership creation fails
```

then:

```text
Organization creation must roll back
```

The exact transaction implementation belongs to the cross-module application workflow.

---

# Transaction Boundary

Only database work belongs inside the transaction.

Do not perform:

- Email
- External HTTP requests
- AI calls
- File uploads
- Notification delivery
- Payment-provider calls

inside the Organization creation transaction.

External effects should occur after successful persistence.

---

# Ownership Transfer

Ownership transfer cannot be implemented by Organizations persistence alone.

It requires:

```text
Memberships
Roles
```

Organizations may expose an application-level operation such as:

```text
transferOrganizationOwnership()
```

but the persistence updates belong to the owning modules.

No temporary ownership column should be introduced.

---

# Organization Deletion

Permanent deletion must remain deferred until cross-module referential behavior is known.

Before enabling it, review:

```text
Memberships
Roles
Settings
Billing
Audit
Domain data
Storage
Backups
Retention requirements
```

Archive remains the safe default lifecycle operation.

---

# Caching

Organization data may eventually be cached.

Cache keys involving tenant data must include Organization identity where appropriate.

Example concept:

```text
organization:{organizationId}:...
```

Caching must not allow data to leak between tenants.

Cache design belongs to the platform caching architecture.

---

# Logging

Organization persistence errors may be logged.

Logs must not expose:

- Database credentials
- Authentication tokens
- Service-role secrets
- Sensitive tenant data unnecessarily

Use stable Organization identifiers for diagnostics where appropriate.

---

# Error Mapping

Prisma errors should not leak directly to the UI.

Persistence errors should be mapped to stable application errors.

Examples:

```text
ORGANIZATION_NOT_FOUND
ORGANIZATION_SLUG_CONFLICT
INVALID_ORGANIZATION_STATE
PERSISTENCE_ERROR
```

Authorization errors belong to the application/service layer.

---

# Testing Requirements

Organizations persistence should test:

```text
Organization creation persistence
UUID generation
Slug uniqueness
Organization lookup
Status transitions
Archive behavior
Restore behavior
archivedAt consistency
Persistence behavior
Transaction rollback where applicable
```

---

# Cross-Module Testing

Once Memberships and Roles exist, integration tests must cover:

```text
Organization creation + OWNER Membership

Organization cannot become operational without required ownership

Ownership transfer

Multiple Organization memberships

Tenant access isolation

Cross-Organization access denial
```

These are tenancy tests, not Organizations persistence tests alone.

---

# RLS Testing

Once Membership-based RLS is implemented, tests should verify:

```text
User can access authorized Organization

User cannot access unrelated Organization

Suspended Membership cannot grant access

Removed Membership cannot grant access

Cross-tenant queries fail

Administrative access remains isolated
```

RLS tests must use realistic PostgreSQL/Supabase behavior.

---

# Performance Testing

Initial Organizations persistence is small.

Premature optimization is unnecessary.

Performance review should focus later on:

- Organization lookup by slug
- User Organization listing
- Membership joins
- Tenant-scoped Domain queries

Index changes should follow measured query behavior.

---

# Prisma Validation Checklist

Before the Organizations schema change is considered ready:

```text
[ ] OrganizationStatus defined
[ ] Organization model defined
[ ] UUID strategy preserved
[ ] No duplicate User model
[ ] No OrganizationMembership ownership leak
[ ] No Role ownership leak
[ ] No Permission ownership leak
[ ] Slug unique
[ ] Timestamp mapping reviewed
[ ] archivedAt behavior reviewed
[ ] Referential implications reviewed
[ ] Prisma format passes
[ ] Prisma validate passes
[ ] Prisma generate passes
[ ] Generated migration reviewed
```

---

# Architectural Validation Checklist

Verify:

```text
[ ] Organizations owns only Organization persistence
[ ] Memberships ownership remains external
[ ] Roles ownership remains external
[ ] Permissions ownership remains external
[ ] Identity remains Supabase Auth + Profile
[ ] No ownerUserId is introduced
[ ] No temporary role implementation exists
[ ] No temporary membership implementation exists
[ ] Tenant boundary remains Organization
[ ] Cross-module orchestration is explicit
```

---

# Deferred Decisions

The following decisions remain intentionally deferred:

```text
MembershipStatus persistence
OrganizationMembership model
OrganizationInvitation model
Role model
Role seeding
Permission model
OrganizationSettings model
Billing relationship
Audit persistence
Final Organization RLS policies
Ownership database enforcement mechanism
Permanent Organization deletion
Active Organization context persistence
```

These decisions belong to their owning modules or future approved architecture work.

---

# Implementation Dependencies

Organizations persistence depends on:

```text
Prisma
PostgreSQL
Existing Profile identity
```

Complete tenancy behavior additionally depends on:

```text
Memberships
Roles
```

Full authorization additionally depends on:

```text
Permissions
```

This distinction must remain explicit in tasks and readiness documentation.

---

# Implementation Readiness

The Organizations persistence layer may begin implementation when:

- Organization model is approved.
- OrganizationStatus is approved.
- UUID strategy is confirmed.
- Migration strategy is approved.
- Existing Identity integration is confirmed.
- Organizations ownership boundary is approved.

However:

```text
complete tenant onboarding
```

is not ready until Memberships and Roles contracts exist.

---

# Definition of Ready

Organizations Prisma implementation is ready when:

- Organization is confirmed as Organizations-owned persistence.
- OrganizationMembership is confirmed as Memberships-owned persistence.
- Role is confirmed as Roles-owned persistence.
- Permission is confirmed as Permissions-owned persistence.
- Identifier strategy matches the active schema.
- Existing Identity architecture is reused.
- Organization lifecycle is approved.
- Slug uniqueness strategy is approved.
- Migration scope is approved.
- RLS dependency on Memberships is understood.
- Ownership invariant is understood as cross-module behavior.

---

# Definition of Done

Organizations persistence is complete when:

- OrganizationStatus is implemented.
- Organization model is implemented.
- Migration is reviewed.
- Prisma schema formats successfully.
- Prisma schema validates successfully.
- Prisma Client generates successfully.
- UUID conventions match the active schema.
- Slug uniqueness is enforced.
- Prisma runtime access exists.
- Lifecycle persistence works.
- Archive and restore behavior work.
- Relevant persistence tests pass.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.
- No Memberships, Roles or Permissions ownership has leaked into Organizations.

Full tenancy foundation is complete only when Memberships and Roles are implemented and integrated.

---

# Final Principle

Organizations owns Organization persistence.

Memberships owns belonging.

Roles owns role definitions.

Permissions owns authorization capabilities.

Prisma may physically connect these entities in one schema, but architectural ownership must remain explicit.

Never create temporary duplicate models merely to bypass a dependency.