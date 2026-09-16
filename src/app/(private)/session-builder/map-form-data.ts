/**
 * FormData → raw Product generation payload (primitive coercion only).
 * Authoritative validation: Domain parseSessionGenerationInput.
 */

export type SessionBuilderRawBpm = {
  start?: number
  end?: number
  min?: number
  max?: number
}

/**
 * Unvalidated Product payload. May contain invalid numbers / energyCurve strings.
 * Must be passed through Domain parseSessionGenerationInput before use.
 */
export type SessionBuilderRawInput = {
  prompt: string
  targetDurationMin: number
  bpm?: SessionBuilderRawBpm
  energyCurve: string
  trackCountHint?: number
  source: 'library_only'
}

function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Blank optional → undefined. Any non-blank string → Number(trimmed)
 * (may be NaN / out of range — Domain decides).
 */
function coerceOptionalNumber(raw: string): number | undefined {
  if (raw.length === 0) {
    return undefined
  }
  return Number(raw)
}

/**
 * Build raw generation input from FormData.
 * Always forces source = library_only (client cannot override).
 */
export function mapSessionBuilderFormData(
  formData: FormData,
): SessionBuilderRawInput {
  const prompt = readTrimmed(formData, 'prompt')
  const targetDurationMin = Number(readTrimmed(formData, 'targetDurationMin'))
  const energyCurve = readTrimmed(formData, 'energyCurve')

  const bpmStart = coerceOptionalNumber(readTrimmed(formData, 'bpmStart'))
  const bpmEnd = coerceOptionalNumber(readTrimmed(formData, 'bpmEnd'))
  const bpmMin = coerceOptionalNumber(readTrimmed(formData, 'bpmMin'))
  const bpmMax = coerceOptionalNumber(readTrimmed(formData, 'bpmMax'))

  const bpm =
    bpmStart !== undefined ||
    bpmEnd !== undefined ||
    bpmMin !== undefined ||
    bpmMax !== undefined
      ? {
          ...(bpmStart !== undefined ? { start: bpmStart } : {}),
          ...(bpmEnd !== undefined ? { end: bpmEnd } : {}),
          ...(bpmMin !== undefined ? { min: bpmMin } : {}),
          ...(bpmMax !== undefined ? { max: bpmMax } : {}),
        }
      : undefined

  const trackCountHint = coerceOptionalNumber(
    readTrimmed(formData, 'trackCountHint'),
  )

  return {
    prompt,
    targetDurationMin,
    ...(bpm ? { bpm } : {}),
    energyCurve,
    ...(trackCountHint !== undefined ? { trackCountHint } : {}),
    source: 'library_only',
  }
}
