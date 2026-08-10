import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'

const ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND'
const INVALID_ORGANIZATION_STATE = 'INVALID_ORGANIZATION_STATE'

export async function restoreOrganization(
  organizationId: string
): Promise<Organization> {
  try {
    return await prisma.organization.update({
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

    const existing = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
      },
    })

    if (!existing) {
      throw new Error(ORGANIZATION_NOT_FOUND)
    }

    throw new Error(INVALID_ORGANIZATION_STATE)
  }
}
