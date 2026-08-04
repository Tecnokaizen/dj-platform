# DJ Platform Prisma Pack v1

## Purpose

This pack translates the current architecture and data-model documents into the first executable Prisma specification.

## Included

```text
prisma/
├── schema.prisma
├── seed.ts
└── README.md

prisma.config.ts
.env.prisma.example

docs/architecture/
└── PRISMA_IMPLEMENTATION.md

database/samples/
└── djs-import-template.csv
```

## Important

This pack targets Prisma ORM 7 conventions:

- `prisma-client` generator
- generated client output inside `src/generated/prisma`
- datasource URL in `prisma.config.ts`
- explicit `prisma db seed`

Do not run migrations until the Next.js project and dependencies are installed.

## Copy instructions

Copy:

- `prisma/` to the repository root
- `prisma.config.ts` to the repository root
- `.env.prisma.example` values into the existing `.env.example`
- `docs/architecture/PRISMA_IMPLEMENTATION.md` into the existing architecture folder
- the CSV template into `database/samples/`

## Existing files

- Replace an empty `prisma/schema.prisma`.
- Replace an empty `prisma/README.md`.
- Do not replace the project's existing `.env.example`; merge the variables.
- Do not commit a real `.env`.

## Status

The schema is a strong first draft. It must be validated with Prisma after package installation and reviewed before the first migration.
