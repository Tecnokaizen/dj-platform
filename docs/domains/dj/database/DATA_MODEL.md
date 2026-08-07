# DJ Platform — Data Model v1

**Documento:** `DATA_MODEL.md`  
**Estado:** Draft v1  
**Proyecto:** DJ Platform  
**Objetivo:** definir el modelo de datos canónico antes de generar `schema.prisma` y la primera migración.

## 1. Propósito

DJ Platform será una base de conocimiento musical orientada a DJs.

La información principal se obtendrá y enriquecerá mediante:

- APIs y fuentes musicales externas.
- Páginas web y tracklists.
- Metadatos embebidos.
- Procesos automáticos.
- Modelos de inteligencia artificial.
- Correcciones humanas cuando sea necesario.

El modelo debe permitir:

1. almacenar entidades musicales canónicas;
2. conservar el origen de cada dato;
3. resolver duplicados y conflictos;
4. diferenciar datos verificados, inferidos y manuales;
5. mantener bibliotecas y preferencias privadas por usuario;
6. soportar búsqueda, recomendación, playlists y análisis de sets.

## 2. Principios de diseño

### 2.1 Entidades globales y datos personales separados

Las entidades musicales serán globales y reutilizables:

- artistas;
- tracks;
- releases;
- sellos;
- géneros;
- fuentes externas.

Los datos propios de cada usuario vivirán en tablas separadas:

- biblioteca;
- valoración;
- energía;
- notas;
- etiquetas;
- cue points;
- playlists;
- sets.

Un mismo track no debe duplicarse por cada usuario.

### 2.2 Procedencia obligatoria

Todo dato automático debe registrar:

- fuente;
- fecha de obtención;
- método de extracción;
- nivel de confianza;
- versión del extractor o modelo;
- estado de validación.

### 2.3 Datos canónicos y evidencias

Las tablas principales contienen el valor canónico actualmente aceptado.

Las evidencias alternativas se conservan como hechos independientes.

Ejemplo:

- Beatport indica 124 BPM.
- Un análisis de audio indica 123.97 BPM.
- Otra fuente indica 125 BPM.

La plataforma conserva los tres valores y selecciona uno como canónico.

### 2.4 IA como fuente, no como verdad absoluta

Los resultados de IA deben guardar:

- proveedor;
- modelo;
- versión del proceso;
- entrada;
- salida;
- confianza;
- coste estimado;
- fecha;
- estado de revisión.

### 2.5 UUID como identificador principal

Las entidades principales utilizarán UUID por compatibilidad con Supabase, menor acoplamiento y mejor preparación para sincronización futura.

### 2.6 PostgreSQL como fuente de verdad

PostgreSQL será la fuente de verdad.

Supabase aportará:

- autenticación;
- API;
- Storage;
- Realtime cuando sea necesario;
- Row Level Security.

Prisma gestionará el dominio de aplicación, no las tablas internas de `auth`.

## 3. Capas del modelo

### 3.1 Identidad

- `profiles`

### 3.2 Conocimiento musical canónico

- `artists`
- `tracks`
- `track_artists`
- `genres`
- `track_genres`
- `labels`
- `releases`
- `release_tracks`

### 3.3 Procedencia, ingesta y enriquecimiento

- `data_sources`
- `external_entities`
- `source_snapshots`
- `entity_facts`
- `entity_matches`
- `ingestion_jobs`
- `ingestion_items`
- `enrichment_jobs`

### 3.4 Producto y biblioteca personal

- `user_tracks`
- `track_files`
- `tags`
- `user_track_tags`
- `cue_points`
- `playlists`
- `playlist_tracks`
- `dj_sets`
- `set_tracks`

## 4. Identidad

### 4.1 `profiles`

Extiende `auth.users` de Supabase.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK y FK a `auth.users.id` |
| `username` | VARCHAR(50) | UNIQUE, nullable inicialmente |
| `display_name` | VARCHAR(120) | nullable |
| `dj_name` | VARCHAR(120) | nullable |
| `avatar_url` | TEXT | nullable |
| `bio` | TEXT | nullable |
| `country_code` | CHAR(2) | nullable |
| `preferred_language` | VARCHAR(10) | default `es` |
| `experience_level` | ENUM | nullable |
| `is_admin` | BOOLEAN | default `false` |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

## 5. Conocimiento musical canónico

### 5.1 `artists`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(255) | required |
| `normalized_name` | VARCHAR(255) | required, indexado |
| `slug` | VARCHAR(255) | UNIQUE |
| `artist_type` | ENUM | default `PERSON` |
| `country_code` | CHAR(2) | nullable |
| `biography` | TEXT | nullable |
| `image_url` | TEXT | nullable |
| `canonical_confidence` | DECIMAL(5,4) | nullable |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

### 5.2 `tracks`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `title` | VARCHAR(500) | required |
| `normalized_title` | VARCHAR(500) | required, indexado |
| `version` | VARCHAR(255) | nullable |
| `duration_ms` | INTEGER | nullable |
| `bpm` | DECIMAL(7,3) | nullable |
| `musical_key` | VARCHAR(20) | nullable |
| `camelot_key` | VARCHAR(4) | nullable |
| `isrc` | VARCHAR(20) | nullable, indexado |
| `release_date` | DATE | nullable |
| `explicit` | BOOLEAN | nullable |
| `artwork_url` | TEXT | nullable |
| `canonical_confidence` | DECIMAL(5,4) | nullable |
| `metadata` | JSONB | default `{}` |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

Un remix, extended mix, radio edit, bootleg o versión en directo será un track distinto.

La deduplicación combinará:

- título normalizado;
- artistas;
- versión;
- duración;
- ISRC;
- IDs externos;
- huella de audio cuando exista.

### 5.3 `track_artists`

| Campo | Tipo | Reglas |
|---|---|---|
| `track_id` | UUID | FK a `tracks` |
| `artist_id` | UUID | FK a `artists` |
| `role` | ENUM | required |
| `position` | SMALLINT | default `0` |
| `credited_name` | VARCHAR(255) | nullable |

PK compuesta:

`track_id + artist_id + role`

Roles iniciales:

- `PRIMARY`
- `FEATURED`
- `REMIXER`
- `PRODUCER`
- `COMPOSER`
- `VOCALIST`
- `OTHER`

### 5.4 `genres`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(120) | required |
| `normalized_name` | VARCHAR(120) | required |
| `slug` | VARCHAR(150) | UNIQUE |
| `parent_id` | UUID | FK a `genres.id`, nullable |
| `description` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

### 5.5 `track_genres`

| Campo | Tipo | Reglas |
|---|---|---|
| `track_id` | UUID | FK |
| `genre_id` | UUID | FK |
| `is_primary` | BOOLEAN | default `false` |
| `confidence` | DECIMAL(5,4) | nullable |
| `assignment_method` | ENUM | required |
| `created_at` | TIMESTAMPTZ | required |

Métodos:

- `SOURCE`
- `AI`
- `AUDIO_ANALYSIS`
- `MANUAL`
- `CONSENSUS`

### 5.6 `labels`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(255) | required |
| `normalized_name` | VARCHAR(255) | required |
| `slug` | VARCHAR(255) | UNIQUE |
| `country_code` | CHAR(2) | nullable |
| `website_url` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

### 5.7 `releases`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `title` | VARCHAR(500) | required |
| `normalized_title` | VARCHAR(500) | required |
| `release_type` | ENUM | required |
| `label_id` | UUID | FK nullable |
| `catalog_number` | VARCHAR(100) | nullable |
| `release_date` | DATE | nullable |
| `artwork_url` | TEXT | nullable |
| `metadata` | JSONB | default `{}` |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

Tipos:

- `SINGLE`
- `EP`
- `ALBUM`
- `COMPILATION`
- `MIX`
- `OTHER`

### 5.8 `release_tracks`

| Campo | Tipo | Reglas |
|---|---|---|
| `release_id` | UUID | FK |
| `track_id` | UUID | FK |
| `disc_number` | SMALLINT | default `1` |
| `track_number` | SMALLINT | nullable |
| `position` | INTEGER | required |

## 6. Fuentes, procedencia e ingesta

### 6.1 `data_sources`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(80) | UNIQUE |
| `name` | VARCHAR(160) | required |
| `source_type` | ENUM | required |
| `base_url` | TEXT | nullable |
| `is_active` | BOOLEAN | default `true` |
| `trust_weight` | DECIMAL(5,4) | default `0.5000` |
| `config` | JSONB | default `{}` |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

Códigos iniciales:

- `YOUTUBE`
- `YOUTUBE_MUSIC`
- `SOUNDCLOUD`
- `SPOTIFY`
- `APPLE_MUSIC`
- `BEATPORT`
- `BANDCAMP`
- `DISCOGS`
- `MUSICBRAINZ`
- `WEB`
- `AUDIO_ANALYSIS`
- `AI`
- `MANUAL`

### 6.2 `external_entities`

Mapea entidades canónicas con IDs y URLs externos.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `source_id` | UUID | FK |
| `entity_type` | ENUM | required |
| `entity_id` | UUID | required |
| `external_id` | VARCHAR(500) | nullable |
| `external_url` | TEXT | nullable |
| `external_name` | TEXT | nullable |
| `availability_status` | ENUM | default `UNKNOWN` |
| `metadata` | JSONB | default `{}` |
| `last_checked_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

### 6.3 `source_snapshots`

Conserva evidencia bruta obtenida de una fuente.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `source_id` | UUID | FK |
| `source_url` | TEXT | nullable |
| `external_id` | VARCHAR(500) | nullable |
| `content_type` | VARCHAR(120) | nullable |
| `http_status` | SMALLINT | nullable |
| `raw_payload` | JSONB | nullable |
| `raw_text` | TEXT | nullable |
| `content_hash` | VARCHAR(128) | nullable, indexado |
| `parser_version` | VARCHAR(80) | nullable |
| `fetched_at` | TIMESTAMPTZ | required |
| `expires_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | required |

### 6.4 `entity_facts`

Registra afirmaciones individuales sobre una entidad.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `entity_type` | ENUM | required |
| `entity_id` | UUID | required |
| `field_name` | VARCHAR(120) | required |
| `value_json` | JSONB | required |
| `normalized_value` | TEXT | nullable |
| `source_id` | UUID | FK nullable |
| `snapshot_id` | UUID | FK nullable |
| `extraction_method` | ENUM | required |
| `confidence` | DECIMAL(5,4) | nullable |
| `is_verified` | BOOLEAN | default `false` |
| `is_selected` | BOOLEAN | default `false` |
| `observed_at` | TIMESTAMPTZ | required |
| `created_at` | TIMESTAMPTZ | required |

Puede haber múltiples hechos para un mismo campo. Cambiar el valor canónico no elimina evidencias anteriores.

### 6.5 `entity_matches`

Registra candidatos de coincidencia y decisiones de deduplicación.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `entity_type` | ENUM | required |
| `left_reference` | JSONB | required |
| `right_reference` | JSONB | required |
| `match_score` | DECIMAL(5,4) | required |
| `decision` | ENUM | default `PENDING` |
| `decision_method` | ENUM | nullable |
| `reason` | TEXT | nullable |
| `reviewed_by` | UUID | FK nullable |
| `reviewed_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | required |

### 6.6 `ingestion_jobs`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `requested_by` | UUID | FK nullable |
| `source_id` | UUID | FK nullable |
| `job_type` | ENUM | required |
| `status` | ENUM | required |
| `source_url` | TEXT | nullable |
| `input` | JSONB | default `{}` |
| `total_items` | INTEGER | default `0` |
| `processed_items` | INTEGER | default `0` |
| `successful_items` | INTEGER | default `0` |
| `failed_items` | INTEGER | default `0` |
| `error_message` | TEXT | nullable |
| `started_at` | TIMESTAMPTZ | nullable |
| `completed_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

Tipos iniciales:

- `TRACKLIST_URL`
- `PLAYLIST_URL`
- `CHANNEL_SCAN`
- `SOURCE_SYNC`
- `FILE_IMPORT`
- `MANUAL_BATCH`

### 6.7 `ingestion_items`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `job_id` | UUID | FK |
| `source_position` | INTEGER | nullable |
| `source_timestamp_ms` | INTEGER | nullable |
| `raw_title` | TEXT | nullable |
| `raw_artist` | TEXT | nullable |
| `raw_data` | JSONB | default `{}` |
| `matched_track_id` | UUID | FK nullable |
| `status` | ENUM | required |
| `match_confidence` | DECIMAL(5,4) | nullable |
| `error_message` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

### 6.8 `enrichment_jobs`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `entity_type` | ENUM | required |
| `entity_id` | UUID | required |
| `job_type` | ENUM | required |
| `status` | ENUM | required |
| `provider` | VARCHAR(120) | nullable |
| `model_name` | VARCHAR(160) | nullable |
| `process_version` | VARCHAR(80) | nullable |
| `input` | JSONB | default `{}` |
| `output` | JSONB | default `{}` |
| `confidence` | DECIMAL(5,4) | nullable |
| `tokens_used` | INTEGER | nullable |
| `estimated_cost` | DECIMAL(12,6) | nullable |
| `error_message` | TEXT | nullable |
| `started_at` | TIMESTAMPTZ | nullable |
| `completed_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | required |

## 7. Biblioteca personal

### 7.1 `user_tracks`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK |
| `track_id` | UUID | FK |
| `status` | ENUM | default `LIBRARY` |
| `rating` | SMALLINT | nullable, 1–5 |
| `energy` | SMALLINT | nullable, 1–10 |
| `familiarity` | SMALLINT | nullable, 1–10 |
| `notes` | TEXT | nullable |
| `custom_bpm` | DECIMAL(7,3) | nullable |
| `custom_key` | VARCHAR(20) | nullable |
| `is_favorite` | BOOLEAN | default `false` |
| `play_count` | INTEGER | default `0` |
| `date_added` | TIMESTAMPTZ | required |
| `last_played_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | required |
| `updated_at` | TIMESTAMPTZ | required |

Restricción:

`UNIQUE(user_id, track_id)`

### 7.2 `track_files`

Un track puede existir sin archivo local y un usuario puede conservar varias versiones físicas del mismo track.

### 7.3 `tags`

Etiquetas privadas del usuario.

### 7.4 `user_track_tags`

Relación N:M entre biblioteca personal y etiquetas.

### 7.5 `cue_points`

Puntos de mezcla privados por usuario.

## 8. Playlists y sets

### 8.1 `playlists`

Tipos:

- `MANUAL`
- `IMPORTED`
- `SMART`
- `AI_GENERATED`
- `CRATE`

### 8.2 `playlist_tracks`

No se utilizará PK compuesta porque un mismo track puede aparecer varias veces.

### 8.3 `dj_sets`

Representa una sesión preparada o ejecutada.

### 8.4 `set_tracks`

Guarda orden, tiempos y datos de transición.

## 9. Relaciones principales

```text
auth.users
    │
    └── profiles
          ├── user_tracks ───────── tracks
          │      ├── track_files      ├── track_artists ── artists
          │      ├── cue_points       ├── track_genres ─── genres
          │      └── tags             ├── release_tracks ─ releases ─ labels
          │                           └── external_entities
          │
          ├── playlists ───────── playlist_tracks ─ tracks
          ├── dj_sets ─────────── set_tracks ─────── tracks
          └── ingestion_jobs ──── ingestion_items

data_sources
    ├── external_entities
    ├── source_snapshots
    └── entity_facts

tracks / artists / releases / labels
    ├── entity_facts
    ├── entity_matches
    └── enrichment_jobs
```

## 10. Índices iniciales

### Matching

- `artists(normalized_name)`
- `tracks(normalized_title)`
- `tracks(isrc)`
- `labels(normalized_name)`
- `releases(normalized_title)`
- `external_entities(source_id, entity_type, external_id)`
- `entity_facts(entity_type, entity_id, field_name)`
- `source_snapshots(content_hash)`

### Producto

- `user_tracks(user_id, date_added DESC)`
- `user_tracks(user_id, is_favorite)`
- `playlist_tracks(playlist_id, position)`
- `set_tracks(set_id, position)`
- `cue_points(user_track_id, position_ms)`
- `track_files(checksum_sha256)`

## 11. Row Level Security

RLS obligatoria en:

- `profiles`
- `user_tracks`
- `track_files`
- `tags`
- `user_track_tags`
- `cue_points`
- `playlists`
- `playlist_tracks`
- `dj_sets`
- `set_tracks`

Las tablas globales permitirán lectura según fase, pero la escritura quedará restringida al backend, procesos de ingesta y administradores.

La `service_role` nunca debe exponerse en el navegador.

## 12. Flujo de datos

```text
Fuente externa
    ↓
ingestion_jobs
    ↓
source_snapshots
    ↓
ingestion_items
    ↓
normalización
    ↓
entity_matches
    ↓
entidad canónica
    ↓
entity_facts
    ↓
selección de valor canónico
    ↓
enrichment_jobs
    ↓
producto
```

## 13. Reglas de calidad

1. Ningún proceso automático sobrescribirá silenciosamente un dato canónico.
2. Los cambios relevantes conservarán la evidencia anterior.
3. Todo resultado de IA identificará proveedor, modelo y versión.
4. Los valores con baja confianza podrán enviarse a revisión.
5. Los IDs externos no sustituirán al UUID interno.
6. No se creará un track si existe una coincidencia fiable.
7. No se fusionarán entidades solo por nombre.
8. Los datos privados no se publicarán sin consentimiento.
9. Los secretos nunca se almacenarán en tablas de dominio.
10. El contenido externo respetará licencias y políticas de cada fuente.

## 14. Alcance recomendado de la primera migración

### Núcleo

- `profiles`
- `artists`
- `tracks`
- `track_artists`
- `genres`
- `track_genres`
- `labels`
- `releases`
- `release_tracks`

### Procedencia

- `data_sources`
- `external_entities`
- `source_snapshots`
- `entity_facts`
- `ingestion_jobs`
- `ingestion_items`
- `enrichment_jobs`

### Producto mínimo

- `user_tracks`
- `tags`
- `user_track_tags`
- `playlists`
- `playlist_tracks`

### Posponer

- `track_files`
- `cue_points`
- `dj_sets`
- `set_tracks`
- `entity_matches`
- `review_tasks`
- `activity_events`

## 15. Decisiones cerradas

1. PostgreSQL será la fuente de verdad.
2. Supabase gestionará Auth, API, Storage y RLS.
3. Prisma gestionará el dominio.
4. Las entidades musicales serán globales.
5. La biblioteca y preferencias serán privadas.
6. Los datos de Internet e IA conservarán procedencia.
7. Se separarán datos brutos, hechos y valores canónicos.
8. Los tracks no se identificarán solo por título y artista.
9. Las playlists permitirán repeticiones.
10. La service role será exclusiva de servidor.
11. La ingesta será idempotente siempre que sea posible.
12. La primera migración será contenida y extensible.

## 16. Cuestiones pendientes

1. ¿El catálogo musical será público desde la v1?
2. ¿Cuál será el primer importador?
3. ¿La taxonomía de géneros será propia desde el inicio?
4. ¿Los snapshots guardarán HTML completo o solo datos extraídos?
5. ¿Qué política de retención tendrán snapshots y resultados de IA?
6. ¿Habrá matching con MusicBrainz o Discogs en la v1?
7. ¿Prisma usará conexión directa o Supavisor según operación?
8. ¿La primera migración incluirá RLS mediante SQL adicional?
9. ¿Cuál será el primer vertical funcional: DJs, tracks o playlists?

## 17. Próximos documentos

1. `ENUMS.md`
2. `ERD.md`
3. `DATA_INGESTION_MODEL.md`
4. `RLS.md`
5. `MIGRATION_STRATEGY.md`
6. `schema.prisma`
