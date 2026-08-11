import 'server-only'

import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import {
  membershipReadRepository,
  type MembershipReadRepository,
} from '@/core/modules/memberships/services/membership-read-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'

export function createProfileMembershipListingServices(
  repository: MembershipReadRepository
) {
  return {
    async listMembershipsForProfile(
      profileId: string
    ): Promise<MembershipDto[]> {
      const memberships = await repository.listByProfile(profileId)
      return memberships.map(toMembershipDto)
    },

    async listActiveMembershipsForProfile(
      profileId: string
    ): Promise<MembershipDto[]> {
      const memberships = await repository.listActiveByProfile(profileId)
      return memberships.map(toMembershipDto)
    },
  }
}

export const {
  listMembershipsForProfile,
  listActiveMembershipsForProfile,
} = createProfileMembershipListingServices(membershipReadRepository)
