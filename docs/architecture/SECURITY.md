---
title: Security Architecture
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
---

# Security Architecture

## Principles

- least privilege
- defense in depth
- secure defaults
- explicit trust boundaries
- minimal data collection
- server-side authorization
- auditable sensitive actions

## Trust boundaries

```text
Browser              untrusted
Next.js server       trusted application boundary
External providers   partially trusted
Database             protected infrastructure
Object storage       protected infrastructure
```

## Secrets

Secrets live only in:

- local `.env` excluded from Git
- Coolify environment variables
- an approved secret manager if later introduced

Never in code, screenshots, logs, documentation or test fixtures.

## Environment validation

Server startup validates required variables with Zod and fails fast when critical configuration is missing.

## Input validation

Validate:

- forms
- JSON
- query parameters
- route parameters
- file metadata
- webhooks
- provider responses
- AI output

## Rich content

Do not render arbitrary HTML from users or models.

Any allowed HTML requires maintained sanitization and an explicit allowlist.

## Authentication and authorization

- server-side checks for every mutation
- object-level authorization
- secure cookies
- HTTPS in staging and production
- rate-limited login flows
- MFA decision for privileged accounts

## SSRF protection

External URL ingestion must:

- allow only HTTP/HTTPS
- block private and loopback networks
- limit redirects
- apply timeout
- limit response size
- revalidate destination after redirects

## Upload security

- file size limit
- MIME allowlist
- signature inspection
- randomized storage key
- no executable serving
- public/private bucket separation
- image re-encoding where useful

## Database security

- separate credentials per environment
- minimal privileges
- encrypted connection where supported
- no open public exposure
- encrypted backups
- credential rotation

## Dependency security

Before installation:

- verify maintenance
- review license
- inspect security history
- prefer fewer dependencies

CI should run vulnerability and secret scans.

## Logging

Log:

- request ID
- error category
- actor ID when appropriate
- action
- entity reference

Never log:

- passwords
- tokens
- cookies
- API keys
- unnecessary personal data
- sensitive prompts

## Audit events

Required for:

- role changes
- publication
- archival or deletion
- import execution
- settings changes
- key rotation
- account suspension

## Security headers

Before production:

- HSTS
- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- secure cookie attributes

## Incident response

1. Identify.
2. Contain.
3. Rotate credentials.
4. Preserve evidence.
5. Assess impact.
6. Recover.
7. Notify when required.
8. Document lessons.
9. Prevent recurrence.

## Pre-production tests

- dependency scan
- secret scan
- authorization tests
- upload tests
- webhook verification
- rate-limit tests
- OWASP review
- backup restore test

## Forbidden practices

Never:

- authorize only in the client
- store plaintext passwords
- write custom cryptography
- expose detailed production errors
- accept unrestricted HTML
- trust uploaded filenames
- share one credential across environments
