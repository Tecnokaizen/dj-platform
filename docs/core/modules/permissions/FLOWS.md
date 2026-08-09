---
title: Permissions Flows
version: 1.0.0
status: Draft
owner: Platform Core
updated: 2026-08-09
related:
  - SPEC.md
  - DATA_MODEL.md
  - API.md
  - PRISMA.md
  - TASKS.md
  - ../roles/FLOWS.md
  - ../roles/API.md
  - ../memberships/FLOWS.md
  - ../memberships/API.md
  - ../organizations/FLOWS.md
  - ../../../architecture/TENANCY.md
  - ../../../architecture/IDENTITY.md
  - ../../../architecture/SECURITY.md
  - ../../../architecture/DATA.md
---

# Permissions Flows

## Purpose

This document defines the workflows owned by or coordinated through the Platform Core Permissions module.

Permissions owns:

```text
Permission catalog lifecycle

RolePermission policy synchronization

Permission lookup

effective Permission resolution

authorization evaluation

authorization guards
```

Permissions does not own:

```text
Authentication

Organization lifecycle

Membership lifecycle

Role definition

Membership Role assignment

Organization ownership invariants

Domain business rules
```

---

# Authorization Chain

Canonical tenant authorization:

```text
Authenticated Identity
        ↓
Profile
        ↓
Organization
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

Each layer has a different responsibility.

---

# Authorization Responsibilities

```text
Identity
→ authenticate and resolve Profile

Organizations
→ resolve tenant and lifecycle state

Memberships
→ establish tenant belonging

Roles
→ provide Role definition

Permissions
→ evaluate explicit capability grants

Owning Core Module / Domain
→ enforce operation-specific invariants
```

Permissions must not absorb the responsibilities of the other layers.

---

# Deny-by-Default Flow

Every authorization decision is fail-closed.

Conceptually:

```text
Can Permission be proven?
        ├── YES → continue
        └── NO  → DENY
```

Examples resulting in denial:

```text
No valid tenant context

Organization inaccessible

No Membership

Membership not ACTIVE

Role missing

Permission missing

RolePermission mapping missing

unknown Permission key
```

Uncertainty never grants access.

---

# Permission Catalog Initialization

Canonical Permission definitions are controlled by application source.

Conceptually:

```text
Version-Controlled Permission Registry
        ↓
Validate Definitions
        ↓
Synchronize Permission Records
        ↓
Validate Persisted Catalog
```

This is an internal platform operation.

It is not a tenant user workflow.

---

# Permission Registry Validation

Before synchronization, validate source definitions.

Required checks:

```text
Permission key exists

Permission key format valid

Permission keys unique

name present

owner metadata valid where used

no wildcard keys

no duplicate semantic capability
```

Failure:

```text
STOP

Do not modify authorization persistence
```

---

# Permission Key Validation

Canonical key examples:

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

Initial key format:

```text
lowercase

dot-separated namespace

explicit capability
```

Do not accept:

```text
*

memberships.*

Organizations.Read

MEMBERSHIPS_REMOVE
```

as canonical Foundation Permission keys.

---

# Synchronize Permission Catalog

For each declared Permission:

```text
Declared Permission
        ↓
Find persisted Permission by key
        ↓
Exists?
        ├── NO
        │    ↓
        │  Create Permission
        │  generated UUID
        │
        └── YES
             ↓
           Compare approved metadata
             ↓
           Update name/description if required
```

The key remains stable.

---

# Permission Synchronization Idempotency

Running synchronization repeatedly must converge to the same state.

It must not create:

```text
duplicate Permission rows

new UUID copies of existing semantic Permissions

duplicate capability keys
```

The synchronization identity is:

```text
Permission.key
```

not:

```text
Permission.id
```

---

# Permission Key Change

A key change is not normal metadata synchronization.

Invalid automatic behavior:

```text
old key missing from registry
+
new similar key exists
        ↓
rename automatically
```

Correct:

```text
explicit migration required
```

A Permission key may be referenced by:

```text
authorization checks

RolePermission mappings

tests

Domains

documentation

cache
```

---

# Unknown Persisted Permission

If persistence contains:

```text
legacy.permission
```

but the current source registry does not:

```text
detect drift
        ↓
report
        ↓
require explicit migration/deprecation
```

Do not automatically hard-delete the Permission.

---

# Permission Catalog Validation

After synchronization:

```text
Canonical Registry
        ↓
Persisted Permissions
        ↓
Compare
```

Validate at minimum:

```text
all required keys exist

no duplicate keys

required metadata valid

no missing canonical Permission
```

Unknown legacy Permissions should be reported separately.

---

# Resolve Permission By Key

Canonical lookup:

```text
permissionKey
        ↓
Validate key
        ↓
Permission Repository
        ↓
Find by unique key
        ↓
Permission found?
        ├── YES → return Permission
        └── NO  → PERMISSION_NOT_FOUND
```

This is a lookup.

It does not grant authorization by itself.

---

# Resolve Required Permission

Internal code may require a canonical Permission to exist.

Conceptually:

```text
resolveRequiredPermission(
  "memberships.remove"
)
```

Flow:

```text
Canonical Permission Key
        ↓
Find Permission
        ↓
Found?
        ├── YES → return
        └── NO  → REQUIRED_PERMISSION_MISSING
```

No runtime auto-creation occurs.

---

# Unknown Permission During Authorization

If a caller asks:

```text
hasPermission(context, unknownPermission)
```

the safe result is:

```text
false
```

If the caller expected a canonical system Permission, diagnostics may additionally identify:

```text
REQUIRED_PERMISSION_MISSING
```

Authorization must still deny.

---

# System Role Permission Policy

Initial system policy maps:

```text
Role.key
        ↓
Permission.key[]
```

Canonical system Roles:

```text
OWNER

ADMIN

MANAGER

MEMBER

VIEWER
```

The mapping itself is the authorization policy.

---

# Initial Foundation Permission Policy

The canonical Foundation policy is explicitly defined.

```text
OWNER
→ organizations.read
→ organizations.update
→ organizations.transfer_ownership
→ memberships.read
→ memberships.suspend
→ memberships.restore
→ memberships.remove
→ memberships.change_role
→ invitations.read
→ invitations.create
→ invitations.revoke
→ invitations.resend
```

```text
ADMIN
→ organizations.read
→ organizations.update
→ memberships.read
→ memberships.suspend
→ memberships.restore
→ memberships.remove
→ memberships.change_role
→ invitations.read
→ invitations.create
→ invitations.revoke
→ invitations.resend
```

```text
MANAGER
→ organizations.read
→ memberships.read
```

```text
MEMBER
→ organizations.read
```

```text
VIEWER
→ organizations.read
```

This is explicit policy.

It is not Role inheritance.

---

# No Role Hierarchy Flow

Do not evaluate:

```text
OWNER > ADMIN > MANAGER > MEMBER > VIEWER
```

as authorization.

Do not perform:

```text
if actorRole.sortOrder <= requiredRole.sortOrder
→ allow
```

Authorization uses RolePermission mappings only.

---

# No Role Inheritance Flow

Do not implement:

```text
OWNER inherits ADMIN

ADMIN inherits MANAGER

MANAGER inherits MEMBER

MEMBER inherits VIEWER
```

Permission resolution does not recursively traverse Roles.

Every effective grant is persisted explicitly.

---

# No OWNER Bypass Flow

Invalid:

```text
Role.key = OWNER?
        ├── YES → allow everything
```

Correct:

```text
Role.key = OWNER
        ↓
Resolve RolePermission mappings
        ↓
Requested Permission mapped?
        ├── YES → allow
        └── NO  → deny
```

OWNER remains subject to explicit Permission policy.

---

# Why OWNER Is Explicit

When a new Permission is introduced:

```text
new Permission
        ↓
OWNER has no mapping yet
        ↓
DENY
```

until policy explicitly grants it.

This prevents silent privilege expansion.

---

# Synchronize RolePermission Policy

System policy synchronization resolves semantic keys to real persistence IDs.

For each policy mapping:

```text
Role key
+
Permission key
        ↓
Resolve Role
        ↓
Resolve Permission
        ↓
Ensure RolePermission exists
```

---

# Missing Role During Policy Sync

Example:

```text
policy expects ADMIN
+
ADMIN Role missing
```

Result:

```text
FAIL
```

Permissions must not:

```text
create ADMIN

create temporary Role

substitute another Role
```

Roles owns the Role catalog.

---

# Missing Permission During Policy Sync

Example:

```text
ADMIN policy
→ memberships.remove

Permission missing
```

Result:

```text
FAIL
```

The catalog must be corrected before RolePermission synchronization can complete.

---

# RolePermission Creation

Conceptually:

```text
Resolved Role.id
+
Resolved Permission.id
        ↓
RolePermission exists?
        ├── YES → no duplicate
        └── NO  → create mapping
```

Required database uniqueness:

```text
roleId + permissionId
```

provides final duplicate protection.

---

# RolePermission Synchronization Idempotency

Repeated synchronization must not create duplicate grants.

Expected:

```text
same source policy
+
same persisted state
        ↓
no semantic changes
```

---

# Unexpected RolePermission Mapping

Example:

```text
VIEWER
→ memberships.remove
```

exists in persistence but not canonical policy.

This is security-sensitive drift.

Flow:

```text
Persisted Mapping
        ↓
Not in canonical policy
        ↓
Report unexpected grant
        ↓
Fail policy validation or flag security drift
```

Do not silently treat the persisted database as the intended policy.

---

# Removing Unexpected RolePermission

Initial safe approach:

```text
detect
        ↓
review
        ↓
explicit approved reconciliation
        ↓
remove mapping
```

Do not build uncontrolled automatic destructive cleanup before policy synchronization behavior is explicitly approved.

---

# Policy Synchronization Transaction

Where the synchronization changes several related mappings:

```text
BEGIN
        ↓
Resolve canonical Roles
        ↓
Resolve canonical Permissions
        ↓
Create required mappings
        ↓
Apply approved removals if explicitly configured
        ↓
COMMIT
```

If required catalog dependencies fail:

```text
ROLLBACK
```

Avoid partially synchronized authorization policy.

---

# Validate System Role Policy

After synchronization:

```text
Declared Role Policy
        ↓
Persisted RolePermission mappings
        ↓
Compare
```

Detect:

```text
missing mappings

unexpected mappings

missing Roles

missing Permissions

duplicate semantic grants
```

---

# Effective Permissions For Role

Canonical resolution:

```text
roleId
        ↓
Role exists?
        ↓
RolePermission mappings
        ↓
Permission records
        ↓
Permission.key[]
```

No hierarchy expansion occurs.

---

# getPermissionsForRole

Conceptual flow:

```text
roleId
        ↓
Validate UUID
        ↓
Resolve Role
        ↓
RolePermission Repository
        ↓
Return explicit Permission set
```

Unknown Role:

```text
ROLE_NOT_FOUND
```

Do not infer Permissions from Role key or name.

---

# Effective Permission Set

Example:

```text
Role = MANAGER
```

Persisted mappings:

```text
organizations.read

memberships.read
```

Effective result:

```text
[
  organizations.read,
  memberships.read
]
```

No implicit ADMIN or MEMBER capabilities are merged.

---

# Tenant Authorization Context

Permission evaluation requires trusted tenancy context.

Conceptually:

```text
TenantContext
├── profileId
├── organizationId
├── membershipId
├── roleId
└── roleKey
```

This context is resolved server side.

It is not client-provided authority.

---

# Tenant Context Resolution

Before Permission evaluation:

```text
Authenticated Identity
        ↓
Resolve Profile
        ↓
Resolve Organization
        ↓
Organization lifecycle valid?
        ↓
Resolve OrganizationMembership
        ↓
Membership ACTIVE?
        ↓
Resolve Role
        ↓
Build Trusted Tenant Context
```

Permissions consumes this context.

Permissions does not recreate Membership persistence.

---

# Invalid Authorization Context

Examples:

```text
missing membershipId

Membership belongs to another Organization

Membership not ACTIVE

roleId does not match persisted Membership

Organization inaccessible
```

Result:

```text
INVALID_AUTHORIZATION_CONTEXT
```

or the relevant upstream tenancy error.

Authorization denies.

---

# hasPermission

Canonical boolean authorization flow:

```text
Trusted Tenant Context
        ↓
Validate context
        ↓
Requested Permission Key
        ↓
Resolve Permission
        ↓
Resolve RolePermission mapping
        ↓
Mapping exists?
        ├── YES → true
        └── NO  → false
```

No hidden fallback exists.

---

# hasPermission — Missing Permission

```text
Permission key not found
        ↓
false
```

Optionally record internal configuration diagnostics.

Never:

```text
unknown Permission
→ allow
```

---

# hasPermission — Inactive Membership

If the trusted context cannot prove:

```text
Membership ACTIVE
```

result:

```text
false
```

even if the Role has the requested RolePermission mapping.

---

# hasPermission — Cross-Tenant Context

Example:

```text
Profile A
→ ADMIN in Organization A
```

request:

```text
Organization B
memberships.remove
```

If no valid ACTIVE Membership in B:

```text
DENY
```

The global ADMIN Role definition does not provide global tenant authority.

---

# requirePermission

Guard-style authorization flow:

```text
Trusted Tenant Context
        ↓
Requested Permission
        ↓
hasPermission()
        ↓
Granted?
        ├── YES → continue
        └── NO  → PERMISSION_DENIED
```

This is the preferred application guard for protected operations.

---

# requirePermission Error

External/application result should normally remain stable:

```text
PERMISSION_DENIED
```

Internal diagnostics may preserve more detail for observability without exposing sensitive authorization policy.

---

# Protected Operation Flow

Canonical server operation:

```text
Request
        ↓
Authenticate
        ↓
Validate Input
        ↓
Resolve Tenant Context
        ↓
requirePermission()
        ↓
Owning Service
        ↓
Validate Resource / Business Invariants
        ↓
Persist
```

Permission success is necessary.

It is not sufficient to bypass the owning service.

---

# Permission Check Placement

Permission checks should occur before executing protected mutation behavior.

Example:

```text
Create Invitation Request
        ↓
Resolve Tenant Context
        ↓
requirePermission("invitations.create")
        ↓
Memberships.createInvitation()
```

Memberships still validates:

```text
actor Membership

Organization consistency

target Role

OWNER restrictions

duplicate invitation

invitation lifecycle
```

---

# Membership Read Flow

Protected Membership administration:

```text
Request Organization Members
        ↓
Resolve Tenant Context
        ↓
requirePermission("memberships.read")
        ↓
Memberships list service
```

ACTIVE Membership alone does not automatically grant member-directory access.

---

# Suspend Membership Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("memberships.suspend")
        ↓
Memberships.suspendMembership()
        ↓
Validate target Membership
        ↓
Validate lifecycle
        ↓
Validate OWNER safety
        ↓
Persist
```

Permissions does not implement suspension logic.

---

# Restore Membership Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("memberships.restore")
        ↓
Memberships.restoreMembership()
```

Memberships owns lifecycle validation.

---

# Remove Membership Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("memberships.remove")
        ↓
Memberships.removeMembership()
```

Permission cannot bypass:

```text
OWNER safety
```

---

# Change Membership Role Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("memberships.change_role")
        ↓
Memberships.changeMembershipRole()
        ↓
Resolve target Role
        ↓
Validate OWNER rules
        ↓
Persist roleId
```

---

# Invitation Read Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("invitations.read")
        ↓
Memberships list Invitations
```

Invitation secrets remain excluded.

---

# Create Invitation Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("invitations.create")
        ↓
Memberships.createInvitation()
        ↓
Validate target recipient
        ↓
Validate Role
        ↓
Reject normal OWNER invitation
        ↓
Persist Invitation
```

---

# Revoke Invitation Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("invitations.revoke")
        ↓
Memberships.revokeInvitation()
```

Permissions does not own invitation status transitions.

---

# Resend Invitation Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("invitations.resend")
        ↓
Memberships.resendInvitation()
        ↓
Rotate token securely
        ↓
Commit
        ↓
Notification delivery
```

---

# Organization Read Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("organizations.read")
        ↓
Organizations read operation
```

Public Organization data may use a different public-access path where explicitly designed.

---

# Organization Update Flow

```text
Actor
        ↓
Resolve Tenant Context
        ↓
requirePermission("organizations.update")
        ↓
Organizations.update()
        ↓
Validate Organization state
        ↓
Persist approved changes
```

---

# Ownership Transfer Authorization

Canonical flow:

```text
Current Tenant Context
        ↓
requirePermission(
  "organizations.transfer_ownership"
)
        ↓
Organizations / Memberships ownership transfer
        ↓
Validate current OWNER
        ↓
Validate target ACTIVE Membership
        ↓
Validate same Organization
        ↓
Resolve OWNER Role
        ↓
Resolve previous-owner Role
        ↓
BEGIN
        ↓
Transfer Role assignments
        ↓
Validate exactly one ACTIVE OWNER
        ↓
COMMIT
```

Permission grants the ability to request transfer.

Organizations/Memberships preserve the invariant.

---

# ADMIN Ownership Transfer

Initial policy does not grant:

```text
organizations.transfer_ownership
```

to ADMIN.

Therefore:

```text
ADMIN
        ↓
requirePermission(
  organizations.transfer_ownership
)
        ↓
DENY
```

even though ADMIN has broad tenant administration capabilities.

---

# OWNER Ownership Transfer

OWNER has the explicit mapping:

```text
OWNER
→ organizations.transfer_ownership
```

This does not bypass structural checks.

---

# Initial Organization Creation

Creating the first Organization cannot depend on tenant Permission because no Membership exists yet.

Bootstrap flow:

```text
Authenticated Profile
        ↓
Create Organization
        ↓
Create OWNER Membership
```

This is a tenancy bootstrap workflow.

Permissions does not artificially create:

```text
organizations.create
```

as a tenant Permission merely to authorize pre-tenant onboarding.

A future platform-level Organization creation policy may be designed separately if required.

---

# Invitation Acceptance

The invited recipient may not yet belong to the Organization.

Therefore acceptance does not require:

```text
invitations.create

invitations.read

any pre-existing tenant Permission
```

Acceptance authorization is:

```text
valid Invitation
+
authenticated matching identity
+
Memberships lifecycle rules
```

This remains a controlled bootstrap path into tenant Membership.

---

# Self-Service Flows

Not every authenticated operation requires tenant Permissions.

Example:

```text
Profile updates own profile information
```

may remain Identity-owned self-service behavior.

Permissions should not become a universal authorization wrapper around unrelated identity operations.

---

# Domain Permission Flow

Future Domain-protected operation:

```text
Domain Request
        ↓
Resolve Tenant Context
        ↓
requirePermission(
  "copy.orders.update"
)
        ↓
Copy Domain Service
        ↓
Validate Order belongs to Organization
        ↓
Validate Order state
        ↓
Update
```

Permissions evaluates capability.

The Domain owns Order behavior.

---

# Domain Permission Registration

A Domain may declare:

```text
copy.orders.update
```

through an approved Permission registry extension.

Flow:

```text
Domain Capability Registry
        ↓
Permission Catalog Synchronization
        ↓
Permission persisted
        ↓
Approved default system Role mappings synchronized
```

---

# Domain Permission Ownership

Example:

```text
Permission:
copy.orders.update
```

Ownership split:

```text
Copy Domain
→ owns update Order behavior

Permissions
→ owns capability persistence/evaluation
```

---

# Domain Policy Must Be Explicit

Do not derive Domain grants from:

```text
Role hierarchy

namespace

other Domain policies
```

Example:

```text
ADMIN
→ copy.orders.update
```

must be declared explicitly if approved.

---

# No Namespace Inheritance

The existence of:

```text
copy.orders.read
```

does not imply:

```text
copy.orders.update
```

Likewise:

```text
memberships.read
```

does not imply:

```text
memberships.remove
```

---

# No Wildcard Evaluation

Do not implement:

```text
ADMIN has memberships.*
```

then pattern-match:

```text
memberships.remove
```

Every authorization lookup uses an explicit canonical Permission.

---

# No Permission Composition

Do not infer:

```text
memberships.remove
```

from combinations such as:

```text
memberships.read
+
memberships.change_role
```

Capabilities do not imply one another initially.

---

# No Explicit DENY Flow

Initial model has no persisted deny mapping.

Therefore there is no:

```text
ALLOW mapping
vs
DENY mapping
```

precedence calculation.

The rule is:

```text
grant exists
→ allow capability

grant absent
→ deny capability
```

---

# No Membership Override Flow

Do not evaluate:

```text
Role Permissions
+
Membership-specific extra Permissions
-
Membership denied Permissions
```

Foundation contains no Membership Permission overrides.

---

# No Organization Override Flow

Do not evaluate:

```text
global RolePermission
+
Organization-specific RolePermission
```

Foundation system policy is global.

Tenant scope comes from Membership.

---

# No Permission Mutation by Tenant Users

Initial system Role policy is platform-controlled.

Tenant users must not receive APIs such as:

```text
grantPermissionToRole

revokePermissionFromRole
```

for canonical system Roles.

---

# Internal Grant Flow

System policy synchronization may internally create a RolePermission.

Flow:

```text
Canonical Policy
        ↓
Resolve Role by key
        ↓
Resolve Permission by key
        ↓
Mapping missing?
        ↓
Create RolePermission
```

This is trusted internal configuration work.

---

# Internal Revoke Flow

When approved policy migration removes a grant:

```text
Canonical Policy Change
        ↓
Security Review
        ↓
Explicit Synchronization / Migration
        ↓
Delete RolePermission
        ↓
Invalidate Authorization Cache
```

This is not normal tenant runtime behavior.

---

# Permission Catalog Extension

Adding a Permission:

```text
Declare new Permission
        ↓
Review capability owner
        ↓
Synchronize Permission
        ↓
No Role receives it automatically
        ↓
Review system Role policy
        ↓
Add explicit approved mappings
```

This is especially important for OWNER.

---

# New Permission Safety

Suppose a new capability is added:

```text
organizations.delete_permanently
```

After Permission creation but before Role mapping:

```text
OWNER
→ DENY

ADMIN
→ DENY

all Roles
→ DENY
```

This is intentional fail-closed behavior.

---

# Permission Removal Flow

Removing a canonical capability requires coordinated work.

```text
Identify Permission
        ↓
Remove protected-operation dependency
        ↓
Update policy registry
        ↓
Remove RolePermission mappings deliberately
        ↓
Deprecate / remove Permission
        ↓
Update tests
        ↓
Update docs
```

Do not hard-delete the Permission first.

---

# Rename Permission Flow

Permission key rename:

```text
Old Permission Key
        ↓
Architecture / API migration decision
        ↓
Add migration
        ↓
Update application constants
        ↓
Update Role policy
        ↓
Update Domain/Core callers
        ↓
Update tests
        ↓
Update database safely
```

It is not a metadata edit.

---

# Permission Metadata Update

Changing:

```text
name

description
```

may use normal idempotent synchronization.

These fields do not affect authorization identity.

---

# Policy Drift Validation

Recommended flow:

```text
Load Canonical Permission Registry
        ↓
Load Persisted Permission Catalog
        ↓
Load Canonical Role Policy
        ↓
Load Persisted RolePermission Mappings
        ↓
Compare
        ↓
Produce Drift Report
```

Possible findings:

```text
missing Permission

unknown Permission

missing RolePermission

unexpected RolePermission

missing Role
```

---

# Policy Drift and Runtime

A runtime authorization check should remain deny-by-default even if drift exists.

Example:

```text
required mapping missing
        ↓
DENY
```

Do not compensate for drift by inferring intended policy.

---

# Authorization Cache

Permission evaluation may cache effective Permission sets for a Role.

Conceptually:

```text
Role.id
        ↓
[
  permission.key,
  permission.key,
  ...
]
```

Caching is optional.

Correctness comes first.

---

# Effective Permission Cache Lookup

Conceptual:

```text
roleId
        ↓
Permission Cache
        ↓
Hit?
        ├── YES → use trusted Permission set
        └── NO
             ↓
           query RolePermission
             ↓
           build Permission set
             ↓
           cache
```

---

# Authorization Cache Invalidation

Invalidate affected Role Permission cache when:

```text
RolePermission added

RolePermission removed

Permission catalog materially changes
```

Tenant context must also be invalidated when:

```text
Membership Role changes

Membership becomes SUSPENDED

Membership becomes REMOVED

Organization becomes inaccessible
```

---

# No Persisted Permission Snapshot

Do not implement caching by writing:

```text
OrganizationMembership.permissions
```

or:

```text
Profile.permissions
```

Cached authorization belongs in a cache layer.

Canonical authorization persistence remains relational.

---

# UI Effective Permissions

A server may return effective Permission keys to the client for presentation.

Flow:

```text
Trusted Tenant Context
        ↓
getEffectivePermissions()
        ↓
Return approved Permission keys
        ↓
UI adapts
```

Example:

```text
no invitations.create
→ hide Invite button
```

---

# UI Is Not Authorization

Even if the client shows:

```text
Invite button
```

the server must still execute:

```text
requirePermission("invitations.create")
```

Client-side state is not authoritative.

---

# Permission Evaluation Performance

Permission checks may occur frequently.

Allowed optimizations:

```text
explicit projection

indexed lookups

trusted cached Permission sets

batched effective Permission resolution
```

Not allowed:

```text
skip authorization

trust stale client Permissions

infer Role privileges

bypass Membership state
```

---

# Membership Role Change and Authorization Cache

When Membership changes:

```text
MEMBER
→ ADMIN
```

its tenant authorization context must be refreshed.

Old Permission state must not remain authoritative.

---

# Membership Suspension and Authorization Cache

When:

```text
ACTIVE
→ SUSPENDED
```

any previously cached Permission set for that tenant session must not continue granting access.

Membership state takes precedence over stale capability cache.

---

# Membership Removal and Authorization Cache

When:

```text
ACTIVE
→ REMOVED
```

normal tenant authorization becomes invalid immediately.

---

# Organization Suspension

Even if Role Permission cache still contains grants:

```text
Organization = SUSPENDED
```

must prevent normal tenant operations through Tenancy rules.

---

# Permission-Aware RLS Boundary

Initial Foundation does not duplicate the complete Permission engine into PostgreSQL RLS.

Preferred initial separation:

```text
RLS
→ tenant Membership isolation

Application Permissions
→ operation-level authorization
```

---

# Direct Database Client Risk

If future clients write directly to Supabase tables:

```text
server requirePermission()
```

cannot protect those writes.

At that point, Permission-aware RLS requires a dedicated design.

Do not assume server authorization covers paths that bypass the server.

---

# Future Permission-Aware RLS

Possible future conceptual helper:

```text
has_permission(
  organization_id,
  permission_key
)
```

would need to resolve:

```text
authenticated identity

ACTIVE Membership

Role

RolePermission

Permission
```

This is not part of Foundation unless required by the actual access architecture.

---

# Server Action Flow

Preferred protected Server Action:

```text
Server Action
        ↓
Validate Input
        ↓
Resolve Authenticated Profile
        ↓
Resolve Tenant Context
        ↓
requirePermission()
        ↓
Call Owning Service
        ↓
Revalidate / Redirect
```

Server Action must not implement the Permission engine directly.

---

# Route Handler Flow

Protected Route Handler:

```text
HTTP Request
        ↓
Authentication
        ↓
Input Validation
        ↓
Tenant Context
        ↓
requirePermission()
        ↓
Owning Service
        ↓
Stable Response
```

Transport does not own authorization policy.

---

# Server Component Flow

A Server Component may evaluate capabilities for secure rendering.

Conceptually:

```text
Resolve Tenant Context
        ↓
getEffectivePermissions()
        ↓
Render authorized UI
```

Mutation security still belongs to protected server operations.

---

# Background Job Flow

Trusted system jobs may operate without tenant-user Permission evaluation when explicitly designated internal.

Example:

```text
Expire Invitations Job
```

Correct:

```text
trusted internal job identity/path
        ↓
Memberships maintenance service
```

Not:

```text
fake OWNER Membership
        ↓
bypass Permissions
```

---

# Seed Flow

Permission seed/synchronization is trusted internal infrastructure.

It does not require:

```text
OrganizationMembership

tenant Permission

fake administrator
```

---

# Migration Flow

Database migration adding Permissions may:

```text
create Permission model

create RolePermission model

create indexes

create constraints
```

Then trusted synchronization populates the canonical catalog/policy.

Do not mix runtime tenant authorization into migration execution.

---

# Authorization Error Flow

Externally:

```text
Permission missing from actor
        ↓
PERMISSION_DENIED
```

Internally, diagnostic context may distinguish:

```text
Permission does not exist

Role does not have mapping

authorization context invalid
```

Do not expose sensitive policy details unnecessarily.

---

# Cross-Tenant Denial Flow

Example:

```text
Profile A
→ ADMIN Membership in Organization A
```

request:

```text
remove Membership from Organization B
```

Flow:

```text
Target Organization B
        ↓
Resolve Profile A Membership in B
        ↓
No ACTIVE Membership
        ↓
Tenant Context cannot be established
        ↓
DENY
```

Permissions must not search for:

```text
any ADMIN Membership anywhere
```

---

# Resource Tenant Validation

Permission success does not prove the target resource belongs to the active tenant.

Example:

```text
Permission granted:
copy.orders.update
```

Owning Domain still verifies:

```text
Order.organizationId
=
TenantContext.organizationId
```

Cross-tenant resource access remains forbidden.

---

# Resource State Validation

Permission success does not bypass lifecycle rules.

Example:

```text
copy.orders.update granted
```

but:

```text
Order = COMPLETED
```

may still reject the operation.

Domain owns that decision.

---

# Permission Is Necessary but Not Sufficient

Canonical protected mutation:

```text
Valid Tenant Context
+
Required Permission
+
Resource Tenant Match
+
Valid Business State
+
Valid Input
=
operation may proceed
```

---

# Permission Testing Flow

Testing must cover:

```text
catalog synchronization

policy synchronization

Permission lookup

effective Permission resolution

hasPermission

requirePermission

Role-specific grants

missing mappings

inactive Membership

cross-tenant denial

OWNER no-bypass behavior
```

---

# Catalog Synchronization Tests

Verify:

```text
first sync creates canonical Permissions

second sync creates no duplicates

metadata updates reconcile

unknown legacy Permission reported

key uniqueness preserved
```

---

# Role Policy Synchronization Tests

Verify:

```text
canonical mappings created

second sync idempotent

missing Role fails

missing Permission fails

unexpected mapping detected

duplicate mapping impossible
```

---

# OWNER Policy Tests

Verify:

```text
OWNER receives only explicit mappings

OWNER can transfer ownership because mapping exists

new unmapped Permission denied to OWNER

OWNER bypass does not exist
```

---

# ADMIN Policy Tests

Verify:

```text
ADMIN can organizations.update

ADMIN can Membership administration according to policy

ADMIN cannot organizations.transfer_ownership
```

---

# MANAGER Policy Tests

Foundation expectations:

```text
organizations.read
→ allowed

memberships.read
→ allowed

memberships.remove
→ denied

invitations.create
→ denied
```

---

# MEMBER Policy Tests

Foundation expectations:

```text
organizations.read
→ allowed

memberships.read
→ denied
```

unless future approved policy changes the mapping.

---

# VIEWER Policy Tests

Foundation expectations:

```text
organizations.read
→ allowed

all Foundation tenant mutation Permissions
→ denied
```

through absence of mappings.

---

# No Role Inheritance Tests

Verify removing a mapping from:

```text
ADMIN
```

does not cause Permissions to be inherited from:

```text
MANAGER
```

or any other Role.

---

# No Wildcard Tests

Verify:

```text
memberships.*
```

is not recognized as a valid implicit grant.

---

# Membership State Tests

Given a Role containing:

```text
memberships.read
```

verify:

```text
ACTIVE Membership
→ allowed

SUSPENDED Membership
→ denied

REMOVED Membership
→ denied
```

---

# Cross-Tenant Tests

Given:

```text
ADMIN in Organization A
VIEWER in Organization B
```

verify:

```text
memberships.remove in A
→ allowed

memberships.remove in B
→ denied
```

The same Profile may have different effective Permissions per Organization.

---

# Unknown Permission Tests

Verify:

```text
hasPermission(unknown)
→ false
```

and:

```text
requirePermission(unknown)
→ deny
```

No Permission is automatically created.

---

# Permission Cache Tests

If caching is implemented, verify invalidation after:

```text
RolePermission grant

RolePermission revoke

Membership Role change

Membership suspension
```

---

# Production Administrative Integration

Once Permissions is implemented, Membership administrative operations may transition from:

```text
implemented internally
but blocked from secure production exposure
```

to:

```text
tenant-authorized production capability
```

---

# Memberships Integration

Permissions unlocks secure production authorization for:

```text
list Memberships

create Invitation

revoke Invitation

resend Invitation

suspend Membership

restore Membership

remove Membership

change Membership Role
```

Memberships remains owner of those workflows.

---

# Organizations Integration

Permissions authorizes:

```text
organizations.read

organizations.update

organizations.transfer_ownership
```

Organizations remains owner of Organization behavior and ownership invariant.

---

# Tenancy Integration

Permissions consumes:

```text
Trusted Tenant Context
```

produced by the tenancy architecture.

It must not create a competing:

```text
PermissionTenantContext
```

persistence model.

---

# Domain Integration

A Domain integrates by:

```text
declaring capability keys

registering canonical Permission definitions

declaring approved default system Role grants

calling requirePermission()
```

The Domain retains its own business invariants.

---

# No Temporary Domain Role Logic

Do not implement Domain authorization through:

```text
if ADMIN then allow
```

when the Domain has a canonical Permission.

Use:

```text
requirePermission(
  domain.permission.key
)
```

---

# Permission Registry Composition

A future implementation may compose:

```text
Platform Core Permission Registry

+

DJ Domain Permission Registry

+

Copy Domain Permission Registry
```

into one canonical synchronization input.

The registry may be modular.

Persistence remains:

```text
Permission
+
RolePermission
```

---

# Registry Collision

If two modules declare:

```text
same Permission.key
```

with incompatible metadata/ownership:

```text
FAIL
```

Do not silently let one definition override another.

Permission keys are globally unique semantic identifiers within the installation.

---

# Domain Uninstall / Removal

If a Domain is removed, its persisted Permissions and mappings should not be blindly deleted without a migration/retention decision.

Authorization policy cleanup must be deliberate.

---

# Security-Sensitive Policy Change

Adding:

```text
ADMIN
→ organizations.transfer_ownership
```

would materially expand authorization.

Such policy changes should be treated as security changes requiring review and tests.

---

# Audit Integration

Future Audit may record changes such as:

```text
permission.created

permission.updated

role_permission.granted

role_permission.revoked
```

Routine Permission evaluation should not create an audit row for every check.

---

# Failed Authorization Observability

Sensitive repeated denials may be useful for:

```text
security monitoring

abuse detection

incident investigation
```

but observability is not Permission persistence.

Do not turn RolePermission into an authorization-decision log.

---

# Notifications Boundary

Permission evaluation does not send notifications.

If policy changes later trigger user communication:

```text
Permissions event
        ↓
Notifications
```

---

# Billing / Entitlement Flow

Future operation may require:

```text
Organization entitlement exists?
        ↓
Permission granted?
        ↓
execute
```

Entitlement and Permission are different.

Permissions must not decide subscription availability.

---

# Feature Flag Flow

Future feature rollout may require:

```text
feature enabled?
+
Permission granted?
```

Feature flags do not replace authorization.

Permissions does not become a feature-flag store.

---

# Platform Administration Boundary

Tenant Permission flow always operates in an Organization tenancy context.

A future platform-wide administrator architecture must not be implemented by:

```text
fake Organization

fake OWNER Membership

special RolePermission bypass
```

That requires separate design.

---

# Foundation Implementation Boundary

Permissions Foundation should implement:

```text
Permission persistence

RolePermission persistence

Permission catalog registry

Permission catalog synchronization

system RolePermission policy

policy synchronization

catalog validation

policy drift validation

Permission lookup

effective Permission resolution

hasPermission

requirePermission
```

---

# Foundation Does Not Implement

```text
custom tenant Roles

tenant-editable Role policy

Membership Permission overrides

Organization Permission overrides

wildcard Permissions

explicit DENY rules

Role inheritance

Permission inheritance

ABAC

policy DSL

platform administrator authorization

feature flags

subscription entitlements
```

---

# Implementation Sequence

Recommended Permissions implementation sequence:

```text
Permission Data Model
        ↓
RolePermission Data Model
        ↓
Migration
        ↓
Permission Registry
        ↓
Permission Synchronization
        ↓
System Role Policy Registry
        ↓
RolePermission Synchronization
        ↓
Catalog / Policy Validation
        ↓
Permission Repository
        ↓
RolePermission Repository
        ↓
Effective Permission Resolution
        ↓
hasPermission
        ↓
requirePermission
        ↓
Core Protected Operation Integration
        ↓
Tests
```

---

# Dependency Failure Rule

If implementation discovers missing:

```text
Role

Membership

Tenant Context

Organization lifecycle
```

required by an approved flow:

```text
STOP

Report dependency

Do not invent replacement architecture
```

---

# AI Agent Rules

AI coding agents implementing Permissions must not:

```text
add Profile.permissions

add Profile.roleId

add Organization.permissions

add Permission.organizationId

add RolePermission.organizationId

add Membership permissionsJson

add Role permissionsJson

create MembershipPermission

create OrganizationPermission

create wildcard Permissions

create Permission inheritance

create Role inheritance

create DENY precedence

use Role.sortOrder as authorization

special-case OWNER as allow-all

hard-code Role UUIDs

hard-code Permission UUIDs

trust client Permission lists

trust client Role claims
```

---

# Security Invariants

The following must remain true:

```text
No Membership
→ no tenant Permission

Inactive Membership
→ no tenant Permission

Missing mapping
→ deny

Unknown Permission
→ deny

OWNER without mapping
→ deny

ADMIN in Organization A
→ no authority in Organization B

Permission granted
→ does not bypass business invariants

Role hierarchy
→ does not grant capability

Permission namespace
→ does not imply capability

Client-side Permission state
→ not authority
```

---

# Definition of Ready

Permissions flows are ready when:

- Permission catalog is approved.
- Initial RolePermission matrix is approved.
- Permission key format is approved.
- Permission and RolePermission ownership are explicit.
- synchronization behavior is defined.
- drift behavior is defined.
- missing catalog entries fail safely.
- OWNER bypass is prohibited.
- Role hierarchy is not authorization.
- wildcard semantics are prohibited.
- tenant context contract is understood.
- Core protected-operation mappings are explicit.
- Domain extension boundary is understood.
- cache invalidation requirements are understood.

---

# Definition of Done

Permissions workflow implementation is complete when:

- canonical Permission registry exists;
- Permission catalog synchronization is idempotent;
- Permission metadata synchronization works;
- unknown persisted Permissions are reported safely;
- canonical system Role policy exists;
- RolePermission synchronization is idempotent;
- missing Roles fail policy synchronization;
- missing Permissions fail policy synchronization;
- unexpected RolePermission mappings are detected;
- Permission lookup by key works;
- required Permission resolution works;
- effective Permissions for Role work;
- hasPermission denies by default;
- requirePermission enforces stable denial;
- OWNER has no magic bypass;
- Role hierarchy is not used;
- wildcard Permissions are not supported;
- inactive Membership cannot authorize;
- cross-tenant Permission reuse is impossible;
- Membership administrative operations use approved Permissions;
- ownership transfer uses its approved Permission;
- server enforcement exists independently of UI;
- policy-sensitive tests pass;
- Prisma validation passes;
- TypeScript passes;
- Lint passes;
- documentation matches implementation.

---

# Final Principle

Authorization begins with a valid tenant relationship.

A Membership holds one Role.

A Role receives only explicit Permission grants.

A missing grant denies access.

OWNER is not a bypass.

Role hierarchy is not authorization.

Permission namespaces do not imply inheritance.

Permissions authorizes an operation.

The owning module or Domain still validates the resource, tenant, lifecycle and business invariants.

Every capability must be explicit, reviewable and fail closed.