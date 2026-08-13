---
title: Backend API Standards
version: 1.0.0
status: Living Document
owner: Engineering
updated: 2026-08-08
related:
  - ../../architecture/API.md
  - ../../architecture/SECURITY.md
  - ../../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Backend API Standards

## Purpose

This document defines the backend API implementation standards used across Platform Core and Business Domains.

Architecture documentation defines communication principles.

This document defines how those principles are implemented consistently.

---

# API Philosophy

APIs are contracts.

Implementation details may change.

Public behavior should remain predictable.

Every API should prioritize:

- Clarity
- Stability
- Security
- Validation
- Consistency
- Observability

---

# Transport Independence

Business logic must remain independent from transport.

Allowed transports may include:

- Server Actions
- Route Handlers
- REST APIs
- Webhooks
- RPC
- MCP
- Future protocols

Business services must not depend on HTTP-specific behavior unless explicitly required.

---

# Standard Request Flow

```text
Request
  ↓
Authentication
  ↓
Authorization
  ↓
Runtime Validation
  ↓
Service
  ↓
Repository
  ↓
Response Mapping
```

No layer should bypass this flow without documented justification.

---

# Server Actions

Use Server Actions for internal application mutations when:

- the caller is the application UI
- the operation is authenticated
- no stable external HTTP contract is required

Server Actions should only:

- validate input
- resolve authentication context
- call Services
- revalidate
- redirect when appropriate

Server Actions must never contain business rules.

---

# Route Handlers

Use Route Handlers when a stable HTTP interface is required.

Typical cases:

- Public APIs
- External integrations
- Webhooks
- Uploads
- Downloads
- Health checks
- Imports
- Exports

Route Handlers must remain thin.

Business logic belongs to Services.

---

# Validation

Every external value must be validated at runtime.

Validate:

- Request Bodies
- Query Parameters
- Route Parameters
- Form Data
- Headers
- Cookies when relevant
- External Provider Responses

Recommended validation library:

```text
Zod
```

TypeScript types never replace runtime validation.

---

# Response Contracts

Internal APIs should return predictable result structures.

Recommended success contract:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Recommended failure contract:

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

Never expose:

- Stack Traces
- Internal SQL Errors
- Secret Values
- Provider Credentials
- Internal implementation details

---

# Error Categories

Recommended platform-level categories:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
DEPENDENCY_FAILURE
INTERNAL_ERROR
```

Domains may introduce additional business-specific error codes.

---

# Error Ownership

Repositories report persistence failures.

Services translate failures into application-level errors.

Transport layers map those errors into the appropriate external response.

Do not expose raw Prisma errors directly.

---

# Authentication

Authentication is resolved through Platform Core Identity.

API implementations must never build parallel authentication systems.

---

# Authorization

Authorization must be enforced server-side.

Every protected operation may require:

```text
Authenticated User
        ↓
Organization
        ↓
Membership
        ↓
Role
        ↓
Permission
```

Client-side visibility is UX only.

It is never authorization.

---

# Tenant Isolation

Tenant-owned API operations must resolve the active Organization.

Never fetch tenant-owned resources using only a resource ID when an Organization boundary applies.

Preferred pattern:

```text
organizationId
+
resourceId
```

---

# Pagination

Every unbounded collection requires pagination.

Recommended approaches:

## Offset Pagination

Suitable for:

- Administration tables
- Small datasets
- Simple navigation

## Cursor Pagination

Suitable for:

- Large collections
- Public feeds
- High-volume datasets

The chosen strategy should remain consistent within each API surface.

---

# Filtering

Filters must be:

- Explicit
- Allowlisted
- Validated
- Documented

Never pass arbitrary client fields directly to persistence ordering or filtering.

---

# Sorting

Supported sort fields must be explicit.

Never expose unrestricted ORM ordering.

---

# Rate Limiting

Rate limiting should be considered for:

- Authentication
- Search
- AI generation
- Imports
- Uploads
- Public APIs
- Webhooks
- Expensive operations

Rate limiting policies must be documented when introduced.

---

# Idempotency

Operations that may be retried should support idempotency when practical.

Examples:

- Payments
- Imports
- Webhooks
- External callbacks
- Background job triggers

Idempotency keys should remain scoped and expire when appropriate.

---

# Versioning

Internal APIs do not require versioning by default.

Stable public APIs should use explicit versions.

Example:

```text
/api/v1/
```

Breaking public API changes require a versioning or migration strategy.

---

# Webhooks

Webhook-specific implementation belongs under:

```text
docs/backend/webhooks/
```

API code receiving webhooks must follow those standards.

---

# File Operations

File endpoints must validate:

- Authentication
- Authorization
- File Size
- MIME Type
- File Signature
- Filename
- Destination

Storage implementation belongs under:

```text
docs/backend/storage/
```

---

# External Integrations

Provider-specific API behavior belongs under:

```text
docs/backend/integrations/
```

Business code must communicate with providers through approved abstractions.

---

# Logging

API failures should produce useful diagnostic information.

Recommended fields:

- Request ID
- Route / Operation
- Error Category
- User ID when appropriate
- Organization ID when appropriate
- Provider when appropriate

Never log secrets.

---

# Observability

When justified, APIs should expose metrics for:

- Error Rate
- Latency
- Request Volume
- Rate Limit Events
- Dependency Failures

Performance decisions should be based on measurements.

---

# Security

Every API implementation must follow:

```text
docs/architecture/SECURITY.md
```

Security is server-enforced.

---

# Testing

API behavior should be tested at the appropriate layer.

Tests may include:

- Validation Tests
- Authorization Tests
- Service Tests
- Integration Tests
- Contract Tests

Avoid testing business logic exclusively through HTTP when Services can be tested directly.

---

# AI Development Rules

AI coding agents must not:

- Invent API contracts.
- Add public endpoints without specification.
- Introduce new transport technologies without approval.
- Place business logic inside Route Handlers.
- Bypass authorization.
- Expose persistence models directly without review.

When uncertain, stop and request clarification.

---

# Forbidden Practices

Never:

- Use GET for mutations.
- Trust client roles.
- Return unbounded collections.
- Expose Prisma errors directly.
- Hide provider failures without logging.
- Implement business rules inside transport handlers.
- Bypass Organization scoping.
- Create undocumented public endpoints.

---

# Final Principle

Transport is replaceable.

Business logic is not.

APIs expose capabilities.

Services implement behavior.