import { z } from 'zod'

import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

const saveTrackSchema = z
  .object({
    libraryItemId: z.uuid(),
    transitionNote: z.string().trim().max(500).nullable(),
  })
  .strict()

export const sessionBuilderSaveInputSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    prompt: z.string().trim().min(1).max(4000),
    tracks: z.array(saveTrackSchema).min(1).max(60),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = value.tracks.map((track) => track.libraryItemId)
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Duplicate libraryItemId is not allowed for AI save',
        path: ['tracks'],
      })
    }
  })

export type SessionBuilderSaveInput = z.infer<
  typeof sessionBuilderSaveInputSchema
>

export function parseSessionBuilderSaveInput(
  input: unknown,
): SessionBuilderSaveInput {
  const parsed = sessionBuilderSaveInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new DjStudioError(
      DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR,
      'Invalid session builder save input',
    )
  }
  return parsed.data
}
