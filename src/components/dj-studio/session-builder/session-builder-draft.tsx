'use client'

import {
  formatBpmClassification,
  formatBpmRange,
  formatDurationMode,
  formatDurationMs,
} from '@/app/(private)/session-builder/presentation'
import { SessionBuilderTrackList } from '@/components/dj-studio/session-builder/session-builder-track-list'
import { SessionBuilderWarnings } from '@/components/dj-studio/session-builder/session-builder-warnings'
import type { SessionBuilderDraft } from '@/domains/dj-studio/session-builder/generation'

type SessionBuilderDraftViewProps = {
  draft: SessionBuilderDraft
  onClear: () => void
}

export function SessionBuilderDraftView({
  draft,
  onClear,
}: SessionBuilderDraftViewProps) {
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
