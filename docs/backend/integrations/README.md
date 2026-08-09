---
title: Backend Integrations Standards
version: 2.0.0
status: Living Document
owner: Engineering
updated: 2026-08-09
related:
  - ../../architecture/API.md
  - ../../architecture/SECURITY.md
  - ../../architecture/SOURCE_STRUCTURE.md
  - ../../engineering/AI_DEVELOPMENT_GUIDE.md
  - ../README.md
---

# Backend Integrations Standards

## Purpose

This document defines engineering standards for communicating with external services and providers.

Integrations isolate provider-specific technical concerns from application behavior where practical.

This document does not assign capability ownership automatically to Platform Core.

An integration may support:

- Platform Core;
- a Business Domain;
- application composition;
- infrastructure;
- operational tooling.

Architecture determines ownership.

---

# Core Principle

External providers are technical dependencies.

Their SDKs, authentication mechanisms, payloads and protocols should not unnecessarily define business behavior.

The typical objective is:

    Owning Capability
        ↓
    Stable Internal Contract
        ↓
    Provider Adapter
        ↓
    External Provider

The owning capability may belong to Platform Core or to a Business Domain.

---

# Integration Is Not Capability Ownership

Provider connectivity and business capability ownership are different concerns.

Example:

    DJ Domain
        ↓
    Music Provider Contract
        ↓
    YouTube Adapter
        ↓
    YouTube API

The DJ Domain may own the music-specific business meaning.

The provider adapter owns YouTube-specific communication.

Creating that adapter does not make Music Services a Platform Core capability.

---

# Source Ownership

Provider-facing implementation generally belongs in infrastructure-facing code such as:

    src/lib/

Business-agnostic technical helpers may belong in:

    src/shared/

Capability contracts and business behavior remain with their architectural owner.

Examples:

    src/core/
    → reusable SaaS capability semantics

    src/domains/
    → business-specific semantics

    src/lib/
    → provider adapters and infrastructure connectivity

    src/shared/
    → generic technical reuse

Do not infer architectural ownership from physical provider code location alone.

---

# Responsibilities

Provider adapters may be responsible for:

- authentication with the provider;
- request construction;
- provider API communication;
- response mapping;
- provider-specific error handling;
- timeout handling;
- rate-limit handling;
- provider-specific configuration;
- technical retries when appropriate.

They should not become accidental owners of:

- Product policy;
- Domain rules;
- Core business invariants;
- tenant policy;
- authorization policy;
- workflow semantics.

---

# Stable Internal Contracts

Provider-specific details should remain behind stable internal contracts when abstraction provides real value.

Avoid leaking unnecessarily:

- SDK-specific objects;
- raw provider response formats;
- provider authentication flows;
- provider exception classes;
- provider-specific naming;
- transport details.

Not every integration requires a large abstraction layer.

Prefer the smallest contract that protects the owning capability from provider-specific implementation details.

---

# Provider Independence

Provider replaceability is desirable when requirements justify it.

It is not an absolute requirement for every integration.

Before creating a provider-independent abstraction, consider:

- whether multiple providers are realistically expected;
- whether provider switching has business value;
- whether abstraction reduces meaningful coupling;
- whether providers actually expose comparable capabilities;
- whether abstraction would hide important provider-specific behavior.

Do not create speculative multi-provider architecture merely because another provider might be used in the future.

---

# Integration Categories

External integrations may include:

- authentication;
- email;
- payments;
- storage;
- AI providers;
- music services;
- analytics;
- maps;
- messaging;
- monitoring;
- external business APIs.

A category appearing here does not imply:

- that it is currently implemented;
- that it belongs to Platform Core;
- that a generic abstraction must exist;
- that multiple providers must be supported.

---

# Authentication Providers

Authentication provider integration must respect the approved Identity architecture.

Supabase authentication identity is the canonical authentication identity for the current platform architecture.

Application `Profile` remains the application identity.

Authentication provider code must not introduce a second canonical user identity system.

---

# AI Providers

AI provider integration may support Platform Core, a Business Domain or application-specific behavior depending on the capability being implemented.

Do not assume:

    AI
    → Platform Core

Provider-specific APIs such as:

- OpenAI;
- Anthropic;
- Gemini;
- future providers;

should remain isolated where practical.

The owning capability defines what AI behavior means.

The provider adapter defines how the external AI service is called.

If only one provider is justified, do not create speculative multi-provider orchestration.

---

# Payment Providers

Payment provider SDKs should remain isolated from unrelated business behavior.

Examples may include:

- Stripe;
- PayPal;
- other approved payment providers.

A future reusable Billing capability may use payment adapters.

That does not mean generic Billing is currently implemented or automatically belongs to Core.

Billing ownership requires approved Architecture and Product requirements.

---

# Music Providers

Music-related providers may include:

- Spotify;
- Beatport;
- YouTube;
- YouTube Music;
- Apple Music;
- SoundCloud.

Music-provider semantics are currently expected to originate from the DJ business context unless broader reuse is demonstrated and Architecture decides otherwise.

Provider-specific connectivity should remain isolated from DJ business rules.

Generic HTTP, authentication or retry utilities may be reused technically without promoting Music behavior into Platform Core.

---

# Storage Providers

Storage providers may include:

- S3-compatible services;
- Supabase Storage;
- object storage platforms;
- local development storage.

Provider connectivity is infrastructure.

A reusable Platform Core Storage capability should only be introduced when approved requirements justify one.

The existence of a storage adapter alone does not create a Core Storage module.

---

# Email Providers

Email providers may support:

- authentication flows;
- notifications;
- transactional messaging;
- Product-specific communication.

Provider-specific delivery logic should remain isolated.

The business reason for sending an email remains with the owning capability.

---

# Domain-Specific Integrations

Some external integrations exist because one Business Domain requires them.

Those integrations may remain Domain-specific.

Example:

    DJ Domain
        ↓
    Music Catalog Requirement
        ↓
    Beatport Adapter

Technical communication patterns may be reusable.

Business semantics remain in the Domain.

Do not move a Domain integration into Platform Core solely because its HTTP or authentication code is reusable.

---

# Core Integrations

Platform Core capabilities may require external providers.

Example:

    Identity
        ↓
    Authentication Adapter
        ↓
    Supabase Auth

or a future approved capability:

    Notifications
        ↓
    Email Adapter
        ↓
    Email Provider

In these cases, Core owns the capability semantics.

Infrastructure owns provider-specific connectivity.

---

# Application-Level Integrations

Some integrations may exist primarily for application composition or operational behavior.

Not every integration must belong to Core or a Business Domain.

Architecture may determine that application or infrastructure ownership is more appropriate.

---

# Request Mapping

Provider requests should be constructed at the provider boundary.

Avoid spreading provider field names and request formats through business logic.

Internal capability inputs should remain meaningful to the application.

---

# Response Mapping

Raw provider responses should normally be mapped before entering business behavior.

Mapping may:

- normalize identifiers;
- normalize dates;
- normalize status values;
- extract required data;
- discard irrelevant provider metadata;
- preserve provider metadata when explicitly needed.

Avoid exposing large raw provider payloads throughout the application.

---

# Error Normalization

Provider-specific failures may include:

- authentication errors;
- rate limits;
- timeouts;
- unavailable services;
- malformed responses;
- rejected requests;
- quota limits.

Infrastructure should preserve useful diagnostic information while preventing provider-specific exceptions from leaking unnecessarily into business behavior.

Do not erase distinctions that the owning capability requires.

---

# Retries

Retry only when appropriate.

Suitable transient failures may include:

- temporary network failure;
- provider timeout;
- transient provider unavailability;
- some rate-limit responses.

Do not blindly retry:

- invalid credentials;
- invalid requests;
- permanent validation failures;
- business rule failures.

Retry policy must consider idempotency.

---

# Timeouts

External calls must not wait indefinitely.

Integrations should use appropriate timeout behavior when supported.

Timeout values should reflect:

- provider characteristics;
- user-facing latency requirements;
- asynchronous execution context;
- retry strategy.

---

# Rate Limits

Provider rate limits should be treated as explicit technical constraints.

Implementation may require:

- request throttling;
- backoff;
- batching;
- caching;
- scheduling;
- provider-specific quotas.

Do not introduce queue infrastructure automatically merely because a provider has rate limits.

---

# Secrets

Provider credentials must:

- remain outside source control;
- use approved environment configuration;
- never be embedded in frontend bundles;
- never be logged;
- never be returned through APIs.

Secret handling must follow Security and Deployment standards.

---

# Configuration

Provider-specific configuration should be centralized enough to remain understandable and auditable.

Avoid:

- duplicated environment-variable access;
- credentials scattered across modules;
- hidden fallback credentials;
- hardcoded production endpoints.

---

# Observability

Useful integration telemetry may include:

- provider;
- operation;
- success or failure;
- duration;
- retry count;
- rate-limit state;
- request or correlation identifier where available.

Avoid logging sensitive payloads unnecessarily.

---

# Versioning

Provider API versions should be isolated from business behavior where practical.

Changing a provider version should not require unrelated Domain changes when the internal contract remains stable.

Provider-specific changes may still require capability changes when the external semantics genuinely change.

Do not hide real semantic differences merely to preserve an abstraction.

---

# Testing

Provider integration testing should distinguish between:

- internal contract tests;
- adapter tests;
- mapping tests;
- failure tests;
- provider integration tests.

Routine tests should avoid unnecessary dependency on live external providers.

Mocks, fixtures or test environments may be used where appropriate.

Critical integrations may also require validated provider-level testing.

---

# Current vs Future

This document defines standards.

It does not prove that the platform currently contains:

- a generic integration framework;
- a provider registry;
- multi-provider AI orchestration;
- generic payment abstraction;
- generic storage abstraction;
- generic notification infrastructure;
- provider failover.

These capabilities require approved requirements and implementation evidence.

---

# AI Development Rules

AI implementation agents must not:

- assume integrations belong to Platform Core;
- introduce speculative provider abstractions;
- introduce multiple providers without an approved need;
- expose provider SDK objects unnecessarily to business behavior;
- duplicate provider communication without evaluating existing adapters;
- hardcode credentials;
- bypass approved capability boundaries;
- move Domain semantics into infrastructure;
- create generic integration orchestration without requirements;
- infer implementation from this document alone.

If integration ownership is unclear:

1. stop;
2. identify the capability requiring the provider;
3. identify the unresolved ownership question;
4. request Architecture evaluation;
5. resume after the decision.

---

# Success Indicators

Integration architecture is healthy when:

- provider-specific code remains isolated;
- business semantics remain with the owning capability;
- provider errors remain understandable;
- secrets remain protected;
- abstractions exist because requirements justify them;
- Domain-specific integrations remain Domain-specific when appropriate;
- Core integration semantics remain business-agnostic;
- provider changes have controlled impact.

---

# Failure Indicators

Integration architecture is unhealthy when:

- every external API becomes a Core capability;
- Domain semantics move into generic provider adapters;
- provider SDK objects spread through the application;
- speculative multi-provider abstractions appear;
- credentials are hardcoded;
- integrations duplicate existing provider communication unnecessarily;
- infrastructure becomes the owner of Product behavior;
- technical reuse is mistaken for business reuse.

---

# Final Principle

Providers are external dependencies.

Infrastructure isolates provider-specific communication.

Platform Core or Business Domains own capability semantics according to Architecture.

Technical reuse does not automatically imply Platform Core ownership.

Provider replaceability is a requirement-driven choice, not an absolute rule.

Abstract only where abstraction creates real value.

Keep business meaning with its owner.

Build only the integrations that approved requirements need.
