import 'server-only'

import { prisma } from '@/lib/prisma'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'

export async function findOrganizationById(
  organizationId: string
): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: organizationSelect,
  })
}
