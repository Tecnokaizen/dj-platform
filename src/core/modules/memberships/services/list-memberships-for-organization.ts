import 'server-only'

import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import {
  membershipReadRepository,
  type MembershipReadRepository,
} from '@/core/modules/memberships/services/membership-read-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'
import type { MembershipStatus } from '@/core/modules/memberships/types/membership-status'

export function createOrganizationMembershipListingServices(
  repository: MembershipReadRepository
) {
  return {
    async listMembershipsForOrganization(
      organizationId: string,
      status?: MembershipStatus
    ): Promise<MembershipDto[]> {
      const memberships = await repository.listByOrganization(
        organizationId,
        status
      )

      return memberships.map(toMembershipDto)
    },

    async listActiveMembershipsForOrganization(
      organizationId: string
    ): Promise<MembershipDto[]> {
      const memberships = await repository.listActiveByOrganization(
        organizationId
      )

      return memberships.map(toMembershipDto)
    },
  }
}

export const {
  listMembershipsForOrganization,
  listActiveMembershipsForOrganization,
} = createOrganizationMembershipListingServices(membershipReadRepository)
