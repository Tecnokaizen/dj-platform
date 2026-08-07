---
title: API and Server Interaction
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
---

# API and Server Interaction

## Strategy

Platform Core follows a server-first architecture.

Use Server Components for reads, Server Actions for internal authenticated mutations, and Route Handlers for stable HTTP contracts, integrations, webhooks, imports, exports and future public APIs.

## Standard flow

```text
Request
  ↓
Authentication
  ↓
Authorization
  ↓
Zod validation
  ↓
Application service
  ↓
Repository
  ↓
Response mapping
```

## Server Components

Use for:

- public page data
- SEO content
- admin read views
- initial rendering

## Server Actions

Use for:

- authenticated forms
- admin commands
- small internal mutations
- progressive enhancement

## Route Handlers

Use for:

- webhooks
- uploads and imports
- exports
- health checks
- external integrations
- stable API endpoints
- future `/api/v1` public contracts

## Validation

Validate at runtime:

- route parameters
- query strings
- request bodies
- form data
- relevant headers
- external provider responses
- AI outputs

TypeScript types do not replace runtime validation.

## Response format

Success:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Failure:

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

Never expose stack traces in production.

## Error categories

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

## Pagination

All unbounded collections require pagination.

- Offset pagination for admin tables.
- Cursor pagination for large public feeds when justified.

## Filtering

Filters must be:

- allowlisted
- validated
- reflected in public URLs
- documented
- supported by indexes where heavily used

Never pass arbitrary client fields directly into Prisma `orderBy`.

## Authorization

Every mutation checks permissions server-side.

Client visibility is UX, not security.

## Rate limiting

Apply to:

- search
- login
- password or magic-link attempts
- AI generation
- imports
- public API
- webhooks

## Webhooks

Must:

- verify signature
- prevent replay
- be idempotent
- persist provider event ID
- return quickly
- move heavy work to a worker when introduced

## File endpoints

Validate:

- user and permission
- size
- MIME allowlist
- real file signature
- normalized filename
- destination
- malware strategy when relevant

## Forbidden practices

Never:

- return raw Prisma models unnecessarily
- expose internal fields by default
- trust client roles
- use GET for mutations
- create unpaginated list endpoints
- suppress provider errors without logs
