---
title: DJ-STUDIO-004 — Real Library + Musical Validation
status: P1.1.1 COMPLETE — P2 NOT STARTED
updated: 2026-09-17
related:
  - DJ-STUDIO-003-CLOSURE.md
  - DJ-STUDIO-003.md
  - DJ-STUDIO-002-CLOSURE.md
  - ../../adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md
---

# DJ-STUDIO-004 — Real Library + Musical Validation

**Status:** P1.1.1 COMPLETE — P2 NOT STARTED  
**Date:** 2026-09-17  
**Depends on:** DJ-STUDIO-003 CLOSED — STAGING LIVE AI VALIDATED  
**Branch:** `feature/dj-studio-004`  
**Base SHA (P0):** `a72158cda8b3cb05b1a530fd4b7f2e6c4c7d50c4`  
**Staging runtime (unchanged by P0/P1/P1.1):** `a9889fe83642fd5987de83c3dfb5bb361b621147`  
**Production:** NOT AUTHORIZED  
**Main merge:** NOT AUTHORIZED

This document is the **source of truth** for importing a controlled real DJ
library into staging and validating Session Builder musical usefulness against
real metadata — without audio upload, schema expansion by default, or production
changes.

P0 = audit + design + SPEC + phase plan.  
P1 = manifest importer infrastructure (code + tests). **No real library import.**  
P1.1 = Engine DJ + Mixed In Key **pilot adapter** → canonical manifest.  
**P2 owns first controlled staging import.**

---

## 1. Goal

1. Replace reliance on synthetic `[P7-SMOKE]` Library for musical validation.
2. Import **metadata-only** real tracks into a **staging Organization** Library.
3. Run a human musical review matrix on Session Builder with provider=`openai`.
4. Keep Domain / provider contracts stable unless a minimal gap is proven.

Business outcome: evidence that Session Builder proposals are musically useful
with real BPM / Camelot / duration / energy / tags — still metadata-only.

---

## 2. Non-goals (V1)

- Audio file storage, streaming, waveforms, phrase detection
- Sending local paths / private URLs / credentials to OpenAI
- Production import or production OpenAI/env changes
- Schema migrations **unless P1 proves impossibility without them**
- Prompt / model / Domain tuning during the same validation pass
- Billing, generation history, streaming UX
- Making Catalog a tenant

---

## 3. Inherited constraints (003)

Proven path (do not redesign):

```
Product → config → factory → OpenAI Structured Outputs
  → Domain parse → ephemeral draft → optional Save
```

003 limitation (explicit): 13 synthetic tracks do **not** prove real musical quality.

Staging currently: `SESSION_BUILDER_PROVIDER=openai`. Leave as-is for 004 validation
phases; P0 does not change Coolify env.

---

## 4. Repository audit — existing capabilities

### 4.1 Present (usable)

| Capability | Evidence |
|---|---|
| Catalog Track search | `src/domains/dj-studio/catalog/services/search-catalog-tracks.ts` |
| Add existing Track → LibraryItem | `addTrackToLibrary` in `src/domains/dj-studio/library/services/library-item-services.ts` |
| Product add-from-catalog | `src/app/(private)/library/actions.ts` → `addTrackToLibraryAction` |
| Org-scoped Tags | `Tag` / `LibraryItemTag` + `tag-services.ts` |
| Session candidate load | `listSessionLibraryCandidateSources` |
| LibraryItem ↔ Track uniqueness | `@@unique([organizationId, trackId])` |
| ISRC on Track | `Track.isrc` (nullable) |
| Track.metadata JSON | available for non-provider batch markers |

### 4.2 Absent (must be built in later phases)

| Capability | Evidence |
|---|---|
| CSV / XML / Engine / MIK importer | **No** `src/**` importer/parser modules |
| Bulk catalog Track create Domain service | Tests create Tracks via Prisma directly; no Product bulk import |
| Bulk LibraryItem create from file | Only single `addTrackToLibrary(trackId)` |
| Artist upsert Domain API | No dedicated upsert service for import |
| Dedup service (title+artist / external id) | Schema indexes only (`normalizedTitle`, `isrc`) — no import orchestration |
| Genre assignment on import | `TrackGenre` model exists; no import path |

### 4.3 Schema-only / unused by DJ Studio Domain runtime

Prisma models exist but **no Domain/app services** under `src/domains` or `src/app`
implement them for library import:

- `DataSource`, `ExternalEntity`, `SourceSnapshot`, `EntityFact`
- `IngestionJob`, `IngestionItem`

**P0 decision:** treat as optional future adapters. V1 may use simpler batch markers
(`Track.metadata.importBatchId` + org Tags) without activating full ingestion graph.
Reusing `ExternalEntity` remains allowed if P1 chooses it without schema change.

---

## 5. Current music data model

| Entity | Relevant fields | Scope |
|---|---|---|
| `Track` | `title`, `normalizedTitle`, `version`, `durationMs`, `bpm`, `musicalKey`, `camelotKey`, `isrc`, `releaseDate`, `metadata`, artists via `TrackArtist` | Global catalog |
| `Artist` | `name`, `normalizedName`, `slug` | Global catalog |
| `TrackArtist` | `role`, `position`, `creditedName` | Global catalog |
| `Genre` / `TrackGenre` | genre graph + assignment | Global catalog |
| `LibraryItem` | `status`, `rating`, `energy`, `familiarity`, `customBpm`, `customKey`, `isFavorite`, `notes`, `organizationId`, `trackId` | Organization |
| `Tag` / `LibraryItemTag` | org-scoped tags | Organization |
| `Playlist` / `PlaylistItem` | Save target for AI proposals | Organization |

**Tenant boundary:** Catalog is shared; LibraryItem is Organization-scoped.  
Real DJ library validation **must not** invent a second tenant type.

---

## 6. Candidate payload today (provider)

Exact fields sent to OpenAI (`PlaylistGenerationCandidate`):

```
libraryItemId
title
artists[]
effectiveBpm
effectiveCamelotKey
durationMs
energy
rating
familiarity
isFavorite
tags[]
candidateScore
```

Plus request: `prompt`, `targetDurationMin`, `bpm?`, `energyCurve`, `trackCountHint?`.

Authority rules (frozen):

- Selection authority = `libraryItemId` only
- Effective BPM/Camelot/duration warnings = Domain SoT
- `Track.musicalKey` is **not** auto-converted to Camelot (`effectiveCamelotKey` parses Camelot only)

### Provider contract gap

**NONE for V1 musical validation.**

Current payload already carries the fields Candidate Engine and Domain use for
BPM / Camelot / duration / energy / tags. Genre/year can ride as **Library tags**
or remain catalog-only without changing the provider DTO.

If later evidence shows genre must be first-class in the provider payload, open a
follow-up delta — do **not** change Domain during the validation pass.

---

## 7. Source compatibility audit

### 7.1 Engine DJ (priority)

| Topic | Finding |
|---|---|
| Export | Playlists export as **CSV, M3U, or JSON** (Engine DJ user guide) |
| Typical CSV columns | `#`, `Title`, `Artist`, `Album`, `Length`, `BPM`, `Genre`, `Label`, `Composer`, `Remixer`, `Year`, `File name` |
| Key / Camelot | Not reliably present in CSV; Key exists in Engine UI/DB but CSV quality is inconsistent |
| Known issues | Community reports of empty CSV rows and BPM exported as `0` / blank; Key may be missing |
| Rekordbox | Engine **imports** Rekordbox XML; XML is not Engine’s native export |
| Paths | `File name` / path fields must be **discarded** from provider payload |

**Implication:** Engine DJ CSV alone is **insufficient** as sole Camelot/BPM SoT.

### 7.2 Mixed In Key (priority)

| Topic | Finding |
|---|---|
| Strength | Analysis writes **Camelot key**, **BPM/tempo**, **Energy Level (1–10)** into file tags |
| Tag options | Key / Tempo / Energy Level into Initial Key, Tempo, comments, grouping, etc. |
| Export | Playlist CSV commonly used for Artist/Title/Location (path); not a rich metadata SoT by itself |
| Camelot | Native Camelot notation (optional zero-pad `05A`) |

**Implication:** MIK is the preferred **analysis enrichment** source for Camelot/BPM/Energy.
Paths from MIK CSV must never reach OpenAI.

### 7.3 Generic CSV

Acceptable as the **canonical interchange** once normalized to DJ Studio columns.

### 7.4 Rekordbox XML/CSV

Future interoperability only. Not V1 primary. Engine already consumes Rekordbox XML
inbound; outbound Rekordbox is out of scope for 004 V1.

### Recommended canonical import format

**Format:** `dj-studio-library-manifest.v1.csv` (normalized UTF-8 CSV)

**Reason:**

1. Decouples Domain from Engine/MIK quirks and bugs.
2. Lets operators merge Engine membership + MIK analysis offline before apply.
3. Matches existing Track / LibraryItem fields without schema change.
4. Easy dry-run / preview / idempotent re-apply.

Suggested columns (manifest v1):

```
external_source, external_id, title, artist, duration_ms, bpm,
camelot_key, musical_key, energy, genre_tags, year, notes, batch_id
```

- `external_source`: e.g. `engine-dj` | `mixed-in-key` | `manual`
- `external_id`: stable id or normalized `artist|title|duration` hash — **not** filesystem path
- Paths/locations: **never** included

Adapters (P1/P2 scripts) may convert Engine CSV / MIK exports → manifest.

---

## 8. Staging Organization recommendation

### Options

| Option | Pros | Cons |
|---|---|---|
| **A. Separate org** `DJ Kaizen Real Library` | Isolates real data from `[P7-SMOKE]`; clean rollback; matches tenancy model | Requires OWNER membership switch for validation sessions |
| B. Same smoke org, tagged batch | Fewer orgs | Contaminates smoke Library; harder Session Builder candidate purity |
| C. Same org, different status | Uses existing status enum | Session Builder only reads `LIBRARY` — would mix with smoke if both LIBRARY |

### Recommendation: **Option A**

Create staging Organization **DJ Kaizen Real Library** (name exact TBD at P2 apply).

- Do **not** create in P0.
- Keep `Staging Smoke DJ` synthetic fixtures untouched.
- Validation Generate runs with that org as Active Organization.

---

## 9. Dataset target

| Dimension | Target |
|---|---|
| Track count | **50–100** real tracks (start smaller if export quality is weak; grow) |
| Styles | Prefer coverage across Afro House, House, Latin House, Disco/Nu Disco when available |
| Context tags | warm-up / sunset / peak-time / close — via org Tags when known |
| Metadata coverage | Prefer tracks with duration + BPM + Camelot; allow nulls with Domain warnings |

Do not invent genre distribution the user’s real library lacks.

---

## 10. Metadata classification

### Required (import reject or warn-hard if missing)

- `title`
- ≥1 `artist`
- stable `external_id` (or computable normalized key for idempotency)

### Recommended (strongly preferred for musical validation)

- `duration_ms`
- `bpm` → `Track.bpm`
- `camelot_key` → `Track.camelotKey` (Domain Camelot SoT for mixing rules)
- `energy` → `LibraryItem.energy` (nullable SmallInt; see §12)

### Optional

- `musical_key` → `Track.musicalKey` (stored; **not** auto-Camelot)
- `genre_tags` → org `Tag`s and/or `TrackGenre` if cheap
- `year` / `releaseDate`
- `isrc` (excellent catalog dedupe when present)
- `notes` → `LibraryItem.notes` (do **not** send private notes to provider by default)
- `batch_id` → `Track.metadata.importBatchId` + Tag `import:<batch>`

### Explicitly excluded from provider

- filesystem paths, filenames as identity, purchase metadata
- org/profile/membership/email/permissions
- raw comments unless promoted to safe public tags

---

## 11. Key / Camelot normalization

| Source form | Target |
|---|---|
| Camelot `8A` / `8a` / `08A` | Normalize to Domain-parseable Camelot (`parseCamelotKey`) → `Track.camelotKey` |
| Traditional `F#m` / `A major` | Store in `Track.musicalKey` only; **do not** invent Camelot |
| Missing | `camelotKey = null` → Domain warnings |

**No dual SoT:** Camelot for Session Builder rules lives in `Track.camelotKey` /
`LibraryItem.customKey` (custom overrides). Musical key is informational.

---

## 12. BPM & Energy

### BPM

- Type: `Decimal(7,3)` on `Track.bpm`; override `LibraryItem.customBpm`
- Range: Domain update allows `0..9999.999`; importer should reject absurd values (e.g. ≤0 or >400) as null + warning
- Null if source missing or Engine exported `0`

### Energy

- Field: `LibraryItem.energy` (`SmallInt`, nullable) — **Organization DJ rating**, not Track catalog
- Candidate Engine uses presence of energy as a soft signal
- Mixed In Key Energy Level is typically **1–10**
- **Do not auto-map MIK→LibraryItem.energy until P1 documents exact equivalence**  
  Default P1 approach: store MIK energy in `Track.metadata.mikEnergy` **or** map 1–10 → LibraryItem.energy **only after** explicit operator confirmation in P1 checklist

---

## 13. Deduplication & idempotency

### Catalog Track

Preferred match order:

1. `ExternalEntity` (`sourceId` + `externalId`) **if** P1 wires DataSource  
2. else `ISRC` when present  
3. else `(normalizedTitle + primary artist normalizedName + durationMs±tolerance)`

Idempotent re-import updates mutable metadata (bpm/camelot/duration) under policy;
does not create duplicate Tracks.

### LibraryItem

- Unique `(organizationId, trackId)` already enforces one membership per Track per Org
- Re-import = upsert membership + refresh LibraryItem fields/tags

### Pipeline

```
parse → normalize → validate → PREVIEW (dry-run) → APPLY
```

Preview must report: create / update / skip / reject counts **before** writes.

---

## 14. Import UX (V1)

**Decision: CLI / controlled server script (Option A).**

| Choice | Rationale |
|---|---|
| CLI/script | Safest for staging; no Product UI surface; auditable; no accidental prod path |
| Admin UI | Deferred; not needed to close musical validation |
| Both | Unnecessary scope for 004 V1 |

Operator flow: generate manifest → `preview` → `apply` against staging Real Library org.

---

## 15. Privacy / OpenAI egress

Real metadata **will** leave the platform during Generate (same as 003).

Allowed egress (existing contract): prompt + candidate music metadata + opaque ids.

Must never egress: paths, credentials, org/profile identity, private notes by default,
DB secrets, raw import files.

Document in Product/ops notes when Real Library org is used.

---

## 16. Musical validation matrix (human)

Do **not** run in P0. Execute in P4/P5 with Real Library org.

| ID | Prompt intent |
|---|---|
| A | Sunset Afro House · 90 min · 118→123 BPM |
| B | House warm-up · 60 min |
| C | Peak-time House · 60–90 min |
| D | Latin House / crossover |
| E | Disco / Nu Disco elegante |
| F | Long session · 120 min |
| G | Vague request |
| H | Harmonic-focused (only if Camelot coverage sufficient) |

Reuse 003 A–C as regression baselines when fixture allows; expand with D–H on real data.

### Human review criteria (per session)

For each criterion: `PASS` | `PASS WITH LIMITATION` | `FAIL` + notes.

1. BPM progression  
2. Harmonic compatibility (Camelot plausibility)  
3. Energy progression (within metadata limits)  
4. Genre / stylistic coherence  
5. Pacing  
6. Opening suitability  
7. Peak placement  
8. Closing suitability  
9. Transition rationale usefulness  
10. Duplicate / repetition avoidance  
11. Prompt adherence  

**Human DJ is authority.** LLM explanations are evidence, not verdict.

### Metadata-only boundary

| Can validate without audio | Cannot validate without audio / listening |
|---|---|
| Harmonic plausibility from Camelot | Audible blend / phrase alignment |
| BPM delta / direction | Vocal clash, EQ interaction |
| Energy direction when ratings exist | True “peak pressure” feel |
| Duration shortfall warnings | Crowd response |
| Prompt adherence at narrative level | Professional mix quality |

004 V1 stays on the left column. Listening-based validation = future milestone.

---

## 17. Baseline comparison methodology (minimal)

For each matrix case, reviewer prepares **before** Generate:

- expected opening / peak / close characteristics (bullet notes)
- must-not-do constraints (e.g. “no hard peak in first 15 min” for warm-up)
- optional: 3–5 “anchor” track titles from the real library if known

After Generate: compare proposal to those notes.  
Full human reference playlists are optional, not required for every case.

---

## 18. Rollback strategy

Must be able to delete **only** Real Library validation data:

- Prefer Tag `import:<batch_id>` on LibraryItems + `Track.metadata.importBatchId`
- Delete order: PlaylistItems/Playlists created during validation → LibraryItemTags → LibraryItems → orphan Tracks created by batch (only if not referenced elsewhere) → Artists only if unused
- Never touch Staging Smoke DJ org or production
- Dry-run delete script before apply

---

## 19. Tuning rule

If validation finds musical problems:

1. Record evidence (case, criterion, FAIL notes).  
2. **Do not** edit prompt / model / Domain / adapter in the same phase.  
3. Open a follow-up phase (e.g. P5.x / 005) for controlled tuning.

---

## 20. Phase plan

| Phase | Objective | Status |
|---|---|---|
| **P0** | Audit + SPEC (this document) | **COMPLETE** |
| **P1** | Manifest schema + normalize/validate + preview/apply CLI; Track/Artist/LibraryItem upsert; idempotency | **COMPLETE** |
| **P1.1** | Engine DJ + Mixed In Key pilot adapter → canonical manifest | **COMPLETE** |
| **P1.1.1** | Audio-extension-aware filename stem (preserve dotted titles) | **COMPLETE** |
| **P2** | Staging Real Library org + controlled import (50–100 tracks) | NOT STARTED |
| **P3** | Data quality report (null rates BPM/Camelot/duration/energy; coverage) | NOT STARTED |
| **P4** | Session Builder matrix A–H on Real Library (provider openai) | NOT STARTED |
| **P5** | Human musical review + findings (no silent tuning) | NOT STARTED |
| **P6** | Closure **or** follow-up tuning decision | NOT STARTED |

Each phase requires explicit authorization. No auto-start.

---

## 20.1 P1 implementation record

**Module:** `src/domains/dj-studio/library-import/`  
**CLI:** `npm run dj-studio:library-import -- <preview|apply|rollback-preview|rollback-apply>`  
**CSV parser:** `csv-parse` (Node/server; quoted commas/newlines, UTF-8, CRLF/LF, BOM)  
**Manifest version:** `dj-studio-library-manifest.v1`  
**Duration tolerance:** `TRACK_DURATION_TOLERANCE_MS = 2000`  
**Energy contract (manifest only):** integer `1..10` → `LibraryItem.energy`  
**Camelot:** Domain `parseCamelotKey` after stripping leading zeros (`08A` → `8A`); no musicalKey→Camelot conversion  
**BPM:** `>0` and `<=400` → `Track.bpm`; else null + warning; never `LibraryItem.customBpm` for canonical metadata  
**Catalog match:** ISRC → title+primary artist (+duration when present); ambiguous → REJECT  
**Existing Track policy:** FILL-NULL-ONLY; never overwrite non-null; never change title/artists; no `createdBatchId` on reused Tracks  
**Import markers:** Tag `import:<batch>` on touched items; `import-created:<batch>` on created memberships; Track.metadata.djStudioImport only on created Tracks  
**Preview:** zero writes  
**Apply:** requires `--confirm-target staging`; refuses production; refuses if any REJECT; single Prisma transaction  
**Auth:** ACTIVE membership + `library.manage` (no isAdmin shortcut)  
**Receipt:** safe IDs + manifestHash + counts; not committed to Git (`tmp/`)  
**Rollback:** preview/apply; preserves pre-existing Tracks/Artists/LibraryItems; cross-org Track safety  
**Provider contract:** UNCHANGED  
**Schema:** NOT MODIFIED  

**Test evidence (local):** library-import suite 36 passed; DJ Studio library/session-builder/permissions/m6 regressions 137 passed in combined run.

---

## 20.2 P1.1 Engine DJ + Mixed In Key pilot adapter

**Module:** `src/domains/dj-studio/library-adapters/engine-mik/`  
**CLI:** `npm run dj-studio:library-adapter -- engine-mik --engine <csv> --mik <csv> --batch <id> --out <manifest.csv>`  
**Flow:** Source Adapter → `dj-studio-library-manifest.v1.csv` → existing P1 importer  
**external_source:** `engine-dj+mixed-in-key`  
**external_id:** `emk-` + SHA-256 prefix of normalized artist + title + duration_ms (no paths)

### Source authority (pilot)

| Field | Authority |
|---|---|
| title, artist, duration, year, genre | Engine DJ CSV |
| BPM, Camelot (`Key result`), Energy | Mixed In Key CSV |
| Engine BPM `0`/blank | **ignored** (untrusted) |

### Commercial dependency principle

**Mixed In Key is NOT required** by commercial DJ Studio architecture.  
Engine DJ / Rekordbox / Serato are also **not** mandatory products.  
MIK is an **optional personal-pilot enrichment** adapter only.  
Vendor parsing must not leak into Domain types or the P1 importer contract.  
Future commercial enrichment (library-native metadata or native analysis) is a
separate milestone — not designed here.

### Join / gate

1. Unique normalized title (Engine title ↔ MIK file-stem title proxy)  
2. Unique filename stem  
3. Duplicate titles: artist / duration / stem discriminators; else AMBIGUOUS  
Unmatched / ambiguous → **fail generation** (no apply-ready manifest).  
Pilot batch target: `latin-afrohouse-pilot-001` (18 tracks). P1.1 does **not** apply.

**P1.1.1:** `toFileStem` strips only recognized audio extensions
(`.mp3`, `.wav`, `.flac`, `.m4a`, `.aac`, `.aif`, `.aiff`, `.ogg`, `.opus`, `.wma`).
Dots inside titles (e.g. `ft.`, `Dr.`, `2.0`) and extensionless MIK values are preserved.

### Privacy

Paths used only for local join; canonical manifest and reports emit **no** absolute paths.

---

## 21. Production boundary

004 executes on **staging only**.

Inherited pre-production gates (still required before any production AI/library rollout):

1. Cross-tenant Product smoke  
2. VIEWER Product smoke  
3. Production topology decision  
4. Explicit production AI env/key authorization  
5. Production deployment authorization  

---

## 22. Acceptance criteria (milestone-level)

1. Real metadata library imported idempotently into staging Real Library org.  
2. Session Builder matrix A–H executed with human reviews.  
3. No audio upload / path egress to provider.  
4. Provider contract unchanged unless approved delta.  
5. Smoke org untouched.  
6. Production untouched.  
7. Findings recorded; tuning deferred if needed.  
8. Closure docs when P6 authorized.

---

## 23. Next step after P1.1

Authorize **DJ-STUDIO-004 P2** (staging Real Library Organization + controlled
real import of the generated pilot manifest) explicitly.

Do **not** auto-start P2.
