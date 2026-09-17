'use client'

import type { SessionBuilderDraftWarning } from '@/domains/dj-studio/session-builder/generation'

type SessionBuilderWarningsProps = {
  warnings: SessionBuilderDraftWarning[]
}

export function SessionBuilderWarnings({
  warnings,
}: SessionBuilderWarningsProps) {
  if (warnings.length === 0) {
    return null
  }

  return (
    <section
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"
      aria-label="Avisos de la propuesta"
    >
      <h3 className="text-lg font-semibold text-amber-100">
        Avisos de la propuesta
      </h3>
      <ul className="mt-3 space-y-2">
        {warnings.map((warning, index) => {
          const isInfo = warning.severity === 'info'
          return (
            <li
              key={`${warning.code}-${index}`}
              className={
                isInfo
                  ? 'rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-100'
                  : 'rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-50'
              }
            >
              {warning.message}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
