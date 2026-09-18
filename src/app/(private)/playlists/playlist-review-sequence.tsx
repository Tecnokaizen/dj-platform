import { Fragment } from 'react'

import {
  buildPlaylistReviewModel,
  formatSignedDelta,
  type PlaylistReviewModel,
  type PlaylistReviewTrackInput,
} from '@/app/(private)/playlists/playlist-review-presentation'

type PlaylistReviewSequenceProps = {
  items: PlaylistReviewTrackInput[]
  showTransitionNotes: boolean
}

function SessionSummary({ summary }: { summary: PlaylistReviewModel['summary'] }) {
  return (
    <dl className="mt-6 grid gap-3 rounded-lg border border-white/10 bg-neutral-950/60 px-4 py-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="text-neutral-500">Tracks</dt>
        <dd className="font-medium text-neutral-100">{summary.trackCount}</dd>
      </div>
      <div>
        <dt className="text-neutral-500">Nominal duration (full-file)</dt>
        <dd className="font-medium text-neutral-100">
          {summary.nominalDurationLabel}
        </dd>
      </div>
      <div>
        <dt className="text-neutral-500">Source BPM</dt>
        <dd className="font-medium text-neutral-100">
          {summary.sourceBpmFirstLastLabel}
        </dd>
      </div>
      <div>
        <dt className="text-neutral-500">BPM range</dt>
        <dd className="font-medium text-neutral-100">{summary.bpmRangeLabel}</dd>
      </div>
      <div>
        <dt className="text-neutral-500">Energy range</dt>
        <dd className="font-medium text-neutral-100">
          {summary.energyRangeLabel}
        </dd>
      </div>
      <div className="sm:col-span-2 lg:col-span-1">
        <dt className="text-neutral-500">Camelot transitions</dt>
        <dd className="font-medium text-neutral-100">
          {summary.camelotTotalsLabel}
        </dd>
      </div>
    </dl>
  )
}

export function PlaylistReviewSequence({
  items,
  showTransitionNotes,
}: PlaylistReviewSequenceProps) {
  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 bg-neutral-900 p-8 text-neutral-400">
        Esta playlist está vacía.
      </div>
    )
  }

  const model = buildPlaylistReviewModel(items)

  return (
    <div className="mt-6">
      <SessionSummary summary={model.summary} />

      <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-neutral-950 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Track</th>
              <th className="px-3 py-2 font-medium">Artist</th>
              <th className="px-3 py-2 font-medium">BPM</th>
              <th className="px-3 py-2 font-medium">Camelot</th>
              <th className="px-3 py-2 font-medium">Energy</th>
              <th className="px-3 py-2 font-medium">Duration</th>
              {showTransitionNotes ? (
                <th className="px-3 py-2 font-medium">Transition note</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <Fragment key={row.positionHuman}>
                {row.transitionInto ? (
                  <tr className="border-t border-white/5 bg-neutral-950/40 text-xs text-neutral-400">
                    <td
                      colSpan={showTransitionNotes ? 8 : 7}
                      className="px-3 py-1.5"
                    >
                      ΔBPM {formatSignedDelta(row.transitionInto.bpmDelta)}
                      {' · '}
                      ΔEnergy {formatSignedDelta(row.transitionInto.energyDelta)}
                      {' · '}
                      Camelot {row.transitionInto.camelotRelation}
                    </td>
                  </tr>
                ) : null}
                <tr className="border-t border-white/10 align-top text-neutral-200">
                  <td className="px-3 py-2 tabular-nums text-neutral-500">
                    {row.positionHuman}
                  </td>
                  <td className="px-3 py-2 font-medium text-neutral-50">
                    {row.title}
                  </td>
                  <td className="px-3 py-2 text-neutral-300">{row.artist}</td>
                  <td className="px-3 py-2 tabular-nums">{row.bpmLabel}</td>
                  <td className="px-3 py-2 tabular-nums">{row.camelotLabel}</td>
                  <td className="px-3 py-2 tabular-nums">{row.energyLabel}</td>
                  <td className="px-3 py-2 tabular-nums">{row.durationLabel}</td>
                  {showTransitionNotes ? (
                    <td className="px-3 py-2 text-neutral-400">
                      {row.transitionNotes ? (
                        <details>
                          <summary className="cursor-pointer text-neutral-300 hover:text-neutral-100">
                            Note
                          </summary>
                          <p className="mt-1 max-w-xs whitespace-pre-wrap text-xs leading-relaxed">
                            {row.transitionNotes}
                          </p>
                        </details>
                      ) : (
                        '—'
                      )}
                    </td>
                  ) : null}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
