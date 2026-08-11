import 'server-only'

import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import {
  membershipLifecycleSupport,
  type MembershipLifecycleSupport,
} from '@/core/modules/memberships/services/membership-lifecycle-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'

export type ChangeMembershipRoleInput = {
  membershipId: string
  roleId: string
}

export function createChangeMembershipRoleService(
  support: MembershipLifecycleSupport
) {
  return async function changeMembershipRole(
    input: ChangeMembershipRoleInput
  ): Promise<MembershipDto> {
    const membership = await support.requireMembership(input.membershipId)

    if (membership.status !== 'ACTIVE') {
      support.throwMembershipStateError(membership)
    }

    const [currentRole, targetRole] = await Promise.all([
      support.requireRole(membership.roleId),
      support.requireRole(input.roleId),
    ])

    support.rejectOwnerRole(currentRole)
    support.rejectOwnerRole(targetRole)

    const updated = await support.membershipRepository.changeActiveRole(
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

export const changeMembershipRole = createChangeMembershipRoleService(
  membershipLifecycleSupport
)
