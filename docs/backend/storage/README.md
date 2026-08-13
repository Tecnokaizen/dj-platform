---
title: Storage Standards
version: 2.0.0
status: Living Document
owner: Engineering
updated: 2026-08-09
related:
  - ../../architecture/SECURITY.md
  - ../../architecture/DEPLOYMENT.md
  - ../../architecture/SOURCE_STRUCTURE.md
  - ../../engineering/AI_DEVELOPMENT_GUIDE.md
  - ../README.md
  - ../integrations/README.md
---

# Storage Standards

## Purpose

This document defines engineering standards for binary assets, file uploads and object storage.

Object storage is an infrastructure concern.

The business meaning, ownership and lifecycle of a stored object belong to the capability that owns the resource.

This document does not define Storage as an automatically implemented Platform Core capability.

---

# Core Principle

Separate:

    Business Resource
        ↓
    Storage Requirement
        ↓
    Internal Storage Contract when justified
        ↓
    Provider Adapter
        ↓
    Object Storage Provider

Provider connectivity is infrastructure.

Business semantics remain with the owning Core capability or Business Domain.

---

# Storage Is Not Automatically Platform Core

Do not use:

    Multiple Products need files
    → Platform Core Storage

or:

    Storage is reusable
    → Core module

Potential reuse is insufficient.

Storage-related implementation may belong to:

- a Business Domain;
- Platform Core;
- application composition;
- Shared technical utilities;
- infrastructure.

Architecture determines ownership.

---

# Provider Boundary

Business behavior should not unnecessarily depend on:

- bucket names;
- provider SDKs;
- provider authentication;
- provider-specific object paths;
- provider-specific response objects.

Provider-specific connectivity generally belongs in infrastructure-facing code such as:

    src/lib/

Generic technical helpers may belong in:

    src/shared/

Business rules remain with their architectural owner.

---

# Storage Providers

Possible providers may include:

- S3-compatible object storage;
- Supabase Storage;
- MinIO;
- Cloudflare R2;
- local development storage.

A provider appearing here does not mean it is currently implemented.

Do not introduce multi-provider abstraction unless requirements justify it.

---

# Current Implementation Status

The existence of this document does not prove that object storage is currently implemented in the repository.

Before implementing storage-dependent behavior, verify:

- current source;
- installed dependencies;
- environment configuration;
- deployed infrastructure;
- security configuration;
- actual Product requirements.

Do not infer implementation from documentation alone.

---

# Object Ownership

Every stored object should have a clear application owner.

Possible owners may include:

- Organization;
- Profile;
- Core entity;
- Domain entity;
- Product-level resource.

Ownership semantics must come from the capability that owns the resource.

Storage infrastructure must not invent business ownership.

---

# Tenant Ownership

In tenant-aware functionality, stored resources may belong to an Organization.

Tenant association must follow the approved tenancy model.

Do not create a separate tenancy system inside storage.

Authorization must resolve through the owning capability and approved authorization rules.

---

# Object Metadata

Application metadata should normally remain separate from binary content.

Metadata may include:

- logical filename;
- content type;
- size;
- checksum;
- resource owner;
- tenant;
- creation timestamp;
- visibility;
- provider object identifier;
- lifecycle state.

The exact metadata model belongs to the capability requiring the file.

Do not create a generic global File entity without approved requirements.

---

# Binary Content

Large binary content should generally remain outside the relational database unless requirements justify otherwise.

Object storage is commonly appropriate for:

- images;
- documents;
- audio;
- video;
- exports;
- generated assets;
- user uploads.

The final storage strategy depends on Product requirements and infrastructure.

---

# Storage Keys

Provider object keys should be:

- unique;
- safe;
- predictable enough for operations where useful;
- independent from unsafe user input.

Avoid using raw user-provided filenames directly as storage keys.

Storage keys do not need to expose business semantics publicly.

---

# User Filenames

Original filenames may be retained as metadata when required.

They should not be trusted for:

- storage paths;
- authorization;
- MIME validation;
- execution behavior.

Sanitize user-controlled values before use.

---

# Public and Private Objects

Stored resources may be public or private according to Product and capability requirements.

Public examples may include:

- public images;
- public media;
- intentionally published assets.

Private examples may include:

- customer documents;
- invoices;
- internal uploads;
- restricted media;
- operational exports.

Visibility is a business and authorization decision.

Infrastructure enforces the selected access mechanism.

---

# Upload Validation

File uploads are untrusted input.

Validation may include:

- authentication;
- authorization;
- tenant access;
- maximum size;
- content type;
- file signature;
- extension;
- expected resource type;
- malware scanning when justified.

Never trust browser-provided metadata alone.

---

# MIME Types

MIME type validation should reflect actual Product requirements.

Avoid allowing arbitrary file types by default.

When security matters, validate file content or signatures rather than relying only on:

- extension;
- browser MIME type;
- original filename.

---

# Upload Flow

A typical upload flow may be:

    Authenticated Request
        ↓
    Authorization
        ↓
    Resource Validation
        ↓
    File Validation
        ↓
    Storage Adapter
        ↓
    Provider
        ↓
    Metadata Persistence

This is a reference pattern, not a mandatory universal architecture.

The owning capability determines the actual workflow.

---

# Download Authorization

Private resources require authorization before access is granted.

Possible delivery mechanisms include:

- application-proxied downloads;
- provider signed URLs;
- temporary access tokens;
- controlled public URLs when appropriate.

The chosen method must preserve authorization requirements.

---

# Signed URLs

Signed URLs may be appropriate for private objects.

They should normally:

- expire;
- have appropriate scope;
- avoid exposing credentials;
- be generated only after authorization.

A signed URL is not a substitute for application authorization.

---

# Lifecycle Ownership

Storage infrastructure does not automatically own file lifecycle policy.

The owning capability determines when a resource should be:

- created;
- replaced;
- archived;
- retained;
- deleted.

Infrastructure performs the requested storage operation.

---

# Deletion

Deletion must consider application references.

Do not automatically remove objects merely because they appear unused at provider level.

Before deleting, determine:

- whether the application still references the object;
- retention requirements;
- audit requirements;
- tenant ownership;
- recovery requirements.

---

# Orphaned Objects

Failed workflows may leave unreferenced objects.

Cleanup mechanisms may eventually be required.

Do not introduce automated deletion until ownership and retention rules are explicit.

---

# Versioning

Versioning may be useful for:

- documents;
- media;
- generated reports;
- editable assets.

Version semantics belong to the owning capability.

Provider object versioning may be used as an infrastructure mechanism when appropriate.

Do not create generic application-level file versioning without requirements.

---

# Provider Independence

Provider independence is useful when it reduces meaningful coupling.

It is not an absolute requirement.

Before building a storage abstraction, consider:

- realistic provider-switching needs;
- Product requirements;
- provider-specific features;
- migration cost;
- abstraction complexity.

Avoid speculative multi-provider architecture.

---

# Security

Storage implementation must consider:

- encrypted transport;
- authentication;
- authorization;
- tenant isolation;
- least privilege;
- safe upload validation;
- secret management;
- private object protection;
- safe logging.

Storage credentials must never be exposed to unauthorized clients.

---

# Secrets

Provider credentials must:

- remain outside source control;
- use approved environment configuration;
- never appear in logs;
- never be embedded in public frontend code;
- be scoped with least privilege where possible.

---

# Observability

Useful storage telemetry may include:

- upload count;
- download count;
- storage usage;
- failed uploads;
- failed downloads;
- deletion failures;
- object growth;
- provider latency.

Monitoring requirements depend on Product maturity and operational needs.

---

# Error Handling

Storage failures should remain distinguishable where useful.

Examples include:

- invalid file;
- authorization failure;
- provider unavailable;
- upload timeout;
- object missing;
- quota exceeded;
- deletion failure.

Provider-specific errors should not leak unnecessarily into Product behavior.

---

# Testing

Storage implementation should be testable without requiring production infrastructure.

Testing may include:

- validation tests;
- authorization tests;
- adapter tests;
- upload tests;
- download tests;
- deletion tests;
- mapping tests;
- provider integration tests.

Mocks or test providers may be appropriate for routine automated tests.

Critical provider behavior may require real integration testing.

---

# CDN and Image Optimization

CDN delivery and image optimization may become useful for some Products.

They are separate concerns from basic object persistence.

Do not create:

- CDN abstraction;
- image pipelines;
- transcoding infrastructure;

before approved requirements justify them.

---

# Media Processing

Future Products may require:

- image resizing;
- thumbnails;
- audio processing;
- video transcoding;
- document conversion;
- antivirus scanning.

These capabilities may have their own architectural ownership.

They must not automatically become part of Platform Core Storage.

---

# Domain-Specific Storage

Domains may have storage requirements with specific semantics.

Example:

    DJ Domain
        ↓
    Artist Image
        ↓
    Domain Metadata
        ↓
    Storage Adapter
        ↓
    Object Provider

The DJ Domain owns what an Artist Image means.

Infrastructure owns how the binary object reaches the provider.

---

# Core Storage Capability

A reusable Platform Core Storage capability may be introduced in the future if demonstrated requirements justify it.

Before doing so, Architecture should evaluate:

- actual reuse across Products;
- business-agnostic semantics;
- required authorization model;
- tenant behavior;
- metadata ownership;
- lifecycle ownership;
- abstraction value.

Until approved and implemented, Storage must not be represented as an active Core module.

---

# Current vs Future

This document defines engineering standards.

It does not prove that the repository currently contains:

- object storage integration;
- a Core Storage module;
- generic File entities;
- signed URL infrastructure;
- CDN integration;
- image optimization;
- media transcoding;
- antivirus scanning;
- lifecycle automation.

Those capabilities require approved requirements and implementation evidence.

---

# AI Development Rules

AI implementation agents must not:

- assume Storage belongs to Platform Core;
- create a Core Storage module speculatively;
- create a generic File entity without requirements;
- expose provider SDK objects unnecessarily to business behavior;
- bypass authorization;
- invent tenant ownership;
- hardcode bucket names into business logic;
- trust uploaded filenames or MIME metadata blindly;
- create speculative multi-provider abstractions;
- create lifecycle automation without explicit rules;
- infer implementation from this document alone.

If storage ownership is unclear:

1. identify the resource being stored;
2. identify the capability that owns that resource;
3. identify the required infrastructure behavior;
4. determine whether reuse is technical or semantic;
5. request Architecture evaluation when ownership remains unresolved.

---

# Success Indicators

Storage implementation is healthy when:

- provider-specific code remains isolated;
- object ownership is explicit;
- tenant isolation is preserved;
- private objects remain protected;
- uploads are validated;
- lifecycle semantics remain with the owning capability;
- abstractions exist because requirements justify them;
- implementation status is supported by repository evidence.

---

# Failure Indicators

Storage implementation is unhealthy when:

- every file requirement becomes Platform Core;
- storage infrastructure invents business ownership;
- provider SDKs spread through business behavior;
- bucket names become business identifiers;
- private objects are exposed;
- uploads are trusted without validation;
- generic file models are created speculatively;
- future storage ideas are described as implemented capabilities.

---

# Final Principle

Object storage is infrastructure.

Core capabilities and Business Domains own resource semantics.

Infrastructure owns provider connectivity.

Shared may provide generic technical helpers.

Storage does not automatically belong to Platform Core.

Provider independence is requirement-driven.

Lifecycle policy belongs to the resource owner.

Documentation defines standards, not implementation status.

Build only the storage capabilities justified by approved requirements.
