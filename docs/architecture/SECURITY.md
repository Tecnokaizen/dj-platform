---
title: Security Architecture
version: 2.0.0
status: Living Document
owner: Platform Core
updated: 2026-08-07
related:
  - IDENTITY.md
  - DATA.md
  - ARCHITECTURE.md
---

# Security Architecture

## Purpose

This document defines the security architecture of Platform Core.

Security is implemented as a cross-cutting concern and applies to every layer of the platform.

Business Domains inherit Platform Core security capabilities and may introduce additional business-specific restrictions when required.

---

# Security Principles

Platform Core follows these principles:

- Least Privilege
- Defense in Depth
- Secure by Default
- Zero Trust
- Explicit Trust Boundaries
- Minimal Data Collection
- Server-side Enforcement
- Auditability

Security is everyone's responsibility.

---

# Trust Boundaries

```text
Browser                 Untrusted

↓

Next.js Server          Trusted Application Boundary

↓

Platform Core

↓

Infrastructure

↓

Database / Storage
```

External providers are considered partially trusted.

Every boundary must validate incoming data.

---

# Secrets Management

Secrets must exist only in approved locations:

- Local `.env` files (excluded from Git)
- Coolify environment variables
- Approved secret managers

Secrets must never appear in:

- Source code
- Git history
- Documentation
- Screenshots
- Logs
- Error messages
- Test fixtures

---

# Environment Validation

Application startup validates all required configuration.

Critical configuration errors should stop the application immediately.

Configuration validation should be performed using runtime schemas.

---

# Authentication

Authentication is implemented by Platform Core.

Current implementation:

- Supabase Authentication
- Secure Cookies
- Server-side Sessions

Future providers should remain replaceable.

Authentication never grants permissions by itself.

---

# Authorization

Every protected operation validates:

- Authentication
- Organization Membership
- Role
- Permission
- Object Ownership (when applicable)

Authorization is always enforced server-side.

Client-side visibility is never considered a security boundary.

---

# Input Validation

Validate every external input.

Examples:

- Forms
- JSON
- Route Parameters
- Query Parameters
- Headers
- Cookies
- File Metadata
- Webhooks
- AI Responses

TypeScript types never replace runtime validation.

---

# File Upload Security

Every uploaded file should be validated.

Minimum checks:

- Maximum Size
- MIME Allowlist
- File Signature
- Safe Filename
- Destination Validation

Recommended:

- Malware Scanning
- Image Re-encoding
- Private/Public Storage Separation

---

# Database Security

Database access follows Platform Core architecture.

Only Repositories communicate with Prisma.

Recommendations:

- Separate credentials per environment
- Encrypted connections
- Least privilege
- Credential rotation
- No public database exposure
- Encrypted backups

---

# External Providers

Every external provider should be treated as untrusted.

Examples:

- AI Providers
- Payment Providers
- Email Providers
- Storage Providers
- OAuth Providers

Responses should always be validated.

---

# SSRF Protection

External URL ingestion should:

- Allow only HTTP/HTTPS
- Block private networks
- Block loopback addresses
- Limit redirects
- Limit response size
- Apply request timeouts
- Revalidate redirected destinations

---

# Logging

Application logs should contain:

- Request ID
- Error Category
- User ID (when appropriate)
- Organization ID (when appropriate)
- Action
- Resource Reference

Never log:

- Passwords
- Tokens
- Cookies
- Secret Keys
- Sensitive Personal Data

---

# Audit

Sensitive actions should always create audit events.

Examples:

- Login
- Logout
- Permission Changes
- Membership Changes
- Organization Updates
- Billing Changes
- Security Configuration
- Administrative Actions

Domains may define additional audit events.

---

# Security Headers

Production environments should enable:

- HSTS
- Content Security Policy (CSP)
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Secure Cookie Attributes

---

# Dependency Security

Before introducing dependencies:

- Verify maintenance status
- Review license
- Review security history
- Minimize dependency count

CI should execute:

- Vulnerability Scans
- Secret Scans
- Dependency Audits

---

# Incident Response

Security incidents follow this lifecycle:

1. Identify
2. Contain
3. Rotate Credentials
4. Preserve Evidence
5. Assess Impact
6. Recover
7. Notify (when required)
8. Document Lessons Learned
9. Prevent Recurrence

---

# Security Validation

Before production deployment verify:

- Authentication
- Authorization
- RLS Policies
- File Uploads
- Webhooks
- Rate Limiting
- Dependency Scan
- Secret Scan
- Backup Restore
- OWASP Checklist

---

# Forbidden Practices

Never:

- Trust client-side authorization
- Store plaintext passwords
- Implement custom cryptography
- Expose detailed production errors
- Render unsanitized HTML
- Trust uploaded filenames
- Share credentials across environments
- Bypass Repository access to the database

---

# Final Principle

Security is not a feature.

Security is a Platform Core capability.

Every Domain benefits from it without having to implement it again.