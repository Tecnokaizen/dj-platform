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

export type RestoreRemovedMembershipInput = {
  membershipId: string
  targetRoleId: string
}

export function createRestoreRemovedMembershipService(
  support: MembershipLifecycleSupport
) {
  return async function restoreRemovedMembership(
    input: RestoreRemovedMembershipInput
  ): Promise<MembershipDto> {
    const membership = await support.requireMembership(input.membershipId)

    if (membership.status !== 'REMOVED') {
      if (membership.status === 'SUSPENDED') {
        support.throwMembershipStateError(membership)
      }

      throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
    }

    await support.requireActiveOrganization(membership.organizationId)

    const targetRole = await support.requireRole(input.targetRoleId)
    support.rejectOwnerRole(targetRole)

    const updated = await support.membershipRepository.restoreRemoved(
      membership.id,
      membership.roleId,
      targetRole.id
    )

    if (!updated) {
      return support.throwMembershipStateError(
        await support.requireMembership(input.membershipId)
      )
    }

    return toMembershipDto(updated)
  }
}

export const restoreRemovedMembership = createRestoreRemovedMembershipService(
  membershipLifecycleSupport
)
