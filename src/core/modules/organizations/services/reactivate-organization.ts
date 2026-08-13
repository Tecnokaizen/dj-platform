import 'server-only'

import { Prisma, type PrismaClient } from '@/generated/prisma/client'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { runAuthorizedOrganizationOperation } from '@/core/modules/permissions/services/require-organization-permission'

type OrganizationMutationClient = Pick<PrismaClient, 'organization'>

export function createReactivateOrganization(
  client: OrganizationMutationClient
) {
  return async function reactivateOrganizationRecord(
    organizationId: string
  ): Promise<Organization> {
    try {
      return await client.organization.update({
        where: {
          id: organizationId,
          status: 'SUSPENDED',
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

export async function reactivateOrganization(
  organizationId: string
): Promise<Organization> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.ORGANIZATIONS_UPDATE,
    resolveOrganizationId: async () => organizationId,
    execute: async (client) =>
      createReactivateOrganization(client)(organizationId),
  })
}
