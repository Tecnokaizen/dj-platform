'use server'

import { mapSessionBuilderError } from '@/app/(private)/session-builder/map-error'
import { mapSessionBuilderFormData } from '@/app/(private)/session-builder/map-form-data'
import { resolveActiveOrganization } from '@/domains/dj-studio/organization/resolve-active-organization'
import { generateSessionProposal } from '@/domains/dj-studio/session-builder/services/generate-session-proposal'
import type { SessionBuilderDraft } from '@/domains/dj-studio/session-builder/generation'
import type { PlaylistGenerationProvider } from '@/domains/dj-studio/session-builder/provider'
import { MockPlaylistGenerationProvider } from '@/lib/ai/providers/mock-playlist-generation-provider'

export type GenerateSessionBuilderActionResult =
  | { ok: true; draft: SessionBuilderDraft }
  | { ok: false; error: string }

/**
 * Product adapter: auth/org server-side + Mock provider + Domain orchestration.
 * Returns a serializable result for Client UI (ephemeral draft).
 */
export async function generateSessionBuilderAction(
  formData: FormData,
  options?: {
    provider?: PlaylistGenerationProvider
  },
): Promise<GenerateSessionBuilderActionResult> {
  try {
    const input = mapSessionBuilderFormData(formData)
    const context = await resolveActiveOrganization()
    const provider =
      options?.provider ?? new MockPlaylistGenerationProvider({ mode: 'success' })

    const draft = await generateSessionProposal({
      context,
      input,
      provider,
    })

    return { ok: true, draft }
  } catch (error) {
    return { ok: false, error: mapSessionBuilderError(error) }
  }
}
