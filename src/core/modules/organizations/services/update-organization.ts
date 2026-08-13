import 'server-only'

import { Prisma, type PrismaClient } from '@/generated/prisma/client'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'
import type { UpdateOrganizationInput } from '@/core/modules/organizations/types/update-organization-input'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { runAuthorizedOrganizationOperation } from '@/core/modules/permissions/services/require-organization-permission'

type OrganizationMutationClient = Pick<PrismaClient, 'organization'>

export function createUpdateOrganization(client: OrganizationMutationClient) {
  return async function updateOrganizationRecord(
    organizationId: string,
    input: UpdateOrganizationInput
  ): Promise<Organization> {
    if (
      input.name === undefined &&
      input.slug === undefined &&
      input.logoUrl === undefined &&
      input.locale === undefined &&
      input.timezone === undefined
    ) {
      throw new OrganizationError(ORGANIZATION_ERROR_CODES.UPDATE_EMPTY)
    }

    const data = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    }

    try {
      return await client.organization.update({
        where: {
          id: organizationId,
        },
        data,
        select: organizationSelect,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new OrganizationError(ORGANIZATION_ERROR_CODES.SLUG_CONFLICT)
        }

        if (error.code === 'P2025') {
          throw new OrganizationError(ORGANIZATION_ERROR_CODES.NOT_FOUND)
        }
      }

      throw error
    }
  }
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput
): Promise<Organization> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.ORGANIZATIONS_UPDATE,
    resolveOrganizationId: async () => organizationId,
    execute: async (client) =>
      createUpdateOrganization(client)(organizationId, input),
  })
}
