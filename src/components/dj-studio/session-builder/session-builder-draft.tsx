'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { saveSessionBuilderPlaylistAction } from '@/app/(private)/session-builder/actions'
import {
  formatBpmClassification,
  formatBpmRange,
  formatDurationMode,
  formatDurationMs,
} from '@/app/(private)/session-builder/presentation'
import {
  buildSessionBuilderSavePayload,
  shouldShowSessionBuilderSaveCta,
} from '@/app/(private)/session-builder/save-payload'
import { SessionBuilderTrackList } from '@/components/dj-studio/session-builder/session-builder-track-list'
import { SessionBuilderWarnings } from '@/components/dj-studio/session-builder/session-builder-warnings'
import type { SessionBuilderDraft } from '@/domains/dj-studio/session-builder/generation'

type SessionBuilderDraftViewProps = {
  draft: SessionBuilderDraft
  generatedPromptSnapshot: string
  canSave: boolean
  onClear: () => void
}

export function SessionBuilderDraftView({
  draft,
  generatedPromptSnapshot,
  canSave,
  onClear,
}: SessionBuilderDraftViewProps) {
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, startSaveTransition] = useTransition()

  const showSave = shouldShowSessionBuilderSaveCta({
    hasDraft: true,
    savedPlaylistId,
  })

  function handleSave() {
    if (!canSave || isSaving || savedPlaylistId) {
      return
    }

    setSaveError(null)
    const payload = buildSessionBuilderSavePayload({
      name: draft.title,
      prompt: generatedPromptSnapshot,
      tracks: draft.tracks.map((track) => ({
        libraryItemId: track.libraryItemId,
        transitionNote: track.transitionNote,
      })),
    })

    startSaveTransition(async () => {
      const result = await saveSessionBuilderPlaylistAction(payload)
      if (result.ok) {
        setSavedPlaylistId(result.playlistId)
        setSaveError(null)
      } else {
        setSaveError(result.error)
      }
    })
  }

  return (
    <section className="space-y-6" aria-label="Propuesta de sesión">
      <div className="rounded-xl border border-white/10 bg-neutral-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-400">Propuesta</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {draft.title}
            </h2>
            <p className="mt-3 max-w-3xl text-neutral-300">{draft.summary}</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/5"
          >
            Limpiar propuesta
          </button>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-3">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">
              Duración objetivo
            </dt>
            <dd className="mt-1 text-neutral-100">
              {draft.targetDurationMin} minutos
            </dd>
          </div>
          <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-3">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">
              Duración estimada
            </dt>
            <dd className="mt-1 text-neutral-100">
              {formatDurationMs(draft.estimatedDurationMs)}{' '}
              <span className="text-neutral-400">
                ({formatDurationMode(draft.estimatedDurationMode)})
              </span>
            </dd>
          </div>
          <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-3">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">
              BPM
            </dt>
            <dd className="mt-1 text-neutral-100">
              {formatBpmRange(
                draft.bpmProgression.start,
                draft.bpmProgression.end,
              )}
            </dd>
          </div>
          <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-3">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">
              Progresión BPM
            </dt>
            <dd className="mt-1 text-neutral-100">
              {formatBpmClassification(draft.bpmProgression.classification)}
            </dd>
          </div>
          <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-3">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">
              Temas
            </dt>
            <dd className="mt-1 text-neutral-100">{draft.tracks.length}</dd>
          </div>
          <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-3 sm:col-span-2 lg:col-span-1">
            <dt className="text-xs uppercase tracking-wide text-neutral-500">
              Energía (narrativa)
            </dt>
            <dd className="mt-1 text-sm text-neutral-200">
              {draft.energyProgression}
            </dd>
          </div>
        </dl>

        {showSave && canSave ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Guardando…' : 'Guardar como Playlist'}
            </button>
          </div>
        ) : null}

        {!canSave && showSave ? (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            No tienes permisos para guardar playlists en esta organización.
          </p>
        ) : null}

        {saveError ? (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {saveError}
          </p>
        ) : null}

        {savedPlaylistId ? (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <p>Playlist guardada correctamente.</p>
            <Link
              href={`/playlists/${savedPlaylistId}`}
              className="mt-2 inline-block font-medium text-emerald-200 underline underline-offset-2 hover:text-white"
            >
              Ver playlist
            </Link>
          </div>
        ) : null}
      </div>

      <SessionBuilderWarnings warnings={draft.warnings} />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">
          Secuencia propuesta
        </h3>
        <SessionBuilderTrackList tracks={draft.tracks} />
      </div>
    </section>
  )
}
