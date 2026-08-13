import 'server-only'

import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import {
  membershipReadRepository,
  type MembershipReadRepository,
} from '@/core/modules/memberships/services/membership-read-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'

export function createGetMembershipForProfileService(
  repository: MembershipReadRepository
) {
  return async function getMembershipForProfile(
    organizationId: string,
    profileId: string
  ): Promise<MembershipDto | null> {
    const membership = await repository.findByOrganizationAndProfile(
      organizationId,
      profileId
    )

    return membership ? toMembershipDto(membership) : null
  }
}

export const getMembershipForProfile =
  createGetMembershipForProfileService(membershipReadRepository)
