---
title: AI Architecture
version: 1.0.0
status: Draft
owner: Architecture
updated: 2026-08-04
---

# AI Architecture

## Purpose

AI assists editorial and operational workflows. It is not an autonomous publisher or a trusted factual source.

## Initial use cases

Allowed:

- metadata normalization
- duplicate suggestions
- genre classification suggestions
- structured extraction
- biography drafts
- source summarization
- SEO suggestions
- relationship suggestions
- editorial quality checks

Not allowed without explicit approval:

- automatic publication
- unreviewed factual biographies
- bulk generation without limits
- private-data training
- hidden ranking manipulation

## Provider abstraction

```text
Domain Service
  ↓
AI Gateway
  ↓
Task Service
  ↓
Provider Adapter
  ├── OpenAI
  └── Anthropic
```

No domain module imports provider SDKs directly.

## Task contract

Every AI task defines:

- purpose
- input schema
- output schema
- prompt version
- allowed providers
- timeout
- retry policy
- token ceiling
- budget policy
- human review requirement

## Structured output

All model output is validated with Zod.

Invalid output is rejected or repaired with a bounded retry.

## Prompt versioning

Examples:

```text
dj-biography.v1
genre-classification.v1
duplicate-detection.v1
```

Prompt changes that alter meaning require:

- version increment
- examples
- evaluation
- documentation

## Factual safety

Generated claims must be:

- derived from supplied sources
- flagged when uncertain
- reviewable
- excluded from automatic publication

Distinguish:

```text
verified fact
source-derived summary
editorial interpretation
AI inference
```

## Review statuses

```text
GENERATED
VALIDATED
REJECTED
PUBLISHED
```

Publishing requires an authorized human.

## Cost controls

- per-task token limits
- daily or monthly budget
- role-based access
- batch limits
- token and cost tracking
- duplicate request protection

## Privacy

Never send:

- secrets
- tokens
- unnecessary personal data
- sensitive logs
- private account content without explicit need

## Reliability

Provider calls require:

- timeout
- bounded retries
- backoff
- error classification
- request ID
- safe fallback policy

## Evaluation

Track:

- schema validity
- factual precision
- reviewer acceptance
- cost
- latency

## Persistence

Store:

- provider
- model
- prompt version
- task
- input hash
- validated output
- review state
- token use
- estimated cost
- timestamps

## Forbidden practices

Never:

- expose provider keys in the browser
- trust raw model output
- publish automatically
- retry indefinitely
- silently switch provider when semantics differ
- claim generated facts are verified
