'use client'

import {
  formatDurationMs,
  formatNullableNumber,
  formatNullableText,
  uiTrackPosition,
} from '@/app/(private)/session-builder/presentation'
import type { SessionBuilderDraftTrack } from '@/domains/dj-studio/session-builder/generation'

type SessionBuilderTrackListProps = {
  tracks: SessionBuilderDraftTrack[]
}

export function SessionBuilderTrackList({
  tracks,
}: SessionBuilderTrackListProps) {
  return (
    <ol className="space-y-4">
      {tracks.map((track) => (
        <li
          key={track.libraryItemId}
          className="rounded-xl border border-white/10 bg-neutral-900 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-violet-400">
                Tema {uiTrackPosition(track.position)}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {track.title}
              </h3>
              <p className="mt-1 text-sm text-neutral-400">
                {track.artists.length > 0 ? track.artists.join(', ') : '—'}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-300 sm:grid-cols-4">
              <div>
                <dt className="text-neutral-500">Inicio</dt>
                <dd>{formatDurationMs(track.estimatedStartMs)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Duración</dt>
                <dd>{formatDurationMs(track.durationMs)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">BPM</dt>
                <dd>{formatNullableNumber(track.bpmEffective)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Camelot</dt>
                <dd>{formatNullableText(track.camelotEffective)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Energía</dt>
                <dd>{formatNullableNumber(track.energy)}</dd>
              </div>
            </dl>
          </div>

          {track.transitionNote ? (
            <p className="mt-4 rounded-lg border border-white/5 bg-neutral-950/60 px-3 py-2 text-sm text-neutral-300">
              <span className="font-medium text-neutral-200">Transición: </span>
              {track.transitionNote}
            </p>
          ) : null}

          <p className="mt-3 text-sm text-neutral-400">
            <span className="font-medium text-neutral-300">
              ¿Por qué este tema?{' '}
            </span>
            {track.reason}
          </p>
        </li>
      ))}
    </ol>
  )
}
