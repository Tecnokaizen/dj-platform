# DJ Platform — Data Ingestion Model v1

**Documento:** `DATA_INGESTION_MODEL.md`  
**Estado:** Draft v1  
**Proyecto:** DJ Platform  
**Dependencias:** `DATA_MODEL.md`, `ENUMS.md`, `ERD.md`  
**Objetivo:** definir cómo entra, se transforma, valida y consolida la información procedente de Internet, APIs, archivos e inteligencia artificial.

---

## 1. Propósito

DJ Platform no se limitará a almacenar datos introducidos manualmente.

Su valor principal estará en:

- capturar información musical desde múltiples fuentes;
- extraer tracklists, artistas, tracks, releases y metadatos;
- resolver entidades duplicadas;
- enriquecer datos mediante IA;
- conservar evidencias y procedencia;
- seleccionar valores canónicos;
- permitir revisión humana cuando la confianza sea insuficiente.

El sistema debe ser:

- trazable;
- idempotente;
- reproducible;
- auditable;
- tolerante a errores;
- extensible;
- seguro;
- eficiente en costes.

---

# 2. Fuentes de entrada

## 2.1 URLs

Ejemplos:

- vídeos de YouTube;
- playlists de YouTube Music;
- playlists de SoundCloud;
- páginas de Beatport;
- releases de Bandcamp;
- perfiles de artistas;
- páginas de Discogs;
- entradas de MusicBrainz;
- páginas web con tracklists.

## 2.2 Texto pegado

Ejemplos:

```text
00:00 Artist A - Track One
03:42 Artist B - Track Two
07:15 Artist C - Track Three (Extended Mix)
```

Este será un flujo prioritario de la v1.

## 2.3 Archivos

Ejemplos:

- CSV;
- JSON;
- M3U;
- XML;
- exportaciones de Engine DJ;
- exportaciones de Rekordbox;
- archivos ID3;
- tracklists exportados.

## 2.4 APIs

Posibles fuentes:

- YouTube Data API;
- MusicBrainz;
- Discogs;
- Spotify;
- Apple Music;
- Beatport, cuando exista acceso autorizado;
- servicios internos;
- proveedores de análisis de audio.

## 2.5 Inteligencia artificial

La IA podrá:

- extraer artista, título y versión;
- clasificar géneros;
- resolver nombres ambiguos;
- detectar duplicados;
- inferir mood y energía;
- sugerir coincidencias;
- analizar playlists;
- recomendar transiciones.

La IA no se tratará como fuente infalible.

---

# 3. Flujo general

```text
Entrada
  ↓
Creación de ingestion_job
  ↓
Captura o lectura de fuente
  ↓
source_snapshot
  ↓
Parsing
  ↓
ingestion_items
  ↓
Normalización
  ↓
Búsqueda de candidatos
  ↓
Matching
  ↓
Decisión
  ├── vincular a entidad existente
  ├── crear nueva entidad
  ├── enviar a revisión
  └── descartar
  ↓
entity_facts
  ↓
Enriquecimiento
  ↓
Selección de valores canónicos
  ↓
Publicación en catálogo
```

---

# 4. Etapas del pipeline

## 4.1 Recepción

Cada solicitud crea un `ingestion_job`.

Debe registrar:

- usuario solicitante;
- tipo de entrada;
- fuente;
- URL o contenido;
- fecha;
- estado;
- parámetros;
- versión del proceso.

### Estados iniciales

```text
PENDING
QUEUED
RUNNING
PARTIALLY_COMPLETED
COMPLETED
FAILED
CANCELLED
```

---

## 4.2 Captura

La captura obtiene el contenido bruto.

Puede producir:

- JSON de API;
- HTML;
- texto;
- metadatos;
- lista de elementos;
- respuesta estructurada.

El resultado se almacena en `source_snapshots`.

### Reglas

1. Calcular `content_hash`.
2. Guardar `fetched_at`.
3. Guardar `parser_version`.
4. Evitar duplicados cuando el contenido no ha cambiado.
5. No almacenar contenido innecesario.
6. Respetar políticas de uso de la fuente.

---

## 4.3 Parsing

El parser transforma el contenido bruto en elementos procesables.

Ejemplo:

```text
00:00 Never Dull - Turning You On (Original Mix)
```

Resultado:

```json
{
  "timestamp_ms": 0,
  "raw_artist": "Never Dull",
  "raw_title": "Turning You On",
  "raw_version": "Original Mix"
}
```

Cada elemento se guarda en `ingestion_items`.

---

## 4.4 Normalización

Antes del matching se generan valores normalizados.

### Artistas

```text
Daft Punk
DAFT PUNK
Daft-Punk
```

Resultado:

```text
daft punk
```

### Tracks

```text
Turning You On (Original Mix)
Turning You On - Original Mix
Turning You On [Original Mix]
```

Resultado:

```text
title: turning you on
version: original mix
```

### Reglas iniciales

- convertir a minúsculas;
- eliminar espacios repetidos;
- normalizar Unicode;
- eliminar signos irrelevantes;
- separar versión;
- identificar featuring;
- identificar remixers;
- conservar el texto original;
- no eliminar información irreversible.

---

# 5. Matching

## 5.1 Objetivo

Determinar si un elemento importado corresponde a una entidad existente.

## 5.2 Señales para tracks

- título normalizado;
- artista principal;
- artistas invitados;
- versión;
- duración;
- ISRC;
- release;
- sello;
- IDs externos;
- timestamp;
- huella de audio;
- similitud semántica.

## 5.3 Señales para artistas

- nombre normalizado;
- aliases;
- IDs externos;
- discografía;
- país;
- colaboraciones;
- perfil de plataforma.

## 5.4 Puntuación

La puntuación final será de 0 a 1.

Ejemplo inicial:

```text
Título exacto              0.35
Artista exacto             0.30
Versión                    0.10
Duración                   0.10
ID externo                 0.10
Release / sello            0.05
```

Los pesos serán configurables.

## 5.5 Umbrales iniciales

```text
>= 0.92  Auto-match
0.75–0.91 Needs review
< 0.75   No match
```

Estos valores son provisionales y deberán ajustarse con datos reales.

---

# 6. Decisiones de matching

## 6.1 Coincidencia automática

Se permite cuando:

- existe ID externo exacto;
- existe ISRC exacto coherente;
- la puntuación supera el umbral;
- no hay conflicto grave.

## 6.2 Crear entidad nueva

Se permite cuando:

- no existe candidato fiable;
- la fuente tiene suficiente calidad;
- el elemento contiene datos mínimos;
- no parece ruido o contenido no musical.

## 6.3 Revisión humana

Se requiere cuando:

- hay varios candidatos similares;
- artista ambiguo;
- versión dudosa;
- remix sin acreditar;
- diferencias fuertes de duración;
- conflicto entre fuentes;
- baja confianza de IA.

## 6.4 Descartar

Se descarta cuando:

- no es un track;
- es publicidad;
- es una intro no identificable;
- es un segmento hablado;
- el contenido está duplicado dentro del mismo job;
- el usuario lo marca como irrelevante.

---

# 7. Idempotencia

El mismo input no debe crear duplicados al procesarse varias veces.

## 7.1 Claves de idempotencia

Posibles componentes:

- source code;
- external ID;
- URL normalizada;
- content hash;
- parser version;
- posición del elemento;
- timestamp;
- título y artista normalizados.

## 7.2 Reglas

1. Un `source_snapshot` con mismo hash puede reutilizarse.
2. Un `external_entity` con mismo proveedor e ID no se duplica.
3. Un `ingestion_item` puede reintentarse sin crear otro track.
4. Un enrichment job debe identificar versión de proceso.
5. Un proceso reintentado debe ser seguro.

---

# 8. Procedencia

Todo dato derivado debe poder rastrearse.

## 8.1 Hecho

Ejemplo:

```json
{
  "entity_type": "TRACK",
  "entity_id": "uuid",
  "field_name": "bpm",
  "value_json": 124,
  "source": "BEATPORT",
  "confidence": 0.95,
  "extraction_method": "API_RESPONSE"
}
```

## 8.2 Evidencia

Cada `entity_fact` puede apuntar a:

- `data_source`;
- `source_snapshot`;
- enrichment job;
- usuario revisor.

## 8.3 Estado

Un hecho puede ser:

- observado;
- verificado;
- seleccionado;
- rechazado;
- sustituido.

En la v1 estos estados se representarán mediante:

- `is_verified`;
- `is_selected`;
- registros históricos.

---

# 9. Selección de valores canónicos

## 9.1 Principio

Las tablas globales contienen el valor canónico actual.

`entity_facts` conserva todas las alternativas.

## 9.2 Regla de selección

La selección puede depender de:

- confianza;
- peso de fuente;
- recencia;
- consenso;
- verificación humana;
- análisis técnico;
- reglas por campo.

## 9.3 Ejemplo BPM

Prioridad inicial:

1. análisis de audio propio fiable;
2. fuente especializada;
3. consenso entre fuentes;
4. fuente generalista;
5. IA inferencial.

## 9.4 Ejemplo género

Prioridad inicial:

1. asignación editorial verificada;
2. consenso entre varias fuentes;
3. clasificación de audio;
4. IA;
5. asignación manual del usuario solo para su biblioteca.

## 9.5 No sobrescritura silenciosa

Cuando cambia un valor canónico:

- se crea un nuevo hecho;
- se desmarca el anterior;
- se actualiza la entidad canónica;
- se conserva el historial.

---

# 10. Enriquecimiento

## 10.1 Tipos

- metadata enrichment;
- track matching;
- genre classification;
- BPM analysis;
- key analysis;
- mood classification;
- energy classification;
- artist resolution;
- duplicate detection;
- source discovery;
- playlist analysis;
- transition recommendation.

## 10.2 Datos mínimos de un enrichment job

- entidad;
- tipo;
- proveedor;
- modelo;
- versión;
- input;
- output;
- confianza;
- coste;
- tokens;
- timestamps;
- error.

## 10.3 Reutilización

No se repite un job si existe uno válido con:

- misma entidad;
- mismo tipo;
- misma versión;
- mismo input hash;
- resultado no expirado.

---

# 11. Uso de IA

## 11.1 Casos adecuados

- parsing de texto irregular;
- separación artista/título;
- detección de versión;
- normalización semántica;
- clasificación de género;
- resolución de ambigüedad;
- resumen de biografías;
- análisis de playlists;
- generación de explicaciones.

## 11.2 Casos no adecuados como única fuente

- ISRC;
- duración exacta;
- fecha oficial;
- sello;
- BPM técnico;
- key;
- IDs externos;
- disponibilidad comercial.

## 11.3 Estrategia de costes

1. reglas deterministas primero;
2. fuentes estructuradas después;
3. IA pequeña para clasificación;
4. IA avanzada solo en casos ambiguos;
5. cachear resultados;
6. procesar por lotes;
7. limitar reintentos;
8. medir coste por job.

---

# 12. Versionado

Cada proceso debe tener versión.

Ejemplos:

```text
tracklist-parser@1.0.0
track-normalizer@1.2.0
track-matcher@1.0.0
genre-classifier@0.3.0
```

Si cambia la lógica:

- se incrementa la versión;
- se pueden reprocesar datos;
- se compara rendimiento;
- no se pierde trazabilidad.

---

# 13. Reprocesamiento

## 13.1 Casos

- parser mejorado;
- nuevo modelo de IA;
- nueva fuente;
- error corregido;
- regla de matching ajustada;
- actualización de taxonomía.

## 13.2 Regla

El reprocesamiento no elimina el resultado anterior automáticamente.

Debe:

- crear nueva ejecución;
- conservar la anterior;
- marcar cuál es vigente;
- registrar diferencias.

---

# 14. Gestión de errores

## 14.1 Errores recuperables

- timeout;
- rate limit;
- error temporal de API;
- DNS;
- respuesta parcial;
- modelo no disponible.

Acción:

- reintento con backoff;
- máximo de intentos;
- reanudación.

## 14.2 Errores no recuperables

- URL inválida;
- contenido eliminado;
- permisos insuficientes;
- formato no soportado;
- payload corrupto.

Acción:

- marcar `FAILED`;
- guardar mensaje;
- no reintentar automáticamente.

## 14.3 Fallo parcial

Un job puede quedar `PARTIALLY_COMPLETED` si algunos elementos fallan.

---

# 15. Rate limits y colas

## 15.1 Necesidades

- evitar bloqueo de proveedores;
- limitar concurrencia;
- priorizar jobs;
- distribuir carga;
- controlar costes.

## 15.2 Estrategia inicial

La v1 puede usar:

- tabla de jobs;
- worker interno;
- cron;
- reintentos controlados.

Más adelante:

- Redis;
- BullMQ;
- pg-boss;
- n8n;
- colas específicas.

No se introduce una cola externa hasta que exista necesidad real.

---

# 16. Seguridad

1. Las claves de APIs viven en variables de entorno.
2. Nunca se almacenan secretos en `data_sources.config`.
3. La `service_role` solo se usa en servidor.
4. Los snapshots no deben contener credenciales.
5. Se debe limpiar información sensible de logs.
6. La entrada del usuario debe validarse.
7. Las URLs deben protegerse contra SSRF.
8. Los archivos deben validarse por tipo y tamaño.
9. Los workers usarán permisos mínimos.
10. Las acciones administrativas quedarán auditadas.

---

# 17. Cumplimiento y contenido externo

## 17.1 Principio

La plataforma almacenará metadatos y evidencias mínimas necesarias.

## 17.2 Evitar

- copiar obras completas;
- almacenar HTML indefinidamente sin necesidad;
- descargar audio sin autorización;
- saltarse controles de acceso;
- incumplir términos de servicio;
- publicar datos no autorizados.

## 17.3 Retención

Cada fuente tendrá política configurable:

- snapshot completo;
- payload reducido;
- hash únicamente;
- caducidad;
- eliminación.

---

# 18. Primer flujo funcional recomendado

## Tracklist pegado

Entrada:

```text
00:00 Artist A - Track One
03:52 Artist B - Track Two
```

Pipeline:

1. crear `ingestion_job`;
2. guardar input;
3. parsear líneas;
4. crear `ingestion_items`;
5. normalizar;
6. buscar tracks;
7. auto-match o review;
8. crear tracks faltantes;
9. crear artistas faltantes;
10. registrar hechos;
11. generar playlist importada;
12. devolver resumen.

## Resultado

```text
12 items
8 matched
3 created
1 needs review
0 failed
```

Este será el primer caso real de extremo a extremo.

---

# 19. Métricas

Por job:

- duración;
- elementos;
- tasa de éxito;
- tasa de match;
- tasa de creación;
- revisiones;
- errores;
- coste IA;
- llamadas por fuente.

Por parser:

- precisión;
- recall;
- fallos;
- tiempo medio.

Por fuente:

- disponibilidad;
- confianza;
- conflictos;
- latencia;
- coste.

---

# 20. Decisiones cerradas

1. Toda ingesta crea un job.
2. El contenido bruto se conserva cuando aporte valor.
3. Los elementos se procesan de forma independiente.
4. El matching usa reglas y puntuación.
5. La IA es una fuente con confianza.
6. Los procesos son idempotentes.
7. Los resultados se versionan.
8. Los valores canónicos no se sobrescriben silenciosamente.
9. El primer flujo será tracklist de texto.
10. La v1 no requiere cola externa.
11. Los costes de IA se registran.
12. La procedencia es obligatoria.

---

# 21. Cuestiones pendientes

1. ¿Qué proveedor se usará para el primer matching externo?
2. ¿Qué fuentes tendrán mayor peso inicial?
3. ¿Cuál será la política de snapshots por proveedor?
4. ¿Qué modelo de IA se usará para parsing ambiguo?
5. ¿Qué umbrales de matching se validarán con datos reales?
6. ¿Cuándo se crea automáticamente una entidad?
7. ¿Qué tipos de revisión estarán disponibles en la interfaz?
8. ¿Qué worker ejecutará los jobs en la primera versión?
9. ¿Cómo se representarán aliases de artistas?
10. ¿Qué fuentes se podrán usar sin autenticación?

---

# 22. Próximo paso

Crear `RLS.md` para definir:

- tablas privadas;
- tablas públicas;
- permisos por usuario;
- permisos de backend;
- políticas de lectura;
- políticas de escritura;
- uso seguro de service role;
- protección de jobs y snapshots.
