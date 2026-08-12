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

export async function changeMembershipRole(
  input: ChangeMembershipRoleInput
): Promise<MembershipDto> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.MEMBERSHIPS_CHANGE_ROLE,
    resolveOrganizationId: async (client) => {
      const membership = await createMembershipRepository(client).findById(
        input.membershipId
      )

      if (!membership) {
        throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_FOUND)
      }

      return membership.organizationId
    },
    execute: async (client) =>
      createChangeMembershipRoleService(
        createMembershipLifecycleSupportForClient(client)
      )(input),
  })
}
