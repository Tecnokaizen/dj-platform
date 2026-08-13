---
title: Security Architecture
version: 2.1.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - CORE.md
  - IDENTITY.md
  - TENANCY.md
  - API.md
  - DATA.md
  - CONVENTIONS.md
  - PRISMA_IMPLEMENTATION.md
  - ../operations/INCIDENT_RESPONSE.md
  - ../operations/BACKUPS.md
---

# Security Architecture

## Purpose

This document defines the platform-wide security architecture for Platform Core and the products built on top of it.

Security is a cross-cutting architectural concern.

It is not owned exclusively by:

```text
Platform Core

Infrastructure

Domains

Application
```

Each architectural owner is responsible for the security concerns that belong to its layer.

The objective is defense in depth through explicit trust boundaries, server-side enforcement, tenant isolation, least privilege and clear ownership.

---

# Security Principle

Security is not a single authorization check.

A protected operation may require several independent controls:

```text
Authentication
        ↓
Trusted Identity Resolution
        ↓
Trusted Tenant Context
        ↓
Membership Validation
        ↓
Permission Authorization
        ↓
Resource / Lifecycle Validation
        ↓
RLS where applicable
        ↓
Database Constraints
```

Each control answers a different question.

No single mechanism replaces all others.

---

# Security Principles

Platform architecture follows these principles:

- Least Privilege
- Defense in Depth
- Secure by Default
- Explicit Trust Boundaries
- Server-Side Enforcement
- Deny by Default
- Minimal Exposure
- Minimal Secret Distribution
- Tenant Isolation
- Runtime Validation
- Explicit Authorization
- Safe Failure
- Auditability where required
- Incremental Security Complexity

Security requirements must reflect actual implementation rather than aspirational features.

---

# Security Ownership

Security responsibilities are distributed.

Conceptually:

```text
Identity
→ authentication and application identity

Organizations
→ tenant entity

Memberships
→ tenant belonging and membership lifecycle

Roles
→ authorization positions

Permissions
→ capability authorization

Core modules / Domains
→ resource and lifecycle invariants

Infrastructure
→ technical security controls

Database
→ structural integrity and row isolation

Application
→ secure transport and composition
```

---

# Identity Security

Identity answers:

```text
Who is the actor?
```

The canonical authentication source is:

```text
Supabase auth.users
```

Application identity is represented by:

```text
Profile
```

Do not create a second competing authenticated-user model.

Detailed Identity rules belong to:

```text
docs/architecture/IDENTITY.md
```

---

# Current Authentication Foundation

Current implemented authentication capabilities include:

```text
Supabase Authentication

Email + Password

Email Magic Link

authentication callback handling

logout

server-side authentication integration
```

Do not document additional authentication methods as active until they are implemented and verified.

---

# Authentication Is Not Authorization

Authentication proves identity.

It does not automatically grant access to an Organization.

Incorrect:

```text
Authenticated
→ tenant access
```

Normal protected tenant access requires additional context.

---

# Canonical Tenant Authorization

Normal protected tenant authorization follows:

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
```

This chain determines whether the actor possesses the required application capability.

---

# Permission Is Not Final Business Validation

Permission authorization answers:

```text
May this actor attempt this capability?
```

The owning Core module or Domain must still answer:

```text
Is this specific operation valid for this resource and lifecycle state?
```

Example:

```text
Permission
→ memberships.remove
```

does not permit removing the sole active OWNER if that violates the Organization ownership invariant.

---

# OWNER Is Not a Security Bypass

OWNER is a canonical Role.

It is not a universal allow-all shortcut.

Forbidden:

```text
if role === "OWNER":
    allow everything
```

OWNER receives explicit RolePermission mappings.

New Permissions are not automatically granted merely because a Membership has the OWNER Role.

---

# Role Ordering Is Not Authorization

Do not use:

```text
Role.sortOrder
```

to determine access.

Role ordering may support display or human semantics.

Authorization uses explicit Permission mappings.

---

# Tenant Context

Client-provided tenant identifiers are not authority.

A trusted tenant context must be resolved server-side.

Conceptually it may contain:

```text
profileId

organizationId

membershipId

roleId

roleKey
```

This is a runtime projection.

It is not persisted as a competing tenant model.

---

# Client Is Untrusted

The browser is an untrusted boundary.

Never trust client-provided:

```text
profileId

organizationId

membershipId

role

permission list

isAdmin

canManage

authenticated
```

as security authority.

Client state may support UX.

The server establishes authority.

---

# Trust Boundaries

A simplified trust model is:

```text
Browser / External Caller
        │
        │ untrusted input
        ▼
Next.js Server Boundary
        │
        ▼
Application / Core / Domain Services
        │
        ▼
Infrastructure Adapters
        │
        ▼
Database / Storage / External Providers
```

Crossing a boundary requires deliberate validation appropriate to that boundary.

---

# Server Is Not Automatically Trusted Input

Server-side execution is trusted application code.

Input reaching the server is still untrusted.

Examples:

```text
form data

URL parameters

query strings

cookies

headers

uploaded files

webhooks

external provider responses

AI outputs
```

All must be validated according to their risk and intended use.

---

# Input Validation

Runtime validation is required at trust boundaries.

Validate where relevant:

```text
route parameters

query parameters

form data

JSON bodies

headers

cookies

webhooks

external API payloads

uploaded-file metadata

AI-generated structured output
```

TypeScript does not replace runtime validation.

---

# Validation Ownership

Transport validation verifies:

```text
shape

format

basic constraints
```

The owning Core module or Domain verifies:

```text
resource relationships

tenant scope

lifecycle state

business invariants
```

Example:

```text
Zod
→ targetMembershipId is a valid UUID

Memberships
→ Membership belongs to the Organization
```

---

# Server-Side Enforcement

Security-sensitive operations are enforced server-side.

Possible entry points include:

```text
Server Component

Server Action

Route Handler

trusted internal workflow

background process when introduced
```

The security requirements depend on the operation.

There is no universal transport flow for every request.

---

# Server Actions

Server Actions are transport boundaries.

They may:

```text
validate input

resolve authenticated context

resolve trusted tenant context

invoke authorization

call owning services
```

They must not become the canonical owner of business or authorization policy.

---

# Route Handlers

Route Handlers expose explicit HTTP boundaries.

Examples include:

```text
webhooks

external callbacks

uploads

exports

public APIs

health endpoints
```

They must validate all externally controlled input.

Business behavior remains inside the owning service.

---

# Bootstrap Security

Some valid workflows occur before a normal tenant Membership exists.

Examples:

```text
registration

login

Magic Link authentication

Profile self-service

initial Organization creation

initial OWNER Membership creation

invitation acceptance
```

These flows use their approved bootstrap security rules.

Do not invent fake Memberships or Permissions merely to force them through normal tenant authorization.

---

# Organization Bootstrap

Initial Organization creation requires an authenticated Profile.

Canonical workflow:

```text
Authenticated Profile
        ↓
Resolve OWNER Role
        ↓
BEGIN
        ↓
Create Organization
        ↓
Create ACTIVE OWNER Membership
        ↓
COMMIT
```

The Organization and initial OWNER Membership must be created atomically.

---

# Invitation Acceptance Security

Invitation acceptance is not authorized through a pre-existing tenant Permission.

The recipient may not yet have a Membership.

Acceptance requires:

```text
valid Invitation

valid unexpired token

authenticated recipient

matching recipient identity

approved Membership lifecycle state
```

The token alone is insufficient authority.

---

# Invitation Token Security

Raw invitation tokens are secrets.

Do not persist:

```text
raw token
```

Persist only the approved secure representation:

```text
tokenHash
```

Raw tokens must not appear in:

```text
logs

audit payloads

database records

error messages
```

---

# Row Level Security

PostgreSQL Row Level Security may provide database-level tenant isolation.

RLS is part of defense in depth.

It is not the application authorization engine.

---

# RLS Versus Permissions

These mechanisms answer different questions.

```text
RLS
→ which tenant rows may this database identity access?
```

```text
Permissions
→ which application capability may this actor perform?
```

```text
Owning Service
→ is the requested operation valid?
```

Do not collapse these concerns.

---

# Membership-Based RLS

Where tenant tables use RLS, policies should follow the canonical tenancy model.

Conceptually:

```text
auth.uid()
        ↓
Profile relationship
        ↓
ACTIVE OrganizationMembership
        ↓
Organization
```

Do not create a parallel Role or Permission model solely for RLS.

Exact policies belong to the data owner protecting each table.

---

# Permission-Aware RLS

Permission-aware RLS is not required by default.

The initial architecture uses:

```text
Membership-based RLS
+
server-side application Permissions
```

More complex Permission-aware database policies should be introduced only when direct client database access or another real requirement makes them necessary.

---

# Database Security

Database security includes:

```text
authentication

network isolation

least-privilege credentials

encrypted transport

tenant isolation

RLS where applicable

foreign keys

unique constraints

safe migrations

backups

controlled administrative access
```

The database must not be publicly exposed without an explicit infrastructure requirement and security review.

---

# Repository Boundary

Repositories are the normal application persistence boundary.

Preferred:

```text
Service
        ↓
Repository
        ↓
Prisma
        ↓
Database
```

Do not scatter persistence access through presentation code.

Migration tooling and infrastructure operations may access the database according to their specific technical responsibilities.

---

# Database Constraints

Critical invariants should be reinforced at the strongest appropriate layer.

Possible controls include:

```text
foreign keys

unique constraints

partial unique indexes

check constraints

PostgreSQL triggers when justified
```

Database enforcement complements application logic.

It does not replace it.

---

# Cross-Tenant Protection

Cross-tenant access must be denied by default.

Tenant-scoped operations must never rely solely on a client-supplied:

```text
organizationId
```

Trusted tenant context must be resolved server-side.

Queries must preserve tenant scope through the entire persistence path.

---

# Platform Administration

Future platform-wide administration must remain separate from normal tenant Roles.

Do not implement:

```text
OWNER
→ cross-tenant platform administrator
```

or:

```text
ADMIN
→ access all Organizations
```

A future platform-administration capability requires explicit architecture.

---

# Secrets Management

Secrets must exist only in approved secret locations.

Examples:

```text
local environment files excluded from Git

Coolify environment variables

approved secret-management infrastructure
```

Secrets must never be intentionally committed to source control.

---

# Secrets Must Not Appear In

Do not expose secrets in:

```text
source code

Git history

documentation

screenshots

logs

error messages

test fixtures

client bundles
```

unless a value is explicitly designed to be public.

---

# Public Versus Secret Configuration

Not every environment variable is secret.

Variables prefixed for client exposure such as:

```text
NEXT_PUBLIC_*
```

must be treated as public.

Never place secret credentials into a variable that will be exposed to the browser.

---

# Environment Validation

Required application configuration should be validated at startup or at the earliest safe usage boundary.

Missing critical configuration should fail clearly rather than producing insecure fallback behavior.

Runtime schema validation is preferred where appropriate.

---

# Credential Separation

Credentials should be separated by environment.

Do not reuse the same production credential indiscriminately across:

```text
development

testing

staging

production
```

where separate credentials are technically supported.

---

# Credential Rotation

Long-lived credentials should support rotation where practical.

Rotation procedures should be documented for production-critical secrets.

Security incidents may require immediate credential rotation.

---

# Authentication Secrets

Never intentionally log or expose:

```text
passwords

access tokens

refresh tokens

Magic Link secrets

session secrets

OAuth secrets

service-role secrets
```

Provider-specific sensitive values must stay behind approved server boundaries.

---

# Supabase Service Role

Any Supabase privileged server credential must remain server-only.

It must never be sent to:

```text
browser code

Client Components

public environment variables
```

Privileged credentials bypassing normal RLS require particularly careful ownership and usage.

---

# File Upload Security

File uploads are untrusted input.

Validation may include:

```text
authenticated identity

tenant context

required Permission

maximum size

MIME allowlist

actual file signature

normalized filename

destination validation

storage constraints
```

The exact controls depend on the product and risk profile.

---

# File Type Validation

Do not rely solely on:

```text
filename extension

browser-provided MIME type
```

when accepting security-sensitive uploads.

Actual file signatures or trusted parsing should be used when appropriate.

---

# Filename Security

Never trust uploaded filenames as storage paths.

Filenames should be normalized or replaced with server-generated identifiers where appropriate.

Prevent:

```text
path traversal

unexpected control characters

unsafe extension behavior
```

---

# Malware Scanning

Malware scanning is not automatically required for every upload.

It should be introduced when:

```text
users exchange arbitrary files

files are redistributed

business risk justifies scanning

compliance requires it
```

Do not claim malware scanning exists until it is implemented.

---

# Storage Visibility

Storage must distinguish between:

```text
public assets

private tenant files

security-sensitive files
```

A file being uploaded successfully does not imply it should be publicly accessible.

Access rules must match the owning capability.

---

# External Providers

External providers are trust boundaries.

Examples:

```text
AI providers

email providers

payment providers

storage providers

OAuth providers

external APIs
```

Provider responses must not be treated as inherently trustworthy.

---

# Provider Adapters

Provider-specific SDK usage belongs behind infrastructure adapters.

Preferred:

```text
Core / Domain Service
        ↓
Infrastructure Adapter
        ↓
Provider SDK
```

This reduces provider leakage and centralizes technical security handling.

---

# Provider Response Validation

Validate external provider responses when malformed or manipulated data could affect:

```text
database state

authorization

publishing

automation

external actions
```

SDK typing does not guarantee runtime correctness.

---

# Webhook Security

Webhook endpoints must be treated as untrusted public entry points.

Where provider capabilities support it:

```text
verify signature

validate timestamp

prevent replay

validate payload

identify provider event

process idempotently
```

---

# Webhook Idempotency

If a provider supplies a stable event identifier, track it when required to prevent duplicate processing.

Provider-specific idempotency semantics belong to the integration.

---

# SSRF Protection

Features that fetch user-controlled URLs introduce Server-Side Request Forgery risk.

Where external URL ingestion exists, protections should include as appropriate:

```text
allow only required schemes

block loopback addresses

block private networks

revalidate redirects

limit redirect count

limit response size

apply timeouts

restrict destinations when possible
```

SSRF defenses must match the actual URL-fetching feature.

Do not implement generic URL fetching without a threat review.

---

# AI Security

AI outputs are untrusted.

AI may produce:

```text
invalid data

malformed structures

unsafe URLs

unexpected instructions

incorrect classifications
```

AI output must pass normal application validation before affecting canonical state.

---

# Prompt Injection

External content supplied to AI systems must be treated as potentially adversarial.

AI-generated or retrieved instructions must never override:

```text
authorization

tenant boundaries

system security rules

data ownership
```

Application code remains the authority.

---

# AI Actions

If AI is eventually allowed to trigger actions:

```text
database writes

publishing

emails

external API calls

automation
```

the action must still pass normal:

```text
authentication

authorization

validation

business invariants
```

AI is not a security principal.

---

# Logging

Logs exist for observability and diagnosis.

Useful structured context may include where appropriate:

```text
requestId

error code

profileId

organizationId

membershipId

action

resource reference
```

Only include identifiers necessary for diagnosis.

---

# Sensitive Logging

Never intentionally log:

```text
passwords

raw tokens

cookies

session secrets

service-role keys

provider credentials

raw invitation tokens

sensitive file contents
```

Personal or business-sensitive data should be minimized.

---

# Error Handling

External responses must not expose implementation details unnecessarily.

Never expose in production:

```text
stack traces

SQL

raw Prisma errors

filesystem paths

secret values

provider credentials

cross-tenant information
```

Use safe application-level errors.

---

# Error Logging

A safe public error does not justify hiding the internal failure.

Preferred:

```text
safe external response
+
structured internal diagnostic log
```

Internal logs must still comply with sensitive-data rules.

---

# Audit

Auditability is a platform requirement for security-sensitive and operationally significant actions.

The future Audit Core module is intended to provide reusable audit infrastructure.

Do not claim a complete audit system exists until it is implemented.

---

# Potential Audit Events

Events that may require audit records include:

```text
authentication security events

Organization changes

Membership changes

Role assignment changes

Permission policy changes

ownership transfer

billing changes

security configuration changes
```

The semantic owner of the event remains the module or Domain where the action occurred.

---

# Audit Is Not Logging

Application logs and audit records serve different purposes.

Conceptually:

```text
logs
→ diagnosis and observability
```

```text
audit records
→ durable record of significant application actions
```

Do not use one as an accidental substitute for the other.

---

# Audit Data Security

Audit records must not contain secrets.

Never store:

```text
passwords

access tokens

refresh tokens

raw invitation tokens

secret keys
```

inside audit payloads.

---

# Security Headers

Production HTTP responses should use appropriate security headers according to application behavior.

Potential controls include:

```text
Strict-Transport-Security

Content-Security-Policy

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

secure cookie attributes
```

Exact policy must reflect real application dependencies.

---

# Content Security Policy

CSP should be deliberately designed rather than copied from a generic template.

It must consider actual:

```text
scripts

styles

images

fonts

iframes

analytics

external providers
```

Avoid permanently weakening CSP merely to suppress integration errors.

---

# HTML Security

Untrusted HTML must not be rendered directly.

React escaping should remain the default.

Any use of:

```text
dangerouslySetInnerHTML
```

requires explicit sanitization and security justification.

---

# Cross-Site Request Forgery

Mutation security must follow the current Next.js and authentication architecture.

Do not create ad hoc CSRF mechanisms without understanding the transport and session behavior.

Explicit external HTTP endpoints may require their own CSRF or signature model depending on the caller.

---

# Cross-Site Scripting

Prevent XSS through:

```text
React escaping

runtime validation

safe URL handling

HTML sanitization when HTML is intentionally accepted

CSP where appropriate
```

Never trust user-provided markup.

---

# Redirect Security

Authentication and application redirects must not permit arbitrary attacker-controlled redirect targets.

Redirect destinations should be:

```text
internal

allowlisted

validated
```

where external redirects are supported.

---

# Rate Limiting

Rate limiting should be applied to abuse-sensitive boundaries when needed.

Examples:

```text
authentication attempts

Magic Link requests

password operations

AI generation

search

imports

webhooks

public APIs

expensive exports
```

Rate-limiting infrastructure must reflect actual threat and workload requirements.

---

# Denial-of-Service Considerations

Protect expensive operations through appropriate controls such as:

```text
input limits

pagination

file-size limits

timeouts

rate limits

bounded AI workloads

bounded external requests
```

Avoid unbounded work triggered directly by untrusted input.

---

# Dependency Security

Dependencies introduce supply-chain risk.

Before introducing a dependency, consider:

```text
maintenance status

security history

license

transitive dependency footprint

actual need
```

Prefer fewer, well-maintained dependencies over unnecessary packages.

---

# Dependency Scanning

Automated dependency and secret scanning should be part of the engineering pipeline when the repository workflow supports it.

Do not claim a particular scanner is active unless it is configured in the repository.

---

# Generated Code Security

Generated code is still part of the deployed system.

Dependencies and generated artifacts should not be assumed safe merely because a tool produced them.

Do not manually insert security behavior into generated files when the generating source or architecture should own that behavior.

---

# Backups

Backups protect availability and recovery.

Security requirements include:

```text
access control

encryption where appropriate

retention

separation from primary failure domain

restore verification
```

Detailed procedures belong under:

```text
docs/operations/BACKUPS.md
```

---

# Backup Confidentiality

Backups may contain the entire application dataset.

They must be protected at least as carefully as the production database.

A leaked backup is a data breach even if the live database remains secure.

---

# Incident Response

Security incidents follow the operational Incident Response process.

Typical lifecycle:

```text
Detect
        ↓
Assess
        ↓
Contain
        ↓
Preserve Evidence
        ↓
Rotate / Revoke
        ↓
Recover
        ↓
Verify
        ↓
Notify where required
        ↓
Document
        ↓
Prevent Recurrence
```

Detailed procedures belong under:

```text
docs/operations/INCIDENT_RESPONSE.md
```

---

# Security Changes

Changes affecting any of the following require deliberate review:

```text
authentication mapping

session handling

tenant model

Membership lifecycle

Role model

Permission model

RLS

secret handling

privileged credentials

file execution/exposure

public APIs

account deletion

cross-tenant administration
```

AI implementation agents must not silently redefine these boundaries.

---

# Account Lifecycle Security

Authentication account deletion or disabling may affect:

```text
Profile

Memberships

Organization ownership

Domain references

audit requirements
```

Do not implement account deletion as a simple provider operation without an approved lifecycle specification.

---

# Organization Ownership Security

Organization ownership is represented through:

```text
ACTIVE OrganizationMembership
+
OWNER Role
```

Do not introduce:

```text
Organization.ownerId

Organization.ownerUserId

Organization.ownerProfileId
```

as a competing ownership system.

---

# Sole OWNER Invariant

Every operational Organization must preserve its approved OWNER invariant.

Normal Membership operations must not:

```text
remove

suspend

demote
```

the sole active OWNER.

Ownership transfer requires its dedicated approved workflow.

---

# Ownership Transfer Security

Ownership transfer is security-sensitive.

It must be:

```text
authenticated

tenant-scoped

permission-authorized

invariant-validated

atomic
```

The destination Role for the previous OWNER must be explicitly defined by architecture before implementation.

Do not assume it is ADMIN.

---

# Platform-Level Privilege

Tenant Roles do not imply platform-wide privilege.

Do not introduce:

```text
SUPER_ADMIN

global OWNER bypass

cross-tenant ADMIN
```

without explicit architecture.

Future platform administration must remain separate from tenant authorization.

---

# Security Testing

Security-sensitive behavior should have automated tests where practical.

Important scenarios include:

```text
unauthenticated denial

inactive Membership denial

missing Permission denial

cross-tenant denial

sole OWNER protection

invalid invitation denial

expired invitation denial

recipient mismatch denial

bootstrap flow success

permission drift detection

unauthorized file access
```

Tests should verify observable security behavior.

---

# Security Validation Before Production

Before a product reaches production readiness, verify applicable controls including:

```text
authentication

session behavior

tenant isolation

authorization

RLS policies

cross-tenant denial

runtime validation

secrets

file upload handling

webhooks

rate limiting where required

security headers

dependency risk

backup restore

incident procedures
```

This is a readiness checklist.

It is not a claim that every control is already implemented.

---

# Current Security Foundation

The current implemented foundation already includes or relies on:

```text
Supabase Authentication

Email + Password authentication

Email Magic Link authentication

server-side authentication integration

Profile identity capability

Next.js server-side application boundaries

PostgreSQL / Supabase persistence foundation
```

Organizations, Roles, Memberships, Tenancy Integration and Permissions are currently defined by approved architecture/specifications and must be implemented according to their dependency sequence.

Do not describe specified-but-unimplemented controls as production protections.

---

# Future Security Capabilities

Potential future capabilities include:

```text
MFA

advanced session management

platform administration

centralized Audit module

automated security scanning

advanced rate limiting

malware scanning

security event monitoring

enterprise identity providers
```

These become current capabilities only after implementation and verification.

---

# AI Agent Security Rules

AI coding agents must not:

```text
trust client authorization values

create duplicate authentication models

create duplicate tenant models

create duplicate authorization systems

store Role directly on Profile

store Permissions directly on Profile

authorize using Role.sortOrder

special-case OWNER as allow-all

add Organization.ownerId

invent SUPER_ADMIN

bypass Membership validation

bypass Permissions for protected tenant operations

persist raw invitation tokens

expose privileged Supabase credentials to the client

disable RLS merely to make queries work

weaken security headers without justification

log secrets

invent authentication providers

claim security controls exist before implementation

change authentication or tenancy semantics silently
```

If implementation requires a new security decision:

```text
STOP
        ↓
Report the finding
        ↓
Architecture / Security decision
        ↓
Document the decision
        ↓
Resume implementation
```

---

# Security Review Checklist

Before implementing a security-sensitive capability, answer:

```text
1. Who is the actor?

2. Is authentication required?

3. Is tenant context required?

4. How is tenant context resolved?

5. Is an ACTIVE Membership required?

6. Which Permission is required?

7. Is this a bootstrap exception?

8. Which module or Domain owns the resource?

9. Which lifecycle invariants must be enforced?

10. Does RLS protect the relevant rows?

11. Which database constraints reinforce correctness?

12. Is any client input being treated as authority?

13. Are secrets involved?

14. Are external providers involved?

15. Does the operation require auditability?

16. Could the operation affect another tenant?

17. Does this change require architecture review?
```

---

# Forbidden Practices

Never:

```text
trust client-side authorization

treat authentication as tenant authorization

treat Membership as unlimited authority

authorize through Role.sortOrder

special-case OWNER as allow-all

store plaintext passwords

persist raw authentication secrets

implement custom cryptography without a reviewed requirement

expose privileged credentials to browser code

expose detailed production errors

expose raw Prisma errors

trust uploaded filenames

trust browser MIME types as sufficient file validation

render unsanitized untrusted HTML

allow arbitrary redirects

trust external provider responses blindly

trust AI output as canonical data

allow unbounded expensive operations from untrusted input

bypass tenant scope for convenience

disable RLS to solve application bugs

duplicate tenant authorization inside Domains

claim future controls are active security
```

---

# Final Principle

Security is systemic.

Identity proves who the actor is.

Organizations establishes the tenant.

Memberships establishes belonging.

Roles establishes the authorization position.

Permissions establishes the allowed capability.

The owning Core module or Domain validates the resource and lifecycle.

RLS strengthens tenant row isolation.

Database constraints strengthen structural correctness.

Infrastructure protects credentials and external boundaries.

The server establishes authority.

The client never does.

No single security mechanism replaces the others.

Defense in depth comes from preserving the responsibility of every layer.