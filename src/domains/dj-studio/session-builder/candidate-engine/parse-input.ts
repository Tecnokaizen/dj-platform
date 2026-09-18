import { z } from 'zod'

import type { CandidateSelectionInput } from '@/domains/dj-studio/session-builder/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

const candidateSelectionInputSchema = z
  .object({
    prompt: z.string().trim().min(1).max(4000),
    bpm: z
      .object({
        start: z.number().finite().optional(),
        end: z.number().finite().optional(),
        min: z.number().finite().optional(),
        max: z.number().finite().optional(),
      })
      .strict()
      .optional(),
    energyCurve: z.enum([
      'gradual_rise',
      'warm_peak',
      'peak_cooldown',
      'steady',
    ]),
    trackCountHint: z.number().int().min(4).max(80).optional(),
  })
  .strict()

export function parseCandidateSelectionInput(
  input: unknown,
): CandidateSelectionInput {
  const parsed = candidateSelectionInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new DjStudioError(
      DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR,
      'Invalid candidate selection input',
    )
  }
  return parsed.data
}
