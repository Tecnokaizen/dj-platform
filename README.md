# Platform Core

> Reusable, business-agnostic SaaS foundation and the primary implementation focus of this repository.

---

## Platform Overview

**Platform Core** is the repository's primary project. It provides reusable SaaS capabilities whose semantics are independent from a specific business vertical.

**DJ Platform** is the first and reference Product that composes Platform Core with the **DJ** Business Domain. It is the current validation consumer of Platform Core, not the owner of Core capabilities.

**DJ** is the current reference Business Domain. It owns electronic-music-specific semantics and consumes Platform Core; it is not synonymous with DJ Platform.

Conceptually, Products are customer-facing compositions:

    Product
        ↓
    App Composition
        +
    Platform Core
        +
    one or more Business Domains
        +
    Shared Technical Capabilities
        +
    Infrastructure

Product and Domain are not synonyms.

---

## Platform Vision

The long-term goal is to develop Platform Core as a reusable, business-agnostic SaaS foundation through approved capabilities and real Product validation.

Business Domains provide vertical-specific semantics. Products compose Platform Core and one or more Domains into customer-facing applications. Neither Products nor Domains own Core capabilities.

Platform Core is not independently deployed or Production Ready merely because it is reusable; Core capabilities operate as part of a deployed Product runtime when applicable.

---

## DJ Platform Reference Product Vision

DJ Platform is an AI-native knowledge and content Product for Electronic Dance Music and DJ culture. Its broader Product direction may include:

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

Strategic Product scope is broader than current implementation. Roadmap presence does not mean a capability is already implemented.

---

## Core Foundation

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
- Organizations Foundation Stage 1 CONDITIONAL PASS
- Roles Foundation Stage 1 CLOSED / PASS
- Memberships Foundation implementation in progress
- Permissions pending / deferred

The Memberships schema, enums, models, migration and repository lookups exist, but Memberships Foundation remains incomplete.

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

No Product or Platform Core runtime is currently considered Production Ready.

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

Platform Core is the repository's primary reusable, business-agnostic SaaS foundation.

DJ Platform is its first/reference Product and current validation consumer.

The DJ Domain is the current reference Business Domain and owns electronic-music-specific semantics.

App composes capabilities.

Engineering implements approved Architecture.

Operations manages deployed systems.

AI agents execute within explicit roles.

Build only the next justified capability.
