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

export async function restoreMembership(
  membershipId: string
): Promise<MembershipDto> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.MEMBERSHIPS_RESTORE,
    resolveOrganizationId: async (client) => {
      const membership =
        await createMembershipRepository(client).findById(membershipId)

      if (!membership) {
        throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_FOUND)
      }

      return membership.organizationId
    },
    execute: async (client) =>
      createRestoreMembershipService(
        createMembershipLifecycleSupportForClient(client)
      )(membershipId),
  })
}
