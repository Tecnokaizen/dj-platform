import 'server-only'

import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import {
  membershipReadRepository,
  type MembershipReadRepository,
} from '@/core/modules/memberships/services/membership-read-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'

export function createGetMembershipService(
  repository: MembershipReadRepository
) {
  return async function getMembership(
    membershipId: string
  ): Promise<MembershipDto> {
    const membership = await repository.findById(membershipId)

    if (!membership) {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_FOUND)
    }

    return toMembershipDto(membership)
  }
}

export const getMembership = createGetMembershipService(
  membershipReadRepository
)
