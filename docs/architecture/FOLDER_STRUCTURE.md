# Folder Structure

```text
src/
├── app/
├── modules/
│   ├── dj/
│   ├── genre/
│   ├── festival/
│   ├── ranking/
│   ├── article/
│   ├── session/
│   ├── search/
│   ├── auth/
│   ├── admin/
│   └── ai/
├── shared/
├── config/
├── lib/
└── types/
```

## Module template

```text
module/
├── actions/
├── components/
├── hooks/
├── repositories/
├── schemas/
├── services/
├── types/
├── utils/
└── validators/
```

### Dependency flow

Page

↓

Action

↓

Service

↓

Repository

↓

Prisma
