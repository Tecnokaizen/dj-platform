import { z } from 'zod'

import type { CandidateSelectionInput } from '@/domains/dj-studio/session-builder/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

const bpmValueSchema = z.number().finite().gt(0).lte(400)

const bpmSchema = z
  .object({
    start: bpmValueSchema.optional(),
    end: bpmValueSchema.optional(),
    min: bpmValueSchema.optional(),
    max: bpmValueSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      typeof value.min === 'number' &&
      typeof value.max === 'number' &&
      value.min > value.max
    ) {
      context.addIssue({
        code: 'custom',
        message: 'bpm.min must be less than or equal to bpm.max',
        path: ['min'],
      })
    }
  })

export const sessionGenerationInputSchema = z
  .object({
    prompt: z.string().trim().min(1).max(4000),
    targetDurationMin: z.number().finite().min(15).max(240),
    bpm: bpmSchema.optional(),
    energyCurve: z.enum([
      'gradual_rise',
      'warm_peak',
      'peak_cooldown',
      'steady',
    ]),
    source: z.literal('library_only'),
    trackCountHint: z.number().int().min(1).max(60).optional(),
  })
  .strict()

export type SessionGenerationInput = z.infer<typeof sessionGenerationInputSchema>

export function parseSessionGenerationInput(
  input: unknown,
): SessionGenerationInput {
  const parsed = sessionGenerationInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new DjStudioError(
      DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR,
      'Invalid session generation input',
    )
  }
  return parsed.data
}

/**
 * Map full generation input → P2 CandidateSelectionInput.
 * trackCountHint is forwarded only when inside the P2 schema window (4–80).
 */
export function toCandidateSelectionInput(
  input: SessionGenerationInput,
): CandidateSelectionInput {
  const mapped: CandidateSelectionInput = {
    prompt: input.prompt,
    energyCurve: input.energyCurve,
  }

  if (input.bpm) {
    mapped.bpm = input.bpm
  }

  if (
    typeof input.trackCountHint === 'number' &&
    input.trackCountHint >= 4 &&
    input.trackCountHint <= 80
  ) {
    mapped.trackCountHint = input.trackCountHint
  }

  return mapped
}
