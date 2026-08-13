---
title: Caching Strategy
version: 2.0.0
status: Living Document
owner: Platform Architecture
updated: 2026-08-09
related:
  - ARCHITECTURE.md
  - DATA.md
  - API.md
---

# Caching Strategy

## Purpose

This document defines the caching strategy for the platform.

Caching is a performance optimization.

No dedicated application cache or distributed cache is currently implemented.

Correctness always takes priority over speed.

---

# Principles

Platform Core follows these principles:

- Correctness before performance
- Server-side cache first
- Explicit invalidation
- Deterministic cache keys
- No secrets in shared caches
- Cache only when justified
- Measure before optimizing

Caching should never change application behavior.

---

# Cache Layers

Platform Core may use multiple cache layers.

```text
Browser

↓

CDN / Reverse Proxy

↓

Next.js Cache

↓

Application Cache

↓

Database

↓

External Providers
```

Not every layer is required for every deployment.

This diagram is conceptual.

A cache layer must not be treated as implemented until it exists in source code and, when applicable, deployment configuration.

---

# Cacheable Resources

Typical cache candidates include:

- Public pages
- Shared configuration
- Reference data
- Navigation
- Public documentation
- Static assets

Business Domains define their own cacheable resources.

---

# Never Cache

The following should never be publicly cached:

- User-specific data
- Authentication state
- Authorization results
- Private files
- Administrative interfaces
- Sensitive business information

The current platform does not cache authorization decisions.

Any future authorization caching would require explicit security review, tenant-aware scoping and reliable invalidation.

---

# Cache Invalidation

The capability or service that owns the mutation coordinates cache invalidation for the state it changes.

Transport and UI layers may initiate a mutation, but they do not own invalidation policy.

Invalidate only the affected resources.

Avoid global cache invalidation whenever possible.

---

# Cache Keys

Cache keys should include:

- Resource Type
- Resource Identifier
- Locale (when applicable)
- Organization Identifier for tenant-scoped data
- Profile or Membership Identifier when private scope depends on the actor
- Filters
- Pagination
- Version

Keys should remain deterministic.

Tenant-scoped cache entries must never share cache identity across Organizations.

A cache hit must never widen access beyond the caller's current authorized scope.

---

# AI Caching

No runtime AI provider or AI response cache is currently implemented.

If AI caching is introduced, AI responses may be cached when appropriate.

Cache keys should include:

- Task
- Prompt Version
- Normalized Input
- Provider
- Model

Invalidate cached AI responses whenever:

- Source data changes
- Prompt behavior changes
- Provider output becomes invalid

---

# Redis

Redis is not currently part of the application stack.

Redis is optional as a distributed caching technology.

Introduce Redis for caching only when a measurable need exists.

Redis may also support other architectural concerns such as rate limiting, queues, distributed locks, idempotency or session storage.

Those uses are not cache responsibilities and require their own failure semantics and architectural review.

Redis adoption with architectural impact requires an ADR.

---

# Failure Strategy

Failure of an optional performance cache should not make the application unavailable.

Recommended behavior:

```text
Cache Miss

↓

Primary Data Source

↓

Optional Cache Refresh
```

Critical services should continue operating without optional caches.

This rule does not apply when a technology is intentionally used as a required coordination, persistence, queue or security mechanism. Those capabilities require their own failure strategy.

---

# Performance Strategy

Performance optimization is evidence-driven.

A typical investigation order is:

1. Query design
2. Database indexes
3. Pagination and data-loading strategy
4. Measure the remaining bottleneck
5. Introduce framework caching or CDN caching when appropriate
6. Introduce distributed caching only when justified
7. Scale infrastructure when measurements require it

This is guidance, not a mandatory sequence.

Do not introduce caching to compensate for poor database design.

---

# Observability

No dedicated cache subsystem is currently implemented, so cache telemetry is a future operational requirement rather than a current capability.

When caching is introduced, monitor as applicable:

- Cache Hit Rate
- Cache Miss Rate
- Latency
- Memory Usage
- Eviction Rate

Caching effectiveness should be measurable.

---

# Forbidden Practices

Never:

- Cache sensitive information
- Cache authorization indefinitely
- Cache secrets
- Cache tenant-scoped data without tenant-aware keys
- Treat cached authorization as the source of truth
- Use infinite TTL without versioning
- Invalidate the entire application after every mutation
- Introduce caching before measuring performance

---

# Final Principle

Caching is an optimization layer.

Business logic must never depend on cached data.

The application should remain functionally correct even when every cache is disabled.