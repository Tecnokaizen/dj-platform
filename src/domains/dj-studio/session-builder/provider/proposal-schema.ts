import { z } from 'zod'

const warningSchema = z
  .object({
    code: z.string().trim().min(1).max(80),
    message: z.string().trim().min(1).max(500),
    severity: z.enum(['info', 'warning']),
  })
  .strict()

const trackSchema = z
  .object({
    libraryItemId: z.uuid(),
    position: z.number().int().min(0),
    transitionNote: z.string().trim().max(500).nullable(),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict()

/**
 * Structural Zod schema for untrusted provider output.
 * Semantic checks (contiguous positions, allowed IDs) live in the parser.
 */
export const playlistGenerationProviderOutputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(2000),
    tracks: z.array(trackSchema).max(200),
    energyProgression: z.string().trim().min(1).max(500),
    bpmProgression: z
      .object({
        start: z.number().finite().nullable(),
        end: z.number().finite().nullable(),
        notes: z.string().trim().max(500).nullable(),
      })
      .strict(),
    warnings: z.array(warningSchema).max(50),
  })
  .strict()

export type RawPlaylistGenerationOutput = z.infer<
  typeof playlistGenerationProviderOutputSchema
>
