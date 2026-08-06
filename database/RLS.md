# DJ Platform — Row Level Security (RLS)

**Documento:** RLS.md  
**Estado:** v1.0  
**Proyecto:** DJ Platform

---

# Objetivo

Definir el modelo de seguridad de toda la base de datos.

Toda autorización se realizará mediante PostgreSQL + Row Level Security (RLS), garantizando que la seguridad reside en la base de datos y nunca en el frontend.

---

# Principios

## Seguridad por defecto

- Denegar todo por defecto.
- Abrir únicamente los permisos necesarios.
- Nunca confiar en el cliente.
- Todas las comprobaciones se realizan en PostgreSQL.

---

## Service Role

La Service Role:

- tiene acceso completo
- únicamente se utiliza desde el backend
- nunca se expone al navegador
- nunca se almacena en código cliente

---

## Auditoría

Todas las operaciones importantes quedarán registradas.

---

# Roles

## Anonymous

Usuario no autenticado.

Puede:

- consultar el catálogo público
- buscar artistas
- buscar DJs
- consultar playlists públicas
- consultar eventos públicos

No puede:

- modificar información
- crear playlists
- acceder a bibliotecas
- acceder a favoritos
- acceder a imports

---

## Authenticated User

Usuario registrado.

Puede:

- editar su perfil
- gestionar su biblioteca
- crear playlists
- marcar favoritos
- importar tracklists
- gestionar sus preferencias

No puede:

- modificar el catálogo global
- modificar artistas
- modificar DJs globales
- acceder a datos de otros usuarios

---

## Moderator

Puede:

- revisar contenido
- revisar duplicados
- revisar reportes
- aprobar información pendiente

No puede:

- modificar configuración global
- gestionar usuarios administradores

---

## Administrator

Acceso completo.

Gestiona:

- usuarios
- IA
- taxonomía
- catálogo
- fuentes
- trabajos de ingestión
- auditoría
- configuración

---

## Service Role

Backend.

Acceso total.

Utilizado por:

- Workers
- Edge Functions
- Server Actions
- Scripts
- Ingestión IA

---

# Clasificación de tablas

## Públicas

Estas tablas pueden consultarse sin autenticación.

- artists
- tracks
- albums
- labels
- genres
- countries
- languages
- external_providers

### Lectura

- Anonymous
- Authenticated
- Moderator
- Administrator

### Escritura

Solo Service Role.

---

## Públicas parcialmente

- djs
- playlists_public
- events
- venues

Lectura:

Todos.

Edición:

Solo propietario o administrador.

---

## Privadas del usuario

- profiles
- libraries
- user_tracks
- favorites
- playlists
- playlist_items
- imports
- notifications
- settings

Lectura:

Solo propietario.

Escritura:

Solo propietario.

---

## Backend

Nunca visibles.

- ingestion_jobs
- ingestion_items
- source_snapshots
- entity_facts
- matching_candidates
- enrichment_jobs
- audit_logs
- worker_logs
- ai_requests
- ai_usage

Acceso exclusivo mediante Service Role.

---

# Ownership

Toda tabla privada contiene:

- user_id

Todas las policies utilizarán:

```sql
auth.uid() = user_id
```

---

# Policies por tabla

## profiles

### SELECT

```sql
auth.uid() = id
```

### INSERT

```sql
auth.uid() = id
```

### UPDATE

```sql
auth.uid() = id
```

### DELETE

```sql
false
```

---

## libraries

SELECT

```sql
user_id = auth.uid()
```

INSERT

```sql
user_id = auth.uid()
```

UPDATE

```sql
user_id = auth.uid()
```

DELETE

```sql
user_id = auth.uid()
```

---

## user_tracks

SELECT

```sql
user_id = auth.uid()
```

INSERT

```sql
user_id = auth.uid()
```

UPDATE

```sql
user_id = auth.uid()
```

DELETE

```sql
user_id = auth.uid()
```

---

## favorites

SELECT

```sql
user_id = auth.uid()
```

INSERT

```sql
user_id = auth.uid()
```

UPDATE

```sql
user_id = auth.uid()
```

DELETE

```sql
user_id = auth.uid()
```

---

## playlists

SELECT

```sql
owner_id = auth.uid()
OR is_public = true
```

INSERT

```sql
owner_id = auth.uid()
```

UPDATE

```sql
owner_id = auth.uid()
```

DELETE

```sql
owner_id = auth.uid()
```

---

## playlist_items

SELECT

Visible únicamente si el usuario tiene acceso a la playlist.

INSERT

Solo propietario.

UPDATE

Solo propietario.

DELETE

Solo propietario.

---

# Catálogo Global

Las siguientes entidades son globales.

- Artists
- Tracks
- Albums
- Labels
- Genres

No pertenecen a ningún usuario.

No pueden modificarse desde frontend.

Solo Service Role.

---

# Biblioteca Personal

Cada usuario dispone de una biblioteca independiente.

```
Library
    │
    ├── User Tracks
    ├── Cue Points
    ├── Ratings
    ├── History
    ├── Notes
    └── Tags
```

Nunca será accesible por otros usuarios.

---

# Playlists

Tipos soportados.

## PRIVATE

Solo propietario.

---

## UNLISTED

Acceso mediante URL.

No aparece en búsquedas.

---

## PUBLIC

Visible para todos.

Editable únicamente por el propietario.

---

# Ingestión IA

Cada usuario únicamente visualizará:

- sus imports
- sus errores
- sus trabajos
- su historial

Nunca podrá consultar procesos de otros usuarios.

---

# Entity Facts

Contienen el conocimiento consolidado por IA.

Nunca son públicos.

Solo backend.

---

# Source Snapshots

Almacenan:

- HTML
- JSON
- Markdown
- respuestas IA
- datos originales

Nunca serán visibles desde frontend.

---

# IA

Los prompts completos:

- nunca serán públicos
- nunca llegarán al navegador

El usuario únicamente recibe el resultado final.

---

# API Keys

Nunca se almacenan en tablas públicas.

Siempre:

- Variables de entorno
- Coolify Secrets
- Supabase Secrets

---

# Backend

Las siguientes operaciones solo podrán ejecutarse mediante backend.

- Crear artistas
- Crear DJs
- Crear eventos
- Matching automático
- Enriquecimiento IA
- Actualización catálogo
- Procesamiento de imports

Nunca mediante la Anon Key.

---

# Auditoría

Todas las operaciones críticas registran:

- usuario
- fecha
- acción
- tabla
- registro
- valores anteriores
- valores nuevos
- dirección IP
- origen
- duración

---

# Buenas prácticas

- Nunca utilizar Service Role desde React.
- Nunca exponer claves privadas.
- Toda escritura pasa por RLS.
- Toda lógica compleja se ejecuta mediante Server Actions o Edge Functions.
- El frontend únicamente consume datos autorizados.

---

# Checklist

- [x] Seguridad por defecto
- [x] Catálogo global público
- [x] Bibliotecas privadas
- [x] Playlists con visibilidad configurable
- [x] Backend aislado
- [x] Service Role protegida
- [x] Auditoría completa
- [x] Entity Facts privados
- [x] Source Snapshots privados
- [x] IA protegida
- [x] RLS en todas las tablas

---

# Próximo documento

**AUTH_ARCHITECTURE.md**

Definirá:

- Supabase Auth
- Magic Links
- OAuth
- Roles
- JWT Claims
- Middleware
- Server Components
- Server Actions
- Cookies
- Refresh Tokens
- Gestión de sesiones