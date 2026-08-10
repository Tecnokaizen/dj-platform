import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Organization } from '@/core/modules/organizations/types/organization'

const organizationSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  logoUrl: true,
  locale: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
} as const

export async function findOrganizationById(
  organizationId: string
): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: organizationSelect,
  })
}
