import 'server-only'

import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import {
  createMembershipLifecycleSupportForClient,
  type MembershipLifecycleSupport,
} from '@/core/modules/memberships/services/membership-lifecycle-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { runAuthorizedOrganizationOperation } from '@/core/modules/permissions/services/require-organization-permission'

export function createRemoveMembershipService(
  support: MembershipLifecycleSupport
) {
  return async function removeMembership(
    membershipId: string
  ): Promise<MembershipDto> {
    const membership = await support.requireMembership(membershipId)

    if (membership.status === 'REMOVED') {
      support.throwMembershipStateError(membership)
    }

    const currentRole = await support.requireRole(membership.roleId)
    support.rejectOwnerRole(currentRole)

    const updated = await support.membershipRepository.removeActiveOrSuspended(
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

export async function removeMembership(
  membershipId: string
): Promise<MembershipDto> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.MEMBERSHIPS_REMOVE,
    resolveOrganizationId: async (client) => {
      const membership =
        await createMembershipRepository(client).findById(membershipId)

      if (!membership) {
        throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_FOUND)
      }

      return membership.organizationId
    },
    execute: async (client) =>
      createRemoveMembershipService(
        createMembershipLifecycleSupportForClient(client)
      )(membershipId),
  })
}
