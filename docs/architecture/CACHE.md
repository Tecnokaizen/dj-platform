---
title: Caching Strategy
version: 2.0.0
status: Living Document
owner: Platform Core
updated: 2026-08-07
related:
  - ARCHITECTURE.md
  - DATA.md
  - API.md
---

# Caching Strategy

## Purpose

This document defines the caching strategy used by Platform Core.

Caching is a performance optimization.

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

---

# Cache Invalidation

The component performing the mutation owns cache invalidation.

Invalidate only the affected resources.

Avoid global cache invalidation whenever possible.

---

# Cache Keys

Cache keys should include:

- Resource Type
- Resource Identifier
- Locale (when applicable)
- Organization (when applicable)
- Filters
- Pagination
- Version

Keys should remain deterministic.

---

# AI Caching

AI responses may be cached when appropriate.

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

Redis is optional.

Introduce Redis only when a measurable need exists.

Typical use cases:

- Distributed Cache
- Rate Limiting
- Queues
- Distributed Locks
- Idempotency
- Session Storage

Redis adoption requires an ADR.

---

# Failure Strategy

Cache failures should never make the application unavailable.

Recommended behavior:

```text
Cache Miss

↓

Primary Data Source

↓

Optional Cache Refresh
```

Critical services should continue operating without cache.

---

# Performance Strategy

Optimize in this order:

1. Database queries
2. Indexes
3. Pagination
4. Next.js Cache
5. CDN
6. Redis
7. Horizontal Scaling

Do not introduce caching to compensate for poor database design.

---

# Observability

Monitor:

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
- Use infinite TTL without versioning
- Invalidate the entire application after every mutation
- Introduce caching before measuring performance

---

# Final Principle

Caching is an optimization layer.

Business logic must never depend on cached data.

The application should remain functionally correct even when every cache is disabled.