---
title: Caching Strategy
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
---

# Caching Strategy

## Principles

- correctness before speed
- server-side cache first
- public data before personalized data
- deterministic cache keys
- explicit invalidation
- no secrets in shared caches

## Cache layers

Potential layers:

1. browser cache
2. CDN or reverse proxy
3. Next.js data cache
4. application cache
5. optimized database queries
6. external provider cache

Not every layer is required for MVP.

## Suitable public resources

- published DJ profiles
- genre pages
- ranking editions
- festival pages
- public articles
- navigation taxonomies

Do not publicly cache:

- drafts
- admin pages
- favorites
- user profiles
- permission-dependent data

## Invalidation

The service that completes a mutation owns cache invalidation.

Conceptual tags:

```text
dj:{id}
dj:slug:{slug}
genre:{id}
ranking:{id}
festival:{id}
article:{id}
directory:djs
```

Publishing a DJ may invalidate:

- DJ profile
- directory
- related genres
- search
- sitemap
- affected rankings

## Cache keys

Include:

- resource type
- identifier
- locale
- normalized filter set
- page or cursor
- version where needed

## AI cache

AI keys include:

- task
- prompt version
- normalized input hash
- provider
- model

Invalidate when source data or prompt meaning changes.

## Redis

Redis is not required initially.

Introduce only for a documented need:

- distributed rate limiting
- queues
- cross-instance cache
- idempotency
- distributed locks

Requires ADR.

## Failure behavior

Normal content cache failure should fall back to source retrieval.

Rate limits, locks and idempotency require explicit failure policies.

## Forbidden practices

Never:

- cache admin pages publicly
- cache secrets
- cache authorization indefinitely
- use infinite TTL without versioning
- add caching to hide poor query design
- invalidate the entire application after every mutation
