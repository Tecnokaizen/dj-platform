---
title: Authentication and Authorization
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
---

# Authentication and Authorization

## Principles

Authentication identifies the user.

Authorization determines allowed actions.

Successful authentication never implies administrative permission.

## Framework

Auth.js is planned. Exact version, adapter and login method require ADR approval during bootstrap.

## Initial roles

```text
READER
EDITOR
ADMIN
SUPER_ADMIN
```

### Reader

- public content
- own profile
- own favorites

### Editor

- create drafts
- edit permitted entities
- add sources
- submit for review
- use limited AI assistance

### Admin

- publish and unpublish
- manage taxonomies
- manage imports
- manage editor accounts
- review audit events
- manage non-critical settings

### Super Admin

- manage administrators
- perform destructive maintenance
- rotate integrations
- access recovery tools

## Permissions

Sensitive operations should use explicit permissions:

```text
DJ_CREATE
DJ_EDIT
DJ_PUBLISH
DJ_ARCHIVE
GENRE_MANAGE
RANKING_MANAGE
IMPORT_RUN
AI_GENERATE
USER_MANAGE
SETTINGS_MANAGE
AUDIT_READ
```

## Server-side enforcement

Every protected operation checks:

- valid session
- active account
- required permission
- object-level access where relevant

Middleware may perform coarse route checks. Fine-grained checks remain in services or actions.

## Account states

```text
INVITED
ACTIVE
SUSPENDED
DISABLED
```

## Session data

Store only what is needed:

- user ID
- role or permission snapshot
- expiration
- optional security version

Do not store complete profiles in the session token.

## Invitation flow

1. Create or locate user.
2. Assign allowed role.
3. Generate time-limited token.
4. Send invitation.
5. Record audit event.
6. Require confirmation.

## Authentication method

Pending ADR:

- magic link
- password
- hybrid
- internal GitHub provider for development

## MFA

Strongly recommended for ADMIN and SUPER_ADMIN.

## Session invalidation

Required after:

- password change
- role downgrade
- account suspension
- security incident
- manual admin action

## Audit

Record:

- login outcome summary
- role changes
- invitations
- suspension
- publication
- destructive actions
- sensitive settings changes

Never log credentials or tokens.

## Pending decisions

- login method
- email provider
- Prisma adapter
- permission persistence model
- MFA method
- session duration
- public registration timing
