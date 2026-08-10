import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'

export async function suspendOrganization(
  organizationId: string
): Promise<Organization> {
  try {
    return await prisma.organization.update({
      where: {
        id: organizationId,
        status: 'ACTIVE',
      },
      data: {
        status: 'SUSPENDED',
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
      throw new OrganizationError(ORGANIZATION_ERROR_CODES.NOT_FOUND)
    }

    throw new OrganizationError(ORGANIZATION_ERROR_CODES.INVALID_STATE)
  }
}
