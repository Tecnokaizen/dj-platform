import { buildSessionBuilderDraft } from '@/domains/dj-studio/session-builder/generation/build-session-draft'
import type { SessionBuilderDraft } from '@/domains/dj-studio/session-builder/generation/draft-types'
import type { SessionGenerationInput } from '@/domains/dj-studio/session-builder/generation/generation-input'
import type { PlaylistGenerationProvider } from '@/domains/dj-studio/session-builder/provider'
import {
  parsePlaylistGenerationProviderOutput,
  toPlaylistGenerationCandidates,
} from '@/domains/dj-studio/session-builder/provider'
import type { SessionCandidate } from '@/domains/dj-studio/session-builder/types'

/**
 * Provider call + parse + pure draft assembly (no auth / no shortlist fetch).
 */
export async function generateSessionProposalFromShortlist(params: {
  input: SessionGenerationInput
  shortlist: SessionCandidate[]
  provider: PlaylistGenerationProvider
}): Promise<SessionBuilderDraft> {
  const { input, shortlist, provider } = params

  const providerCandidates = toPlaylistGenerationCandidates(shortlist)
  const raw = await provider.generate({
    prompt: input.prompt,
    targetDurationMin: input.targetDurationMin,
    bpm: input.bpm,
    energyCurve: input.energyCurve,
    trackCountHint: input.trackCountHint,
    candidates: providerCandidates,
  })

  const allowedCandidateIds = shortlist.map(
    (candidate) => candidate.libraryItemId,
  )
  const proposal = parsePlaylistGenerationProviderOutput(
    raw,
    allowedCandidateIds,
  )

  return buildSessionBuilderDraft({
    input,
    candidates: shortlist,
    proposal,
  })
}
