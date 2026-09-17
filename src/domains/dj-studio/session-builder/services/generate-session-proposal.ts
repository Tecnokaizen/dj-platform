import 'server-only'

import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { requireDjStudioPermission } from '@/domains/dj-studio/permissions/require-dj-studio-permission'
import type { SessionBuilderDraft } from '@/domains/dj-studio/session-builder/generation/draft-types'
import {
  parseSessionGenerationInput,
  toCandidateSelectionInput,
} from '@/domains/dj-studio/session-builder/generation/generation-input'
import { generateSessionProposalFromShortlist } from '@/domains/dj-studio/session-builder/generation/generate-from-shortlist'
import type { PlaylistGenerationProvider } from '@/domains/dj-studio/session-builder/provider'
import { buildSessionCandidateShortlist } from '@/domains/dj-studio/session-builder/services/build-session-candidate-shortlist'

/**
 * P4 orchestration: authorize → shortlist → provider → parse → draft.
 * Read-only: no Playlist / Library / draft persistence.
 */
export async function generateSessionProposal(params: {
  context: ActiveOrganizationContext
  input: unknown
  provider: PlaylistGenerationProvider
}): Promise<SessionBuilderDraft> {
  const input = parseSessionGenerationInput(params.input)

  await requireDjStudioPermission(
    params.context,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  )

  const shortlist = await buildSessionCandidateShortlist(
    params.context,
    toCandidateSelectionInput(input),
  )

  return generateSessionProposalFromShortlist({
    input,
    shortlist,
    provider: params.provider,
  })
}
