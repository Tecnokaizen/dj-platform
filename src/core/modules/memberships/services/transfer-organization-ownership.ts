import 'server-only'

import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { transferOrganizationOwnershipSchema } from '@/core/modules/memberships/schemas/transfer-organization-ownership'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import {
  runAuthorizedOrganizationOperation,
  type AuthorizedOrganizationOperation,
} from '@/core/modules/permissions/services/require-organization-permission'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import type { Prisma } from '@/generated/prisma/client'

export type TransferOrganizationOwnershipInput = {
  organizationId: string
  targetMembershipId: string
  previousOwnerRoleId: string
}

export type OwnershipTransferResult = {
  organizationId: string
  previousOwner: MembershipDto
  newOwner: MembershipDto
}

type AuthorizedRunner = <Result>(
  operation: AuthorizedOrganizationOperation<Prisma.TransactionClient, Result>
) => Promise<Result>

export function createTransferOrganizationOwnershipService(
  runAuthorized: AuthorizedRunner
) {
  return async function transferOrganizationOwnership(
    input: TransferOrganizationOwnershipInput
  ): Promise<OwnershipTransferResult> {
    const parsed = transferOrganizationOwnershipSchema.parse(input)

    return runAuthorized({
      permissionKey: PERMISSION_KEYS.ORGANIZATIONS_TRANSFER_OWNERSHIP,
      resolveOrganizationId: async () => parsed.organizationId,
      execute: async (client, context) => {
        await client.$queryRaw`
          SELECT id
          FROM organizations
          WHERE id = ${parsed.organizationId}::uuid
          FOR UPDATE
        `

        const repository = createMembershipRepository(client)
        const currentOwner = await repository.findById(context.membershipId)
        const targetMembership = await repository.findById(
          parsed.targetMembershipId
        )
        const previousOwnerRole = await client.role.findUnique({
          where: { id: parsed.previousOwnerRoleId },
        })
        const ownerRole = await client.role.findUnique({
          where: { key: SYSTEM_ROLE_KEYS.OWNER },
        })

        if (!currentOwner || currentOwner.status !== 'ACTIVE') {
          throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_ACTIVE)
        }

        if (
          !ownerRole ||
          currentOwner.organizationId !== parsed.organizationId ||
          currentOwner.roleId !== ownerRole.id ||
          context.roleKey !== SYSTEM_ROLE_KEYS.OWNER
        ) {
          throw new MembershipError(
            MEMBERSHIP_ERROR_CODES.OWNER_INVARIANT_VIOLATION
          )
        }

        if (
          !targetMembership ||
          targetMembership.organizationId !== parsed.organizationId
        ) {
          throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_FOUND)
        }

        if (
          targetMembership.id === currentOwner.id ||
          targetMembership.status !== 'ACTIVE' ||
          targetMembership.roleId === ownerRole.id
        ) {
          throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
        }

        if (!previousOwnerRole) {
          throw new MembershipError(MEMBERSHIP_ERROR_CODES.ROLE_INVALID)
        }

        if (previousOwnerRole.key === SYSTEM_ROLE_KEYS.OWNER) {
          throw new MembershipError(
            MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED
          )
        }

        const previousOwner = await repository.transferActiveRole(
          currentOwner.id,
          ownerRole.id,
          previousOwnerRole.id
        )

        if (!previousOwner) {
          throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
        }

        const newOwner = await repository.transferActiveRole(
          targetMembership.id,
          targetMembership.roleId,
          ownerRole.id
        )

        if (!newOwner) {
          throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
        }

        const ownerCount = await client.organizationMembership.count({
          where: {
            organizationId: parsed.organizationId,
            status: 'ACTIVE',
            role: { key: SYSTEM_ROLE_KEYS.OWNER },
          },
        })

        if (ownerCount !== 1) {
          throw new MembershipError(
            MEMBERSHIP_ERROR_CODES.OWNER_INVARIANT_VIOLATION
          )
        }

        return {
          organizationId: parsed.organizationId,
          previousOwner: toMembershipDto(previousOwner),
          newOwner: toMembershipDto(newOwner),
        }
      },
    })
  }
}

export const transferOrganizationOwnership =
  createTransferOrganizationOwnershipService(
    runAuthorizedOrganizationOperation
  )
