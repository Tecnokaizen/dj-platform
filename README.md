# DJ Platform

> The AI-native knowledge platform for Electronic Dance Music.

---

# Overview

DJ Platform es una plataforma editorial y de datos estructurados dedicada al mundo de los DJs y la música electrónica.

Su objetivo es convertirse en la referencia para descubrir, explorar y comprender artistas, géneros, rankings, festivales, sesiones y escenas musicales mediante una combinación de contenido editorial, relaciones entre entidades y automatización asistida por IA.

No pretende ser una red social, un servicio de streaming ni una simple base de datos.

El proyecto está diseñado desde su origen como una **plataforma AI-Native**, donde la documentación, la arquitectura y el desarrollo están optimizados para ser comprendidos y mantenidos tanto por personas como por asistentes de IA.

---

# Vision

Construir la plataforma de referencia mundial sobre DJs y música electrónica.

El usuario debe poder descubrir cualquier artista relevante y comprender rápidamente:

- quién es
- cómo suena
- qué géneros representa
- qué trayectoria tiene
- qué festivales frecuenta
- qué sesiones son imprescindibles
- qué artistas similares existen
- qué rankings ocupa
- cómo se relaciona con la escena electrónica

---

# Product Goals

## MVP

- Directorio público de DJs.
- Perfiles editoriales.
- Géneros musicales.
- Rankings.
- Buscador.
- Panel administrativo.
- Importador de datos.
- SEO técnico.
- Arquitectura preparada para IA.

---

## Medium Term

- Comunidad.
- Favoritos.
- Listas.
- Sistema editorial avanzado.
- API.
- Automatización mediante IA.
- Recomendaciones personalizadas.

---

## Long Term

- Plataforma internacional.
- Aplicaciones móviles.
- Marketplace.
- Integraciones externas.
- Herramientas profesionales.

---

# Core Principles

Todo el proyecto gira alrededor de estos principios.

## Documentation First

La documentación es la fuente de verdad.

Antes de escribir código debe existir una definición funcional.

---

## AI Native

El proyecto está preparado para ser desarrollado conjuntamente por personas y asistentes de IA.

Toda decisión importante debe quedar documentada.

---

## Clean Architecture

El código debe ser:

- mantenible
- modular
- testeable
- escalable

---

## SEO First

Todo contenido público debe estar preparado para buscadores desde el primer día.

---

## Editorial Quality

No buscamos cantidad.

Buscamos calidad.

Una ficha excelente vale más que cien fichas vacías.

---

# Planned Features

## Public Website

- Home
- DJ Directory
- DJ Profiles
- Genres
- Rankings
- Festivals
- Sessions
- Editorial Content
- Search
- Filters

---

## Administration

- Dashboard
- CRUD DJs
- CRUD Genres
- CRUD Rankings
- Editorial Workflow
- Importers
- Media Management
- User Management

---

## AI Features

- Draft generation
- Genre suggestions
- Duplicate detection
- Metadata normalization
- Editorial assistance
- Structured extraction

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

---

## Backend

- Next.js
- Prisma
- PostgreSQL

---

## Authentication

- Auth.js

---

## Validation

- Zod

---

## Infrastructure

- Docker
- Coolify
- GitHub

---

## AI Providers

Primary

- OpenAI

Secondary

- Anthropic

---

# Repository Structure

```
dj-platform/

docs/
tasks/
.cursor/
.ai/

src/
prisma/
public/

README.md
AGENTS.md
```

---

# Documentation

Toda la documentación vive dentro de `/docs`.

```
docs/

00-VISION.md
01-PRD.md

...

60-CODING_STANDARDS.md
```

No debe existir conocimiento importante fuera de la documentación.

---

# Development Workflow

```
Vision

↓

Requirements

↓

Architecture

↓

Task

↓

Implementation

↓

Testing

↓

Review

↓

Merge

↓

Deploy
```

---

# Git Workflow

```
main

↓

develop

↓

feature/*
```

Nunca se desarrolla directamente sobre `main`.

---

# Project Status

Actualmente el proyecto se encuentra en fase de definición.

La prioridad es construir una base sólida de:

- documentación
- arquitectura
- modelo de datos
- reglas de desarrollo

Antes de comenzar la implementación.

---

# Coding Standards

Las reglas completas se encuentran en:

```
AGENTS.md
```

Todo desarrollador o IA debe leer ese documento antes de modificar el proyecto.

---

# Project Documentation

La documentación está organizada por dominios.

## Foundation

- Vision
- PRD
- Roadmap
- Glossary

## Product

- Features
- User Stories
- Business Rules

## Architecture

- Stack
- Database
- API
- Deployment

## Domain

- DJs
- Genres
- Rankings
- Festivals
- Tracks

## Frontend

- Design System
- Components
- Pages

## SEO

- Metadata
- Structured Data
- URL Strategy

## Development

- Coding Standards
- Testing
- Git Workflow
- AI Rules

---

# Development Philosophy

El objetivo no es escribir código rápidamente.

El objetivo es construir una plataforma que pueda mantenerse durante años.

Toda funcionalidad debe ser:

- comprensible
- reutilizable
- documentada
- testeable

---

# Deployment

Entornos previstos.

## Local

Desarrollo.

---

## Staging

Validación previa.

---

## Production

Entorno público.

Cada entorno tendrá su propia configuración y base de datos.

---

# Security

Nunca almacenar:

- claves
- tokens
- contraseñas
- secretos

dentro del repositorio.

Toda configuración sensible vive en variables de entorno.

---

# Quality Requirements

Antes de cerrar cualquier tarea deben pasar:

- Lint
- Typecheck
- Tests
- Revisión manual

---

# Future Documentation

La documentación crecerá junto al proyecto.

Cada decisión importante quedará registrada.

Esto permitirá que cualquier desarrollador o IA pueda continuar el trabajo sin depender del contexto de conversaciones anteriores.

---

# License

Pendiente de definir.

---

# Maintainers

Actualmente el proyecto está dirigido por:

- Product Owner
- AI Architecture
- Cursor
- GPT
- Claude

La arquitectura está diseñada para permitir colaboración entre asistentes de IA y desarrolladores humanos sin pérdida de contexto.