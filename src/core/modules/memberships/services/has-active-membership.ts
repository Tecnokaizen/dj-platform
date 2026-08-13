import 'server-only'

import {
  membershipReadRepository,
  type MembershipReadRepository,
} from '@/core/modules/memberships/services/membership-read-support'

export function createHasActiveMembershipService(
  repository: MembershipReadRepository
) {
  return async function hasActiveMembership(
    organizationId: string,
    profileId: string
  ): Promise<boolean> {
    const membership = await repository.findActiveByOrganizationAndProfile(
      organizationId,
      profileId
    )

    return membership !== null
  }
}

export const hasActiveMembership = createHasActiveMembershipService(
  membershipReadRepository
)
