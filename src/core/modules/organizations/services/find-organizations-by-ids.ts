import 'server-only'

import type { PrismaClient } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'

type OrganizationLookupClient = Pick<PrismaClient, 'organization'>

export function createFindOrganizationsByIds(client: OrganizationLookupClient) {
  return async function findOrganizationsByIds(
    organizationIds: string[]
  ): Promise<Organization[]> {
    if (organizationIds.length === 0) {
      return []
    }

    return client.organization.findMany({
      where: {
        id: {
          in: organizationIds,
        },
      },
      select: organizationSelect,
    })
  }
}

export const findOrganizationsByIds = createFindOrganizationsByIds(prisma)
