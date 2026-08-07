---
title: Identity and Access Management
version: 2.0.0
status: Living Document
owner: Platform Core
updated: 2026-08-07
---

# Identity and Access Management

## Purpose

This document defines how Platform Core manages identity, authentication, authorization, organizations, memberships, roles, permissions and session security.

Identity is a Platform Core capability.

Business-specific permissions belong to Domains.

---

# Identity Model

Platform identity follows this structure:

```text
User
↓
Profile
↓
Organization Membership
↓
Role
↓
Permissions
```

A user may belong to multiple organizations.

A user identity is not a business entity.

Examples:

- A user identity is not a business entity.
- A user is not an employee.
- A user is not a customer.
- A user is not a salesperson.

Business entities belong to Domains.

---

# Authentication

Authentication identifies the user.

Platform Core currently supports:

- Supabase Authentication
- Email + Password
- Secure Cookies
- Server-side Sessions
- SSR Session Refresh

Future authentication methods may include:

- Magic Link
- Google OAuth
- GitHub OAuth
- Apple OAuth
- Enterprise SSO

Authentication providers must remain replaceable.

---

# Profiles

Every authenticated user owns one Platform Profile.

Profiles contain platform-level information such as:

- Display Name
- Avatar
- Language
- Timezone
- Personal Preferences

Profiles never contain business-specific information.

---

# Organizations

Organizations define tenant boundaries.

```text
Organization
├── Members
├── Roles
├── Permissions
├── Settings
└── Domain Data
```

A user may:

- Own an organization.
- Administer multiple organizations.
- Belong to multiple organizations.
- Have different roles in different organizations.

---

# Memberships

A Membership represents the relationship between:

```text
User
+
Organization
+
Role
```

Membership states:

```text
INVITED
ACTIVE
SUSPENDED
REMOVED
```

---

# Roles

Roles belong to Platform Core.

Default roles:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Domains may extend permissions but should not redefine the Core role model.

---

# Permissions

Permissions define allowed actions.

Core permissions may include:

```text
PROFILE_UPDATE
MEMBER_INVITE
MEMBER_REMOVE
ROLE_ASSIGN
ORGANIZATION_UPDATE
SETTINGS_UPDATE
BILLING_MANAGE
AUDIT_READ
```

Domains define their own business permissions.

Examples:

```text
DOMAIN_RESOURCE_CREATE
DOMAIN_RESOURCE_PUBLISH
ORDER_UPDATE
SEO_PROJECT_MANAGE
```

---

# Authorization

Authentication identifies the user.

Authorization determines whether the authenticated user may perform an action.

Every protected operation must validate:

- Active session.
- Organization membership.
- Assigned role.
- Required permission.
- Object-level ownership when applicable.

---

# Server-side Enforcement

Authorization is always enforced server-side.

Typical enforcement points:

- Server Actions
- Services
- API Routes
- Row Level Security (RLS)

Client-side visibility is never considered a security boundary.

---

# Row Level Security

RLS protects data access at database level.

Policies typically evaluate:

```text
auth.uid()
organization_id
membership
role
```

Application authorization and RLS complement each other.

---

# Sessions

Sessions should contain only minimal identity information.

Recommended session data:

- User ID
- Session Expiration
- Authentication Context

Avoid storing:

- Complete Profiles
- Permission Trees
- Business Data

---

# Invitations

Invitation lifecycle:

1. Organization member creates invitation.
2. Invitation stores target organization and role.
3. Recipient accepts invitation.
4. Membership is created.
5. Audit event is recorded.

Invitations must expire automatically.

---

# Session Invalidation

Sessions should be invalidated after:

- Password change.
- Account suspension.
- Account deletion.
- Critical permission changes.
- Security incidents.
- Explicit administrator action.

---

# Multi-Factor Authentication

Platform Core should support:

- TOTP
- Recovery Codes
- Enterprise MFA Providers

MFA is strongly recommended for:

```text
OWNER
ADMIN
```

---

# Audit

Identity-related events should be recorded.

Examples:

- Login
- Logout
- Failed Login
- Invitation Created
- Invitation Accepted
- Role Changed
- Membership Removed
- Password Reset
- MFA Enabled
- MFA Disabled

Never record:

- Passwords
- Access Tokens
- Refresh Tokens
- Secret Keys

---

# Domain Integration

Domains may:

- Request authentication.
- Request authorization.
- Define domain-specific permissions.

Domains must never implement their own authentication system.

Allowed:

```text
Domain
↓
Platform Core Identity
```

Forbidden:

```text
Domain
↓
Custom Authentication
```

---

# Future Roadmap

Platform Core should evolve to support:

- Magic Link
- Enterprise SSO
- SCIM
- Device Management
- Session Management
- Security Policies
- Organization-level Security
- Identity Providers