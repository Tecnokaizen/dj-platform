import 'server-only'

import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import {
  membershipLifecycleSupport,
  type MembershipLifecycleSupport,
} from '@/core/modules/memberships/services/membership-lifecycle-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'

export function createRestoreMembershipService(
  support: MembershipLifecycleSupport
) {
  return async function restoreMembership(
    membershipId: string
  ): Promise<MembershipDto> {
    const membership = await support.requireMembership(membershipId)

    if (membership.status !== 'SUSPENDED') {
      if (membership.status === 'REMOVED') {
        support.throwMembershipStateError(membership)
      }

      throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
    }

    await support.requireActiveOrganization(membership.organizationId)
    await support.requireRole(membership.roleId)

    const updated = await support.membershipRepository.restoreSuspended(
      membership.id,
      membership.roleId
    )

    if (!updated) {
      return support.throwMembershipStateError(
        await support.requireMembership(membershipId)
      )
    }

    return toMembershipDto(updated)
  }
}

export const restoreMembership = createRestoreMembershipService(
  membershipLifecycleSupport
)
