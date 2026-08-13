---
title: Backend SEO Standards
version: 2.0.0
status: Living Document
owner: Engineering
updated: 2026-08-09
related:
  - ../../architecture/API.md
  - ../../architecture/CACHE.md
  - ../../architecture/DOMAINS.md
  - ../../architecture/SOURCE_STRUCTURE.md
  - ../../engineering/AI_DEVELOPMENT_GUIDE.md
  - ../README.md
---

# Backend SEO Standards

## Purpose

This document defines backend engineering standards for SEO-related implementation.

SEO is a Product concern that may involve:

- routing;
- metadata;
- structured data;
- canonical URLs;
- indexability;
- crawlability;
- sitemaps;
- robots directives;
- redirects;
- internal linking;
- performance;
- public content delivery.

This document does not define SEO as an automatic Platform Core capability.

Architecture determines ownership of each SEO-related responsibility.

---

# Core Principle

SEO behavior should remain close to the semantic owner of the public resource.

Typical relationship:

    Business Domain
        ↓
    Public Resource Semantics
        ↓
    Application Composition
        ↓
    SEO Representation

Technical helpers may be reused.

Business meaning must remain with its owner.

---

# SEO Is Not Automatically Platform Core

Do not use:

    SEO is reusable
    → Platform Core

or:

    Multiple Products need metadata
    → Core SEO Module

Potential reuse is insufficient.

SEO-related code may belong to:

- a Business Domain;
- application composition;
- Shared technical utilities;
- infrastructure;
- an approved future Core capability.

Architecture decides ownership.

---

# Responsibility Model

## Business Domains May Own

Domains may own:

- entity titles;
- entity descriptions;
- public naming;
- publication state;
- slug semantics;
- business relationships;
- editorial meaning;
- structured-data meaning;
- content hierarchy;
- public resource eligibility.

## Application Composition May Own

Application composition may own:

- route-level metadata composition;
- canonicposition;
- public route exposure;
- framework-specific SEO hooks;
- robots endpoints;
- sitemap endpoints;
- route rendering strategy.

## Shared May Own

Shared technical utilities may own reusable helpers such as:

- URL normalization;
- metadata formatting;
- text truncation;
- schema serialization;
- generic slug helpers;
- generic validation utilities.

Shared must not contain hidden Domain semantics.

## Infrastructure May Own

Infrastructure may own:

- Search Console integrations;
- analytics providers;
- crawler APIs;
- external SEO services;
- provider-specific connectivity.

## Platform Core May Own

Platform Core may own an SEO-related capability only if approved requirements demonstrate that:

- the semantics are business-agnostic;
- multiple real Products require the same capability;
- Core ownership provides meaningful reuse;
- the capability does not embed Domain behavior.

This is an architectural decision, not an Engineering default.

---

# URL Strategy

Public URLs should normally be:

- stable;
- understandable;
- deterministic;
- unique;
- compatible with Product routing requirements.

Avoid unnecessary exposure of:

- internal database identifiers;
- implementation-specific values;
- temporary identifiers;
- provider-specific identifiers.

Some products may intentionally expose identifiers when requirements justify it.

Do not create absolute URL rules without Product requirements.

---

# Slugs

Slugs may be derived from Domain-owned public naming.

Slug behavior should define where relevant:

- normalization;
- uniqueness;
- collision handling;
- rename behavior;
- historical URL behavior.

Slug semantics belong with the resource owner.

Generic slug utilities may remain Shared.

---

# Metadata

Metadata should normally derive from structured Product and Domain data.

Typical metadata may include:

- title;
- description;
- canonical URL;
- Open Graph data;
- social preview data;
- robots directives.

Avoid duplicating metadata rules when meaningful technical reuse exists.

Do not centralize Domain-specific meaning merely to remove code duplication.

---

# Metadata Ownership

Example:

    DJ Artist
        ↓
    DJ Domain
    owns artist name and public meaning
        ↓
    Application SEO Composition
        ↓
    HTML Metadata

The Domain provides semantic input.

The application composes the public representation.

Neither responsibility automatically requires a Core SEO module.

---

# Canonical URLs

Public resources should define canonical behavior when duplicate or alternate URLs may exist.

Canonical generation should use:

- approved public routing;
- stable Product URL rules;
- resource identity;
- localization strategy when applicable.

Domain semantics may provide canonical inputs.

Application composition may generate the final canonical URL.

Canonical generation does not automatically belong to Platform Core.

---

# Structured Data

Structured data should represent actual Product and Domain semantics.

Possible schema types may include:

- Organization;
- Person;
- Article;
- Event;
- BreadcrumbList;
- FAQPage;
- Product;
- WebSite;
- CollectionPage;
- MusicGroup;
- MusicEvent;
- other schemas justified by Product requirements.

Generic serialization helpers may be reused.

Schema content and meaning remain with the owning capability.

Do not generate structured data merely because a schema type exists.

---

# Structured Data Validation

Structured data should be:

- valid;
- consistent with visible content;
- derived from real data;
- omitted when required information is unavailable.

Do not fabricate missing values for SEO completeness.

---

# XML Sitemaps

Products with indexable public resources may require XML sitemaps.

Sitemap generation should derive from approved public resources.

A Domain may contribute:

- public entity URLs;
- publication state;
- modification timestamps;
- relevant resource classification.

Application composition may aggregate those resources into sitemap output.

The existence of multiple Domain resources does not automatically justify a generic Core sitemap capability.

---

# Robots

Robots directives must respect visibility and publication rules.

Public indexing behavior may depend on:

- environment;
- authentication requirements;
- publication state;
- Product policy;
- Domain state.

Draft, private or restricted content should not become indexable accidentally.

---

# Publication State

SEO code must not invent publication semantics.

The owning Domain determines whether a business resource is:

- draft;
- published;
- archived;
- private;
- restricted;
- otherwise eligible for public exposure.

SEO implementation consumes that state.

---

# Internal Linking

Internal links may derive from real semantic relationships.

Examples may include:

- Artist → Genre;
- Artist → Festival;
- Festival → Artist;
- Article → Entity;
- Session → Track.

These relationships belong to the relevant Domain.

SEO implementation may expose them publicly.

Do not create fake relationships solely for search optimization.

---

# Redirects

Redirects may be required for:

- slug changes;
- resource moves;
- legacy URLs;
- route migrations;
- Product restructuring.

Redirect ownership depends on the reason for the redirect.

Application routing may implement redirects.

Domain state may determine when a redirect is required.

Do not create a generic redirect platform unless approved requirements justify one.

---

# Rendering

Public SEO-sensitive content should be available to crawlers using rendering appropriate to the Product and framework.

Server-rendered or statically generated output may be appropriate for many public resources.

Rendering strategy should consider:

- content freshness;
- crawlability;
- performance;
- caching;
- personalization;
- infrastructure cost.

Do not impose one rendering strategy on every Product.

---

# Performance

SEO-sensitive public experiences should consider:

- response time;
- caching;
- payload size;
- image handling;
- rendering cost;
- unnecessary client-side execution;
- repeated data access.

Performance optimizations should be measurable.

Performance implementation must respect Architecture and data ownership.

---

# Caching

SEO-related public data may benefit from caching.

Cache strategy depends on:

- data volatility;
- publication state;
- route behavior;
- invalidation requirements;
- infrastructure.

Follow the platform Cache architecture.

Do not introduce separate SEO-specific cache infrastructure without need.

---

# Internationalization

If a Product supports multiple languages or locales, SEO may require:

- localized URLs;
- localized metadata;
- alternate-language relationships;
- hreflang;
- localized structured data.

Implementation must follow the Product localization strategy.

Do not create localization infrastructure solely inside SEO.

---

# AI-Assisted SEO

AI may assist with:

- metadata suggestions;
- summaries;
- descriptions;
- keyword suggestions;
- content classification;
- editorial assistance;
- structured-data suggestions.

AI-generated outputject to Product and Domain rules.

AI does not own SEO semantics.

Provider-specific AI integrations should follow Backend Integrations standards.

---

# AI Content Safety

AI-generated SEO content should not:

- fabricate business facts;
- invent relationships;
- publish unsupported claims;
- replace authoritative Domain data;
- automatically publish sensitive content.

Human or automated review requirements depend on Product risk and workflow.

---

# External SEO Integrations

Products may eventually integrate with services such as:

- Google Search Console;
- analytics platforms;
- crawling services;
- technical SEO APIs.

Provider connectivity belongs to infrastructure-facing integration code.

External SEO integrations do not automatically create a Platform Core SEO capability.

---

# Monitoring

Useful Product-level SEO signals may include:

- indexed pages;
- crawl failures;
- sitemap health;
- canonical conflicts;
- metadata completeness;
- structured-data errors;
- broken public links;
- redirect failures;
- performance indicators.

Monitoring should be introduced when justified by Product maturity and operational requirements.

---

# Security

SEO implementation must not expose:

- private resources;
- restricted resources;
- unpublished content;
- secrets;
- internal operational data;
- sensitive provider metadata.

Public discoverability must never override authorization or publication rules.

---

# Current vs Future

This document defines engineering standards.

It does not prove the repository currently contains:

- a generic SEO engine;
- a Core SEO module;
- generic sitemap infrastructure;
- generic redirect management;
- structured-data orchestration;
- Search Console integration;
- AI SEO optimization;
- SEO scoring;
- automated SEO auditing.

These capabilities require approved requirements and implementation evidence.

---

# DJ Platform Context

DJ Platform is expected to contain significant public, content-oriented and discoverable resources.

SEO may therefore be strategically important for that Product.

Possible public resources may include:

- DJs and artists;
- genres;
- festivals;
- sessions;
- playlists;
- tracks;
- labels;
- rankings;
- editorial content.

Their business semantics belong to the DJ Domain.

Public route and metadata composition belongs to application implementation unless Architecture decides otherwise.

This DJ-specific need must not silently redefine Platform Core.

---

# Cross-Product Reuse

Future Products may also require SEO.

Repeated need alone does not automatically create a Core capability.

Evaluate whether the reused element is:

- business behavior;
- application composition;
- Shared technical utility;
- infrastructure;
- genuine reusable SaaS capability.

Architecture determines the correct owner.

---

# AI Development Rules

AI implementation agents must not:

- assume SEO belongs to Platform Core;
- create a Core SEO module without approved Architecture;
- duplicate Domain semantics inside generic SEO utilities;
- expose unpublished resources;
- hardcode Product-specific metadata into Shared utilities;
- invent canonical routes;
- invent publication rules;
- create speculative Search Console integrations;
- create speculative AI SEO systems;
- infer implementation from this document alone.

If SEO ownership is unclear:

1. identify the public resource;
2. identify who owns its semantics;
3. identify the technical SEO requirement;
4. determine whether the concern belongs to Domain, App, Shared, Infrastructure or Core;
5. request Architecture evaluation when ownership remains unresolved.

---

# Success Indicators

SEO implementation is healthy when:

- public resources reflect real Domain semantics;
- metadata is predictable;
- canonical behavior is consistent;
- private content remains private;
- structured data reflects visible content;
- technical helpers are reused without moving business meaning;
- Product-specific SEO remains Product-aware;
- Core remains business-agnostic;
- implementation status is supported by repository evidence.

---

# Failure Indicators

SEO implementation is unhealthy when:

- every SEO helper becomes Platform Core;
- Domain semantics are copied into Shared utilities;
- unpublished content is indexable;
- canonical URLs are invented independently from routing;
- metadata logic contradicts Product behavior;
- generic infrastructure is built speculatively;
- AI-generated content invents facts;
- future SEO ideas are treated as implemented capabilities.

---

# Final Principle

SEO makes Product resources understandable and discoverable.

Business Domains own business meaning.

Application composition exposes public resources.

Shared may provide generic technical helpers.

Infrastructure isolates external providers.

Platform Core owns SEO-related behavior only when Architecture and demonstrated reuse justify it.

Reuse does not automatically mean Core.

SEO strategy follows Product needs.

Build only what the Product currently requires.
