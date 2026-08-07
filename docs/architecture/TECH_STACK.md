---
title: Technology Stack
version: 2.0.0
status: Living Document
owner: Platform Core
updated: 2026-08-07
---

# Technology Stack

## Purpose

This document defines the official technology stack used by Platform Core.

Technology choices should prioritize:

- Stability
- Maintainability
- Developer Experience
- AI-assisted Development
- Long-term Support

Technology decisions with significant architectural impact require an ADR.

---

# Frontend

## Framework

- Next.js (App Router)

## UI

- React
- TypeScript
- Tailwind CSS
- shadcn/ui

---

# Backend

Platform Core follows a Server-First architecture.

Technologies:

- Next.js Server Components
- Next.js Server Actions
- Next.js Route Handlers

---

# Database

- PostgreSQL
- Prisma ORM

---

# Authentication

- Supabase Authentication
- @supabase/ssr

Future providers may include:

- Google OAuth
- GitHub OAuth
- Magic Link
- Enterprise SSO

Authentication providers should remain replaceable.

---

# Validation

- Zod

All external input must be validated at runtime.

---

# Storage

Production storage should use:

- S3-compatible Object Storage

Local development may use local storage when appropriate.

---

# AI

Current providers:

- OpenAI
- Anthropic

Provider access must always be abstracted behind Platform Core services.

Domains must never communicate directly with provider SDKs.

---

# Infrastructure

- Docker
- Coolify
- GitHub
- GitHub Actions

---

# Development

Language:

- TypeScript

Package Manager:

- npm

Code Generation:

- Prisma

---

# Quality

Current:

- ESLint
- Prettier

Planned:

- Vitest
- Playwright

---

# Architecture Principles

The technology stack must support:

- Server-First Architecture
- Multi-tenancy
- Domain Isolation
- AI-assisted Development
- Platform Reusability

Technology should never dictate architecture.

Architecture dictates technology.

---

# Future Evaluation

Future technologies may be adopted when they provide measurable benefits.

Potential candidates include:

- Redis
- Background Workers
- Queue Systems
- Vector Databases
- Search Engines

No technology should be introduced without a clear architectural justification and, when appropriate, an ADR.