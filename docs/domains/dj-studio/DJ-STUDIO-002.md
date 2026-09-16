---
title: DJ-STUDIO-002 — AI Playlist / Session Builder
status: STAGING MVP READY / MILESTONE CLOSED
updated: 2026-09-16
related:
  - DJ-STUDIO-001-CLOSURE.md
  - DJ-STUDIO-001.md
  - DJ-STUDIO-002-CLOSURE.md
  - ../../adr/ADR-011-dj-studio-domain-boundary-and-tenancy.md
---

# DJ-STUDIO-002 — AI Playlist / Session Builder

**Status:** STAGING MVP READY / MILESTONE CLOSED  
**Date:** 2026-09-16  
**Depends on:** DJ-STUDIO-001 CLOSED — STAGING MVP READY  
**Phases:** P0–P7 COMPLETE  
**Production:** NOT MODIFIED / NOT AUTHORIZED  
**Main merge:** NOT MERGED / NOT AUTHORIZED

This document is the **source of truth** for DJ-STUDIO-002. Product decisions
below remain **frozen**. Formal closure evidence:
[DJ-STUDIO-002-CLOSURE.md](./DJ-STUDIO-002-CLOSURE.md).

---

## 1. Goal

Allow a DJ to describe a session in natural language and receive a musically
coherent ordered playlist proposal from their Organization Library, then review,
regenerate or clear the ephemeral draft, and save it as a real Organization-scoped
Playlist.

Example prompt:

> Sunset Afro House, 90 minutos, empezar sobre 118 BPM, subir progresivamente
> hasta 123 BPM, comienzo elegante y atmosférico, zona central más rítmica y
> final potente pero sin volverse agresivo.

---

## 2. User story

As an authenticated DJ with Active Organization and `playlists.manage`,  
I want to generate a session proposal from a prompt and settings,  
so that I can review transitions and save an Organization Playlist without
the AI inventing tracks or bypassing RBAC.

---

## 3. Frozen product decisions

| Decision | Frozen value |
|----------|--------------|
| Candidate source | **Library only** (`status = LIBRARY`) |
| Catalog | Metadata via related Track only; **no** Tracks outside Library |
| Draft | **Ephemeral** — no draft table; refresh may lose draft |
| Session entity | **Out of scope** |
| Permissions | Generate/Save: `playlists.manage`; candidates: `library.read` |
| New permission keys | **None** |
| Route | `/session-builder` |
| Nav label (ES) | Crear sesión |
| Branding P0 | Visible UI → **DJ Kaizen Studio** |
| Save | `Playlist.playlistType = AI_GENERATED` + provenance in `metadata` |
| Schema migration | **Not required** for MVP |

---

## 4. Scope

### In scope

- Branding / Spanish nav cleanup (P0)
- Deterministic musical rules (BPM / Camelot / effective metadata)
- Candidate engine (Library only)
- Provider contract + mock (no OpenAI SDK in early phases)
- Generation orchestration (read-only until Save)
- `/session-builder` UI
- Save as Playlist
- Tests + staging smoke (when authorized)
- This specification

### Out of scope

- Session DB entity
- Persistent AI drafts / generation history
- Billing / credits / token accounting
- OpenAI (or any live LLM) integration in this **spec** task; live provider is a later authorized phase after mock
- Catalog fallback as candidate source
- Genre enrichment runtime
- Spotify / YouTube / Engine DJ / Serato / Mixed In Key
- Hotcues, Companion, devices, calendar, mobile
- Production rollout / main merge
- `includeLibraryItemIds` / `excludeLibraryItemIds` / `excludeArtistIds` (iteration 2)

---

## 5. Architecture

```
User
 → Product action (/session-builder)
 → resolveActiveOrganization
 → require playlists.manage (+ library.read for candidates)
 → deterministic candidate engine (Library only)
 → PlaylistGenerationProvider.generate(input, candidates)
 → Zod validate structured proposal
 → Domain reject invalid IDs / empty / malformed
 → present ephemeral draft in UI
 → user edits
 → Save: re-resolve org + re-check permission + re-validate IDs
 → create Playlist (AI_GENERATED) + PlaylistItems
```

**Rules:**

- AI proposes; Domain validates; Domain persists only on Save.
- AI has no DB access, no RBAC, no tenancy authority.
- Core must not depend on DJ Studio or DJ-specific AI.
- Provider adapters live under `src/lib/ai/`; Domain contracts under
  `src/domains/dj-studio/session-builder/`.

---

## 6. Data model

### Existing (reuse)

| Entity | Role in 002 |
|--------|-------------|
| LibraryItem | Candidate identity (`libraryItemId`) + DJ metadata |
| Track / TrackArtist / Artist | Musical metadata for candidates already in Library |
| Playlist | Persistence target; `playlistType`, `metadata` JSON |
| PlaylistItem | Ordered items; `notes`, `transitionNotes` |
| Tag / LibraryItemTag | Soft scoring signal |

### New entities

**NONE** for MVP.

### Effective metadata precedence

| Signal | Precedence |
|--------|------------|
| BPM | `LibraryItem.customBpm ?? Track.bpm` |
| Key / Camelot | Prefer `LibraryItem.customKey` when set; else Track `camelotKey`, with `musicalKey` as fallback utility input (documented in musical-rules module) |
| Energy | `LibraryItem.energy` if present; else `null` (never invent/persist) |
| Duration | `Track.durationMs` if present; else unknown for that track |

Generation must **not** write inferred values back to Track or LibraryItem.

---

## 7. Input contract

Conceptual Zod schema (formalize in code during P4):

```ts
SessionBuilderInput = {
  prompt: string                 // trim, min 1, max 4000
  targetDurationMin: number      // int, min 15, max 240 (MVP defaults UI: 60|90|120)
  bpm?: {
    start?: number               // 40–300
    end?: number
    min?: number
    max?: number
  }
  energyCurve: 'gradual_rise' | 'warm_peak' | 'peak_cooldown' | 'steady'
  source: 'library_only'         // literal only in MVP
  trackCountHint?: number        // int, min 4, max 80
}
```

Iteration 2 (not MVP): include/exclude library items / artists.

---

## 8. Output contract

```ts
SessionBuilderProposal = {
  title: string
  summary: string
  targetDurationMin: number
  estimatedDurationMs: number | null
  estimatedDurationMode: 'exact' | 'approximate' | 'unknown'
  bpmProgression: { start: number | null; end: number | null; notes: string | null }
  energyProgression: string
  tracks: SessionBuilderProposalTrack[]
  warnings: SessionBuilderWarning[]
}

SessionBuilderProposalTrack = {
  libraryItemId: uuid
  position: number                 // 0-based contiguous
  bpmEffective: number | null
  camelotEffective: string | null
  energy: number | null
  estimatedStartMs: number | null
  transitionNote: string | null
  reason: string
}

SessionBuilderWarning = {
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
}
```

Selectable authority is **`libraryItemId` only** (not bare Track IDs).

---

## 9. Anti-hallucination contract

1. Provider receives only `candidates: { libraryItemId, ...displayFields }[]`.
2. Every output `libraryItemId` **must** be in that set.
3. Any ID outside the set → **reject entire proposal** with structured validation
   error (`INVALID_CANDIDATE_ID`). No silent repair/substitution.
4. Empty `tracks` → reject (`EMPTY_PROPOSAL`).
5. Duplicate positions or non-contiguous positions → reject.

---

## 10. Candidate engine contract

### Hard filters

- `organizationId = active Organization`
- `status = LIBRARY`
- Related Track exists
- Optional BPM window when `bpm.min` / `bpm.max` provided (using effective BPM).
  **P2 freeze:** items with `effectiveBpm = null` are **rejected** when a min/max
  window is present (cannot prove constraint satisfaction).
- `bpm.start` / `bpm.end` are **not** hard filters (scoring only).

### Soft scores (deterministic, weights P2)

Components are ratios in `[0, 1]` then multiplied by absolute weights summing to
**100**:

| Component | Weight | Behaviour (P2) |
|-----------|--------|----------------|
| `bpm` | 35 | Envelope from `start`/`end`: `max(0, 1 - distance/6)`; null BPM → 0.25; no start/end → 0.5; min/max-only after hard filter → 1.0 |
| `rating` | 15 | Relative min/max in eligible set; equal known → 0.5; null → 0 |
| `familiarity` | 10 | Same relative model as rating |
| `favorite` | 10 | `isFavorite` true → 1 else 0 |
| `tags` | 15 | Deterministic phrase match prompt↔tag (normalized); ≥1 match → 1 else 0 |
| `energy` | 10 | Metadata presence only (`!= null` → 1); no HIGH/LOW preference |
| `camelot` | 5 | Effective Camelot parseable → 1 else 0 (no inter-track adjacency yet) |

**Stable sort:** `score` DESC → `libraryItemId` ASC.

**Artist diversity pass:** after sort, first pass caps **4** candidates per Artist
ID; second pass backfills omitted candidates in score order until
`min(60, eligibleCount)` so diversity never drops below available inventory.

### Shortlist size

**Target: 60** (clamp available count).  
If eligible LIBRARY items after hard filters **&lt; 8** → fail with
`DJ_STUDIO_INSUFFICIENT_SESSION_CANDIDATES` (do not call provider).

---

## 11. Musical rules (MVP)

### Camelot compatibility

Compatible pairs:

- Same Camelot key
- ±1 number, same letter (e.g. `8A` ↔ `7A` / `9A`)
- Same number, A ↔ B (e.g. `8A` ↔ `8B`)

Unknown / unparsable key: **no hard fail**; neutral score + warning
`UNKNOWN_KEY` when sequencing across unknown.

### BPM

- Build linear target curve from `bpm.start` → `bpm.end` across positions when both set.
- Local tolerance: **±3 BPM** vs target at position.
- Exceeding tolerance → soft penalty + warning `BPM_JUMP` / `BPM_OFF_CURVE` — **not** automatic hard fail.
- Prefer monotonic progression; zig-zag triggers warning `BPM_ZIGZAG`.

### Energy

- Product scale is **not** normalized in schema; do not invent a persisted 1–5 scale.
- Scoring may use temporary relative normalization within the candidate set only.
- Null remains null; never persist AI-inferred energy.

### Duration

- If enough tracks have `durationMs`: `estimatedDurationMode = exact` (sum).
- Partial coverage: `approximate` (known sum + estimate for missing using median of known or `targetDurationMin / trackCount`).
- Insufficient: `unknown`.
- Never fake precision in UI.

---

## 12. Deterministic vs AI boundary

| Deterministic Domain | AI Provider |
|----------------------|-------------|
| Org / status filter | Interpret prompt |
| Effective BPM / key | Choose subset from shortlist |
| Scoring / shortlist | Order tracks |
| BPM curve / Camelot adjacency checks | Title, summary |
| Duplicates / artist repetition caps | `transitionNote`, `reason` |
| Duration estimation | Narrative energy wording |
| Zod + ID validation / warnings | — |
| Permissions / tenancy / Save | — |

AI: **NO** DB, RBAC, tenancy, arbitrary IDs, persistence.

---

## 13. Provider boundary

### Domain contract location

`src/domains/dj-studio/session-builder/provider/`

### Infra adapters

`src/lib/ai/` (`MockPlaylistGenerationProvider`)

**Dependency rule:** Domain → `src/lib/ai` imports = **0**.
`lib/ai` may import Domain contracts/types.

### Interface

```ts
interface PlaylistGenerationProvider {
  generate(request: PlaylistGenerationRequest): Promise<unknown>
}
```

`PlaylistGenerationRequest` (no org/profile/permissions/Prisma/secrets):

- `prompt`, `targetDurationMin`, `bpm?`, `energyCurve`, `trackCountHint?`
- `candidates[]` with `libraryItemId` as selection authority plus display fields
  (`title`, `artists`, effective BPM/Camelot, `durationMs`, `energy`, `rating`,
  `familiarity`, `isFavorite`, `tags`, `candidateScore`)

Provider output is **UNTRUSTED**. Domain must call
`parsePlaylistGenerationProviderOutput(raw, allowedCandidateIds)` before P4 use.

Validated proposal fields:

- `title`, `summary`, `tracks[]`, `energyProgression`, `bpmProgression`, `warnings[]`
- track: `libraryItemId`, `position` (contiguous 0..N-1), `transitionNote`, `reason`
- AI MVP: each `libraryItemId` at most once (duplicates → reject entire proposal)
- unknown IDs → reject entire proposal (no silent drop / substitute / DB lookup)

### MVP implementations

- `MockPlaylistGenerationProvider` — deterministic / fixture-based for CI
  Modes: `success` | `timeout` | `unavailable` | `malformed` | `hallucinated_id` |
  `duplicate_id` | `empty`
- Live OpenAI (or other) — **later authorized phase**, not this spec task

### Failure contract (no DB writes)

| Error | Code |
|-------|------|
| Timeout | `PROVIDER_TIMEOUT` |
| Unavailable | `PROVIDER_UNAVAILABLE` |
| Structural / Zod failure | `INVALID_PROVIDER_RESPONSE` |
| Semantic proposal failure (IDs, duplicates, positions) | `INVALID_PROVIDER_PROPOSAL` |
| Empty tracks | `EMPTY_PROVIDER_PROPOSAL` |

Generate path is **read-only** until Save.

---

## 13.1 Generation orchestration (P4)

### Service

`generateSessionProposal({ context, input, provider })` in Domain
`session-builder/services/`. Provider is **injected** (`PlaylistGenerationProvider`);
Domain never imports `src/lib/ai/**`.

### Mandatory order

1. Parse/validate `SessionGenerationInput` (includes `source: 'library_only'`).
2. `require playlists.manage` (**before** shortlist / provider).
3. Build P2 shortlist (`library.read` inside Candidate Engine).
4. Map candidates → Provider DTO; call `provider.generate`.
5. `parsePlaylistGenerationProviderOutput(raw, allowedIds)`.
6. Pure `buildSessionBuilderDraft` — Domain metadata authority + P1 analysis.
7. Return ephemeral `SessionBuilderDraft` (no persistence).

### Authorization

Generate needs **both** `playlists.manage` and `library.read`.
VIEWER (read-only library, no playlist manage) is denied **before** provider call.

### Domain authority

Provider owns narrative fields only (`title`, `summary`, order, `transitionNote`,
`reason`, textual `energyProgression`, `bpmProgression.notes`, validated warnings).
Effective BPM / Camelot / energy / duration / estimated starts / BPM classification
come from Candidate + P1 helpers — never from Provider factual BPM numbers.

### Deterministic warnings (examples)

`BPM_LARGE_JUMP`, `CAMELOT_INCOMPATIBLE`, aggregated missing metadata,
`DURATION_METADATA_PARTIAL` / `DURATION_METADATA_UNKNOWN`.
Merge: Domain warnings first, then Provider; dedupe on exact `code + message`.

### Read-only guarantee

P4 performs **no** Playlist / PlaylistItem / Library writes and stores no draft rows.

---

## 14. Save contract

On “Guardar como Playlist”:

1. Re-resolve Active Organization (never trust client org id alone).
2. Re-require `playlists.manage`.
3. Re-validate every `libraryItemId` belongs to that Organization + `LIBRARY`.
4. Create `Playlist` with `playlistType = AI_GENERATED`, visibility default PRIVATE.
5. Create `PlaylistItem` rows in order; map `transitionNote` → `transitionNotes`;
   optional `reason` may map to `notes` or be omitted (prefer `transitionNotes` for
   transitions; keep `notes` free unless product maps reason explicitly — **MVP:
   transitionNote → transitionNotes; reason not persisted** unless added later).
6. Provenance in `Playlist.metadata`:

```json
{
  "generatedBy": "dj-studio-session-builder",
  "prompt": "<user prompt truncated if needed>",
  "generatedAt": "<ISO-8601>",
  "generationVersion": "dj-studio-002-v1"
}
```

No secrets, no invented model/cost fields until a real provider exists.

7. Failure mid-write → transactional rollback; no partial Playlist.

---

## 15. Permissions / tenancy / security

| Action | Permission |
|--------|------------|
| Load builder / generate / regenerate / save | `playlists.manage` |
| Load Library candidates | `library.read` |
| VIEWER | denied generate & save |

Tenancy: Active Organization only; no cross-org candidates.

Threat mitigations (spec-level):

- Truncate/sanitize metadata before prompt assembly
- Hard prompt length 4000
- Reject hallucinated IDs
- Rate-limit generation per org/profile (implementation detail in P4/P7)
- No provider secrets in client
- Malformed output → soft fail, no writes

---

## 16. UX contract

**Route:** `/session-builder`  
**Nav:** Crear sesión (after Playlists)

### P5 implemented

`empty` / configuring → `generating` → `proposal` (local state) | `error`

- Generar propuesta (Mock provider / modo de prueba)
- Regenerar (vuelve a generar; sustituye draft local)
- Limpiar propuesta (estado local only)
- Review: title, summary, duration/BPM summary, warnings, ordered tracks

### Deferred / Future (not in 002 MVP)

~~- Guardar como Playlist~~ → **P6 implemented** (atomic AI_GENERATED save)
- Edit / reorder / remove tracks on the ephemeral proposal
- OpenAI / live AI provider (next milestone: DJ-STUDIO-003 design/spec)
- Persistent idempotency key for Save

### Result display (P5)

Timeline: UI position (1-based), title, artists, BPM, Camelot, energy, duration,
estimated start, transition, reason.  
Summary: duration mode, BPM classification, warnings.  
P6: Save CTA when draft exists → success link to `/playlists/{id}`.

---

## 17. Branding P0 (visible UI only)

### Rename brand

| File | Current |
|------|---------|
| `src/app/(private)/layout.tsx` | `DJ Platform` |
| `src/app/(auth)/login/page.tsx` | `DJ Platform` |
| `src/app/(auth)/register/page.tsx` | `DJ Platform` |

→ **DJ Kaizen Studio**

Do **not** rename repo `dj-platform` or Platform Core internals.

### Spanish nav / labels (approved)

| Current | Target |
|---------|--------|
| Dashboard | Inicio |
| Library | Biblioteca |
| Playlists | Playlists |
| Studio Profile | Perfil DJ |
| Perfil | Cuenta |
| Organizaciones | Organizaciones |
| (new) Session Builder | Crear sesión |

Also clean obvious English crumbs in private pages where user-visible
(`Music Library`, `Studio Profile` headings, `Library items`, etc.) as part of P0
without renaming Domain module paths.

---

## 18. Test contract

### Unit

- Effective BPM / key precedence
- Camelot compatibility matrix
- BPM curve + tolerance warnings
- Hard filters + scoring determinism + shortlist 60 + tie-break
- Zod proposal validation
- Invalid ID rejection

### Domain

- Org isolation of candidates
- `library.read` / `playlists.manage` enforcement
- Save creates `AI_GENERATED` Playlist + items
- Rollback on mid-save failure
- Re-validation of IDs on save

### Provider

- Mock success
- Timeout / malformed / hallucinated ID / empty proposal

### Product

- Load builder, generate, edit, reorder, remove, regenerate, save
- Permission denied
- Provider failure surfaces without DB writes

### CI

**No real external AI calls.**

---

## 19. Implementation phases

### P0 — Branding + nav ES

- **Objective:** Visible Product brand and Spanish nav consistency  
- **Files:** auth login/register, private layout, private page headings as needed  
- **DB:** none  
- **Tests:** smoke / snapshot of labels if present  
- **Gate:** no “DJ Platform” in user-visible app routes; nav matches table  
- **Non-goals:** Domain renames, metadata title SEO overhaul

### P1 — Musical rules

- **Objective:** Pure functions BPM/Camelot/effective metadata  
- **Modules:** `src/domains/dj-studio/session-builder/` (rules only)  
- **DB:** none  
- **Tests:** unit matrix  
- **Gate:** rules match this spec  
- **Non-goals:** provider, UI

### P2 — Candidate engine

- **Objective:** Library-only shortlist scoring  
- **Modules:** candidate engine + library queries  
- **DB:** none (reuse grants)  
- **Tests:** org filter, weights, shortlist size  
- **Gate:** deterministic shortlist for fixture Library  
- **Non-goals:** catalog fallback

### P3 — Provider contract + mock

- **Objective:** Interface + Mock + Zod schemas  
- **Modules:** Domain types/validation; `src/lib/ai` mock  
- **DB:** none  
- **Tests:** provider suite  
- **Gate:** CI green without network AI  
- **Non-goals:** OpenAI SDK

### P4 — Generation orchestration

- **Objective:** End-to-end generate service (read-only)  
- **Modules:** `generateSessionProposal` + `generation/*` draft builder  
- **DB:** none  
- **Tests:** input / draft unit + Domain integration (Mock provider)  
- **Gate:** valid `SessionBuilderDraft` or structured errors only; no persistence  
- **Non-goals:** Save, UI, OpenAI SDK, staging deploy

### P5 — `/session-builder` UI

- **Objective:** Product surface for describe → generate → review ephemeral draft  
- **Modules:** `src/app/(private)/session-builder/**` +
  `src/components/dj-studio/session-builder/**`  
- **DB:** none  
- **Adapter:** Server Action injects `MockPlaylistGenerationProvider` (staging/dev
  test mode); Domain `generateSessionProposal` remains authority  
- **Fields:** prompt, targetDurationMin, optional BPM start/end/min/max,
  energyCurve, optional trackCountHint; source fixed `library_only`  
- **Nav:** Crear sesión  
- **Gate:** authenticated form + draft review + regenerate/clear local state  
- **Non-goals:** Save as Playlist, reorder/edit tracks, OpenAI, persistence,
  staging data seeding

### P6 — Save as Playlist

- **Objective:** Persist ephemeral proposal as Organization Playlist  
- **Modules:** `saveSessionBuilderDraftAsPlaylist` + Product Save CTA/action  
- **DB schema:** none (reuse Playlist / PlaylistItem)  
- **Save DTO (minimal, untrusted from browser):** `{ name, prompt, tracks[{ libraryItemId, transitionNote }] }`  
- **Gates:** re-resolve active org; re-require `playlists.manage`; revalidate
  every `libraryItemId` as org + `LIBRARY` in one query; reject duplicates;
  atomic Prisma transaction; server-owned `AI_GENERATED` + `PRIVATE` + provenance
  metadata; `transitionNote → transitionNotes`; `reason` not persisted  
- **Success:** Product returns `playlistId` → `/playlists/[id]`  
- **MVP note:** no persistent idempotency key (disable CTA while saving + success state)  
- **Non-goals:** draft persistence, OpenAI, Session entity, schema migration

### P7 — Staging smoke + docs alignment — COMPLETE

- **Objective:** Staging OWNER smoke; docs status update  
- **DB schema:** none (data writes for synthetic smoke only)  
- **Evidence:** OWNER Generate → Review → Save → `/playlists/[id]` + DB
  provenance validation on staging  
- **Gate:** staging PASS for 002 scope; docs aligned; CI GREEN  
- **Non-goals:** production, VIEWER/cross-tenant (remain 001 pre-prod gates)

---

## 20. Acceptance criteria (milestone)

Given an Organization Library with sufficient `LIBRARY` items and partial
BPM/Camelot metadata, when the user submits a sunset Afro House 90-minute
118→123 prompt:

1. Proposal is ordered and uses only allowed `libraryItemId`s.  
2. BPM progression is reasonable or emits warnings (no silent fiction).  
3. Camelot adjacency is coherent when keys exist; unknown keys warn.  
4. No hallucinated IDs.  
5. User can review, regenerate, clear, and save the ephemeral proposal.  
6. Save creates Organization Playlist with `AI_GENERATED` and items/transitions.  
7. VIEWER / missing `playlists.manage` cannot generate or save.  
8. Provider failures never write DB rows.  
9. Visible branding is DJ Kaizen Studio; nav uses approved Spanish labels.

Edit / reorder / remove of proposal tracks remains **Deferred / Future**
(not part of 002 MVP).

---

## 21. Pre-existing gates (unchanged from 001)

Still required before **production** (not blockers for 002 staging closure):

- Cross-tenant Product smoke  
- VIEWER Product smoke  
- Topology decision Kong/PG15 vs Envoy/PG17  

---

## 22. Next step after milestone closure

DJ-STUDIO-003 — REAL AI PROVIDER DESIGN AUDIT / SPEC  

Do **not** auto-start. Requires explicit authorization.  
Production deploy and main merge remain unauthorized.
