/**
 * Map FormData / loose Product fields → SessionGenerationInput shape.
 * Authoritative validation remains in Domain parseSessionGenerationInput.
 */

export type SessionBuilderFormFields = {
  prompt: string
  targetDurationMin: number
  bpm?: {
    start?: number
    end?: number
    min?: number
    max?: number
  }
  energyCurve: 'gradual_rise' | 'warm_peak' | 'peak_cooldown' | 'steady'
  trackCountHint?: number
  source: 'library_only'
}

function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function parseOptionalPositiveNumber(
  raw: string,
  options: { min: number; max: number },
): number | undefined {
  if (raw.length === 0) {
    return undefined
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value < options.min || value > options.max) {
    return undefined
  }
  // Reject 0 and negatives explicitly for BPM/hint UX contract.
  if (value <= 0) {
    return undefined
  }
  return value
}

const ENERGY_CURVES = new Set([
  'gradual_rise',
  'warm_peak',
  'peak_cooldown',
  'steady',
])

/**
 * Build generation input from FormData.
 * Always forces source = library_only (client cannot override).
 */
export function mapSessionBuilderFormData(
  formData: FormData,
): SessionBuilderFormFields {
  const prompt = readTrimmed(formData, 'prompt')
  const durationRaw = readTrimmed(formData, 'targetDurationMin')
  const targetDurationMin = Number(durationRaw)
  const energyRaw = readTrimmed(formData, 'energyCurve') || 'gradual_rise'
  const energyCurve = ENERGY_CURVES.has(energyRaw)
    ? (energyRaw as SessionBuilderFormFields['energyCurve'])
    : 'gradual_rise'

  const bpmStart = parseOptionalPositiveNumber(readTrimmed(formData, 'bpmStart'), {
    min: 1,
    max: 400,
  })
  const bpmEnd = parseOptionalPositiveNumber(readTrimmed(formData, 'bpmEnd'), {
    min: 1,
    max: 400,
  })
  const bpmMin = parseOptionalPositiveNumber(readTrimmed(formData, 'bpmMin'), {
    min: 1,
    max: 400,
  })
  const bpmMax = parseOptionalPositiveNumber(readTrimmed(formData, 'bpmMax'), {
    min: 1,
    max: 400,
  })

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

  const trackCountHint = parseOptionalPositiveNumber(
    readTrimmed(formData, 'trackCountHint'),
    { min: 1, max: 60 },
  )

  return {
    prompt,
    targetDurationMin: Number.isFinite(targetDurationMin)
      ? targetDurationMin
      : Number.NaN,
    ...(bpm ? { bpm } : {}),
    energyCurve,
    ...(trackCountHint !== undefined ? { trackCountHint } : {}),
    source: 'library_only',
  }
}
