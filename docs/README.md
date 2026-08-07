# Documentation

DJ Platform is the first product built on top of a reusable SaaS architecture.

The documentation is split into three layers:

## Architecture

Reusable platform architecture shared by any SaaS product built on this codebase.

See:

- `docs/architecture/CORE.md`
- `docs/architecture/DOMAINS.md`
- `docs/architecture/PROJECT_STRUCTURE.md`
- `docs/architecture/CONVENTIONS.md`

## Domains

Product-specific documentation.

Current domains:

- `docs/domains/dj/`

The DJ domain contains:

- Product vision
- PRD
- Music data model
- AI architecture
- Data ingestion
- RLS
- Domain-specific authentication notes

## Business

Reserved for business-level documentation such as:

- Monetization
- Pricing
- Go-to-market
- Market research
- Competitors

## Principle

The platform core must remain independent from any specific business domain.

Domains may depend on the Core and Shared layers.

The Core must never depend on a domain.