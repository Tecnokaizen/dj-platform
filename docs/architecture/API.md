---
title: API and Server Interaction
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - SOURCE_STRUCTURE.md
  - PROJECT_STRUCTURE.md
  - IDENTITY.md
  - TENANCY.md
  - SECURITY.md
  - DATA.md
  - CACHE.md
  - ../core/README.md
---

# API and Server Interaction

## Purpose

This document defines how Platform Core and business Domains expose and consume application capabilities across server boundaries.

Platform Core follows a:

```text
server-first
service-oriented
explicit-boundary
```

architecture.

The system distinguishes between:

```text
Application API
→ internal typed capabilities exposed by modules and Domains

HTTP API
→ stable network contracts exposed through Route Handlers
```

These concepts must not be conflated.

---

# API Does Not Mean HTTP

Core module documents such as:

```text
docs/core/modules/organizations/API.md

docs/core/modules/memberships/API.md

docs/core/modules/roles/API.md

docs/core/modules/permissions/API.md
```

describe application capabilities.

Examples:

```text
createOrganization()

listMemberships()

requirePermission()

getRoleByKey()
```

These interfaces may be consumed internally without creating an HTTP endpoint.

Do not create `/api/...` routes merely because a module has an `API.md`.

---

# Server-First Strategy

Preferred execution model:

```text
Server Component
→ reads and rendering

Server Action
→ internal authenticated commands and form mutations

Route Handler
→ explicit HTTP contract

Application Service
→ reusable operation/business orchestration

Repository
→ persistence boundary
```

The transport layer must remain thin.

Business or Core behavior belongs to the owning service.

---

# Server Components

Use Server Components primarily for:

```text
public page data

SEO content

authenticated read views

dashboard reads

initial rendering

server-side composition
```

Server Components may call application services directly.

They should not require an internal HTTP round trip to the same Next.js application.

Preferred:

```text
Server Component
        ↓
Application Service
        ↓
Repository
```

Avoid:

```text
Server Component
        ↓
fetch("/api/internal/...")
        ↓
Route Handler
        ↓
Application Service
```

unless a real HTTP boundary is required.

---

# Server Actions

Use Server Actions for internal application commands such as:

```text
authenticated forms

profile updates

Organization settings

Membership administration

invitation administration

small product mutations

progressive-enhancement workflows
```

A Server Action is a transport/orchestration boundary.

It must not become the owner of Core or Domain behavior.

Preferred:

```text
Server Action
        ↓
Validate Input
        ↓
Resolve required context
        ↓
Application Service
        ↓
Persistence
```

---

# Route Handlers

Use Route Handlers when an explicit HTTP contract is required.

Examples:

```text
webhooks

external integrations

uploads

imports

exports

health endpoints

callback endpoints

machine-to-machine access

future public API

stable versioned HTTP contracts
```

Future public contracts may use structures such as:

```text
/api/v1/...
```

Versioning should be introduced only when an actual externally consumed contract requires it.

---

# Transport Independence

An application capability should not depend unnecessarily on how it was invoked.

Example:

```text
Memberships.createInvitation()
```

may eventually be called from:

```text
Server Action

Route Handler

trusted internal workflow
```

The Memberships service remains the owner of invitation behavior.

Do not duplicate that behavior inside each transport.

---

# Standard Protected Flow

For a normal protected tenant operation:

```text
Request / Server Invocation
        ↓
Authentication
        ↓
Input Validation
        ↓
Trusted Tenant Context
        ↓
Permission Authorization
        ↓
Owning Application Service
        ↓
Resource / Business Invariants
        ↓
Repository
        ↓
Persistence
        ↓
Response / UI Mapping
```

The exact flow may vary by operation.

---

# Authentication

Identity answers:

```text
Who is making the request?
```

Authentication must be resolved server side through the approved Identity architecture.

Do not trust client assertions such as:

```text
userId

profileId

authenticated = true
```

as proof of identity.

---

# Tenant Context

For Organization-scoped operations, resolve a trusted tenant context.

Conceptually:

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
```

The trusted context may contain:

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

# Authorization

For protected tenant operations:

```text
Trusted Tenant Context
        ↓
Permissions.requirePermission()
        ↓
Owning Service
```

Example:

```text
requirePermission(
  context,
  "invitations.create"
)
        ↓
Memberships.createInvitation()
```

Permissions authorizes the attempt.

The owning service still enforces structural and business invariants.

---

# Authentication Is Not Authorization

A valid authenticated Profile does not automatically have access to every Organization.

Correct:

```text
Authenticated
+
ACTIVE Membership
+
required Permission
```

for normal protected tenant operations.

Incorrect:

```text
authenticated
→ tenant access granted
```

---

# Membership Is Not Authorization

An ACTIVE Membership proves tenant belonging.

It does not automatically prove every operation is allowed.

Example:

```text
ACTIVE Membership
```

does not imply:

```text
memberships.remove
```

Permission evaluation remains explicit.

---

# Authorization Is Server-Side

Client visibility is UX.

It is not security.

The client may receive effective Permission information to:

```text
hide controls

disable actions

adapt navigation
```

but the server must still authorize every protected operation.

Never trust:

```text
canManage = true

role = "ADMIN"

permissionKeys from browser
```

as authority.

---

# Bootstrap and Non-Tenant Flows

Not every operation can use normal tenant Permission authorization.

Approved examples include:

```text
registration

login

logout

magic-link authentication

Profile self-service

initial Organization creation

initial OWNER Membership creation

invitation acceptance by authenticated matching recipient
```

These flows have their own approved authorization rules.

Do not invent fake tenant Permissions merely to force them into:

```text
Membership
→ Role
→ Permission
```

before the required Membership exists.

---

# Initial Organization Onboarding

Canonical bootstrap:

```text
Authenticated Profile
        ↓
Create Organization
        ↓
Create initial ACTIVE OWNER Membership
```

This workflow establishes the tenant.

Normal tenant administration can use Permissions after that context exists.

---

# Invitation Acceptance

An invitation recipient may not yet have Membership.

Therefore acceptance is authorized through:

```text
valid Invitation

matching authenticated identity

invitation lifecycle rules
```

not through a pre-existing tenant Permission.

---

# Validation

Runtime validation is required at trust boundaries.

Validate where relevant:

```text
route parameters

query parameters

request bodies

form data

headers

cookies

external provider payloads

webhook payloads

uploaded-file metadata

AI outputs

third-party API responses
```

TypeScript types do not replace runtime validation.

---

# Validation Ownership

Transport validation should validate:

```text
shape

format

basic constraints
```

The owning service validates:

```text
business state

resource relationships

tenant ownership

lifecycle invariants
```

Example:

```text
Zod
→ validates targetMembershipId is UUID

Memberships
→ validates Membership exists and belongs to Organization
```

---

# Do Not Trust Arbitrary Client Fields

Never forward arbitrary client objects directly into persistence operations.

Invalid:

```text
prisma.model.update({
  data: requestBody
})
```

Preferred:

```text
validated input
        ↓
explicit service command
        ↓
explicit persistence projection
```

---

# Response Strategy

Response shape depends on transport.

Do not force Server Components, Server Actions and HTTP APIs into one universal serialization format.

---

# Internal Application Results

Application services may return typed application results such as:

```text
DTO

entity projection

command result

domain result
```

They should not return HTTP-specific objects unless they own an HTTP boundary.

---

# Server Action Results

Server Actions may return typed results suitable for application UI.

Conceptually:

```ts
type ActionResult<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: {
        code: string
        message?: string
      }
    }
```

The exact shared representation should only be introduced when repeated use justifies it.

Do not create unnecessary abstraction prematurely.

---

# HTTP Response Format

Stable HTTP APIs may use a consistent envelope.

Success example:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Failure example:

```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found",
    "requestId": "..."
  }
}
```

This contract applies to HTTP interfaces where formally adopted.

It is not mandatory for internal services.

---

# HTTP Status Mapping

Application errors and HTTP status codes are related but distinct.

Example mapping:

```text
VALIDATION_ERROR
→ 400

AUTHENTICATION_REQUIRED
→ 401

PERMISSION_DENIED
→ 403

RESOURCE_NOT_FOUND
→ 404

CONFLICT
→ 409

RATE_LIMITED
→ 429

DEPENDENCY_FAILURE
→ 502 / 503 where appropriate

INTERNAL_ERROR
→ 500
```

Exact mapping depends on the HTTP contract.

---

# Error Taxonomy

Architecture-level error categories may include:

```text
VALIDATION_ERROR

AUTHENTICATION_REQUIRED

PERMISSION_DENIED

RESOURCE_NOT_FOUND

CONFLICT

RATE_LIMITED

DEPENDENCY_FAILURE

INTERNAL_ERROR
```

Modules may define more precise stable errors such as:

```text
MEMBERSHIP_NOT_ACTIVE

REQUIRED_ROLE_MISSING

REQUIRED_PERMISSION_MISSING

PERMISSION_CATALOG_DRIFT
```

Transport layers should map module errors rather than replacing them with incompatible semantics.

---

# Error Ownership

The owning module defines semantic errors.

Example:

```text
Memberships
→ MEMBERSHIP_NOT_ACTIVE

Permissions
→ PERMISSION_DENIED
```

The Route Handler decides:

```text
which HTTP status

which external message
```

to expose.

---

# Error Security

Never expose in production:

```text
stack traces

SQL

raw Prisma errors

internal filesystem paths

secrets

authorization internals

cross-tenant data

provider credentials
```

External error messages should reveal only what the caller needs.

---

# Logging Errors

Do not hide operational failures merely because the external response is generic.

Preferred:

```text
safe external error
+
structured internal logging
```

Logs must also avoid secrets and sensitive payloads.

---

# Request ID

Externally exposed HTTP errors may contain a:

```text
requestId
```

or correlation identifier when observability infrastructure supports it.

Do not invent a request-ID subsystem merely to satisfy the example response format.

---

# Pagination

Unbounded collections must not be returned without a deliberate bound.

Use pagination when result size can grow materially.

Possible strategies:

```text
offset pagination

cursor pagination
```

---

# Offset Pagination

Suitable for cases such as:

```text
small administrative tables

moderate datasets

explicit page-number UX
```

where query behavior remains acceptable.

---

# Cursor Pagination

Prefer for:

```text
large feeds

high-volume timelines

public content streams

large operational datasets
```

where stable cursor semantics provide value.

---

# Pagination Is Query-Specific

Do not choose a pagination strategy solely from whether a page is:

```text
admin

public
```

Choose based on:

```text
dataset size

sort stability

navigation UX

query cost

consistency requirements
```

---

# Filtering

Filters must be:

```text
allowlisted

validated

explicitly mapped to queries

documented for stable public APIs
```

Never pass arbitrary client fields directly into Prisma:

```text
where

orderBy

include

select
```

---

# Public URL Filtering

For public pages where filter state is navigable or SEO-relevant, filters should normally be reflected in URLs.

This is not a requirement for every internal application filter.

---

# Sorting

Sort fields must be allowlisted.

Invalid:

```text
orderBy = clientSuppliedObject
```

Preferred:

```text
validated sort key
        ↓
known server mapping
        ↓
Prisma orderBy
```

Indexes should support heavily used query patterns where justified.

---

# Rate Limiting

Rate limiting should be considered for abuse-sensitive boundaries such as:

```text
authentication attempts

magic-link requests

password operations

search

AI generation

imports

public APIs

webhooks

expensive exports
```

Rate-limiting strategy belongs to Security/infrastructure architecture.

API consumers should not implement incompatible ad hoc limiters.

---

# Webhooks

Webhook endpoints must be treated as untrusted external entry points.

Where provider capabilities support it:

```text
verify signature

validate timestamp / replay protection

validate payload

identify provider event

make processing idempotent
```

---

# Webhook Idempotency

If the provider supplies a stable event identifier, persist or otherwise track it when required to prevent duplicate processing.

Do not assume every provider supplies the same event-ID semantics.

The integration owns provider-specific behavior.

---

# Webhook Response Time

Webhook handlers should return promptly.

Heavy processing should move to:

```text
background job

queue

worker
```

when that infrastructure exists and the operation warrants it.

Do not invent a queue system prematurely for trivial processing.

---

# Webhook Ownership

Provider-specific logic belongs under the relevant integration boundary.

Do not place:

```text
Stripe-specific behavior

external CRM behavior

DJ provider behavior
```

inside generic API architecture.

---

# File Endpoints

File upload/import boundaries must validate where applicable:

```text
authenticated identity

tenant context

required Permission

file size

MIME allowlist

actual file signature

normalized filename

destination

storage constraints
```

---

# File Security

Do not trust:

```text
filename extension

browser MIME type

client-provided destination
```

as sufficient validation.

Malware scanning strategy should be introduced when the risk profile and product requirements justify it.

---

# Upload Authorization

A valid Permission does not automatically prove:

```text
destination belongs to tenant

resource accepts files

file type is allowed

storage quota exists
```

The owning module or Domain must enforce those invariants.

---

# Imports

Import endpoints should separate:

```text
transport

file validation

parsing

normalization

application validation

persistence
```

Large or asynchronous imports may later use Jobs/Queue infrastructure.

---

# Exports

Exports must enforce the same authorization and tenant isolation as normal reads.

Do not assume:

```text
download operation
→ harmless
```

Exports may contain sensitive tenant data.

---

# Health Endpoints

Health endpoints should reveal only operational information appropriate for their audience.

Do not expose:

```text
database credentials

internal topology

secret values

sensitive dependency detail
```

through public health endpoints.

---

# External Integrations

External provider calls should pass through approved integration boundaries.

Preferred:

```text
Application Service
        ↓
Integration Adapter
        ↓
External Provider
```

Provider SDKs should not be scattered throughout:

```text
src/app

Core modules

Domains
```

without ownership.

---

# Provider Response Validation

External APIs are trust boundaries.

Validate provider responses when malformed or unexpected data could affect application correctness or security.

Static SDK typing alone does not guarantee runtime validity.

---

# AI Outputs

AI-generated structured data is untrusted input.

When AI output affects:

```text
database state

authorization-sensitive data

publishing

automation

external actions
```

validate it before use.

AI models do not bypass normal application invariants.

---

# Public APIs

A public API should be introduced only when there is an actual external consumer or product requirement.

Before creating a stable public API, define:

```text
versioning

authentication

authorization

rate limits

pagination

error contracts

idempotency where relevant

deprecation policy
```

---

# Versioning

Do not version internal application services as if they were public HTTP contracts.

HTTP versioning is primarily for externally consumed stable interfaces where breaking changes must be managed.

---

# Internal HTTP Endpoints

Avoid creating internal HTTP endpoints when server-side code can call the application service directly.

Internal HTTP adds:

```text
serialization

latency

duplicated validation risk

error mapping complexity
```

without necessarily adding a useful boundary.

---

# Repository Boundary

Repositories own persistence access.

Preferred:

```text
Transport
        ↓
Application Service
        ↓
Repository
        ↓
Prisma
```

Do not allow transport layers to bypass services for protected business behavior merely because Prisma is convenient.

---

# Prisma Boundary

Do not expose raw Prisma models unnecessarily through:

```text
HTTP

Server Action responses

public interfaces
```

Use deliberate DTOs/projections where boundaries require them.

Generated persistence types are not automatically application contracts.

---

# Transactions

Transaction boundaries should follow the owning workflow.

Example:

```text
Create Organization
+
Create initial OWNER Membership
```

requires atomic coordination.

The Route Handler or Server Action must not split an approved atomic service workflow into unrelated persistence calls.

---

# Cross-Module Orchestration

Some operations coordinate several Core modules.

Example:

```text
Ownership Transfer
```

may involve:

```text
Organizations

Memberships

Roles

Permissions
```

The orchestration may cross module boundaries.

Entity ownership does not change because a workflow coordinates them.

---

# Domain Boundaries

Domains consume Platform Core services.

Example:

```text
Copy Domain
        ↓
Permissions.requirePermission(
  "copy.orders.update"
)
        ↓
Copy Order Service
```

Permissions owns authorization evaluation.

Copy Domain owns Order behavior.

---

# No Domain Logic in Generic API Layer

Do not place business rules such as:

```text
DJ playlist workflow

Copy production state

SEO project behavior
```

inside generic API helpers.

The API layer transports requests.

Domains own business semantics.

---

# Caching

API consumers may use approved caching architecture for reads where justified.

Never cache authorization-sensitive responses without considering:

```text
Profile

Organization

Membership

Role

Permission

resource visibility
```

Cache behavior must not create cross-tenant leakage.

---

# Revalidation

Server mutations should invalidate or revalidate affected application data using the project's approved Next.js strategy.

Revalidation is transport/UI coherence.

It does not replace database consistency.

---

# Idempotency

Idempotency should be implemented where duplicate execution is realistically possible or dangerous.

Examples:

```text
webhooks

payment/provider callbacks

import submission

retryable external commands

selected public API mutations
```

Do not require idempotency keys for every trivial internal Server Action without need.

---

# Security Boundaries

Every externally controllable input is untrusted.

This includes:

```text
URL parameters

query strings

cookies

headers

form fields

JSON bodies

files

webhooks

provider responses

AI outputs
```

Trust is established through validation and server-side resolution.

---

# Forbidden Practices

Never:

```text
trust client Roles

trust client Permissions

trust client tenant context

authorize through Role.sortOrder

special-case OWNER as allow-all

return raw Prisma models by default

expose internal fields unnecessarily

use GET for state-changing operations

forward arbitrary client query objects into Prisma

create unbounded collection endpoints

leak stack traces

leak raw Prisma errors

silently swallow provider failures

duplicate Core or Domain logic in transport handlers

create internal HTTP endpoints when direct server service calls are sufficient

invent temporary authorization systems
```

---

# Source Ownership

Conceptually:

```text
src/app/
→ Next.js transport and composition

src/core/
→ reusable Platform Core application capabilities

src/domains/
→ business-specific capabilities

src/lib/
→ technical adapters and integrations

src/shared/
→ business-agnostic technical utilities
```

API transport must respect these ownership boundaries.

---

# AI Agent Rules

AI coding agents must not:

```text
create HTTP endpoints for every application service

move business logic into Route Handlers

move business logic into Server Actions

trust client role or Permission values

invent new authorization semantics

create duplicate tenant context

bypass Permissions for protected operations

use Role hierarchy as authorization

hard-code OWNER bypasses

expose Prisma models without reviewing the contract

introduce pagination abstractions without real query need

introduce queues without real asynchronous workload

invent public API versioning before a public contract exists
```

If implementation requires a new architectural decision:

```text
STOP

report the finding

decide architecture first

then implement
```

---

# Definition of Ready

An API/server interaction is ready for implementation when:

```text
owning module or Domain is known

transport choice is justified

input contract is defined

authentication requirement is known

tenant requirement is known

Permission requirement is known

bootstrap exception is explicit where applicable

service boundary is known

persistence owner is known

error behavior is defined

response contract is defined where externally relevant
```

---

# Definition of Done

A server interaction is complete when:

```text
runtime input validation exists

authentication is server-resolved where required

tenant context is server-resolved where required

Permission is enforced where required

bootstrap flows use their approved rules

owning service executes business behavior

resource/tenant invariants are enforced

persistence is behind the approved boundary

errors are safely mapped

no sensitive internals leak

unbounded data is bounded/paginated

tests cover important security boundaries

TypeScript passes

lint passes

documentation matches implementation
```

---

# Final Principle

Transport is not architecture ownership.

Server Components read and compose.

Server Actions handle internal application commands.

Route Handlers expose HTTP boundaries.

Application services own reusable operations.

Repositories own persistence access.

Identity proves who the actor is.

Tenancy proves the tenant relationship.

Permissions proves the capability.

The owning Core module or Domain proves that the requested operation is valid.

Client state is never authority.

Every server boundary must remain explicit, secure and as simple as the actual use case requires.