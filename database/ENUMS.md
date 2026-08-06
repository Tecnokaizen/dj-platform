# DJ Platform — Enumerations v1

**Documento:** `ENUMS.md`  
**Estado:** Draft v1  
**Proyecto:** DJ Platform  
**Dependencia:** `DATA_MODEL.md`  
**Objetivo:** definir las enumeraciones iniciales que se utilizarán en Prisma, PostgreSQL y la API.

---

## 1. Criterios generales

Las enumeraciones deben cumplir estas reglas:

1. Usar nombres en inglés en código y base de datos.
2. Usar valores en mayúsculas con guion bajo.
3. Evitar valores ambiguos.
4. Incluir un estado genérico solo cuando sea realmente necesario.
5. No usar enums para catálogos que necesiten edición frecuente.
6. Mantener compatibilidad con Prisma y PostgreSQL.
7. No introducir valores dependientes de un proveedor concreto cuando puedan modelarse como datos.

---

# 2. Identidad

## 2.1 `ExperienceLevel`

Nivel de experiencia declarado por el usuario.

```prisma
enum ExperienceLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  PROFESSIONAL
}
```

### Uso

- `profiles.experience_level`

---

# 3. Entidades musicales

## 3.1 `ArtistType`

Tipo principal de artista.

```prisma
enum ArtistType {
  PERSON
  GROUP
  PROJECT
  ORCHESTRA
  COLLECTIVE
  UNKNOWN
}
```

### Uso

- `artists.artist_type`

### Notas

`PROJECT` cubre alias, proyectos musicales y nombres artísticos no asociados claramente a una persona o grupo.

---

## 3.2 `ArtistRole`

Papel de un artista en un track.

```prisma
enum ArtistRole {
  PRIMARY
  FEATURED
  REMIXER
  PRODUCER
  COMPOSER
  VOCALIST
  DJ_MIXER
  OTHER
}
```

### Uso

- `track_artists.role`

---

## 3.3 `ReleaseType`

Tipo de lanzamiento.

```prisma
enum ReleaseType {
  SINGLE
  EP
  ALBUM
  COMPILATION
  DJ_MIX
  SOUNDTRACK
  LIVE
  OTHER
}
```

### Uso

- `releases.release_type`

---

## 3.4 `AssignmentMethod`

Método usado para asignar una clasificación a una entidad.

```prisma
enum AssignmentMethod {
  SOURCE
  AI
  AUDIO_ANALYSIS
  MANUAL
  CONSENSUS
}
```

### Uso

- `track_genres.assignment_method`

---

# 4. Fuentes y procedencia

## 4.1 `SourceType`

Naturaleza de la fuente de datos.

```prisma
enum SourceType {
  API
  WEB
  FILE
  AI
  MANUAL
  INTERNAL
}
```

### Uso

- `data_sources.source_type`

---

## 4.2 `EntityType`

Tipo de entidad sobre la que opera una referencia, hecho, proceso o coincidencia.

```prisma
enum EntityType {
  ARTIST
  TRACK
  RELEASE
  LABEL
  GENRE
  PLAYLIST
  DJ_SET
}
```

### Uso

- `external_entities.entity_type`
- `entity_facts.entity_type`
- `entity_matches.entity_type`
- `enrichment_jobs.entity_type`

### Decisión

No incluimos `USER_TRACK` ni otras entidades privadas en la v1 de procedencia global.

---

## 4.3 `AvailabilityStatus`

Disponibilidad de una entidad en una fuente externa.

```prisma
enum AvailabilityStatus {
  UNKNOWN
  AVAILABLE
  UNAVAILABLE
  REGION_RESTRICTED
  REMOVED
  PRIVATE
}
```

### Uso

- `external_entities.availability_status`

---

## 4.4 `ExtractionMethod`

Método que produjo un hecho.

```prisma
enum ExtractionMethod {
  API_RESPONSE
  HTML_PARSER
  STRUCTURED_DATA
  METADATA
  AUDIO_ANALYSIS
  AI_EXTRACTION
  AI_INFERENCE
  MANUAL
  DERIVED
}
```

### Uso

- `entity_facts.extraction_method`

### Diferencia importante

- `AI_EXTRACTION`: la IA extrae un dato explícito de una fuente.
- `AI_INFERENCE`: la IA deduce o clasifica algo que no aparece de forma explícita.
- `DERIVED`: valor calculado a partir de otros datos sin IA.

---

# 5. Matching y resolución

## 5.1 `MatchDecision`

Resultado de una propuesta de coincidencia.

```prisma
enum MatchDecision {
  PENDING
  MATCH
  NO_MATCH
  MERGED
  IGNORED
}
```

### Uso

- `entity_matches.decision`

---

## 5.2 `DecisionMethod`

Método con el que se tomó una decisión de matching.

```prisma
enum DecisionMethod {
  RULE
  EXACT_ID
  FINGERPRINT
  AI
  MANUAL
  CONSENSUS
}
```

### Uso

- `entity_matches.decision_method`

---

# 6. Jobs y procesos

## 6.1 `JobStatus`

Estado común de procesos asíncronos.

```prisma
enum JobStatus {
  PENDING
  QUEUED
  RUNNING
  PARTIALLY_COMPLETED
  COMPLETED
  FAILED
  CANCELLED
}
```

### Uso

- `ingestion_jobs.status`
- `enrichment_jobs.status`

---

## 6.2 `IngestionJobType`

Tipo de ingesta.

```prisma
enum IngestionJobType {
  TRACKLIST_URL
  TRACKLIST_TEXT
  PLAYLIST_URL
  CHANNEL_SCAN
  SOURCE_SYNC
  FILE_IMPORT
  MANUAL_BATCH
}
```

### Uso

- `ingestion_jobs.job_type`

### Decisión

Se añade `TRACKLIST_TEXT` porque una entrada habitual será pegar directamente un tracklist con timestamps.

---

## 6.3 `IngestionItemStatus`

Estado individual de un elemento importado.

```prisma
enum IngestionItemStatus {
  PENDING
  PARSED
  MATCHED
  CREATED
  NEEDS_REVIEW
  SKIPPED
  FAILED
}
```

### Uso

- `ingestion_items.status`

### Significado

- `PARSED`: título y artista extraídos.
- `MATCHED`: vinculado a una entidad existente.
- `CREATED`: se creó una entidad nueva.
- `NEEDS_REVIEW`: no existe confianza suficiente.
- `SKIPPED`: descartado intencionadamente.

---

## 6.4 `EnrichmentJobType`

Tipo de enriquecimiento aplicado.

```prisma
enum EnrichmentJobType {
  METADATA_ENRICHMENT
  TRACK_MATCHING
  GENRE_CLASSIFICATION
  BPM_ANALYSIS
  KEY_ANALYSIS
  MOOD_CLASSIFICATION
  ENERGY_CLASSIFICATION
  ARTIST_RESOLUTION
  DUPLICATE_DETECTION
  SOURCE_DISCOVERY
  PLAYLIST_ANALYSIS
  TRANSITION_RECOMMENDATION
}
```

### Uso

- `enrichment_jobs.job_type`

---

# 7. Biblioteca personal

## 7.1 `UserTrackStatus`

Estado de un track dentro de la biblioteca del usuario.

```prisma
enum UserTrackStatus {
  LIBRARY
  WISHLIST
  ARCHIVED
  REJECTED
}
```

### Uso

- `user_tracks.status`

---

## 7.2 `StorageProvider`

Proveedor o ubicación del archivo.

```prisma
enum StorageProvider {
  SUPABASE
  MINIO
  LOCAL
  S3
  EXTERNAL_URL
}
```

### Uso

- `track_files.storage_provider`

---

## 7.3 `CueType`

Tipo de punto DJ.

```prisma
enum CueType {
  HOT_CUE
  MEMORY_CUE
  LOOP
  LOAD_POINT
  BEATGRID_MARKER
}
```

### Uso

- `cue_points.cue_type`

---

# 8. Playlists y sets

## 8.1 `PlaylistType`

Tipo funcional de playlist.

```prisma
enum PlaylistType {
  MANUAL
  IMPORTED
  SMART
  AI_GENERATED
  CRATE
}
```

### Uso

- `playlists.playlist_type`

---

## 8.2 `Visibility`

Nivel de visibilidad.

```prisma
enum Visibility {
  PRIVATE
  UNLISTED
  PUBLIC
}
```

### Uso

- `playlists.visibility`
- `dj_sets.visibility`

---

## 8.3 `SetStatus`

Estado de una sesión DJ.

```prisma
enum SetStatus {
  DRAFT
  PLANNED
  READY
  PERFORMED
  PUBLISHED
  ARCHIVED
}
```

### Uso

- `dj_sets.status`

---

# 9. Revisión humana

## 9.1 `ReviewTaskType`

Tipo de revisión requerida.

```prisma
enum ReviewTaskType {
  ENTITY_MATCH
  DUPLICATE
  SOURCE_CONFLICT
  ARTIST_AMBIGUITY
  TRACKLIST_ITEM
  GENRE_CLASSIFICATION
  LOW_CONFIDENCE_FACT
  PUBLICATION_REVIEW
  OTHER
}
```

### Uso

- `review_tasks.task_type`

---

## 9.2 `ReviewStatus`

Estado de una tarea de revisión.

```prisma
enum ReviewStatus {
  OPEN
  ASSIGNED
  IN_REVIEW
  RESOLVED
  DISMISSED
}
```

### Uso

- `review_tasks.status`

---

# 10. Catálogos que no deben ser enums

Los siguientes conceptos deben vivir en tablas porque cambiarán con frecuencia o necesitarán configuración:

- proveedores concretos: YouTube, Beatport, Spotify, etc.;
- géneros y subgéneros;
- países;
- idiomas;
- modelos de IA;
- proveedores de IA;
- tipos de transición;
- formatos de audio;
- colores;
- nombres de roles futuros;
- estados específicos de APIs externas.

---

# 11. Enumeraciones incluidas en la primera migración

La primera migración debería incluir:

```text
ExperienceLevel
ArtistType
ArtistRole
ReleaseType
AssignmentMethod
SourceType
EntityType
AvailabilityStatus
ExtractionMethod
JobStatus
IngestionJobType
IngestionItemStatus
EnrichmentJobType
UserTrackStatus
PlaylistType
Visibility
```

---

# 12. Enumeraciones pospuestas

Se pueden introducir cuando lleguen sus tablas:

```text
MatchDecision
DecisionMethod
StorageProvider
CueType
SetStatus
ReviewTaskType
ReviewStatus
```

---

# 13. Decisiones cerradas

1. Los valores estarán en inglés.
2. La base de datos guardará los valores en mayúsculas.
3. No se usarán enums para proveedores externos.
4. `JobStatus` será compartido por ingesta y enriquecimiento.
5. `TRACKLIST_TEXT` formará parte de la v1.
6. La IA distinguirá extracción de inferencia.
7. Los estados privados del usuario no afectarán al catálogo global.
8. Las enumeraciones pospuestas no bloquearán la primera migración.

---

# 14. Próximo paso

Crear `ERD.md` con:

- relaciones;
- cardinalidades;
- claves primarias;
- claves foráneas;
- restricciones únicas;
- reglas de borrado;
- alcance de la primera migración.
