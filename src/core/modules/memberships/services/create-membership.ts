import 'server-only'

import { Prisma } from '@/generated/prisma/client'
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

export type CreateMembershipInput = {
  organizationId: string
  profileId: string
  roleId: string
}

export function createMembershipService(support: MembershipLifecycleSupport) {
  return async function createMembership(
    input: CreateMembershipInput
  ): Promise<MembershipDto> {
    await support.requireActiveOrganization(input.organizationId)
    await support.requireProfile(input.profileId)

    const role = await support.requireRole(input.roleId)
    support.rejectOwnerRole(role)

    const existing =
      await support.membershipRepository.findByOrganizationAndProfile(
        input.organizationId,
        input.profileId
      )

    if (existing) {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.ALREADY_EXISTS)
    }

    try {
      const created = await support.membershipRepository.create(input)
      return toMembershipDto(created)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new MembershipError(MEMBERSHIP_ERROR_CODES.ALREADY_EXISTS)
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
      }

      throw error
    }
  }
}

export const createMembership = createMembershipService(
  membershipLifecycleSupport
)
