---
title: Monitoring Operations
version: 2.0.0
status: Living Document
owner: Operations
updated: 2026-08-09
related:
  - README.md
  - DEPLOYMENT.md
  - INCIDENT_RESPONSE.md
  - ../architecture/SECURITY.md
  - ../PLATFORM_MATURITY.md
---

# Monitoring Operations

## Purpose

This document defines operational standards for observing deployed Products and infrastructure.

Monitoring provides evidence about runtime health.

It does not imply that complete production monitoring is currently implemented.

---

# Core Principle

Monitoring should reflect actual deployed systems.

Do not monitor hypothetical infrastructure.

Typical relationship:

    Deployed Product
        ↓
    Application Runtime
    +
    Database
    +
    Infrastructure
    +
    External Dependencies
        ↓
    Monitoring and Observability

Platform Core capabilities may be observed when they run inside a Product.

Platform Core is not treated as an independently monitored Product.

---

# Monitoring Scope

Monitoring may include:

- application availability;
- application errors;
- database health;
- infrastructure health;
- authentication;
- external providers;
- storage when implemented;
- background processing when implemented;
- security-relevant events;
- operational resource usage.

Monitoring scope must match actual infrastructure.

---

# Current vs Future

This document defines standards.

It does not prove that the platform currently has:

- production monitoring;
- centralized logging;
- alerting;
- dashboards;
- queue metrics;
- storage metrics;
- distributed tracing;
- uptime monitoring;
- automated incident detection.

These capabilities require implementation and runtime evidence.

---

# Environment Awareness

Monitoring requirements depend on environment.

Local development may rely primarily on:

- terminal output;
- framework logs;
- service logs;
- direct inspection.

Development deployments may additionally require:

- service health;
- container state;
- application availability;
- database connectivity.

Production may require stronger monitoring according to Product risk.

---

# Application Monitoring

Useful application signals may include:

- availability;
- HTTP errors;
- server errors;
- response latency;
- failed requests;
- authentication failures;
- critical workflow failures.

Monitor signals that help detect real Product impact.

---

# Database Monitoring

Database monitoring may include:

- availability;
- connection failures;
- connection count;
- storage growth;
- slow queries;
- migration failures;
- resource pressure.

Monitoring depth should reflect actual operational requirements.

---

# Infrastructure Monitoring

Infrastructure signals may include:

- CPU;
- memory;
- disk usage;
- service state;
- container state;
- network connectivity;
- restart frequency;
- persistent volume health.

Infrastructure monitoring should reflect services that actually exist.

---

# Coolify

Coolify may provide operational visibility for deployed services.

Useful evidence may include:

- deployment state;
- service status;
- container status;
- logs;
- restart behavior.

Coolify visibility does not automatically replace dedicated monitoring where stronger operational guarantees are required.

---

# Supabase Self-Hosted

Supabase self-hosted services should be monitored according to the services actually deployed and required.

Possible services may include:

- authentication;
- REST;
- storage;
- realtime;
- Studio;
- supporting services.

Do not assume a service is healthy because its deployment definition exists.

Runtime state must be inspected.

---

# Storage Monitoring

Storage monitoring applies only when object storage is actually implemented.

Possible signals may include:

- upload failures;
- download failures;
- storage growth;
- quota usage;
- provider availability.

Do not create storage monitoring before storage exists.

---

# Queue and Job Monitoring

Queue monitoring applies only when queue infrastructure is implemented.

Possible signals may include:

- queue depth;
- failed jobs;
- retry count;
- processing latency;
- dead-letter volume.

Do not assume a queue exists because backend standards describe one.

---

# External Providers

External provider monitoring may include:

- availability;
- request failures;
- timeout rate;
- rate limiting;
- authentication failures;
- provider latency.

Monitoring should focus on providers that materially affect Product behavior.

---

# Authentication

Authentication monitoring may include:

- login failures;
- callback failures;
- provider outages;
- session-related errors.

Monitoring must not log sensitive authentication material.

---

# Health Checks

Health checks should reflect real dependencies.

Possible checks may include:

- application response;
- database connectivity;
- authentication provider availability;
- required external dependencies;
- storage when implemented;
- background workers when implemented.

Not every service requires the same health-check strategy.

---

# Logs

Logs should be useful for diagnosing real operational problems.

Where practical, logs should be:

- structured;
- understandable;
- timestamped;
- attributable to a service or operation;
- retained according to operational need.

Logging implementation may evolve with Product maturity.

---

# Sensitive Logging

Never log:

- passwords;
- authentication secrets;
- API keys;
- database credentials;
- private tokens;
- unnecessary personal data.

Sensitive payloads should be minimized or sanitized.

---

# Correlation

Correlation identifiers may become useful when a request crosses multiple services or integrations.

They are not mandatory before distributed behavior requires them.

Do not introduce tracing infrastructure speculatively.

---

# Metrics

Useful technical metrics may include:

- response time;
- error rate;
- request volume;
- CPU;
- memory;
- disk;
- database connections;
- restart count.

Only collect metrics that provide operational value.

---

# Business Metrics

Business KPIs are not automatically Operations-owned monitoring.

Examples may include:

- active customers;
- orders;
- subscriptions;
- sessions;
- content publication.

Their semantics belong to the relevant Product or Business Domain.

Operations may help expose infrastructure for measuring them, but does not own their business meaning.

---

# Alerting

Alerts should be introduced when they support meaningful operational response.

Good alerts are:

- actionable;
- relevant;
- appropriately prioritized;
- linked to real failure conditions.

Avoid alert fatigue.

Do not create alerts merely because a metric exists.

---

# Alert Ownership

Important alerts should have a clear operational owner.

The owner should know:

- what the alert means;
- expected impact;
- first diagnostic steps;
- escalation path when required.

Runbooks may support alert handling.

---

# Dashboards

Dashboards may become useful for summarizing runtime health.

Possible dashboard areas may include:

- application;
- infrastructure;
- database;
- deployments;
- incidents;
- external dependencies.

A dashboard should answer operational questions.

Do not create dashboards for appearance alone.

---

# Monitoring After Deployment

Significant deployments should be observed when monitoring exists.

Useful post-deployment checks may include:

- error changes;
- latency changes;
- service restarts;
- database failures;
- authentication failures;
- critical workflow failures.

Monitoring should help determine whether a deployment is healthy.

---

# Incident Detection

Monitoring may contribute to incident detection.

Incidents may also be discovered through:

- users;
- logs;
- manual inspection;
- external providers;
- operational checks.

Monitoring is one source of evidence.

It is not the only possible detection mechanism.

---

# Security Monitoring

Security-related monitoring may include:

- repeated authentication failures;
- suspicious access patterns;
- infrastructure access;
- service failures;
- abnormal resource usage.

Security monitoring requirements should be proportional to Product risk.

---

# Retention

Logs and metrics should be retained according to:

- diagnostic value;
- storage cost;
- legal requirements when applicable;
- privacy;
- security;
- Product maturity.

Do not retain sensitive data indefinitely without justification.

---

# Monitoring Evidence

Operational monitoring evidence may include:

- service status;
- logs;
- metrics;
- alerts;
- health checks;
- uptime data;
- incident records.

Documentation alone does not prove monitoring exists.

---

# Monitoring Maturity

Monitoring should evolve with Product maturity.

A reasonable progression may be:

    Direct Logs
        ↓
    Service Health
        ↓
    Centralized Visibility
        ↓
    Metrics
        ↓
    Alerts
        ↓
    Dashboards
        ↓
    Advanced Observability when justified

This progression is illustrative, not mandatory.

---

# AI Development Rules

AI agents must not:

- assume production monitoring exists;
- assume centralized logging exists;
- assume Storagering is required before those systems exist;
- disable existing observability without explicit approval;
- log secrets;
- invent monitoring providers;
- create speculative observability infrastructure;
- treat business KPIs as Operations-owned semantics;
- infer monitoring maturity from documentation alone.

---

# AI Monitoring Stop Rule

AI agents must stop when:

- the environment being monitored is unclear;
- service existence is uncertain;
- runtime evidence conflicts with documentation;
- proposed logging may expose sensitive data;
- alert ownership is unknown for critical alerts;
- monitoring changes may disrupt production visibility.

Report the uncertainty before proceeding.

---

# Success Indicators

Monitoring is healthy when:

- monitored services actually exist;
- important failures can be detected;
- logs support diagnosis;
- sensitive information remains protected;
- alerts are actionable;
- monitoring reflects current infrastructure;
- monitoring maturity matches Product maturity.

---

# Failure Indicators

Monitoring is unhealthy when:

- documentation claims monitoring that does not exist;
- hypothetical infrastructure appears in dashboards;
- secrets appear in logs;
- alerts generate noise without action;
- business semantics are treated as infrastructure metrics;
- service health is assumed without evidence;
- observability infrastructure grows speculatively.

---

# Final Principle

Monitoring provides runtime evidence.

Monitor deployed Products and infrastructure that actually exist.

Platform Core capabilities are observed as part of Product runtime.

Business Domains retain ownership of business meaning.

Technical metrics support operations.

Business metrics retain Product or Domain semantics.

Monitoring maturity should grow with real operational need.

Trust runtime evidence, not assumptions.
