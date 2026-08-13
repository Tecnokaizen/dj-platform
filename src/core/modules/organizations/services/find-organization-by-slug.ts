import 'server-only'

import { prisma } from '@/lib/prisma'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'

export async function findOrganizationBySlug(
  slug: string
): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { slug },
    select: organizationSelect,
  })
}
