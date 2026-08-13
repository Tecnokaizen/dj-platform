---
title: Architecture Decisions
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - CORE.md
  - DATA.md
  - DOMAINS.md
  - IDENTITY.md
  - TENANCY.md
  - SECURITY.md
  - PRISMA_IMPLEMENTATION.md
  - TECH_STACK.md
  - DEPLOYMENT.md
  - ../adr/
---

# Architecture Decisions

## Purpose

This document is the registry for Architectural Decision Records (ADRs) that define significant long-term platform decisions.

Living architecture documents describe the current approved architecture.

ADRs record why significant architectural decisions were made, which alternatives were considered and how those decisions evolve over time.

The canonical ADR directory is:

`docs/adr/`

---

# Current Formal ADR Status

No ADR files currently exist under `docs/adr/`.

Therefore no decision has yet been formally recorded as an Accepted ADR.

However, several foundational architectural decisions are already established across the Living Architecture documents and current implementation.

Those decisions require ADR backfill so that the architecture baseline records not only what was decided, but also why.

Backfilling an ADR does not automatically reopen an already established architectural decision.

---

# ADR Lifecycle

The standard ADR lifecycle is:

`Proposed → Accepted → Superseded`

A Proposed ADR is not an implementation authorization.

An Accepted ADR becomes part of the architectural baseline.

When an Accepted ADR is replaced, the previous ADR remains in the repository and is marked Superseded.

Architectural history must not be deleted merely because a decision changes.

---

# ADR Naming

ADR files should use a stable numeric identifier and descriptive filename.

Example:

`ADR-001-platform-core-domain-boundary.md`

The ADR number never changes after assignment.

---

# Required ADR Backfill

The following foundational decisions are already established and should be formalized as ADRs.

## ADR-001 — Platform Core and Domain Boundary

Record the decision to separate the system into:

- Platform Core
- Business Domains
- Shared technical resources
- Infrastructure adapters
- Application composition

The ADR should formalize the dependency direction:

- `app → core / domains / shared`
- `domains → core / shared / lib`
- `core → shared / lib`
- `lib → generated / external`

And explicitly prohibit:

- `core → domains`
- `shared → core`
- `shared → domains`
- `Domain A → Domain B`

---

## ADR-002 — Identity Source of Truth

Record the decision that:

- Supabase `auth.users` is the canonical authentication identity.
- `Profile` is the canonical application identity/profile.
- Authentication and application profile are related but distinct concepts.
- Platform Core must not introduce a duplicate Prisma `User` authentication model.
- Business Domain entities such as Artist or Employee must not automatically become authentication identities.

---

## ADR-003 — Internal Identifier Strategy

Record the identifier strategy for new Platform Core persistence models.

The current architecture uses UUID identifiers for new Core entities.

Semantic reference data such as Roles and Permissions must be resolved through stable semantic keys rather than hard-coded UUID values.

Examples include:

- `OWNER`
- `ADMIN`
- `organizations.read`
- `memberships.read`

Existing models must not be rewritten solely to satisfy identifier uniformity without a justified migration requirement.

---

## ADR-004 — Tenancy and Organization Model

Record the decision that:

- `Organization` is the canonical tenant.
- `Organization.id` is the canonical tenant identifier.
- No separate persisted `Tenant` entity is required.
- Tenant belonging is represented through `OrganizationMembership`.
- Tenant context is resolved server-side.
- Client-provided organization identifiers are not trusted as authorization authority.
- Tenant isolation is enforced across application services, persistence and RLS where applicable.

---

## ADR-005 — Roles, Memberships and Ownership Model

Record the decision that:

- Roles are global system reference data.
- Initial canonical Roles are `OWNER`, `ADMIN`, `MANAGER`, `MEMBER` and `VIEWER`.
- A Membership connects a Profile to an Organization.
- Role assignment belongs to the Membership.
- Organization ownership is represented through an ACTIVE Membership with the OWNER Role.
- `Organization` does not contain `ownerId`, `ownerUserId` or `ownerProfileId`.
- Invitations are modeled separately from durable Memberships.
- An invitation does not become a Membership until it is accepted successfully.

---

## ADR-006 — Authorization and Permission Model

Record the initial authorization model:

`ACTIVE Membership → Role → RolePermission → Permission`

The ADR should formalize that:

- authorization is deny-by-default;
- Permissions are explicit positive grants;
- there is no implicit OWNER bypass;
- there is no Role inheritance;
- there are no wildcard Permissions in the initial model;
- there are no per-Membership or per-Organization Permission overrides in the initial model;
- Domain-specific Permission keys use the same Platform Core authorization engine;
- Permission approval does not replace Domain business validation;
- RLS and application Permissions solve different security concerns.

---

## ADR-007 — Prisma and Data Access Conventions

Record the decision to use PostgreSQL with Prisma as the application ORM and establish the persistence conventions.

The ADR should include:

- repository-based persistence boundaries;
- Prisma generated code as implementation detail rather than semantic ownership;
- transactional boundaries for multi-entity invariants;
- explicit database constraints where appropriate;
- raw PostgreSQL migration SQL when a required database capability is not safely expressible through the active Prisma configuration;
- no duplicate authentication identity model;
- semantic ownership remaining in Core or Domain rather than in Prisma itself.

---

## ADR-008 — Deployment and Infrastructure Strategy

Record the initial deployment strategy:

- modular monolith;
- Docker-based application deployment;
- Coolify-managed infrastructure;
- PostgreSQL persistence;
- self-hosted Supabase infrastructure where adopted;
- environment isolation;
- ephemeral application container filesystem;
- external persistent storage when required;
- no microservices without demonstrated architectural need.

The ADR must distinguish architecture targets from infrastructure that is actually operational.

---

# Future ADR Candidates

The following subjects may require ADRs when implementation requirements become concrete.

## ADR-009 — Storage Strategy

Potential topics:

- S3-compatible object storage
- storage abstraction
- tenant boundaries
- private files
- signed access
- backup implications
- provider portability

No storage provider should be treated as selected until this decision is made.

---

## ADR-010 — AI Provider Abstraction

Potential topics:

- provider adapter boundary
- OpenAI
- Anthropic
- provider portability
- prompt ownership
- validation of AI output
- observability
- cost controls

Development AI tools are separate from application runtime AI providers.

---

## ADR-011 — Search Strategy

Potential topics:

- PostgreSQL search
- dedicated search engine
- vector search
- indexing
- tenant isolation
- synchronization

No dedicated search infrastructure should be introduced without demonstrated need.

---

## ADR-012 — Background Jobs and Queue Strategy

Potential topics:

- workers
- queues
- retries
- idempotency
- scheduling
- failure handling
- Redis or alternative infrastructure

Long-running tasks do not automatically justify introducing a queue system.

---

## ADR-013 — Event Architecture

Potential topics:

- Domain events
- integration events
- asynchronous workflows
- event persistence
- delivery guarantees

Do not introduce an event architecture speculatively.

---

## ADR-014 — Billing Strategy

Potential topics:

- subscriptions
- entitlements
- plans
- payment provider abstraction
- tenant billing ownership
- billing lifecycle

Billing remains a planned Platform Core capability until requirements are approved.

---

# Open Architectural Questions

The following questions are intentionally unresolved and must not be silently decided by implementation agents.

## Ownership Transfer Destination Role

When Organization ownership is transferred, the destination Role of the previous OWNER has not yet been approved.

Implementation must not assume that the previous OWNER automatically becomes ADMIN.

This decision must be resolved before ownership-transfer implementation.

---

## OWNER Database Enforcement

The architecture requires every operational Organization to have exactly one ACTIVE OWNER.

Application transactions and tests must enforce the invariant.

The exact PostgreSQL enforcement mechanism requires implementation review because OWNER semantics depend on the related Role record.

Possible stronger database enforcement must be evaluated before adoption.

---

## Invitation Partial Uniqueness

The architecture requires at most one PENDING invitation per:

`organizationId + normalizedEmail`

The implementation must verify the capabilities of the active Prisma version and configuration.

If the required partial uniqueness cannot be represented safely through the active Prisma schema capabilities, raw PostgreSQL migration SQL may be used.

The implementation agent must not invent or assume ORM support.

---

# Decision Authority

Platform Architecture owns architectural decisions.

AI coding agents implement approved architecture.

AI coding agents must not silently decide:

- new architectural layers;
- new tenant models;
- new identity systems;
- new authorization systems;
- new Platform Core modules;
- direct Domain-to-Domain dependencies;
- infrastructure with architectural impact;
- changes to canonical ownership;
- unresolved architectural questions.

When implementation reveals a missing architectural decision:

`STOP → Report → Architecture Decision → Documentation → Resume`

---

# ADR and Living Document Consistency

Accepted ADRs and Living Architecture documents must remain aligned.

When an ADR changes the architecture:

1. accept or supersede the relevant ADR;
2. update affected Living Architecture documents;
3. update implementation guidance;
4. update review/readiness documents when necessary;
5. verify source consistency before implementation continues.

An ADR must not leave the current architecture documentation knowingly contradictory.

---

# Implementation Rule

Significant new architectural decisions should normally be documented through an ADR before implementation.

When implementation predates ADR formalization, the decision should be backfilled before the next architecture baseline is declared complete.

Implementation convenience is not an architectural decision process.

---

# Final Principle

Living Architecture documents define the current system architecture.

ADRs preserve the reasoning and history behind significant architectural choices.

The platform must retain both.

Architecture without implementation reality becomes fiction.

Implementation without recorded architectural decisions becomes accidental architecture.