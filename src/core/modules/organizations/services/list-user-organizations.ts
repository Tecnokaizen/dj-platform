import 'server-only'

import {
  PROFILE_ERROR_CODES,
  ProfileError,
} from '@/core/identity/profile/errors/profile-error'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { findOrganizationsByIds } from '@/core/modules/organizations/services/find-organizations-by-ids'
import type { Organization } from '@/core/modules/organizations/types/organization'
import { prisma } from '@/lib/prisma'

type ActiveMembershipReference = {
  organizationId: string
}

export type ListUserOrganizationsDependencies = {
  getCurrentProfileId: () => Promise<string | null>
  listActiveMembershipsForProfile: (
    profileId: string
  ) => Promise<ActiveMembershipReference[]>
  findOrganizationsByIds: (
    organizationIds: string[]
  ) => Promise<Organization[]>
}

export function createListUserOrganizationsService(
  dependencies: ListUserOrganizationsDependencies
) {
  return async function listUserOrganizations(): Promise<Organization[]> {
    const profileId = await dependencies.getCurrentProfileId()

    if (!profileId) {
      throw new ProfileError(PROFILE_ERROR_CODES.NOT_FOUND)
    }

    const memberships =
      await dependencies.listActiveMembershipsForProfile(profileId)
    const organizationIds = [
      ...new Set(memberships.map(({ organizationId }) => organizationId)),
    ]
    const organizations =
      await dependencies.findOrganizationsByIds(organizationIds)
    const organizationsById = new Map(
      organizations.map((organization) => [organization.id, organization])
    )

    return organizationIds.flatMap((organizationId) => {
      const organization = organizationsById.get(organizationId)
      return organization ? [organization] : []
    })
  }
}

const membershipRepository = createMembershipRepository(prisma)

export const listUserOrganizationsDependencies: ListUserOrganizationsDependencies = {
  getCurrentProfileId: async () => {
    const session = await getCurrentProfile()
    return session?.profile?.id ?? null
  },
  listActiveMembershipsForProfile: (profileId) =>
    membershipRepository.listActiveByProfile(profileId),
  findOrganizationsByIds,
}

export const listUserOrganizations = createListUserOrganizationsService(
  listUserOrganizationsDependencies
)
