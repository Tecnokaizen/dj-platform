---
title: Permissions Specification
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
  - ../roles/SPEC.md
  - ../roles/DATA_MODEL.md
  - ../memberships/SPEC.md
  - ../memberships/DATA_MODEL.md
  - ../../../architecture/TENANCY.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/SECURITY.md
  - ../../../architecture/DATA.md
  - ../../../architecture/PRISMA_IMPLEMENTATION.md
---

# Permissions Specification

## Purpose

The Permissions module defines and evaluates authorization capabilities within Platform Core.

It answers:

```text
What capability exists?

Which Roles hold that capability?

Does this Membership's Role allow the requested operation?
```

Permissions completes the authorization chain established by tenancy.

Conceptually:

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
        ↓
Requested Operation
```

---

# Core Principle

Platform Core separates:

```text
Identity
→ Who is this person?

Organizations
→ What tenant exists?

Memberships
→ Does this Profile belong to this tenant?

Roles
→ What authorization position does this Membership hold?

Permissions
→ What capabilities does that Role grant?
```

These responsibilities must remain separate.

---

# Architectural Ownership

The relevant Core ownership model is:

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
Permission definitions

Permission keys

Permission catalog persistence

Role-to-Permission mapping persistence

Permission evaluation

Effective permission resolution

Authorization capability checks
```

Permissions does not own:

```text
Profile

Authentication

Organization

Organization lifecycle

OrganizationMembership

Membership lifecycle

Role definition

Role assignment to Membership

Organization ownership invariant

Domain resource business rules

Audit persistence
```

---

# Permission vs Role

A Role answers:

```text
What authorization position does this Membership have?
```

A Permission answers:

```text
What capability does that position allow?
```

Example:

```text
Role
ADMIN

Permissions
memberships.read
invitations.create
memberships.suspend
organizations.update
```

Role and Permission are not interchangeable.

---

# RolePermission

RolePermission represents the authorization mapping:

```text
Role
        ↓
RolePermission
        ↓
Permission
```

Permissions owns this mapping.

Roles owns:

```text
Role
```

Permissions owns:

```text
which Permissions are granted to that Role
```

---

# No Permission on Membership

Do not persist tenant authorization directly as:

```text
OrganizationMembership.permissions
```

or:

```text
OrganizationMembership.permissionIds
```

or:

```text
OrganizationMembership.permissionsJson
```

The initial authorization path remains:

```text
Membership
→ Role
→ RolePermission
→ Permission
```

---

# No Permission on Profile

Do not introduce:

```text
Profile.permissions

Profile.permissionIds

Profile.permissionsJson
```

for tenant authorization.

A Profile may have different Roles in different Organizations.

Authorization is Organization scoped through Membership.

---

# No Permission on Organization

Do not store:

```text
Organization.permissions
```

as tenant authorization policy.

Permissions are capabilities associated with Roles.

---

# Initial Authorization Model

Platform Core initially uses:

```text
RBAC
```

Role-Based Access Control.

Canonical flow:

```text
Membership
        ↓
Role
        ↓
Permission Set
```

Initial design does not implement:

```text
ABAC

policy expression language

resource-condition engine

explicit deny rules

multiple Roles per Membership

permission overrides per Membership
```

These may be considered later if validated requirements justify them.

---

# Deny by Default

Authorization is fail-closed.

If a required Permission cannot be proven:

```text
DENY
```

This includes cases such as:

```text
No Membership

Membership not ACTIVE

Role missing

Permission missing

RolePermission mapping missing

invalid tenant context
```

The system must never infer authorization from uncertainty.

---

# Positive Grants Only

Initial Permissions Foundation uses explicit positive grants.

Conceptually:

```text
RolePermission exists
→ capability granted

RolePermission absent
→ capability denied
```

There is no initial:

```text
DENY Permission

negative Permission

deny override

allow/deny precedence engine
```

---

# No Role Hierarchy Authorization

Do not authorize through assumptions such as:

```text
OWNER > ADMIN > MANAGER > MEMBER > VIEWER
```

or:

```text
Role.sortOrder
```

A higher display order does not automatically inherit Permissions from a lower Role.

Authorization depends on explicit RolePermission mappings.

---

# No Implicit Role Inheritance

Initial architecture does not implement:

```text
OWNER inherits ADMIN

ADMIN inherits MANAGER

MANAGER inherits MEMBER
```

as runtime authorization logic.

Each effective grant must be represented explicitly through approved RolePermission policy.

This prevents hidden permission inheritance.

---

# Why Explicit RolePermission Mapping

Explicit mapping provides:

```text
predictability

auditability

safe migrations

clear authorization review

deterministic tests

no hidden hierarchy semantics
```

A Role's effective permissions can be inspected directly.

---

# OWNER Is Not a Permission Bypass

OWNER has special meaning for Organization ownership.

That does not mean Permissions should implement:

```text
if role == OWNER
  allow everything
```

Do not create an OWNER authorization bypass.

Correct:

```text
OWNER Role
        ↓
explicit RolePermission mappings
        ↓
approved Permissions
```

---

# OWNER Authorization

The canonical OWNER Role should receive the approved capabilities required by tenant ownership through explicit policy.

This may include capabilities such as:

```text
Organization administration

Membership administration

Role assignment operations

ownership transfer
```

depending on the approved Permission catalog.

The grant must still be explicit.

---

# Why OWNER Does Not Automatically Allow Everything

A future capability may be security-sensitive or platform-global.

Automatically granting every new Permission to OWNER would make adding a Permission silently expand authorization.

Preferred behavior:

```text
new Permission added
        ↓
explicit RolePermission policy reviewed
        ↓
grant deliberately
```

This keeps authorization changes intentional.

---

# System Roles

Initial Roles are canonical global reference data:

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

Permissions consumes those Role definitions.

It does not recreate them.

---

# Initial Permission Definitions

Permissions are platform-defined capabilities.

Examples of Core tenancy capabilities may include:

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

These are examples of the naming model.

The final approved catalog must be explicitly documented before implementation.

---

# Permission Key

Every Permission has a stable semantic key.

Examples:

```text
organizations.update

invitations.create

memberships.remove
```

Permission key is the application-facing semantic identity.

The database UUID remains the persistence identity.

---

# Permission Key Strategy

Recommended key format:

```text
lowercase dot-separated capability namespace
```

Examples:

```text
organizations.read

organizations.update

memberships.read

memberships.change_role
```

Domain permissions may eventually use deeper namespaces such as:

```text
dj.playlists.create

copy.orders.update

seo.projects.manage
```

The exact domain capability remains owned by its Domain.

Permissions owns registration and evaluation infrastructure.

---

# Permission Key Stability

Permission keys are part of the authorization contract.

Once released, they should be treated as stable identifiers.

Renaming:

```text
invitations.create
```

to:

```text
invitations.issue
```

is not a cosmetic change.

It may affect:

```text
RolePermission seeds

authorization checks

tests

Domain integrations

documentation

cached permission sets
```

Permission-key changes require coordinated migration.

---

# Permission Key Case

Permission keys should be canonical lowercase.

Do not create competing keys such as:

```text
Invitations.Create

INVITATIONS_CREATE

invitations.Create
```

when the approved key is:

```text
invitations.create
```

---

# Permission Persistence Identity

Permission persistence uses:

```text
UUID
```

Conceptually:

```text
Permission.id
→ UUID

Permission.key
→ unique stable semantic key
```

Do not use the Permission key itself as the primary database identifier.

---

# Permission Definition

A Permission represents one application capability.

Conceptually:

```text
Permission
├── id
├── key
├── name
├── description
└── lifecycle metadata
```

Exact physical fields belong in DATA_MODEL.md and PRISMA.md.

---

# Permission Definition Is Not Business Data

Permission definitions are authorization reference data.

They are not:

```text
user content

Organization content

Domain records

tenant configuration
```

Initial Permission definitions are global.

---

# Global Permission Catalog

Initial Permission definitions are global across the platform installation.

Do not add:

```text
Permission.organizationId
```

to the initial architecture.

The capability:

```text
invitations.create
```

means the same capability regardless of which Organization is being accessed.

Tenant scope comes from:

```text
OrganizationMembership
```

not from duplicating Permission rows per tenant.

---

# No Organization-Specific Permission Definitions

Do not create:

```text
Organization A
→ Permission invitations.create

Organization B
→ another Permission invitations.create
```

Initial Permission definitions are canonical global capabilities.

---

# RolePermission Is Global Initially

Because initial Roles and Permission definitions are global:

```text
RolePermission
```

is also global policy.

Conceptually:

```text
ADMIN
→ invitations.create
```

means the ADMIN Role carries that capability wherever that Role is assigned.

Tenant scope is still established by Membership.

---

# Tenant Scope Comes From Membership

Example:

```text
Profile A
        ↓
Membership in Organization X
        ↓
ADMIN
        ↓
invitations.create
```

does not grant authority in Organization Y unless Profile A also has an appropriate ACTIVE Membership there.

Permission mappings are global.

Permission execution remains tenant scoped.

---

# No Per-Organization RolePermission Mapping Initially

Do not introduce:

```text
OrganizationRolePermission

OrganizationPermission

RolePermission.organizationId
```

during Permissions Foundation.

Tenant-specific authorization customization is deferred.

---

# No Membership Permission Overrides Initially

Do not introduce:

```text
MembershipPermission

permissionOverrides

extraPermissions

deniedPermissions
```

during initial implementation.

The authorization path stays:

```text
Membership
→ Role
→ RolePermission
→ Permission
```

---

# Permission Catalog Ownership

Permissions owns persistence and canonical registration of capabilities.

However, the semantic capability may originate from another owner.

Example:

```text
invitations.create
```

describes a Memberships operation.

Memberships owns the operation.

Permissions owns the authorization representation and evaluation.

---

# Capability Ownership Principle

For:

```text
memberships.suspend
```

ownership is divided:

```text
Memberships
→ owns suspendMembership behavior

Permissions
→ owns the Permission record and evaluation

RolePermission
→ determines which Roles may request it
```

Permissions does not absorb Membership lifecycle logic.

---

# Domain Permission Extension

Business Domains may eventually declare Domain-specific capability keys.

Examples:

```text
dj.playlists.create

dj.playlists.delete

copy.orders.update
```

The Domain owns what those operations mean.

Permissions owns:

```text
Permission registration

RolePermission mapping persistence

capability evaluation
```

Platform Core must not hard-code DJ, Copy or SEO business rules.

---

# Domain Permission Boundary

Correct:

```text
DJ Domain
→ defines operation: create playlist

Permissions
→ represents/evaluates dj.playlists.create
```

Incorrect:

```text
Permissions
→ contains DJ playlist business logic
```

---

# Initial Domain Permission Policy

Permissions Foundation must support a namespace strategy compatible with Domain permissions.

It does not need to implement a dynamic tenant permission designer.

Domain permission registration and default Role mapping should be introduced only through an approved integration contract.

---

# Permission Catalog Is Code-Controlled

Initial Permissions should be defined declaratively in application source and synchronized to persistence.

Conceptually:

```text
Permission Catalog
        ↓
Seed / Sync
        ↓
permissions table
```

Do not require manual database editing to create canonical Permissions.

---

# Permission Seed

System Permissions should be seeded idempotently by:

```text
Permission.key
```

Not by hard-coded UUID.

Conceptually:

```text
Permission key exists?
        ├── YES → update approved metadata if required
        └── NO  → create with generated UUID
```

---

# No Hard-Coded Permission UUID

Do not implement authorization using constants such as:

```text
INVITATIONS_CREATE_PERMISSION_ID
=
"fixed-environment-uuid"
```

Permission UUIDs may differ by environment.

Resolve semantic capability through:

```text
Permission.key
```

---

# RolePermission Seed

Initial RolePermission policy should also be synchronized deterministically.

Conceptually:

```text
Role key
+
Permission key
        ↓
resolve real UUIDs
        ↓
ensure RolePermission mapping exists
```

Do not hard-code Role or Permission UUIDs into the policy catalog.

---

# RolePermission Policy Is Version Controlled

Initial system Role mappings are platform policy.

They should be:

```text
declared

reviewed

seeded

tested
```

from version-controlled application configuration.

They should not depend on undocumented manual database changes.

---

# Runtime Mutation of System Role Policy

Initial Foundation does not expose normal product UI for modifying the Permission set of canonical system Roles.

Do not expose unrestricted:

```text
grantPermissionToRole

revokePermissionFromRole
```

to tenant users.

System-role authorization policy is platform-controlled.

---

# Future Custom Roles

Future custom Organization Roles may require tenant-managed Permission assignment.

That would require an explicit evolution of:

```text
Roles

Permissions

Memberships

authorization UI

audit

RLS
```

Do not prebuild this during Foundation.

---

# Permission Evaluation

Permissions owns the canonical evaluation operation.

Conceptually:

```text
Trusted Tenant Context
        ↓
Membership ACTIVE
        ↓
Role
        ↓
RolePermission
        ↓
Requested Permission
        ↓
ALLOW / DENY
```

---

# Trusted Tenant Context

Permission evaluation must operate on server-trusted tenancy data.

A context may conceptually contain:

```text
profileId

organizationId

membershipId

roleId

roleKey
```

It is a runtime projection.

It is not client authority.

---

# No Client-Constructed Authorization Context

Do not trust:

```text
organizationId from browser

roleId from browser

roleKey from browser

permission list from browser

membershipId from browser
```

as proof of authorization.

The server must resolve or validate the persisted Membership relationship.

---

# hasPermission

Permissions should provide a canonical capability similar to:

```text
hasPermission(
  trustedContext,
  permissionKey
)
```

Result:

```text
true
```

or:

```text
false
```

It must fail closed.

---

# requirePermission

Permissions should also provide a capability similar to:

```text
requirePermission(
  trustedContext,
  permissionKey
)
```

Behavior:

```text
granted
→ return / continue

not granted
→ throw or return stable PERMISSION_DENIED result
```

This provides a consistent guard for server workflows.

---

# Effective Permissions

Permissions may expose an internal/application capability such as:

```text
getEffectivePermissions(roleId)
```

or:

```text
getEffectivePermissions(trustedContext)
```

This returns the explicit Permission set associated with the Role.

It must not invent inherited or wildcard capabilities.

---

# Permission Evaluation Is Not Authentication

Permissions must not implement:

```text
login

session validation

magic links

password verification
```

Identity owns authentication.

---

# Permission Evaluation Is Not Membership Resolution

Permissions may consume trusted Membership/Tenant context.

It should not duplicate Membership persistence.

Memberships owns:

```text
OrganizationMembership
```

---

# Permission Evaluation Is Not Organization Lifecycle

Permissions does not decide whether an Organization is:

```text
ACTIVE

SUSPENDED

ARCHIVED
```

Tenancy/context resolution should establish a valid tenant before fine-grained permission evaluation.

---

# Layered Authorization

Canonical protected operation:

```text
Authenticated?
        ↓
Profile valid?
        ↓
Organization accessible?
        ↓
Membership ACTIVE?
        ↓
Permission granted?
        ↓
Resource-specific invariants valid?
        ↓
Execute
```

Permissions owns only the capability authorization step.

---

# Resource-Level Business Rules

Permission:

```text
copy.orders.update
```

may prove that a Role may attempt to update an Order.

It does not prove:

```text
the Order belongs to this Organization

the Order is editable in its current state

the user owns the resource

the business transition is valid
```

The owning Domain/service must enforce those invariants.

---

# Permission Is Necessary, Not Always Sufficient

Conceptually:

```text
Permission granted
+
resource belongs to tenant
+
business state allows operation
=
operation may proceed
```

A Permission check alone must not bypass resource validation.

---

# No Generic Policy Expression Language

Initial Permissions does not implement rules such as:

```text
allow if resource.ownerId == profile.id

allow if amount < 1000

allow if department == "production"

allow during office hours
```

These are attribute/business conditions.

They belong to owning services or a future approved policy architecture.

---

# No Wildcard Permissions Initially

Do not introduce implicit Permission keys such as:

```text
*

organizations.*

memberships.*
```

during Foundation.

Wildcard semantics create hidden expansion behavior.

Initial policy uses explicit Permission keys.

---

# Why No Wildcards

Suppose:

```text
ADMIN
→ memberships.*
```

and later a sensitive capability is added:

```text
memberships.transfer_ownership
```

A wildcard could grant that capability automatically.

Explicit mappings avoid unintended authorization expansion.

---

# Permission Missing vs Permission Denied

Two situations must be conceptually distinguished.

## Permission exists but Role does not have it

```text
DENY
```

This is normal authorization behavior.

## Required system Permission definition is missing

```text
configuration / catalog integrity failure
```

The system should fail safely and surface a diagnostic such as:

```text
REQUIRED_PERMISSION_MISSING
```

---

# Unknown Permission Key

Authorization must never interpret an unknown key as granted.

Conceptually:

```text
Unknown Permission
→ DENY
```

Internal callers using an expected canonical Permission may additionally receive:

```text
PERMISSION_NOT_FOUND
```

or:

```text
REQUIRED_PERMISSION_MISSING
```

---

# No Runtime Auto-Creation During Authorization

Do not implement:

```text
hasPermission("invitations.create")
        ↓
Permission missing
        ↓
create Permission automatically
```

Missing Permission definitions indicate catalog drift or deployment error.

Authorization should fail safely.

---

# Permission Catalog Validation

Permissions should support validation that required canonical Permissions exist.

Conceptually:

```text
validatePermissionCatalog()
```

The validation may check:

```text
required keys exist

keys are unique

metadata is valid

RolePermission policy references valid Roles

RolePermission policy references valid Permissions
```

---

# Permission Policy Validation

The system should be able to validate its system Role mappings.

Example:

```text
OWNER policy exists

ADMIN policy exists

VIEWER policy does not contain mutation capabilities accidentally
```

Exact policy assertions should be encoded in tests rather than inferred from Role ordering.

---

# Canonical System Role Policy

Initial semantic guidance:

```text
OWNER
→ full approved tenant ownership and administration capability

ADMIN
→ broad tenant administration without ownership-only operations

MANAGER
→ approved operational management capabilities

MEMBER
→ approved standard operational capabilities

VIEWER
→ approved read-only capabilities
```

This is semantic guidance.

The real authorization result comes from explicit RolePermission mappings.

---

# No Automatic Permission From Role Name

Do not implement:

```text
if role.key == "ADMIN"
  allow admin operations
```

outside the RolePermission policy.

Correct:

```text
ADMIN
        ↓
RolePermission
        ↓
Permission
```

---

# Ownership Transfer Permission

Ownership transfer should have a dedicated capability.

Example:

```text
organizations.transfer_ownership
```

This capability alone is not sufficient.

The operation must also satisfy:

```text
current OWNER rules

target Membership rules

same Organization

ownership invariant

atomic transaction
```

Organizations/Memberships own those structural rules.

Permissions only authorizes the capability.

---

# Membership Management Permissions

Membership administration may use capabilities such as:

```text
memberships.read

memberships.suspend

memberships.restore

memberships.remove

memberships.change_role
```

Memberships remains owner of:

```text
Membership lifecycle

Invitation lifecycle

Role assignment persistence
```

Permissions determines whether the actor may request those operations.

---

# Invitation Permissions

Invitation operations may use explicit capabilities such as:

```text
invitations.read

invitations.create

invitations.revoke

invitations.resend
```

These `invitations.*` capabilities are canonical for Permissions Foundation.

Do not duplicate the same operations under the `memberships.*` namespace.

---

# Permission Naming Does Not Imply Inheritance

The fact that:

```text
memberships.read
```

and:

```text
memberships.remove
```

share a namespace does not mean one implies the other.

Likewise:

```text
memberships.*
```

does not exist initially.

---

# System Permission Metadata

Permission records may contain human-readable metadata such as:

```text
name

description
```

This supports:

```text
administrative UI

documentation

debugging

future custom Role UI
```

The stable authorization identity remains:

```text
Permission.key
```

---

# Permission Descriptions

Descriptions should explain the capability.

Example:

```text
key:
invitations.create

description:
Allows creation of Organization invitations for new Members.
```

Descriptions must not become authorization logic.

---

# Permission Lifecycle

Initial Permission definitions are durable reference data.

Normal runtime operations should not:

```text
hard delete Permission

rename Permission casually

disable Permission silently
```

Permission catalog evolution is a controlled deployment concern.

---

# Permission Deletion

A Permission referenced by RolePermission should not be casually deleted.

Removing a capability requires:

```text
policy review

RolePermission cleanup

code check removal

migration

tests

documentation update
```

---

# RolePermission Lifecycle

RolePermission represents a current grant.

Adding a mapping:

```text
expands Role authorization
```

Removing a mapping:

```text
reduces Role authorization
```

Both are security-sensitive policy changes.

---

# RolePermission Uniqueness

There must not be duplicate grants for the same:

```text
Role
+
Permission
```

Required conceptual invariant:

```text
UNIQUE (
  roleId,
  permissionId
)
```

Exact persistence belongs in PRISMA.md.

---

# RolePermission Does Not Need Tenant ID

Initial mapping:

```text
Role
+
Permission
```

is global.

Do not add:

```text
organizationId
```

to RolePermission during Foundation.

---

# RolePermission Does Not Need Effect

Initial model is positive-grant only.

Do not add:

```text
effect = ALLOW | DENY
```

during Foundation.

The existence of the mapping means:

```text
ALLOW
```

Absence means:

```text
DENY
```

---

# No Permission Priority

Do not introduce:

```text
priority

precedence

weight

rank
```

for Permission conflict resolution.

Initial architecture has no allow/deny conflict model.

---

# No Permission Inheritance Graph

Do not introduce:

```text
Permission.parentId

Permission.implies

Permission.children

Permission hierarchy
```

during Foundation.

Every capability is explicit.

---

# Permission Evaluation Result

A permission check may conceptually return:

```text
ALLOW
```

or:

```text
DENY
```

Application APIs may expose this as:

```text
boolean
```

or throw/return a stable authorization error.

Avoid exposing internal persistence detail unnecessarily.

---

# Authorization Errors

Recommended error categories include:

```text
PERMISSION_DENIED

PERMISSION_NOT_FOUND

REQUIRED_PERMISSION_MISSING

INVALID_AUTHORIZATION_CONTEXT

ROLE_NOT_FOUND
```

Membership/context failures may already have their own errors from Tenancy/Memberships.

Do not duplicate them unnecessarily.

---

# Error Security

Authorization responses must not unnecessarily expose:

```text
which hidden Permissions another Role possesses

cross-tenant Membership details

private tenant configuration

internal database IDs
```

For external callers:

```text
PERMISSION_DENIED
```

may be safer than detailed policy diagnostics.

---

# Server-First Authorization

Permission evaluation should occur server side.

Preferred:

```text
Server Action / Route Handler / Server Component
        ↓
Trusted Tenant Context
        ↓
Permissions.requirePermission()
        ↓
Owning Service
```

Do not rely on client-side UI visibility as authorization.

---

# UI Permission Checks

The client may receive enough effective Permission information to improve UX.

For example:

```text
hide "Invite Member" button
```

when capability is absent.

This is presentation only.

The server must still enforce the Permission.

---

# Client-Side Permission State Is Not Authority

Never authorize solely because:

```text
frontend says canInvite = true
```

or:

```text
button was visible
```

Server-side Permission evaluation remains authoritative.

---

# Permission Projection to UI

A trusted server may return:

```text
effective permission keys
```

to the UI when useful.

Examples:

```text
memberships.read

invitations.create
```

Do not return:

```text
RolePermission database internals
```

unless the UI actually needs them.

---

# Caching Effective Permissions

Because initial RolePermission policy is global and Role-based, effective permissions may be cacheable by:

```text
roleId
```

or:

```text
roleKey
```

if implemented safely.

Any policy change must invalidate relevant cache.

---

# Cache Invalidation

Changes to:

```text
Permission catalog

RolePermission mappings
```

must invalidate cached effective permission sets.

Membership Role changes must also invalidate tenant authorization context.

---

# Permission Check Performance

Permission evaluation is expected to occur frequently.

Implementation should avoid unnecessary repeated database traversal when a trusted resolved context already contains an approved effective permission set.

However:

```text
performance optimization
```

must not weaken authorization correctness.

---

# Authorization Context Freshness

Cached tenant/permission context becomes stale when:

```text
Membership Role changes

Membership is SUSPENDED

Membership is REMOVED

Organization is SUSPENDED

RolePermission policy changes

Permission catalog changes
```

Stale context must not continue granting authority.

---

# RLS Boundary

Membership-based RLS primarily establishes:

```text
tenant row isolation
```

Permissions primarily establishes:

```text
operation-level authorization
```

Initial server-first architecture should not duplicate the complete Permission engine inside PostgreSQL RLS.

---

# Initial RLS Principle

Conceptually:

```text
RLS
→ active Membership proves tenant relationship

Application Permissions
→ capability check proves operation authorization
```

This provides clear separation.

---

# Direct Client Database Access

If future features allow direct Supabase client writes to tenant resources, Permission-aware RLS may become necessary.

That requires explicit Security/Permissions design.

Do not assume server-side `requirePermission()` protects direct database writes that bypass the application server.

---

# Permission-Aware RLS Future

A future design may introduce reusable PostgreSQL authorization helpers.

Possible concept:

```text
has_permission(
  organization_id,
  permission_key
)
```

This is not part of initial Foundation unless required by actual access patterns.

Avoid maintaining two inconsistent permission engines prematurely.

---

# Audit Boundary

Permission policy changes are security-sensitive.

Future Audit events may include:

```text
permission.created

permission.updated

role_permission.granted

role_permission.revoked
```

Initial system policy may be deployment-controlled rather than runtime mutable.

Audit persistence belongs to Audit.

---

# Authorization Decision Logging

Do not automatically persist an Audit record for every Permission check.

That would create excessive volume and noise.

Security-sensitive denied operations may be logged through the appropriate observability/security mechanism when justified.

---

# Notifications Boundary

Permissions does not send notifications.

If a policy change eventually requires notification:

```text
Permissions
→ emits/request event

Notifications
→ delivers message
```

---

# Billing Boundary

Billing may define capabilities such as:

```text
billing.read

billing.manage
```

if required.

Billing owns billing operations.

Permissions owns capability evaluation.

Do not put subscription logic into Permission evaluation.

---

# Settings Boundary

Settings may eventually define capabilities such as:

```text
settings.read

settings.update
```

Settings owns configuration behavior.

Permissions determines whether the actor may perform it.

---

# Storage Boundary

Storage may expose capabilities such as:

```text
storage.read

storage.upload

storage.delete
```

where required.

Permissions must not absorb file-storage logic.

---

# Platform Administration Boundary

Organization Permissions are not automatically platform-wide administrative Permissions.

Future platform administration requires separate architecture.

Do not create:

```text
SUPER_ADMIN Permission
```

or:

```text
Profile.isSuperAdmin
```

as an undocumented shortcut.

---

# System Role vs Platform Administrator

An Organization OWNER is:

```text
owner of one Organization
```

It is not:

```text
administrator of the SaaS platform
```

These concepts must remain separate.

---

# Cross-Tenant Permissions

Initial tenant Permission evaluation must never grant authority across Organizations merely because the same Role exists globally.

Example:

```text
Profile
→ ADMIN in Organization A
```

does not grant:

```text
ADMIN authority in Organization B
```

without a valid Membership in B.

---

# Permission Evaluation Must Include Tenant Context

Incorrect:

```text
Profile has ADMIN somewhere
        ↓
allow
```

Correct:

```text
Profile
+
target Organization
+
ACTIVE Membership for that Organization
+
Role
+
Permission
        ↓
allow
```

---

# Membership State

Only:

```text
ACTIVE
```

Membership normally participates in tenant Permission evaluation.

A:

```text
SUSPENDED
```

or:

```text
REMOVED
```

Membership must not grant normal tenant capabilities.

---

# Organization State

Permissions should consume a tenant context that already respects Organization lifecycle.

An ACTIVE Membership in a:

```text
SUSPENDED
```

Organization does not mean normal tenant operation is allowed.

Tenancy handles this before or alongside Permission evaluation.

---

# Role Validity

Permission evaluation requires a real Role.

Invalid state:

```text
Membership.roleId
→ missing Role
```

must fail safely.

Do not infer a fallback Role.

---

# Permission Catalog Integrity

Invalid state:

```text
application checks invitations.create
+
canonical Permission missing from persistence
```

must fail safely.

Do not grant based on the string alone.

---

# RolePermission Integrity

Invalid RolePermission references must be prevented through database foreign keys.

Application services should still validate expected catalog state.

---

# Permission Repository

Permissions should own a persistence boundary for:

```text
Permission
```

Possible operations:

```text
findById

findByKey

findManyByKeys

listPermissions
```

Exact repository contracts belong in API.md and PRISMA.md.

---

# RolePermission Repository

Permissions should own persistence access for:

```text
RolePermission
```

Possible operations:

```text
hasMapping

listPermissionsForRole

listRolesForPermission

ensureMapping

removeMapping
```

System-policy mutation methods may remain internal to seed/synchronization workflows.

---

# Evaluation Service

Permissions should provide an application service responsible for:

```text
hasPermission

requirePermission

getEffectivePermissions
```

This service consumes approved Role/tenant context.

---

# Permission Catalog Service

Permissions may provide internal capabilities such as:

```text
resolveRequiredPermission

validatePermissionCatalog

syncPermissionCatalog
```

These are configuration/reference-data operations.

They are not tenant business operations.

---

# Policy Synchronization Service

Permissions may provide internal capability for synchronizing canonical:

```text
Role
+
Permission
```

mappings.

Conceptually:

```text
syncSystemRolePermissionPolicy()
```

This should be:

```text
idempotent

deterministic

version-controlled
```

---

# Seed vs Runtime

Initial Permission and RolePermission reference data should be established through:

```text
seed / synchronization
```

not by normal tenant runtime activity.

---

# Missing Role During Policy Sync

If canonical Role:

```text
ADMIN
```

cannot be resolved during Permission-policy synchronization:

```text
FAIL
```

Do not create a temporary Role inside Permissions.

Roles owns Role creation/reference data.

---

# Missing Permission During Policy Sync

A Permission declaration should be synchronized before RolePermission mapping.

If required Permission persistence cannot be established:

```text
FAIL
```

Do not create incomplete mappings.

---

# Permission Catalog Transaction

Where useful, synchronization may use a transaction to ensure:

```text
Permission catalog
+
RolePermission policy
```

does not become partially updated.

Exact transaction behavior belongs in implementation design.

---

# Policy Drift

The persisted Permission catalog and RolePermission mappings should be verifiable against the declared platform policy.

Examples of drift:

```text
missing Permission

unexpected RolePermission

missing RolePermission

unknown legacy Permission

duplicate mapping
```

The platform should detect such drift during validation.

---

# Unexpected Legacy Permissions

Do not automatically hard-delete unknown persisted Permissions during synchronization.

A safe synchronization workflow should identify them and require explicit migration/deprecation handling.

Authorization reference data changes can be destructive.

---

# Idempotency

Running Permission synchronization multiple times must converge to the same intended state.

It must not:

```text
duplicate Permission rows

duplicate RolePermission rows

generate new semantic copies
```

---

# Permission Metadata Updates

If a Permission already exists by key, approved non-semantic metadata such as:

```text
name

description
```

may be updated idempotently.

Changing the key requires explicit migration.

---

# Permission Key Constants

Application code should avoid scattered string literals.

Recommended concept:

```text
PERMISSIONS.INVITATIONS.CREATE
```

or another typed canonical constant structure.

The resulting semantic value remains:

```text
invitations.create
```

Exact source-code structure belongs to implementation.

---

# No Permission UUID Constants

Constants should represent:

```text
Permission keys
```

not environment-specific UUIDs.

---

# Type Safety

Where practical, canonical platform Permission keys should be represented through TypeScript types/constants to reduce:

```text
typos

unknown keys

authorization drift
```

Domain extension must remain possible without centralizing business logic inside Core.

---

# Dynamic Permission Strings

Do not build Permission keys from untrusted runtime input such as:

```text
`${resource}.${action}`
```

and assume they are authorized.

Permission keys used by application services should come from approved capability definitions.

---

# Authorization Guard Placement

Permission checks belong near the application/service boundary of protected operations.

Example:

```text
Server Action
        ↓
resolve tenant context
        ↓
requirePermission("invitations.create")
        ↓
Memberships.createInvitation()
```

Memberships service still validates its structural invariants.

---

# Defense in Depth

For security-critical operations, the owning service may require an authorization context or invoke Permission evaluation itself.

Avoid architectures where calling a lower-level service accidentally bypasses required authorization.

The exact service boundary must be explicit.

---

# Internal Trusted Operations

Some internal workflows are not user-authorized through tenant Permissions.

Examples:

```text
system migration

seed

background maintenance

initial bootstrap orchestration
```

These must use explicitly trusted internal execution paths.

Do not simulate a fake user Permission to run infrastructure tasks.

---

# Initial Organization Onboarding

The bootstrap flow:

```text
Authenticated Profile
        ↓
Create Organization
        ↓
Create OWNER Membership
```

may exist as a structural tenancy workflow.

Once Permissions is available, subsequent tenant administration should use normal capability authorization.

---

# Invitation Acceptance

A recipient accepting their own valid invitation is primarily authorized through:

```text
valid invitation

matching authenticated identity

Memberships invariants
```

It does not require the recipient to already possess:

```text
invitations.accept
```

because they do not yet belong to the Organization.

This remains a workflow-specific bootstrap authorization path.

---

# Permission to Create Invitations

The inviter does require an approved tenant capability.

Example:

```text
invitations.create
```

or the final approved equivalent.

Memberships still validates:

```text
inviter Membership active

same Organization

target Role valid

OWNER restrictions

duplicate invitation rules
```

---

# Permission to Change Roles

A capability such as:

```text
memberships.change_role
```

authorizes attempting the operation.

It does not allow violating:

```text
OWNER invariant

Role validity

same-Organization requirement

Membership state rules
```

---

# Permission to Transfer Ownership

Ownership transfer requires both:

```text
authorization capability
```

and:

```text
ownership structural invariant
```

Conceptually:

```text
requirePermission(
  organizations.transfer_ownership
)
        ↓
Organizations/Memberships transfer workflow
```

---

# Read Permissions

Read capability should be explicit when data is sensitive.

Examples:

```text
memberships.read

invitations.read
```

Do not assume:

```text
if someone belongs to Organization
→ they can read every Membership
```

---

# Self-Service Operations

Some operations may be authorized by ownership of the identity/resource rather than tenant Permission.

Example:

```text
Profile updates own display name
```

Identity/Profile service may handle this directly.

Do not force every self-service operation into Organization Permissions.

---

# Domain Resource Ownership

A Domain may combine:

```text
Permission
+
resource ownership
```

Example:

```text
dj.playlists.update
+
playlist belongs to Profile/Organization
```

Permissions does not evaluate the playlist business relationship itself.

---

# Permission Catalog Granularity

Permissions should be neither:

```text
too broad
```

nor:

```text
field-by-field excessive
```

Good capability:

```text
memberships.change_role
```

Potentially excessive without validated need:

```text
memberships.change_role_to_manager
```

Permission granularity should correspond to meaningful authorization boundaries.

---

# Avoid UI-Based Permission Naming

Do not define Permissions around transient UI controls such as:

```text
show_invite_button

see_settings_tab
```

Define the underlying capability:

```text
invitations.create

settings.read
```

UI derives visibility from capabilities.

---

# Avoid Technical Implementation Permission Names

Do not define Permissions such as:

```text
call_api_v2

execute_server_action

use_prisma_update
```

Permissions represent business/application capabilities, not technical transport.

---

# Permission Namespaces

Namespaces should normally align with capability owners.

Examples:

```text
organizations.*

memberships.*

invitations.*

billing.*

settings.*
```

Domain namespaces may be:

```text
dj.*

copy.*

seo.*
```

Exact keys remain explicit; wildcard authorization is not implemented.

---

# Permission Documentation

Every canonical Permission should document:

```text
key

human name

description

owning capability/module/domain

expected protected operation
```

This makes authorization policy reviewable.

---

# Permission Registry

A future typed Permission registry may conceptually contain:

```text
key

name

description

owner
```

and possibly approved default system Role grants.

The exact representation belongs in DATA_MODEL/API implementation design.

Do not turn registry metadata into runtime business rules unnecessarily.

---

# Default Role Grant Policy

Default grants for system Roles must be deliberate.

They must not be inferred from:

```text
Role name

Role sortOrder

Permission namespace

Permission name
```

The mapping itself is the policy.

---

# VIEWER Semantics

VIEWER is intended to receive only explicitly approved read-oriented capabilities.

Do not implement:

```text
if VIEWER
  block all mutations
```

as an alternative authorization engine.

The absence of mutation RolePermission mappings produces the denial.

---

# MEMBER Semantics

MEMBER receives explicit standard operational capabilities.

The exact capability set may expand as Core and Domains define their operations.

No inheritance is assumed.

---

# MANAGER Semantics

MANAGER receives explicit operational-management capabilities.

It should not automatically receive security-sensitive tenant administration merely because its Role name sounds elevated.

---

# ADMIN Semantics

ADMIN receives explicit broad administrative capabilities.

Ownership-only operations may remain excluded.

---

# OWNER Semantics

OWNER receives explicit approved tenant ownership capabilities.

It does not bypass Permission evaluation.

---

# Permission Matrix

The project should maintain a reviewable matrix conceptually similar to:

```text
Permission                    OWNER ADMIN MANAGER MEMBER VIEWER

organizations.read              ✓     ✓      ✓      ✓      ✓
organizations.update            ✓     ✓
organizations.transfer_ownership    ✓
memberships.read                 ✓     ✓
invitations.create               ✓     ✓
...
```

The exact matrix must come from the canonical RolePermission policy.

This table must not be generated from Role hierarchy assumptions.

---

# Permission Matrix and Domains

Domain-specific permission matrices belong with the Domain's authorization integration documentation.

Platform Core may provide the mechanism.

It must not embed product-specific policy accidentally.

---

# Security Review

Any Permission policy expansion should be treated as a security-relevant change.

Review questions include:

```text
Which Role gains the capability?

Which tenant resources can it affect?

Can it change Membership or ownership?

Can it expose sensitive data?

Can it cause cross-tenant impact?

Does it require additional business invariants?
```

---

# Testing Strategy

Permissions requires tests at several levels:

```text
Permission catalog

RolePermission persistence

effective Permission resolution

hasPermission

requirePermission

tenant-context integration

protected Core operations

cross-tenant denial
```

---

# Permission Catalog Tests

Validate:

```text
canonical keys unique

required Permission records exist

keys use approved format

no duplicate semantic capabilities

no missing required system Permission
```

---

# RolePermission Tests

Validate:

```text
Role + Permission unique

expected mappings exist

unexpected mappings do not silently appear

missing mapping denies capability
```

---

# OWNER Tests

Verify:

```text
OWNER has approved Permissions through explicit mappings

OWNER has no magic bypass

unknown Permission is denied

new Permission without OWNER mapping is denied
```

---

# Role Hierarchy Tests

Verify authorization does not depend on:

```text
sortOrder

Role name comparison

numeric hierarchy
```

---

# Membership State Integration Tests

Verify:

```text
ACTIVE Membership + granted Permission
→ allowed

ACTIVE Membership + missing Permission
→ denied

SUSPENDED Membership + granted RolePermission
→ denied

REMOVED Membership + granted RolePermission
→ denied

no Membership
→ denied
```

---

# Cross-Tenant Tests

Example:

```text
Profile
→ ADMIN in Organization A
```

with:

```text
invitations.create
```

must not permit invitation creation in:

```text
Organization B
```

unless a separate valid Membership/context exists there.

---

# Unknown Permission Tests

Verify:

```text
hasPermission(unknown key)
→ false / safe denial
```

and required canonical lookups can surface configuration failure without granting access.

---

# Policy Drift Tests

Validate that canonical declared policy and persisted RolePermission state remain synchronized.

---

# No Permissions Tests Through UI Only

Testing hidden buttons is insufficient.

Server-side authorization must have direct automated coverage.

---

# Definition of Permission Success

A protected operation succeeds only when:

```text
authentication valid

tenant context valid

Organization state valid

Membership ACTIVE

Role valid

Permission explicitly granted

operation-specific invariants valid
```

Permissions is one required layer within the full chain.

---

# Source Structure

Initial implementation should live conceptually under:

```text
src/core/modules/permissions/
```

Possible structure:

```text
permissions/
├── constants/
├── repositories/
├── services/
├── schemas/
└── types/
```

Only create directories required by real implementation.

Do not create speculative empty structure merely to match documentation.

---

# No Permission Logic in Shared

Do not place authorization policy in:

```text
src/shared/
```

Permissions is a reusable SaaS business capability.

It belongs to Platform Core.

---

# No Permission Logic in lib

`src/lib` may provide infrastructure adapters.

It must not own:

```text
RolePermission policy

Permission evaluation

authorization rules
```

---

# No Permission Logic in app

`src/app` may call:

```text
requirePermission()
```

but must not contain the canonical Permission engine.

---

# No Domain Permission Engine

Domains may define capability semantics and consume Permissions.

They must not create competing authorization engines such as:

```text
DJPermissionService

CopyPermissionSystem
```

that bypass Platform Core Permissions.

---

# Infrastructure Dependency

Permissions Foundation depends on:

```text
Prisma

PostgreSQL
```

and existing Core entities:

```text
Role

OrganizationMembership
```

for complete tenant authorization.

---

# Required Module Dependencies

Permissions consumes:

```text
Roles

Memberships

Tenancy context
```

It may integrate with:

```text
Audit

Cache
```

later.

---

# Permissions Foundation Sequence

Current architecture sequence:

```text
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
```

Documentation may be specified before source implementation.

Actual coding must respect implementation prerequisites.

---

# Permissions Persistence Foundation

Initial persistence should establish:

```text
Permission

RolePermission

unique Permission key

unique Role + Permission mapping

real Role foreign key

real Permission foreign key
```

No tenant-specific RolePermission model is required initially.

---

# Permissions Service Foundation

Initial service layer should establish:

```text
getPermission

getPermissionByKey

listPermissions

resolveRequiredPermission

getPermissionsForRole

hasPermission

requirePermission

validatePermissionCatalog
```

Policy synchronization may be internal.

---

# Production Authorization Integration

Once Permissions exists, production administrative Core operations should use it.

Examples:

```text
Memberships.createInvitation
→ requires approved Permission

Memberships.suspendMembership
→ requires approved Permission

Memberships.removeMembership
→ requires approved Permission

Memberships.changeMembershipRole
→ requires approved Permission

Organizations ownership transfer
→ requires approved Permission
```

Structural invariants remain with their owners.

---

# Authorization Does Not Replace Ownership Invariants

Even if:

```text
organizations.transfer_ownership
```

is granted, the operation must not create:

```text
zero OWNERs

two OWNERs

OWNER in another Organization

ownership transfer to REMOVED Membership
```

Permission means:

```text
actor may request operation
```

not:

```text
all invariants are bypassed
```

---

# Authorization Does Not Replace Validation

Permission granted does not bypass:

```text
input validation

resource existence

tenant ownership

lifecycle state

transaction requirements

database constraints
```

---

# Non-Goals

Permissions Foundation does not implement:

```text
custom tenant Roles

multiple Roles per Membership

per-Membership Permission overrides

per-Organization Permission overrides

explicit DENY rules

wildcard Permissions

Role inheritance

Permission inheritance

ABAC

policy DSL

platform super-admin

dynamic user-created Permissions

field-level authorization engine

direct Domain business logic

subscription entitlements

feature flags
```

---

# Permissions vs Feature Flags

Feature availability and authorization are different.

Example:

```text
feature enabled?
```

does not answer:

```text
is this Membership authorized?
```

Do not use Permissions as a generic feature-flag system.

---

# Permissions vs Subscription Entitlements

Subscription plan may determine:

```text
which product capability exists for the Organization
```

Permissions determines:

```text
which Membership may use an available capability
```

Future operation may require both:

```text
subscription entitlement
+
Permission
```

Billing/entitlement architecture remains separate.

---

# Permissions vs Domain State

Permission may allow:

```text
order.cancel
```

while Domain state may reject cancellation because:

```text
Order already completed
```

Authorization and business state must both succeed.

---

# Permissions vs Ownership

Resource ownership such as:

```text
createdByProfileId
```

may be a Domain or entity rule.

Do not assume RolePermission alone represents record ownership.

---

# Future Custom Role Evolution

If custom Organization Roles are later introduced, the likely model may evolve toward:

```text
Organization-specific Role
        ↓
RolePermission
        ↓
Permission
```

That requires an approved Roles architecture change.

Do not pre-add:

```text
organizationId
```

to current Permission or RolePermission models merely for hypothetical future custom Roles.

---

# Future Permission Overrides

If validated requirements later demand exceptional grants or denies per Membership, that is a major authorization-model change.

It requires explicit design for:

```text
precedence

audit

security UI

RLS

caching

conflict resolution
```

Do not implement early.

---

# Future ABAC

If future enterprise requirements need policy based on:

```text
resource attributes

user attributes

time

location

ownership

risk
```

an ABAC/policy layer may complement RBAC.

That is outside Permissions Foundation.

---

# Future Platform Administration

Platform-level authorization must be designed separately from Organization tenancy.

Do not overload:

```text
Role

Permission

Membership
```

with undocumented global administrator semantics.

---

# Permission Documentation Readiness

Permissions is ready for implementation only when:

```text
SPEC

DATA_MODEL

FLOWS

API

PRISMA

TASKS
```

agree on:

```text
Permission ownership

RolePermission ownership

key strategy

explicit grants

deny-by-default

no OWNER bypass

no Role inheritance

no wildcards

tenant context

system policy synchronization

Permissions boundary
```

---

# Definition of Ready

Permissions Foundation is ready for implementation when:

- Roles Foundation exists in source.
- Memberships Foundation exists in source.
- Tenancy context strategy is stable.
- Permission entity ownership is approved.
- RolePermission ownership is approved.
- Permission-key format is approved.
- UUID strategy is confirmed.
- Permission definitions are global initially.
- RolePermission mappings are global initially.
- System Role policy is explicit.
- OWNER does not bypass Permission evaluation.
- Missing mappings deny by default.
- No Role hierarchy authorization is used.
- No wildcard semantics are used.
- No deny rules are used initially.
- Permission catalog synchronization strategy is approved.
- RolePermission synchronization strategy is approved.
- Core protected operations have identified Permission keys.
- Domain extension boundary is understood.
- RLS boundary is understood.
- Required tests can be implemented.

---

# Definition of Done

Permissions Foundation is complete when:

- Permission persistence exists.
- RolePermission persistence exists.
- Permission IDs use UUID.
- Permission keys are unique.
- RolePermission Role/Permission pairs are unique.
- Real Role foreign keys are used.
- No hard-coded Role UUIDs exist.
- No hard-coded Permission UUIDs exist.
- Canonical Permission catalog exists.
- Permission synchronization is idempotent.
- RolePermission system policy exists.
- RolePermission synchronization is idempotent.
- Missing Permission mappings deny access.
- OWNER has no authorization bypass.
- Role hierarchy is not used as authorization.
- Wildcard Permissions are absent.
- Permission inheritance is absent.
- Membership Permission overrides are absent.
- Organization Permission overrides are absent.
- `getPermission` works.
- `getPermissionByKey` works.
- `listPermissions` works.
- `resolveRequiredPermission` works.
- `getPermissionsForRole` works.
- `hasPermission` works.
- `requirePermission` works.
- Permission catalog validation works.
- Tenant context is resolved server side.
- SUSPENDED Membership cannot authorize.
- REMOVED Membership cannot authorize.
- Cross-tenant authorization is denied.
- Protected Membership administration uses Permissions.
- Protected ownership transfer uses Permissions.
- Core authorization tests pass.
- Prisma format passes.
- Prisma validation passes.
- Prisma generation passes.
- TypeScript passes.
- Lint passes.
- Documentation matches implementation.

---

# Final Principle

Permissions defines capabilities.

Roles group capabilities.

Memberships assign Roles inside Organizations.

Identity identifies the person.

Organizations define the tenant.

Tenancy establishes the secure context.

A Permission grant allows an actor to request a capability.

It does not bypass tenant isolation, Membership state, Organization lifecycle, ownership invariants or Domain business rules.

Authorization is explicit.

Missing authorization denies access.

OWNER is not a magic bypass.

Role hierarchy is not a permission engine.

Every effective capability must come from approved, explicit policy.