---
title: Background Jobs Standards
version: 1.0.0
status: Living Document
owner: Engineering
updated: 2026-08-08
related:
  - ../../architecture/DEPLOYMENT.md
  - ../../architecture/CACHE.md
  - ../../engineering/AI_DEVELOPMENT_GUIDE.md
---

# Background Jobs Standards

## Purpose

This document defines how long-running asynchronous work should be implemented across Platform Core.

Jobs improve responsiveness by moving expensive work outside synchronous requests.

---

# Philosophy

HTTP requests should finish quickly.

Long-running work belongs to background jobs.

Users should never wait for operations that can safely execute asynchronously.

---

# Typical Jobs

Examples include:

- AI generation
- Imports
- Exports
- Image processing
- Email delivery
- Notifications
- Search indexing
- Scheduled cleanup
- Synchronization
- Report generation

---

# Execution Flow

```text
Request

↓

Service

↓

Job

↓

Worker

↓

Result
```

Business logic creates jobs.

Workers execute them.

---

# Responsibilities

Jobs should:

- execute one logical task
- be repeatable
- be observable
- support retries
- produce structured logs

Jobs should not contain transport-specific behavior.

---

# Job Design

Each job should define:

- purpose
- input
- expected output
- retry policy
- timeout
- failure strategy

The job interface should remain stable.

---

# Idempotency

Jobs should be idempotent whenever possible.

Executing the same job twice should not create inconsistent state.

---

# Retry Policy

Retry only transient failures.

Typical examples:

- temporary network issues
- provider unavailable
- timeout
- rate limiting

Permanent validation failures should not be retried.

---

# Timeouts

Every job should define an execution timeout.

Jobs must never run indefinitely.

---

# Progress Tracking

Long-running jobs may expose:

- Pending
- Running
- Completed
- Failed
- Cancelled

Status reporting should remain consistent across the platform.

---

# Scheduling

Scheduled jobs should be centralized.

Typical examples:

- cleanup
- reminders
- synchronization
- maintenance
- analytics

Scheduling logic should not be duplicated.

---

# Observability

Jobs should log:

- Job ID
- Type
- Duration
- Attempts
- Result
- Failure reason

Never log secrets.

---

# Failure Handling

Failures should be:

- logged
- categorized
- recoverable when possible

Unexpected failures should never remain silent.

---

# Scalability

Jobs should remain independent.

Workers should execute jobs without shared mutable state whenever possible.

---

# Queue Integration

Job execution may use queues.

Queue implementation is documented separately.

Jobs should remain queue-independent.

---

# AI Development Rules

AI coding agents must not:

- execute expensive work inside HTTP requests
- duplicate scheduling logic
- create undocumented job types
- ignore retry strategies

If background execution is required but undefined:

Stop.

Request architectural guidance.

---

# Forbidden Practices

Never:

- block HTTP requests unnecessarily
- execute unbounded loops
- retry permanent failures
- ignore execution timeouts
- hide failed jobs

---

# Final Principle

Requests respond.

Jobs work.

Workers scale.