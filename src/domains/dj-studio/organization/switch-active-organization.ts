import 'server-only'

import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { organizationIdSchema } from '@/core/modules/organizations/schemas/organization-id'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import { prisma } from '@/lib/prisma'
import { setActiveOrganizationCookie } from '@/domains/dj-studio/organization/active-organization-cookie'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

/**
 * Validate ACTIVE membership, persist preference cookie, return context.
 * Cookie is preference only — never authorization.
 */
export async function switchActiveOrganization(
  organizationId: string,
): Promise<ActiveOrganizationContext> {
  const parsed = organizationIdSchema.safeParse(organizationId)

  if (!parsed.success) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR)
  }

  const session = await getCurrentProfile()
  const profileId = session?.profile?.id

  if (!profileId) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED)
  }

  const membershipRepository = createMembershipRepository(prisma)
  const resolveContext = createResolveOrganizationContextService({
    getCurrentProfileId: async () => profileId,
    findOrganizationById,
    findRoleById,
    findActiveMembership: (orgId, pid) =>
      membershipRepository.findActiveByOrganizationAndProfile(orgId, pid),
  })

  try {
    const context = await resolveContext(parsed.data)
    await setActiveOrganizationCookie(context.organizationId)
    return context
  } catch {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.FORBIDDEN)
  }
}
