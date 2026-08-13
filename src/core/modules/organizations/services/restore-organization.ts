import 'server-only'

import { Prisma, type PrismaClient } from '@/generated/prisma/client'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import {
  runAuthorizedOrganizationOperation,
  type AuthorizedOrganizationOperation,
} from '@/core/modules/permissions/services/require-organization-permission'

type OrganizationMutationClient = Pick<PrismaClient, 'organization'>

type AuthorizedRunner = <Result>(
  operation: AuthorizedOrganizationOperation<Prisma.TransactionClient, Result>
) => Promise<Result>

export function createRestoreOrganization(client: OrganizationMutationClient) {
  return async function restoreOrganizationRecord(
    organizationId: string
  ): Promise<Organization> {
    try {
      return await client.organization.update({
        where: {
          id: organizationId,
          status: 'ARCHIVED',
        },
        data: {
          status: 'ACTIVE',
          archivedAt: null,
        },
        select: organizationSelect,
      })
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2025'
      ) {
        throw error
      }

      const existing = await client.organization.findUnique({
        where: {
          id: organizationId,
        },
        select: {
          id: true,
        },
      })

      if (!existing) {
        throw new OrganizationError(ORGANIZATION_ERROR_CODES.NOT_FOUND)
      }

      throw new OrganizationError(ORGANIZATION_ERROR_CODES.INVALID_STATE)
    }
  }
}

export function createAuthorizedRestoreOrganizationService(
  runAuthorized: AuthorizedRunner
) {
  return async function restoreOrganization(
    organizationId: string
  ): Promise<Organization> {
    return runAuthorized({
      permissionKey: PERMISSION_KEYS.ORGANIZATIONS_UPDATE,
      allowedOrganizationStatuses: ['ARCHIVED'],
      resolveOrganizationId: async () => organizationId,
      execute: async (client) =>
        createRestoreOrganization(client)(organizationId),
    })
  }
}

export const restoreOrganization = createAuthorizedRestoreOrganizationService(
  runAuthorizedOrganizationOperation
)
