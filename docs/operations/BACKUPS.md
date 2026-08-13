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

## Implemented tooling

`Dockerfile.backup` pins Restic 0.19.1 and PostgreSQL 17 client tooling.
`scripts/backup/backup-postgres.sh` creates and validates a custom-format dump
inside the backup container's encrypted-runtime boundary and `/tmp` tmpfs, then
streams the verified artifact into Restic. The temporary dump is never placed
on a persistent volume and is removed on exit. Restic encrypts it client-side,
applies seven-daily/four-weekly retention, prunes and checks repository
integrity.

Staging must supply a separately provisioned, read-capable backup credential;
it is not the web runtime or migration credential. Phase A CI uses the
disposable stack administrator solely to prove full-stack backup coverage.

The repository is provider-neutral through Restic's S3-compatible backend.
`docker-compose.backup.yml` defines the environment contract but contains no
credentials. Coolify may inject secrets, but the recovery copy must remain in
an external operator-controlled vault.

`scripts/backup/restore-postgres.sh` refuses system databases, same-source
restores and target-name mismatches. It requires an explicit isolated-restore
confirmation and validates both migration ledgers plus canonical catalogs.

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
