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

export async function findOrganizationBySlug(
  slug: string
): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { slug },
    select: organizationSelect,
  })
}
