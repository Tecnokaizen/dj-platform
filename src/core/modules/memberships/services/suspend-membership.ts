import 'server-only'

import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import {
  membershipLifecycleSupport,
  type MembershipLifecycleSupport,
} from '@/core/modules/memberships/services/membership-lifecycle-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'

export function createSuspendMembershipService(
  support: MembershipLifecycleSupport
) {
  return async function suspendMembership(
    membershipId: string
  ): Promise<MembershipDto> {
    const membership = await support.requireMembership(membershipId)

    if (membership.status !== 'ACTIVE') {
      support.throwMembershipStateError(membership)
    }

    const currentRole = await support.requireRole(membership.roleId)
    support.rejectOwnerRole(currentRole)

    const updated = await support.membershipRepository.suspendActive(
      membership.id,
      membership.roleId,
      support.now()
    )

    if (!updated) {
      return support.throwMembershipStateError(
        await support.requireMembership(membershipId)
      )
    }

    return toMembershipDto(updated)
  }
}

export const suspendMembership = createSuspendMembershipService(
  membershipLifecycleSupport
)
