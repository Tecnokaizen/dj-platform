---
title: Backup Operations
version: 1.1.0
status: Living Document
owner: Operations
updated: 2026-08-13
related:
  - DEPLOYMENT.md
---

# Backup Operations

## Purpose

This document defines backup and recovery procedures.

Backups are only valuable if restoration works.

---

# Philosophy

Recovery is more important than backup creation.

Every backup strategy must include restore testing.

---

# Protected Resources

Backups include:

- PostgreSQL
- Object Storage
- Configuration
- Secrets (when applicable)
- Infrastructure definitions

---

# Backup Frequency

The approved staging baseline creates a daily logical PostgreSQL backup.

Targets:

- RPO: no more than 24 hours;
- RTO: no more than 4 hours;
- retention: seven daily and four weekly restore points;
- destination: external S3-compatible storage outside the primary VPS;
- encryption: client-side before the backup leaves the runtime boundary.

This policy becomes operational only after Phase B provisioning. Phase A must
prove backup and isolated restore with disposable infrastructure.

---

# Restore Testing

Restore tests should occur regularly.

Successful backups without restore verification are not trusted.

---

# Encryption

Backups should remain encrypted.

Access should follow least privilege.

---

# Retention

Retention policies should be documented.

Expired backups should be removed securely.

---

# AI Development Rules

AI coding agents must not modify backup procedures without documentation.

---

# Final Principle

A backup is only successful after a verified restore.
