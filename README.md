# DJ Platform

> AI-native knowledge and content Product for Electronic Dance Music, built on a reusable SaaS foundation.

---

## Overview

DJ Platform is a Product focused on DJs, electronic music and structured music knowledge.

Its broader direction includes:

- DJs and artists
- genres
- festivals
- tracks
- labels
- sessions
- playlists
- rankings
- editorial content
- relationships between music entities
- discovery
- AI-assisted workflows

The repository is also being used to develop and validate a reusable SaaS foundation called **Platform Core**.

Conceptually:

    DJ Platform
        ↓
    App Composition
        +
    Platform Core
        +
    DJ Domain
        +
    Shared Technical Capabilities
        +
    Infrastructure

DJ Platform is the Product.

DJ is the Business Domain.

Platform Core is the reusable SaaS foundation.

Product and Domain are not synonyms.

---

## Product Vision

The long-term goal is to build a high-quality knowledge platform for DJs and electronic music.

Users should eventually be able to understand:

- who an artist is
- how they sound
- which genres they represent
- their career and context
- relevant festivals
- important sessions
- related artists
- rankings
- relationships within electronic music culture

Strategic Product scope is broader than current implementation.

Roadmap presence does not mean a capability is already implemented.

---

## Platform Core

Platform Core contains reusable SaaS capabilities whose semantics are independent from a specific business vertical.

Current Foundation sequence:

    Identity
        ↓
    Organizations
        ↓
    Roles
        ↓
    Memberships
        ↓
    Tenancy Integration
        ↓
    Permissions

Current status:

- Identity foundation implemented
- Organizations specified
- Roles specified
- Memberships specified
- Permissions specified

Specified does not mean implemented.

Future capabilities are not promoted into Platform Core merely because they could theoretically be reused.

---

## Current Implementation

The repository already contains application code.

Current implemented foundation includes:

- Next.js application
- Supabase authentication
- email/password authentication
- magic-link authentication
- protected application area
- application Profile
- Prisma foundation
- generated Prisma client
- initial Core and Domain source boundaries

Large parts of the DJ Domain and Core Foundation remain implementation work.

---

## Identity

Supabase Auth is the canonical authentication identity.

Application identity is represented by:

    Profile

A DJ or artist is a Domain entity.

A DJ is not automatically an authenticated application user.

Do not introduce a second canonical Prisma `User` model.

---

## Tenancy

`Organization` is the canonical tenant boundary.

Organization ownership is modeled through:

    Organization
    +
    ACTIVE OrganizationMembership
    +
    OWNER Role

Ownership is not represented by a competing `ownerUserId`, `ownerId` or `ownerProfileId` field.

---

## Source Structure

    src/
    ├── app/
    ├── config/
    ├── core/
    │   ├── identity/
    │   └── modules/
    ├── domains/
    │   └── dj/
    ├── generated/
    │   └── prisma/
    ├── lib/
    └── shared/

Main responsibilities:

`src/app`

Product composition, routing and framework entry points.

`src/core`

Reusable SaaS capabilities.

`src/domains`

Business-specific semantics.

`src/shared`

Business-agnostic technical reuse.

`src/lib`

Infrastructure adapters and provider connectivity.

`src/generated`

Generated artifacts.

---

## Dependency Direction

Allowed:

    app
    → core / domains / shared

    domains
    → core / shared / lib

    core
    → shared / lib

    lib
    → generated / external providers

Forbidden:

    core
    → domains

    shared
    → core

    shared
    → domains

    Domain A
    → Domain B

---

## Current Technology Stack

Application:

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4

Data:

- PostgreSQL
- Prisma 7
- `pg`

Authentication:

- Supabase Auth
- `@supabase/ssr`
- `@supabase/supabase-js`

Package manager:

- npm

Infrastructure direction:

- VPS
- Coolify
- PostgreSQL
- Supabase self-hosted
- Docker-based services where appropriate

Verify exact dependency versions from `package.json`.

---

## Do Not Assume

The repository does not currently assume the presence of:

- Auth.js
- Zod
- shadcn/ui
- OpenAI SDK
- Anthropic SDK
- Vitest
- Playwright
- Storybook
- Redis
- queue infrastructure
- generic object storage
- generic Billing

Check the repository before introducing or using dependencies.

---

## Repository Structure

    dj-platform/
    ├── .cursor/
    ├── docs/
    ├── prisma/
    ├── public/
    ├── src/
    ├── AGENTS.md
    ├── PROJECT_CONTEXT.md
    ├── README.md
    └── package.json

Other directories may exist for tooling, tasks, assets or generated artifacts.

Architectural ownership is defined by repository documentation, not by directory names alone.

---

## Documentation

Primary entry points:

- `PROJECT_CONTEXT.md`
- `AGENTS.md`
- `docs/INDEX.md`
- `docs/PLATFORM_MATURITY.md`

Main documentation areas:

    docs/
    ├── architecture/
    ├── backend/
    ├── business/
    ├── core/
    ├── domains/
    ├── engineering/
    ├── frontend/
    ├── operations/
    ├── adr/
    └── reviews/

Documentation is organized by responsibility and ownership.

Documentation must remain aligned with repository reality.

No single document should be followed blindly when stronger repository or runtime evidence proves it stale.

---

## Development Model

Before significant implementation:

1. understand the task
2. read relevant context
3. identify capability ownership
4. inspect current source
5. verify implementation readiness
6. implement approved scope
7. validate
8. review and report

Readiness question:

    Can the implementation agent execute this work
    without making an unresolved architectural decision?

If not, stop and resolve the decision before continuing.

---

## AI-Assisted Development

AI is used as part of the development workflow.

Different roles must remain explicit.

An Architecture agent may analyze and propose architectural decisions.

An implementation agent implements approved Architecture and must not silently redefine it.

Repository-level AI instructions are defined in:

- `AGENTS.md`
- `.cursor/RULES.md`
- `.cursor/WORKFLOW.md`
- `.cursor/CHECKLIST.md`

---

## Validation

Current baseline validation:

    npm run typecheck
    npm run lint

Additional validation depends on the task and may include:

- build
- automated tests
- migrations
- database verification
- authentication verification
- runtime checks
- Product flow validation

Never claim a validation step passed unless it was actually executed.

Static validation is not equivalent to comprehensive automated testing.

---

## Infrastructure Status

Development infrastructure exists and continues to evolve.

Current infrastructure direction includes:

- VPS
- Coolify
- PostgreSQL
- Supabase self-hosted

Supabase self-hosted infrastructure remains under operational validation.

The existence of deployment configuration does not prove that every service is healthy.

Staging is not assumed.

Production is not currently verified.

DJ Platform is not currently considered Production Ready.

---

## Security

Never commit:

- passwords
- tokens
- API keys
- database credentials
- authentication secrets
- private environment configuration

External input must be validated at the appropriate boundary.

Protected behavior requires server-side authorization.

Client-side visibility is not security.

---

## Current Repository Priorities

Current priorities are:

1. complete repository context consolidation
2. backfill foundational ADRs
3. perform formal Architecture Review
4. perform Cursor / AI Agent Readiness Review
5. validate repository state
6. commit the consolidated foundation
7. resume approved Core Foundation implementation

Avoid jumping ahead to speculative Product or infrastructure capabilities.

---

## Project Maturity

Architecture and documentation are significantly consolidated.

Implementation is partial.

Operational readiness is not established.

Production readiness requires evidence.

See:

    docs/PLATFORM_MATURITY.md

---

## License

License strategy is not yet finalized.

---

## Final Principle

DJ Platform is the current Product.

Platform Core is the reusable SaaS foundation.

The DJ Domain owns electronic-music-specific semantics.

App composes capabilities.

Engineering implements approved Architecture.

Operations manages deployed systems.

AI agents execute within explicit roles.

Build only the next justified capability.
