---
title: Backup Operations
version: 1.0.0
status: Living Document
owner: Operations
updated: 2026-08-08
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

Frequency depends on business requirements.

Policies should be documented.

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