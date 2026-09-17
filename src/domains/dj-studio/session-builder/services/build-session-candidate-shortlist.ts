import 'server-only'

import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { buildSessionCandidateShortlistFromSources } from '@/domains/dj-studio/session-builder/candidate-engine/build-shortlist'
import { parseCandidateSelectionInput } from '@/domains/dj-studio/session-builder/candidate-engine/parse-input'
import { listSessionLibraryCandidateSources } from '@/domains/dj-studio/session-builder/services/list-session-library-candidates'
import type {
  CandidateSelectionInput,
  SessionCandidate,
} from '@/domains/dj-studio/session-builder/types'

/**
 * Organization Library → hard filters → score → diversity → shortlist (max 60).
 * Requires library.read. Read-only — no provider / persistence.
 */
export async function buildSessionCandidateShortlist(
  context: ActiveOrganizationContext,
  input: CandidateSelectionInput,
): Promise<SessionCandidate[]> {
  const parsedInput = parseCandidateSelectionInput(input)
  const sources = await listSessionLibraryCandidateSources(context)
  return buildSessionCandidateShortlistFromSources(sources, parsedInput)
}
