---
id: M2-004
title: Authentication and Authorization
status: Blocked
depends_on:
  - M2-001
  - M2-003
---

# Objective

Implement Auth.js and protect the administrative application.

# Blocking decisions

Confirm login method, session strategy, email provider, Auth.js adapter models, role/permission approach and MFA timing.

# Requirements

- Roles: READER, EDITOR, ADMIN, SUPER_ADMIN.
- Server-side route protection.
- Explicit permission helper.
- Account status validation.
- Session invalidation support.
- Audit security-sensitive actions.
- Polished login screen.
- Seeded administrator support.

# Security

No client-only authorization. Secure cookies. Rate-limit login. Do not expose whether an account exists.

# Acceptance criteria

- login and logout work.
- admin routes protected.
- initial administrator can log in.
- roles available in server context.
- lint, typecheck, build and tests pass.
