---
title: Architecture Blueprint
version: 1.0.0
status: Draft
---

# Architecture Blueprint

## Philosophy

DJ Platform follows a pragmatic Domain Driven Design approach with a modular architecture.

Core principles:

- Documentation First
- Feature First
- AI Native
- Server First
- SEO First

## Layers

Browser
↓
Next.js App Router
↓
Presentation
↓
Server Actions
↓
Application Services
↓
Repositories
↓
Prisma
↓
PostgreSQL

Rules:

- Pages never access Prisma.
- Components never contain business logic.
- Repositories are the only layer allowed to query the database.

## Modules

Every domain owns its own:

- components
- services
- repositories
- schemas
- validators
- types
- utils

## AI

All providers are abstracted behind an AI service layer.

## Future

Architecture prepared for API, mobile apps, queues and additional AI providers.
