# AUTH_ARCHITECTURE.md

> DJ Platform – Authentication & Authorization Architecture
>
> Version: 1.0
> Status: Approved
> Stack:
>
> - Next.js 16 (App Router)
> - React 19
> - Supabase Self Hosted
> - PostgreSQL
> - Supabase Auth (GoTrue)
> - Prisma ORM
> - TypeScript

---

# 1. Objetivo

Diseñar una arquitectura de autenticación moderna, segura y escalable para DJ Platform.

La autenticación deberá funcionar tanto para usuarios gratuitos como Premium y administradores, integrándose completamente con Supabase Auth, PostgreSQL y Row Level Security (RLS).

---

# 2. Principios

La autenticación debe ser:

- Stateless
- SSR First
- Edge Compatible
- Segura
- Escalable
- Compatible con RLS
- Compatible con Server Components
- Compatible con Server Actions

Nunca existirá una autenticación propia.

Toda la autenticación será delegada a Supabase Auth.

---

# 3. Componentes

## Identity Provider

Supabase Auth

Responsable de:

- usuarios
- sesiones
- JWT
- OAuth
- Magic Link
- recuperación contraseña
- refresh tokens

---

## Base de datos

PostgreSQL Self Hosted

Responsable de:

- perfiles
- roles
- permisos
- preferencias
- relaciones

---

## Cliente

Next.js 16

Responsable de:

- Login
- Logout
- Middleware
- Cookies
- SSR

---

# 4. Métodos de Login

## Magic Link

Usuario introduce email.

Supabase envía enlace.

El usuario queda autenticado.

---

## Google

OAuth

---

## GitHub

OAuth

Principalmente para desarrolladores.

---

## Futuro

Apple

Discord

Spotify

Microsoft

---

# 5. Flujo de autenticación

Usuario

↓

Página Login

↓

Supabase Auth

↓

Validación

↓

JWT

↓

Cookie HttpOnly

↓

Middleware

↓

Server Components

↓

Dashboard

---

# 6. Arquitectura de sesión

Supabase mantiene:

Access Token

Refresh Token

Los tokens se almacenan mediante cookies seguras.

Nunca se almacenan manualmente.

---

# 7. JWT

El JWT contendrá:

- user id
- email
- role
- exp
- iss

Nunca contendrá:

- datos personales
- preferencias
- playlists
- permisos específicos

Todo eso vive en PostgreSQL.

---

# 8. Tabla auth.users

Gestionada por Supabase.

No debe modificarse.

Información:

- id
- email
- created_at
- last_sign_in
- metadata

---

# 9. Tabla profiles

Cada usuario tendrá un perfil.

```
auth.users
        │
        │ 1
        │
        ▼
profiles
```

Campos:

- id
- username
- display_name
- avatar_url
- bio
- website
- country
- language
- timezone
- created_at
- updated_at

El id coincide exactamente con auth.users.id.

---

# 10. Creación automática

Cuando Supabase crea un usuario:

Trigger PostgreSQL

↓

Insert

↓

profiles

No existe creación manual.

---

# 11. Roles

## USER

Usuario estándar.

Puede:

- crear playlists
- favoritos
- seguir DJs

No puede administrar contenido.

---

## PREMIUM

Todo USER

+

- IA avanzada
- recomendaciones
- exports
- sincronizaciones

---

## MODERATOR

Puede:

- revisar contenido

- validar DJs

- validar eventos

- ocultar contenido

---

## ADMIN

Acceso completo.

---

# 12. Tabla user_roles

```
profiles

↓

user_roles

↓

roles
```

Permite múltiples roles futuros.

---

# 13. Middleware

Todas las rutas privadas pasan por middleware.

Ejemplo:

```
/

/dashboard

/profile

/settings

/admin
```

El middleware:

- verifica sesión

- renueva token

- redirige login

---

# 14. Rutas públicas

```
/

/about

/contact

/djs

/playlists

/events
```

No requieren login.

---

# 15. Rutas privadas

```
/dashboard

/profile

/library

/settings
```

Requieren sesión válida.

---

# 16. Rutas Admin

```
/admin

/admin/users

/admin/djs

/admin/labels

/admin/events

/admin/imports
```

Además del login requieren:

role == ADMIN

---

# 17. Cliente Supabase

Se crearán tres clientes.

## Browser Client

Uso:

React Client Components

---

## Server Client

Uso:

Server Components

Server Actions

---

## Admin Client

Utiliza:

SERVICE_ROLE_KEY

Nunca se expone al navegador.

---

# 18. Variables de entorno

## Públicas

```
NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Privadas

```
SUPABASE_SERVICE_ROLE_KEY
```

Nunca viajan al frontend.

---

# 19. Organización del código

```
src/

lib/

supabase/

browser.ts

server.ts

admin.ts

middleware.ts

auth.ts
```

---

# 20. Protección de datos

Todo acceso a PostgreSQL utiliza:

Row Level Security

No existe seguridad únicamente desde el frontend.

---

# 21. Eliminación de cuenta

Usuario

↓

Solicita eliminación

↓

Soft Delete

↓

Periodo recuperación

↓

Delete definitivo

↓

Supabase Auth

↓

PostgreSQL

↓

Storage

---

# 22. Auditoría

Toda acción crítica quedará registrada.

Ejemplos:

- login

- logout

- cambio email

- cambio contraseña

- creación playlists

- importaciones

- eliminación contenido

---

# 23. Integración con RLS

Cada consulta comprobará automáticamente:

```
auth.uid()
```

contra

```
profiles.id
```

No existirán consultas sin políticas RLS.

---

# 24. Seguridad

- Cookies HttpOnly
- HTTPS obligatorio
- JWT firmado
- Refresh automático
- CSRF protegido
- OAuth seguro
- Passwordless por defecto
- Secretos únicamente en servidor

---

# 25. Roadmap

## Fase 1

- Magic Link

- Google Login

- Profiles

- Middleware

---

## Fase 2

- GitHub

- Roles

- Admin

---

## Fase 3

- Spotify OAuth

- Discord OAuth

- Apple Login

---

# Estado

**APPROVED**

Este documento define la arquitectura oficial de autenticación y autorización de DJ Platform sobre Supabase Self Hosted y será la referencia para toda la implementación de la capa de acceso, sesiones y seguridad.