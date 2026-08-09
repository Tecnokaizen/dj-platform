---
title: Webhook Standards
version: 2.0.0
status: Living Document
owner: Engineering
updated: 2026-08-09
related:
  - ../../architecture/API.md
  - ../../architecture/SECURITY.md
  - ../../engineering/AI_DEVELOPMENT_GUIDE.md
  - ../README.md
  - ../integrations/README.md
---

# Webhook Standards

## Purpose

This document defines backend implementation standards for receiving and processing webhook events from external providers.

Webhooks are transport and integration entry points.

They do not own Product or Domain business logic.

The existence of this document does not imply that generic webhook infrastructure is currently implemented.

---

# Core Principle

A webhook endpoint should:

1. receive the request;
2. verify authenticity;
3. validate the payload;
4. identify the provider event;
5. map provider-specific data when required;
6. delegate processing to the capability that owns the behavior;
7. return an appropriate response.

The endpoint itself should remain thin.

---

# Responsibility Boundary

Webhook transport may own:

- request verification;
- signature validation;
- payload parsing;
- payload validation;
- provider event mapping;
- idempotency handling;
- technical logging;
- acknowledgement responses.

Webhook transport must not own:

- Product business policy;
- Domain workflow meaning;
- authorization policy unrelated to webhook verification;
- business state transitions that belong to a Domain or Core capability.

---

# Provider Boundary

External providers may use their own:

- event names;
- payload schemas;
- signatures;
- retry behavior;
- identifiers;
- timestamps;
- delivery guarantees.

Provider-specific details should remain isolated from business behavior where practical.

Business Domains should not depend directly on provider event names or SDK objects.

---

# Processing Flow

Typical flow:

    External Provider
        ↓
    Webhook Endpoint
        ↓
    Signature Verification
        ↓
    Payload Validation
        ↓
    Provider Event Mapping
        ↓
    Owning Service / Capability
        ↓
    Business Processing

Asynchronous processing may be introduced when approved requirements justify it.

A queue is not required merely because a webhook exists.

---

# Request Verification

Webhooks from external providers should be authenticated using the mechanism supported by that provider.

Examples may include:

- signed payloads;
- HMAC signatures;
- provider secrets;
- certificates;
- trusted tokens.

Never trust a webhook payload solely because it reached the expected URL.

---

# Secrets

Webhook secrets must:

- remain outside source control;
- use approved environment configuration;
- never appear in logs;
- never be returned to clients;
- be rotated when required.

---

# Payload Validation

Incoming payloads are untrusted input.

Validate:

- expected structure;
- required identifiers;
- event type;
- required fields;
- provider-specific constraints.

Do not pass unchecked provider payloads directly into Domain behavior.

---

# Event Mapping

Provider-specific event names should be translated at the integration boundary when the business capability should not know about provider terminology.

Example:

    provider.invoice.payment_succeeded
        ↓
    Provider Adapter
        ↓
    Internal Meaning
        ↓
    Owning Capability

The exact internal representation depends on the approved architecture.

Do not create a generic event architecture unless requirements justify it.

---

# Idempotency

Providers may deliver the same event more than once.

Webhook processing should be idempotent when duplicate delivery could produce incorrect behavior.

Possible approaches may include:

- recording provider event identifiers;
- enforcing uniqueness;
- checking existing processing state;
- using domain-specific idempotency rules.

The correct mechanism depends on the provider and owning capability.

---

# Retries

External providers may retry delivery after:

- timeouts;
- network failures;
- server errors;
- delayed acknowledgement.

Webhook handling should therefore assume duplicate delivery is possible unless provider guarantees prove otherwise.

---

# Response Timing

Webhook endpoints should normally respond quickly.

Long-running work should not unnecessarily block acknowledgement.

If asynchronous processing becomes necessary, it must use approved job or queue architecture.

Do not introduce a queue system solely to satisfy this document.

---

# Event Ordering

Do not assume webhook events arrive in order unless the provider explicitly guarantees ordering and the implementation relies safely on that guarantee.

Business state transitions should validate current state rather than trusting delivery sequence blindly.

---

# Failure Handling

Failures should be explicit and observable.

Distinguish where useful between:

- invalid signatures;
- invalid payloads;
- unknown event types;
- duplicate events;
- temporary provider or infrastructure failures;
- business processing failures.

Unexpected failures must not expose internal details to the external provider.

---

# Logging

Useful webhook telemetry may include:

- provider;
- event type;
- external event identifier;
- processing result;
- duration;
- retry or duplicate status;
- correlation identifier.

Avoid logging:

- secrets;
- authentication material;
- complete sensitive payloads;
- unnecessary personal data.

---

# Domain Boundary

A webhook may trigger Domain behavior.

Example:

    Provider Event
        ↓
    Webhook Transport
        ↓
    Adapter / Mapping
        ↓
    Domain Service

The Domain decides what the event means to the business.

The webhook transport does not become the owner of that meaning.

---

# Platform Core Boundary

A webhook may also delegate to a Platform Core capability when Core owns the relevant reusable behavior.

This does not mean Webhooks themselves are automatically a Platform Core module.

Technical webhook handling may remain part of application or infrastructure implementation.

Architecture determines ownership.

---

# Integrations Boundary

Provider connectivity should follow the standards in:

    docs/backend/integrations/README.md

Provider SDK objects should not spread unnecessarily into Core or Domain business behavior.

---

# Security

Webhook endpoints are externally reachable attack surfaces.

Engineering must consider:

- signature verification;
- replay protection when required;
- payload size;
- input validation;
- secret management;
- rate limiting when justified;
- safe error responses;
- logging hygiene.

Security-sensitive implementation requires appropriate review.

---

# Testing

Webhook implementations should progressively test:

- valid signatures;
- invalid signatures;
- valid payloads;
- malformed payloads;
- supported events;
- unsupported events;
- duplicate delivery;
- idempotency;
- delegation;
- relevant failure behavior.

Testing requirements depend on the actual implementation.

---

# Current vs Future

This document defines standards.

It does not prove the repository currently contains:

- generic webhook infrastructure;
- a webhook event store;
- asynchronous webhook workers;
- retry queues;
- dead-letter queues;
- generic event orchestration.

Those capabilities require approved requirements and implementation evidence.

---

# AI Development Rules

AI implementation agents must not:

- trust incoming webhook payloads;
- skip signature verification when the provider supports it;
- place Product or Domain business rules directly inside webhook endpoints;
- expose provider SDK objects directly to Domains without justification;
- introduce generic event architecture speculatively;
- introduce queue infrastructure speculatively;
- assume events arrive exactly once;
- assume events arrive in order;
- log secrets;
- expose internal failures to providers;
- infer implementation from this documentation alone.

If a webhook requirement creates an unresolved architectural question:

1. stop;
2. report the requirement;
3. request Architecture evaluation;
4. resume after ownership and behavior are clear.

---

# Success Indicators

Webhook implementation is healthy when:

- requests are verified;
- payloads are validated;
- duplicate delivery is handled safely where required;
- provider details remain isolated;
- endpoints remain thin;
- business meaning remains with the owning capability;
- failures are observable;
- sensitive information remains protected.

---

# Failure Indicators

Webhook implementation is unhealthy when:

- endpoints contain substantial business logic;
- signatures are ignored;
- duplicate events create duplicate business effects;
- provider terminology spreads through Domains;
- secrets appear in logs;
- queues are introduced without need;
- webhook transport becomes an architectural owner by accident;
- documentation is treated as proof that infrastructure exists.

---

# Final Principle

Webhooks receive external events.

They verify and validate transport.

Provider-specific details remain isolated.

The owning Core capability or Businessess meaning.

Webhook endpoints remain thin.

Delivery must be treated as untrusted and potentially duplicated.

Documentation defines standards, not implementation status.
