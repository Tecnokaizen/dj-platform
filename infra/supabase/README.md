# Official Supabase self-hosting baseline

Staging is based on the official Supabase self-hosting release:

- release: `self-hosted/v0.8.0`
- commit: `241bb11c0627f2981746d37033f57dbfa81d29b0`
- published: 2026-08-11
- default gateway: Envoy

The complete official `docker/` directory is the topology source. Do not copy a
hand-selected subset or follow `master`. Materialize it with:

```bash
sh scripts/deploy/fetch-supabase-release.sh
```

The generated `infra/supabase/vendor/` directory is ignored because the source
commit and verification rules are versioned. Phase B must use the generated
official topology before evaluating optional services.

Product-required capabilities are PostgreSQL, Auth, PostgREST and the gateway.
Studio is optional/private. Product-unused and operational-stack dependencies
are evaluated independently.

