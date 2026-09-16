'use client'

import { useState, useTransition } from 'react'

import { generateSessionBuilderAction } from '@/app/(private)/session-builder/actions'
import { SessionBuilderDraftView } from '@/components/dj-studio/session-builder/session-builder-draft'
import type { SessionBuilderDraft } from '@/domains/dj-studio/session-builder/generation'

type SessionBuilderFormProps = {
  canGenerate: boolean
}

export function SessionBuilderForm({ canGenerate }: SessionBuilderFormProps) {
  const [draft, setDraft] = useState<SessionBuilderDraft | null>(null)
  const [generatedPromptSnapshot, setGeneratedPromptSnapshot] = useState<
    string | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    if (!canGenerate || isPending) {
      return
    }

    const promptSnapshot =
      typeof formData.get('prompt') === 'string'
        ? String(formData.get('prompt')).trim()
        : ''

    setError(null)
    startTransition(async () => {
      const result = await generateSessionBuilderAction(formData)
      if (result.ok) {
        setDraft(result.draft)
        setGeneratedPromptSnapshot(promptSnapshot)
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      <form
        action={handleSubmit}
        className="grid gap-4 rounded-xl border border-white/10 bg-neutral-900 p-6 sm:grid-cols-2"
      >
        <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Parámetros de la sesión</h2>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            Generador en modo de prueba
          </span>
        </div>

        <label className="sm:col-span-2 text-sm text-neutral-300">
          Describe tu sesión
          <textarea
            name="prompt"
            required
            maxLength={4000}
            rows={5}
            placeholder="Sunset Afro House, 90 minutos, de 118 a 123 BPM, inicio elegante, subida progresiva y final potente."
            className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
          />
        </label>

        <label className="text-sm text-neutral-300">
          Duración objetivo (minutos)
          <input
            name="targetDurationMin"
            type="number"
            required
            min={15}
            max={240}
            defaultValue={90}
            className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
          />
        </label>

        <label className="text-sm text-neutral-300">
          Curva de energía
          <select
            name="energyCurve"
            defaultValue="gradual_rise"
            className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="gradual_rise">Subida progresiva</option>
            <option value="warm_peak">Pico cálido</option>
            <option value="peak_cooldown">Pico y bajada</option>
            <option value="steady">Energía estable</option>
          </select>
        </label>

        <fieldset className="sm:col-span-2 grid gap-4 rounded-lg border border-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <legend className="px-1 text-sm font-medium text-neutral-200">
            BPM (opcional)
          </legend>
          <label className="text-sm text-neutral-300">
            BPM inicial
            <input
              name="bpmStart"
              type="number"
              min={1}
              max={400}
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </label>
          <label className="text-sm text-neutral-300">
            BPM final
            <input
              name="bpmEnd"
              type="number"
              min={1}
              max={400}
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </label>
          <label className="text-sm text-neutral-300">
            BPM mínimo
            <input
              name="bpmMin"
              type="number"
              min={1}
              max={400}
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </label>
          <label className="text-sm text-neutral-300">
            BPM máximo
            <input
              name="bpmMax"
              type="number"
              min={1}
              max={400}
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </label>
        </fieldset>

        <label className="text-sm text-neutral-300">
          Número aproximado de temas
          <input
            name="trackCountHint"
            type="number"
            min={1}
            max={60}
            className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            Es una orientación, no una cantidad obligatoria.
          </span>
        </label>

        <div className="flex flex-col justify-end text-sm text-neutral-400">
          <p>
            Fuente: <span className="text-neutral-200">Mi biblioteca</span>
          </p>
        </div>

        {!canGenerate ? (
          <p className="sm:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            No tienes permisos para generar sesiones en esta organización.
          </p>
        ) : null}

        {error ? (
          <p className="sm:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="sm:col-span-2 sm:text-right">
          <button
            type="submit"
            disabled={!canGenerate || isPending}
            className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Generando propuesta…' : 'Generar propuesta'}
          </button>
        </div>
      </form>

      {draft && generatedPromptSnapshot ? (
        <SessionBuilderDraftView
          draft={draft}
          generatedPromptSnapshot={generatedPromptSnapshot}
          canSave={canGenerate}
          onClear={() => {
            setDraft(null)
            setGeneratedPromptSnapshot(null)
            setError(null)
          }}
        />
      ) : null}
    </div>
  )
}
