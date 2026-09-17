import 'server-only'

import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import type { PrismaClient } from '@/generated/prisma/client'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { requireDjStudioPermission } from '@/domains/dj-studio/permissions/require-dj-studio-permission'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

/**
 * Resolve ActiveOrganizationContext for a trusted operator CLI and require
 * LIBRARY_MANAGE. No isAdmin shortcut.
 */
export async function requireImporterAuthorization(input: {
  prisma: PrismaClient
  organizationId: string
  profileId: string
}): Promise<ActiveOrganizationContext> {
  const membershipRepository = createMembershipRepository(input.prisma)
  const resolve = createResolveOrganizationContextService({
    getCurrentProfileId: async () => input.profileId,
    findOrganizationById,
    findRoleById,
    findActiveMembership: (organizationId, profileId) =>
      membershipRepository.findActiveByOrganizationAndProfile(
        organizationId,
        profileId,
      ),
  })

  let context: ActiveOrganizationContext
  try {
    context = await resolve(input.organizationId)
  } catch {
    throw new DjStudioError(
      DJ_STUDIO_ERROR_CODES.FORBIDDEN,
      'Operator lacks ACTIVE membership for target Organization',
    )
  }

  if (context.profileId !== input.profileId) {
    throw new DjStudioError(
      DJ_STUDIO_ERROR_CODES.FORBIDDEN,
      'Resolved context profile does not match operator profile',
    )
  }

  return requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )
}
