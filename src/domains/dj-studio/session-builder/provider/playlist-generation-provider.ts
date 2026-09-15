import type { PlaylistGenerationRequest } from '@/domains/dj-studio/session-builder/provider/provider-types'

/**
 * AI playlist generation boundary.
 * Implementations return untrusted data; Domain must parse/validate.
 * No DB / RBAC / tenancy / persistence.
 */
export interface PlaylistGenerationProvider {
  generate(request: PlaylistGenerationRequest): Promise<unknown>
}
