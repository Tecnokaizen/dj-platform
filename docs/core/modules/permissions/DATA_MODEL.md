---
title: Permissions Data Model
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-09
related:
  - SPEC.md
  - FLOWS.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../roles/DATA_MODEL.md
  - ../roles/PRISMA.md
  - ../memberships/DATA_MODEL.md
  - ../memberships/PRISMA.md
  - ../../../architecture/TENANCY.md
  - ../../../architecture/DATA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
  - ../../../architecture/SECURITY.md
---

# Permissions Data Model

## Purpose

This document defines the data model owned by the Platform Core Permissions module.

Permissions persists two primary authorization concepts:

```text
Permission

RolePermission
```

A Permission represents a capability.

A RolePermission represents an explicit grant of that capability to a Role.

Conceptually:

```text
Role
        ↓
RolePermission
        ↓
Permission
```

Combined with tenancy:

```text
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

---

# Architectural Ownership

The relevant ownership model is:

```text
Identity
└── Profile

Organizations
└── Organization

Memberships
├── OrganizationMembership
└── OrganizationInvitation

Roles
└── Role

Permissions
├── Permission
└── RolePermission
```

Permissions owns:

```text
Permission

RolePermission

Permission catalog

Permission key semantics

Role-to-Permission grant persistence

effective Permission resolution
```

Permissions does not own:

```text
Profile

Organization

OrganizationMembership

Role definition

Membership Role assignment

Organization ownership invariant

Domain business entities
```

Physical foreign-key relations do not transfer architectural ownership.

---

# Core Data Model

Initial authorization persistence:

```text
Role
 │
 │ 1
 │
 ▼
RolePermission
 │
 │ *
 ▼
Permission
```

More precisely:

```text
Role
1 ──────── * RolePermission * ──────── 1 Permission
```

This represents a many-to-many relationship between:

```text
Role

Permission
```

through an explicit mapping entity.

---

# Primary Entities

Permissions Foundation introduces:

```text
Permission

RolePermission
```

No additional authorization entity is required initially.

---

# Permission

A Permission represents one canonical capability that application code may protect.

Examples:

```text
organizations.update

memberships.remove

invitations.create
```

A Permission does not itself grant authority.

Authority exists when the Permission is mapped to the Role belonging to an ACTIVE Membership in the relevant tenant context.

---

# Permission Fields

Recommended initial fields:

```text
id

key

name

description

createdAt

updatedAt
```

Keep Permission persistence explicit and minimal.

Do not add speculative authorization metadata without a validated requirement.

---

# Permission id

Persistence identifier.

Strategy:

```text
UUID
```

Conceptually:

```prisma
id String @id @default(uuid()) @db.Uuid
```

The UUID is the database identity.

It is not the semantic authorization identifier used throughout application code.

---

# Permission key

Stable semantic capability identifier.

Examples:

```text
organizations.read

organizations.update

organizations.transfer_ownership

memberships.read

memberships.change_role
```

Required properties:

```text
unique

lowercase

stable

human-reviewable

namespaced
```

---

# Permission Key Uniqueness

Required database invariant:

```text
UNIQUE(key)
```

There must never be two Permission records representing the same semantic capability.

Invalid:

```text
Permission A
key = memberships.read

Permission B
key = memberships.read
```

---

# Permission Key Is Not Primary Key

Do not use:

```text
Permission.key
```

as the database primary key.

Correct:

```text
Permission.id
→ UUID persistence identity

Permission.key
→ semantic application identity
```

This allows persistence concerns to remain separate from capability naming.

---

# Permission Key Format

Initial format:

```text
<namespace>.<capability>
```

Examples:

```text
organizations.read

organizations.update

memberships.read

memberships.remove

invitations.create
```

Domain capabilities may later use:

```text
<domain>.<resource>.<capability>
```

Examples:

```text
dj.playlists.create

copy.orders.update

seo.projects.manage
```

---

# Permission Key Case

Canonical Permission keys are lowercase.

Do not create semantic duplicates such as:

```text
Memberships.Read

MEMBERSHIPS_READ

memberships.Read
```

when the canonical key is:

```text
memberships.read
```

---

# Permission Key Character Policy

Initial recommended character set:

```text
a-z

0-9

underscore

dot
```

Conceptual pattern:

```text
^[a-z0-9_]+(\.[a-z0-9_]+)+$
```

The exact validation implementation belongs to API/schema design.

---

# Permission Key Stability

Permission keys form part of the authorization contract.

Changing:

```text
memberships.change_role
```

to:

```text
members.change_role
```

is a migration.

It may affect:

```text
application guards

RolePermission policy

tests

Domain integration

documentation

cached authorization state
```

Do not rename Permission keys casually.

---

# Permission name

Human-readable label.

Example:

```text
Manage member roles
```

This is presentation metadata.

It does not participate in authorization decisions.

---

# Permission description

Optional human-readable description of the capability.

Example:

```text
Allows changing the Role assigned to an Organization Membership.
```

The description supports:

```text
documentation

administrative interfaces

security review

debugging
```

It is not executable authorization logic.

---

# Permission createdAt

Timestamp when the Permission record was first persisted.

Canonical Permissions are reference data.

This timestamp is not an authorization decision timestamp.

---

# Permission updatedAt

Timestamp for metadata/persistence updates.

Changing:

```text
name

description
```

may update this value.

Changing:

```text
key
```

requires an explicit migration rather than a casual metadata update.

---

# No Permission Status Initially

Do not add:

```text
ACTIVE

DISABLED

ARCHIVED
```

status to Permission during Foundation.

Canonical Permission lifecycle is deployment-controlled.

Removing or deprecating a capability requires an explicit migration and policy review.

---

# No Permission organizationId

Initial Permission definitions are global.

Do not add:

```text
Permission.organizationId
```

The capability:

```text
memberships.remove
```

has one canonical definition.

Tenant scope comes from:

```text
OrganizationMembership
```

not from duplicating Permission definitions per Organization.

---

# No Permission roleId

Do not place:

```text
roleId
```

directly on Permission.

A Permission may belong to many Roles.

The relationship is represented by:

```text
RolePermission
```

---

# No Permission Effect

Do not add:

```text
effect = ALLOW

effect = DENY
```

to Permission.

Permission defines a capability.

RolePermission defines a positive grant.

Absence of a mapping means denial.

---

# No Permission Hierarchy

Do not add:

```text
parentId

implies

children

inherits
```

to Permission.

Initial authorization is explicit.

---

# No Permission Wildcard Record

Do not create Permission records such as:

```text
*

memberships.*

organizations.*
```

Initial authorization uses explicit capability keys.

---

# No Generic Permission Metadata

Do not add:

```text
metadata Json
```

as a container for future authorization concepts.

Security-relevant fields should be modeled explicitly.

---

# Permission Catalog

Canonical Permissions are reference data controlled by source code.

Conceptually:

```text
Version-Controlled Permission Registry
        ↓
Synchronization
        ↓
Permission table
```

The database is the runtime persistence representation.

Application source defines the intended canonical catalog.

---

# Permission Registry Metadata

A source-level registry may contain:

```text
key

name

description

owner
```

The `owner` value may help documentation and policy review.

It does not need to become a persisted Permission column during Foundation.

---

# Capability Owner

A Permission can describe an operation owned by another Core module.

Example:

```text
Permission
memberships.suspend
```

Semantic ownership:

```text
Memberships
→ owns suspendMembership behavior

Permissions
→ owns authorization representation and evaluation
```

The data model must preserve this distinction.

---

# RolePermission

RolePermission represents one explicit authorization grant.

Conceptually:

```text
Role X
has
Permission Y
```

Example:

```text
ADMIN
        ↓
RolePermission
        ↓
memberships.read
```

---

# RolePermission Fields

Recommended initial fields:

```text
id

roleId

permissionId

createdAt
```

No additional policy attributes are required initially.

---

# RolePermission id

Persistence identifier.

Recommended:

```text
UUID
```

Conceptually:

```prisma
id String @id @default(uuid()) @db.Uuid
```

Although the semantic relationship is uniquely defined by:

```text
roleId + permissionId
```

a UUID identifier keeps persisted Core entities consistent and gives the mapping a stable identity for future diagnostics or audit correlation.

---

# roleId

References:

```text
Role.id
```

Required.

Conceptually:

```text
RolePermission.roleId
        ↓
Role.id
```

Roles owns the Role definition.

Permissions owns the grant relationship.

---

# permissionId

References:

```text
Permission.id
```

Required.

Conceptually:

```text
RolePermission.permissionId
        ↓
Permission.id
```

---

# RolePermission createdAt

Timestamp when the explicit grant was persisted.

It represents current mapping creation metadata.

It is not a complete policy-change history.

Historical policy change events belong to Audit.

---

# No RolePermission updatedAt Initially

A RolePermission has no mutable authorization payload during Foundation.

It either exists:

```text
grant present
```

or does not:

```text
grant absent
```

Therefore an `updatedAt` field provides little value initially.

If mutable mapping attributes are introduced later, this can be reconsidered.

---

# RolePermission Uniqueness

Required invariant:

```text
one grant
per
Role + Permission
```

Conceptually:

```text
UNIQUE (
  roleId,
  permissionId
)
```

Invalid:

```text
ADMIN + memberships.read
ADMIN + memberships.read
```

as two separate mappings.

---

# Positive Grant Semantics

RolePermission existence means:

```text
ALLOW
```

RolePermission absence means:

```text
DENY
```

Initial model contains no negative grant rows.

---

# No effect Column

Do not add:

```text
effect
```

with values such as:

```text
ALLOW

DENY
```

Initial architecture has only explicit positive mappings.

---

# No RolePermission organizationId

Do not add:

```text
RolePermission.organizationId
```

during Foundation.

Initial:

```text
Roles
```

are global canonical definitions.

Initial:

```text
Permissions
```

are global canonical definitions.

Therefore:

```text
RolePermission
```

is also global policy.

Tenant scope comes from Membership.

---

# No Membership ID on RolePermission

Do not add:

```text
membershipId
```

to RolePermission.

That would create per-Membership Permission overrides.

Initial authorization remains:

```text
Membership
→ Role
→ RolePermission
→ Permission
```

---

# No Priority

Do not add:

```text
priority

weight

rank

precedence
```

to RolePermission.

There is no initial grant conflict system.

---

# No Inheritance Metadata

Do not add:

```text
inheritedFromRoleId

inherited Boolean
```

because initial Roles do not inherit Permissions.

Every mapping is explicit.

---

# RolePermission Referential Model

Required:

```text
RolePermission.roleId
        ↓
Role.id
```

and:

```text
RolePermission.permissionId
        ↓
Permission.id
```

Both relations are required.

---

# Role Referential Principle

A Role with active RolePermission mappings must not be casually hard deleted.

Preferred persistence principle:

```text
Role deletion
→ restricted while mappings exist
```

Roles already treats canonical system Roles as durable reference data.

---

# Permission Referential Principle

A Permission referenced by RolePermission must not be casually hard deleted.

Preferred:

```text
Permission deletion
→ restricted while mappings exist
```

Capability removal requires deliberate policy migration.

---

# No Cascading Authorization Deletion

Do not casually configure:

```text
delete Permission
→ silently delete all RolePermission grants
```

or:

```text
delete Role
→ silently delete authorization policy
```

through destructive cascading.

Authorization-policy removal must be explicit.

---

# Permission Catalog Foundation

The initial Platform Core tenancy Permission catalog should use a minimal explicit set.

Canonical Foundation proposal:

```text
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
```

These keys protect the Core tenant-administration capabilities already defined by Organizations and Memberships.

---

# Canonical Invitation Permission Naming

The canonical Foundation model uses:

```text
invitations.create
```

for creating an Organization invitation.

Do not create a duplicate semantic Permission such as:

```text
memberships.invite
```

for the same operation.

One protected operation should have one canonical Permission identity.

---

# Why Invitations Have Their Own Namespace

OrganizationInvitation is owned by Memberships, but it is a distinct persisted entity and lifecycle.

Using:

```text
invitations.*
```

keeps capabilities explicit:

```text
invitations.read

invitations.create

invitations.revoke

invitations.resend
```

Memberships still owns the underlying invitation behavior.

---

# organizations.read

Represents ability to access normal Organization information where the tenant context already exists.

It does not itself establish Membership.

---

# organizations.update

Represents ability to update approved Organization settings or metadata.

Organizations still validates:

```text
Organization state

input

lifecycle rules

business invariants
```

---

# organizations.transfer_ownership

Represents authorization to request the dedicated ownership transfer operation.

It does not bypass:

```text
current OWNER validation

target Membership validation

same-Organization requirement

exactly-one-OWNER invariant

transaction requirements
```

---

# memberships.read

Represents access to tenant Membership administration/read views.

It does not provide access to unrelated Organizations.

---

# memberships.suspend

Represents authorization to request Membership suspension.

Memberships still validates:

```text
current status

OWNER safety

same tenant

target Membership
```

---

# memberships.restore

Represents authorization to request restoration of a SUSPENDED Membership.

It does not bypass Membership lifecycle rules.

---

# memberships.remove

Represents authorization to request Membership removal.

It does not allow removal of the sole OWNER.

---

# memberships.change_role

Represents authorization to request a Membership Role change.

It does not permit:

```text
invalid Role

cross-Organization mutation

unauthorized OWNER promotion

unauthorized OWNER demotion
```

---

# invitations.read

Represents access to Organization Invitation administrative information.

It must not expose:

```text
raw invitation token

tokenHash
```

---

# invitations.create

Represents authorization to request Organization invitation creation.

It does not allow normal invitation of:

```text
OWNER
```

because ownership transfer uses a dedicated workflow.

---

# invitations.revoke

Represents authorization to revoke a valid PENDING invitation.

It does not remove an already established Membership.

---

# invitations.resend

Represents authorization to request secure Invitation resend/token rotation.

It does not bypass Invitation lifecycle or expiration rules.

---

# Initial Core Role Policy

Initial system Roles:

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

must receive explicit Permission mappings.

No policy may be derived from Role name or sort order.

---

# Foundation RolePermission Policy

A conservative initial Platform Core tenancy policy is:

| Permission | OWNER | ADMIN | MANAGER | MEMBER | VIEWER |
|---|---:|---:|---:|---:|---:|
| organizations.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| organizations.update | ✓ | ✓ |  |  |  |
| organizations.transfer_ownership | ✓ |  |  |  |  |
| memberships.read | ✓ | ✓ | ✓ |  |  |
| memberships.suspend | ✓ | ✓ |  |  |  |
| memberships.restore | ✓ | ✓ |  |  |  |
| memberships.remove | ✓ | ✓ |  |  |  |
| memberships.change_role | ✓ | ✓ |  |  |  |
| invitations.read | ✓ | ✓ |  |  |  |
| invitations.create | ✓ | ✓ |  |  |  |
| invitations.revoke | ✓ | ✓ |  |  |  |
| invitations.resend | ✓ | ✓ |  |  |  |

This table is explicit authorization policy.

It is not generated from a hierarchy.

---

# OWNER Policy

OWNER receives every currently approved Platform Core tenancy Permission in the Foundation catalog.

Important:

```text
this does not mean OWNER automatically receives every future Permission
```

When a new capability is added:

```text
new Permission
        ↓
policy review
        ↓
explicit RolePermission mapping
```

No wildcard grant exists.

---

# ADMIN Policy

ADMIN receives broad Organization and Membership administration.

ADMIN does not receive:

```text
organizations.transfer_ownership
```

in the initial Foundation policy.

Ownership remains a protected OWNER-specific capability.

---

# MANAGER Policy

Initial conservative MANAGER policy grants:

```text
organizations.read

memberships.read
```

This allows management visibility without automatically granting security-sensitive Membership mutation.

Domain-specific operational management Permissions may be added by the relevant Domain.

---

# MEMBER Policy

Initial Core tenancy policy grants MEMBER:

```text
organizations.read
```

Domain-specific operational capabilities are added separately through Domain Permission integration.

---

# VIEWER Policy

Initial Core tenancy policy grants VIEWER:

```text
organizations.read
```

No mutation capability is implied.

Read access to Domain data requires explicit Domain Permissions where needed.

---

# MEMBER and VIEWER May Differ in Domains

Their Core tenancy policy can initially be similar.

Business Domains may later define differences such as:

```text
copy.orders.create

dj.playlists.create

seo.projects.update
```

without changing Platform Core tenant administration policy.

---

# No Role Inheritance in Policy

The matrix must not be interpreted as:

```text
OWNER inherits ADMIN

ADMIN inherits MANAGER

MANAGER inherits MEMBER

MEMBER inherits VIEWER
```

Each check resolves actual persisted RolePermission mappings.

---

# No Automatic OWNER Expansion

Do not implement:

```text
for every Permission:
  grant to OWNER
```

during runtime or synchronization.

The approved policy registry must explicitly enumerate OWNER grants.

This prevents newly introduced sensitive capabilities from being silently enabled.

---

# Permission Registry

Canonical Permission source definition should conceptually resemble:

```text
Permission Definition
├── key
├── name
├── description
└── owner
```

Example:

```text
key
→ memberships.remove

name
→ Remove members

description
→ Allows requesting removal of a Membership from an Organization.

owner
→ Memberships
```

`owner` can initially remain source-level metadata rather than persisted database state.

---

# System Role Policy Registry

The source-controlled RolePermission policy should conceptually map:

```text
Role.key
        ↓
Permission.key[]
```

Example:

```text
OWNER
→ [
    organizations.read,
    organizations.update,
    organizations.transfer_ownership,
    ...
  ]
```

No UUID should appear in the canonical policy declaration.

---

# Runtime Resolution

Synchronization resolves:

```text
Role.key
→ Role.id
```

and:

```text
Permission.key
→ Permission.id
```

then persists:

```text
RolePermission
```

---

# No Hard-Coded Role UUID

Do not declare:

```text
OWNER_ROLE_ID = "..."
```

inside Permission policy.

Role UUIDs may differ between environments.

Use:

```text
Role.key
```

for semantic resolution.

---

# No Hard-Coded Permission UUID

Do not declare:

```text
MEMBERSHIPS_REMOVE_PERMISSION_ID = "..."
```

in application authorization policy.

Use:

```text
memberships.remove
```

as the semantic identifier.

---

# Permission Catalog Synchronization

Permission synchronization is idempotent by:

```text
Permission.key
```

Conceptually:

```text
Declared Permission
        ↓
Find by key
        ↓
Exists?
        ├── NO → create UUID Permission
        └── YES → reconcile approved metadata
```

Repeated execution must not create semantic duplicates.

---

# Permission Metadata Synchronization

Safe idempotent updates may include:

```text
name

description
```

The key is not silently rewritten.

---

# Unknown Persisted Permission

If persistence contains a Permission not present in the current canonical registry:

```text
do not automatically hard-delete it
```

Authorization reference-data removal is security-sensitive.

Preferred behavior:

```text
detect

report

migrate/deprecate explicitly
```

---

# RolePermission Synchronization

System policy synchronization resolves:

```text
Role key

Permission key
```

then ensures each approved:

```text
Role + Permission
```

mapping exists.

---

# Missing Canonical Role

If policy expects:

```text
ADMIN
```

but the Role cannot be resolved:

```text
FAIL SAFELY
```

Permissions must not create a replacement Role.

Roles owns Role catalog persistence.

---

# Missing Canonical Permission

If Role policy references:

```text
memberships.remove
```

but Permission synchronization cannot resolve it:

```text
FAIL SAFELY
```

Do not create an incomplete policy mapping.

---

# Unexpected RolePermission Mapping

An unexpected mapping can represent unauthorized policy expansion.

Example:

```text
VIEWER
→ memberships.remove
```

when the canonical policy does not grant it.

This must be detected.

---

# Reconciliation of Unexpected Mappings

Initial safe rule:

```text
validation reports unexpected mappings
```

Do not silently ignore them.

Removal should happen through an explicit approved policy synchronization/migration behavior.

Security-sensitive destructive reconciliation must be deliberate.

---

# Exact Policy Verification

After synchronization, validation should be able to compare:

```text
declared canonical policy
```

with:

```text
persisted RolePermission policy
```

and detect:

```text
missing grants

unexpected grants

unknown Roles

unknown Permissions
```

---

# Permission Drift

Examples:

```text
Permission exists in code but not DB

Permission exists in DB but not registry

expected RolePermission missing

unexpected RolePermission exists

policy references missing Role
```

Drift must not be silently converted into authorization.

---

# Deny by Default

The data model implements:

```text
Mapping exists
→ granted

Mapping absent
→ denied
```

No Permission is inferred through Role naming, hierarchy or namespace.

---

# Unknown Permission

An unknown Permission key must not be considered granted.

Conceptually:

```text
Permission key not found
        ↓
DENY
```

If the Permission was expected to be canonical, the system may additionally report catalog integrity failure.

---

# OWNER Does Not Bypass RolePermission

Even when:

```text
Role.key = OWNER
```

authorization remains:

```text
Role
        ↓
RolePermission
        ↓
Permission
```

Do not short-circuit with:

```text
if OWNER:
  return true
```

---

# Tenant Scope

RolePermission is global policy.

Tenant authority is created only when that Role is attached to a valid Membership.

Example:

```text
Profile A
        ↓
ACTIVE Membership
Organization A
        ↓
ADMIN
        ↓
memberships.remove
```

This does not grant authority in:

```text
Organization B
```

unless Profile A has another valid Membership there.

---

# Permission Scope Is Contextual

Permission persistence does not store:

```text
organizationId
```

but Permission evaluation requires the target tenant context.

Correct:

```text
Organization A Membership
+
Role
+
Permission
```

Incorrect:

```text
Profile has ADMIN somewhere
→ globally authorized
```

---

# Membership State

RolePermission persistence does not know Membership state.

Permission evaluation must consume tenancy context that establishes:

```text
Membership = ACTIVE
```

SUSPENDED and REMOVED Memberships must not authorize.

---

# Organization State

RolePermission persistence does not encode Organization lifecycle.

Tenancy context must ensure the Organization itself permits access.

---

# Role Validity

A RolePermission foreign key ensures the referenced Role exists.

If Role resolution fails at runtime:

```text
deny / fail safely
```

There is no fallback Role.

---

# Permission Evaluation Data

A typical effective authorization query needs:

```text
roleId

permissionKey
```

or a previously resolved Permission set.

Conceptually:

```text
Role.id
        ↓
RolePermission
        ↓
Permission.key
```

---

# Effective Permission Set

For a Role:

```text
RolePermission
        ↓
Permission[]
```

produces its explicit effective Permission set.

There is no:

```text
inherited Permission set
```

to merge.

---

# Effective Permission Set Uniqueness

Because RolePermission enforces:

```text
UNIQUE(roleId, permissionId)
```

the effective Permission set cannot contain duplicate grants for the same capability.

---

# Permission DTO Boundary

Normal application representation may contain:

```text
id

key

name

description
```

Persistence timestamps may be included where needed.

---

# RolePermission DTO Boundary

Most consumers do not need RolePermission row identities.

Typical consumers need:

```text
Permission keys for Role
```

rather than:

```text
RolePermission.id
```

Do not expose mapping internals unnecessarily.

---

# Authorization UI

A future platform administration UI may need to display:

```text
Role

Permission catalog

current grants
```

The persisted model supports this.

Foundation does not provide tenant-editable RolePermission mutation.

---

# System Policy Is Not Tenant Configuration

Initial RolePermission policy is:

```text
platform-controlled
```

not:

```text
Organization-configurable
```

Tenant users cannot modify the grant matrix.

---

# No Organization Override

Do not add:

```text
OrganizationPermission

OrganizationRolePermission

RolePermission.organizationId
```

to Foundation.

---

# No Membership Override

Do not add:

```text
MembershipPermission

MembershipPermissionOverride
```

or fields such as:

```text
extraPermissions

deniedPermissions

permissionsJson
```

to OrganizationMembership.

---

# No Profile Override

Do not add:

```text
ProfilePermission

Profile.permissions
```

for tenant authorization.

---

# No Domain Authorization Columns in Core Mapping

Do not add fields such as:

```text
djAccess

copyDepartment

seoProjectScope
```

to RolePermission.

Domain capability semantics remain with Domains.

---

# Domain Permission Registration

Future Domains may contribute canonical Permission definitions.

Conceptually:

```text
DJ Domain
        ↓
Permission Registry
        ↓
dj.playlists.create
```

Permissions owns persistence of the capability.

DJ Domain owns the business operation.

---

# Domain Default Grants

A Domain may define an approved default mapping from system Roles to its Domain Permissions.

Example:

```text
MEMBER
→ dj.playlists.create
```

if that product requires it.

Such policy must be explicit and version-controlled.

---

# Domain Grant Isolation

Adding:

```text
dj.playlists.create
```

must not automatically grant:

```text
copy.orders.update
```

Namespaces do not imply authorization inheritance.

---

# No Wildcard Domain Grant

Do not map:

```text
ADMIN
→ dj.*
```

during Foundation.

Every Domain capability is explicit.

---

# Permission Granularity

Permission keys should represent meaningful authorization boundaries.

Good:

```text
memberships.change_role
```

Potentially excessive without a validated need:

```text
memberships.change_role_to_manager
```

Avoid field-level or UI-control-level Permission explosion.

---

# No UI Permission Keys

Do not define capabilities such as:

```text
show_invite_button

see_admin_tab
```

The UI derives presentation from real capabilities.

---

# No Technical Transport Permissions

Do not define:

```text
call_api

execute_server_action

use_prisma
```

Permissions represent application capabilities.

---

# Permission and Resource State

The Permission model does not encode resource business state.

Example:

```text
copy.orders.update
```

does not determine whether:

```text
Order is already completed
```

The owning Domain enforces that rule.

---

# Permission and Resource Ownership

Permissions does not model:

```text
resource.ownerId == Profile.id
```

conditions.

That belongs to the owning service or future approved attribute-based authorization architecture.

---

# RBAC Foundation

Initial data model is pure explicit RBAC:

```text
Membership
→ Role
→ RolePermission
→ Permission
```

It does not implement:

```text
ABAC

ACL per resource

policy DSL

deny precedence

attribute conditions

time conditions

location conditions
```

---

# Permission vs Feature Flag

Permission is not feature availability.

Do not store:

```text
featureEnabled
```

on Permission.

A future operation may require:

```text
feature/entitlement available
+
Permission granted
```

Those are separate systems.

---

# Permission vs Subscription

RolePermission does not store:

```text
plan

subscription

seat

billing status
```

Billing/Entitlements owns those concerns.

---

# Permission vs RLS

Permission persistence supports operation-level authorization.

Membership-based RLS primarily protects:

```text
tenant row isolation
```

Do not duplicate the entire Permission model into separate ad hoc RLS tables.

---

# Future Permission-Aware RLS

If direct database writes later require Permission-aware RLS, PostgreSQL may need access to:

```text
Membership

Role

RolePermission

Permission
```

through carefully designed helper functions/policies.

That is a later Security/Permissions integration.

It does not require a second authorization data model.

---

# Referential Model

Final Foundation relationships:

```text
Role
        │
        ▼
RolePermission
        │
        ▼
Permission
```

With tenancy:

```text
Profile
        ↓
OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

---

# Inverse Prisma Relations

The shared Prisma schema may physically require:

```text
Role
→ permissionMappings RolePermission[]
```

and:

```text
Permission
→ roleMappings RolePermission[]
```

These inverse fields do not transfer ownership.

Roles still owns Role.

Permissions owns RolePermission and Permission.

---

# Permission Table Naming

Recommended PostgreSQL table:

```text
permissions
```

---

# RolePermission Table Naming

Recommended PostgreSQL table:

```text
role_permissions
```

---

# Permission Indexes

Required:

```text
UNIQUE(key)
```

This already provides the primary semantic lookup index.

No additional key index is required.

---

# RolePermission Indexes

Required:

```text
UNIQUE(roleId, permissionId)
```

Recommended additional index:

```text
permissionId
```

The unique composite index already supports efficient Role-first lookup because `roleId` is the first component.

The separate `permissionId` index supports reverse lookup:

```text
Which Roles hold this Permission?
```

---

# No Excessive Indexing

Do not add indexes for:

```text
Permission.name

Permission.description

RolePermission.createdAt
```

without real query requirements.

---

# Referential Delete Strategy

Initial conservative policy:

```text
Role
→ Restrict while RolePermission exists

Permission
→ Restrict while RolePermission exists
```

Do not use broad destructive cascade as authorization lifecycle.

---

# Removing a Permission

Controlled removal sequence:

```text
Remove application checks / capability use
        ↓
Update canonical Role policy
        ↓
Remove RolePermission mappings deliberately
        ↓
Migrate/deprecate Permission
        ↓
Update tests
        ↓
Update documentation
```

No casual runtime hard-delete API is required.

---

# Removing a RolePermission Grant

Removing a mapping immediately reduces authorization.

This is a security-relevant policy change.

The canonical source policy and persistence must remain synchronized.

---

# Adding a RolePermission Grant

Adding a mapping expands authorization.

Required review should consider:

```text
which Role receives it

which tenant operation becomes available

whether capability is ownership-sensitive

whether Domain invariants remain protected
```

---

# Audit Boundary

Permission and RolePermission rows represent current authorization policy.

They are not a complete history.

Future Audit may record:

```text
permission.created

permission.updated

role_permission.granted

role_permission.revoked
```

Do not turn Permission into an event log.

---

# No Audit Payload on RolePermission

Do not add:

```text
changedBy

changeReason

auditJson
```

to RolePermission solely to replace Audit architecture.

If policy changes are runtime-editable later, Audit can correlate the event.

---

# Seed Requirements

Permissions Foundation requires canonical seed/synchronization data.

Unlike Memberships:

```text
Permissions
```

are reference data.

Therefore seed/sync is expected.

---

# Permission Seed Identity

Seed by:

```text
key
```

not UUID.

Correct:

```text
find / upsert Permission where key = memberships.read
```

Incorrect:

```text
assume fixed Permission UUID across environments
```

---

# RolePermission Seed Identity

Resolve:

```text
Role.key

Permission.key
```

then persist actual UUID relationships.

Do not encode environment-specific IDs in source policy.

---

# Seed Idempotency

Repeated synchronization must not create:

```text
duplicate Permissions

duplicate RolePermission grants
```

Database uniqueness provides final protection.

---

# Seed Transaction

Permission catalog and Role policy synchronization may use transactions where necessary to avoid partial authorization-policy state.

Exact synchronization transaction design belongs in FLOWS.md and PRISMA.md.

---

# Permission Catalog Integrity

The runtime database should be verifiable against the canonical source registry.

Required validations include:

```text
all expected Permission keys exist

Permission keys are unique

all expected RolePermission mappings exist

unexpected mappings are detected

referenced Roles exist
```

---

# No Runtime Permission Auto-Creation

Normal authorization checks must not mutate the catalog.

Invalid:

```text
hasPermission("memberships.read")
        ↓
Permission not found
        ↓
create Permission
```

Correct:

```text
Permission missing
        ↓
deny / configuration failure
```

---

# Authorization Cache Data

If effective Permission sets are cached, the canonical cacheable projection is conceptually:

```text
Role.id
→ Permission.key[]
```

or an equivalent trusted representation.

Cache is not persistence ownership.

---

# Cache Invalidation Sources

Effective Permission cache becomes stale when:

```text
RolePermission mapping changes

Permission catalog changes
```

Tenant authorization context also becomes stale when:

```text
Membership Role changes

Membership is suspended

Membership is removed

Organization becomes inaccessible
```

---

# No Permission Snapshot on Membership

Do not copy current effective Permissions into:

```text
OrganizationMembership
```

as a cached persistence field.

That would create authorization drift.

If caching is required, use an explicit cache layer.

---

# No Permission Snapshot on Profile

Do not persist effective tenant Permissions on Profile.

A Profile may have different Membership Roles per Organization.

---

# Type Safety

Canonical Permission keys should eventually have typed source constants.

Conceptually:

```text
PERMISSIONS.ORGANIZATIONS.READ

PERMISSIONS.MEMBERSHIPS.REMOVE
```

whose runtime values remain:

```text
organizations.read

memberships.remove
```

This is source-level typing, not a separate persistence entity.

---

# No Database Permission Enum

Do not model all Permission keys as a Prisma/PostgreSQL enum.

Example prohibited approach:

```prisma
enum PermissionKey {
  ORGANIZATIONS_READ
  MEMBERSHIPS_READ
  ...
}
```

Reasons:

```text
Domain extensibility

migration overhead

namespace growth

authorization catalog evolution
```

Permission key remains a unique String.

---

# No Permission Boolean Columns

Do not model Role authorization as:

```text
canReadOrganizations

canInviteMembers

canRemoveMembers
```

columns on Role.

This does not scale across reusable Core and Domains.

Use RolePermission mappings.

---

# No JSON Permission Array

Do not store:

```text
Role.permissions Json
```

or:

```text
Role.permissionKeys String[]
```

as the canonical authorization model.

Use relational persistence.

---

# Why Relational Mapping

RolePermission provides:

```text
foreign-key integrity

unique grants

queryable policy

explicit authorization

future auditability

Domain extensibility
```

without embedding authorization blobs.

---

# Platform Administrator Boundary

Do not create Foundation Permission keys such as:

```text
platform.super_admin
```

to avoid designing platform-wide administration properly.

Tenant authorization and SaaS platform administration are different scopes.

---

# Ownership Permission Boundary

The Foundation contains:

```text
organizations.transfer_ownership
```

because ownership transfer is an Organization tenant operation already defined by tenancy.

The Permission does not create platform-global authority.

---

# Invitation Acceptance Boundary

Recipient invitation acceptance does not require a pre-existing tenant Permission.

The recipient may not yet have a Membership.

Acceptance is authorized through:

```text
valid Invitation

matching authenticated identity

Memberships lifecycle rules
```

This does not require a RolePermission mapping for the recipient.

---

# Organization Creation Boundary

Initial Organization creation may occur before a Membership exists.

Therefore tenant Permission evaluation cannot be the sole authorization mechanism for:

```text
create first Organization
```

Onboarding uses its own approved bootstrap flow.

---

# Post-Onboarding Administration

Once the Organization and initial OWNER Membership exist, normal tenant administration should use:

```text
Membership
→ Role
→ Permission
```

for protected operations.

---

# Data Model Dependencies

Permissions Foundation requires:

```text
Role
```

persistence.

Complete tenant authorization additionally requires:

```text
OrganizationMembership

Organization

Profile
```

through Tenancy integration.

---

# Implementation Dependency Order

Data-model order:

```text
Role
        ↓
Permission
        ↓
RolePermission
```

Tenant evaluation then uses:

```text
OrganizationMembership
        ↓
Role
        ↓
RolePermission
        ↓
Permission
```

---

# Migration Scope

Permissions Foundation migration should introduce:

```text
permissions

role_permissions

Permission key uniqueness

RolePermission Role/Permission uniqueness

foreign keys

required indexes
```

No Membership or Organization schema redesign belongs in this migration unless physically required for inverse Prisma relations.

---

# No Permission Migration Side Effects

Permissions migration must not introduce:

```text
Profile.roleId

Profile.permissions

Organization.permissions

OrganizationMembership.permissions

Permission.organizationId

RolePermission.organizationId

MembershipPermission

Role inheritance

Permission hierarchy

platform super-admin
```

---

# Existing Roles

Permissions assumes canonical Roles already exist:

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

If they do not:

```text
STOP
```

Do not create provisional Roles inside Permissions.

---

# Existing Memberships

RolePermission policy can technically be persisted before Memberships are populated.

However, tenant authorization is not operational until real Membership/Tenancy context exists.

---

# Existing Domain Data

Permissions Foundation does not retroactively add:

```text
organizationId

permission columns

authorization state
```

to unrelated Domain tables.

Domain authorization integration occurs deliberately.

---

# Permission Data Model Validation Checklist

Before implementation verify:

```text
[ ] Permission owned by Permissions

[ ] RolePermission owned by Permissions

[ ] Permission.id uses UUID

[ ] Permission.key is unique

[ ] Permission.key is lowercase namespaced String

[ ] Permission is global initially

[ ] RolePermission references real Role

[ ] RolePermission references real Permission

[ ] RolePermission pair is unique

[ ] RolePermission is positive-grant only

[ ] RolePermission has no organizationId

[ ] Membership has no Permission override

[ ] Profile has no tenant Permission override

[ ] Role has no permissionsJson

[ ] OWNER has no magic bypass

[ ] Role hierarchy is not authorization

[ ] Permission inheritance is absent

[ ] wildcard Permissions are absent

[ ] explicit initial Core Permission catalog exists

[ ] explicit system Role policy exists

[ ] Permission seed resolves by key

[ ] Role policy resolves Role/Permission by keys

[ ] no hard-coded UUIDs exist
```

---

# Definition of Ready

Permissions data model is ready when:

- Permission ownership is explicit.
- RolePermission ownership is explicit.
- Permission UUID strategy is approved.
- Permission-key strategy is approved.
- Permission key uniqueness is approved.
- Permission definitions are global initially.
- RolePermission mappings are global initially.
- Role relation is approved.
- RolePermission uniqueness is approved.
- Positive-grant semantics are approved.
- Missing mapping means deny.
- OWNER bypass is prohibited.
- Role inheritance is prohibited.
- wildcard Permissions are prohibited.
- per-Membership overrides are prohibited.
- per-Organization overrides are prohibited.
- initial Core Permission catalog is approved.
- initial system Role policy is approved.
- seed/synchronization by semantic key is approved.
- Permission removal is understood as a migration/policy operation.
- tenant scope remains Membership-based.
- Domain extension boundary is understood.

---

# Definition of Done

Permissions persistence is complete when:

- Permission model exists.
- RolePermission model exists.
- Permission IDs use UUID.
- RolePermission IDs use UUID.
- Permission key is required.
- Permission key is unique.
- Permission key validation is implemented at the application boundary.
- Permission name exists.
- Permission description is supported.
- RolePermission references Role.
- RolePermission references Permission.
- RolePermission Role/Permission pair is unique.
- delete behavior is conservative.
- canonical Core Permission catalog is persisted.
- Permission synchronization is idempotent.
- canonical system Role policy is persisted.
- RolePermission synchronization is idempotent.
- no hard-coded Role UUID exists.
- no hard-coded Permission UUID exists.
- no Permission organizationId exists.
- no RolePermission organizationId exists.
- no Membership Permission override exists.
- no Profile Permission override exists.
- no wildcard Permission exists.
- no Permission hierarchy exists.
- no Role inheritance exists.
- no DENY mapping exists.
- no OWNER bypass exists.
- policy drift can be detected.
- expected Permission/index constraints exist.
- Prisma validation passes.
- relevant persistence tests pass.
- TypeScript passes.
- Lint passes.
- documentation matches implementation.

---

# Final Principle

Permission defines a capability.

RolePermission explicitly grants that capability to a Role.

Membership assigns that Role inside one Organization.

Tenant scope comes from Membership, not from Permission.

Authorization is relational, explicit and deny-by-default.

There are no wildcard grants.

There is no hidden Role inheritance.

There are no per-Membership overrides.

OWNER has no magic bypass.

Every granted capability must exist as an explicit, reviewable RolePermission mapping.