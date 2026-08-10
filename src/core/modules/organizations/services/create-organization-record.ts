import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'

const ORGANIZATION_SLUG_CONFLICT = 'ORGANIZATION_SLUG_CONFLICT'

export type CreateOrganizationRecordInput = {
  name: string
  slug: string
  logoUrl?: string | null
  locale?: string
  timezone?: string
}

export async function createOrganizationRecord(
  input: CreateOrganizationRecordInput
): Promise<Organization> {
  try {
    return await prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
        ...(input.locale !== undefined ? { locale: input.locale } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      },
      select: organizationSelect,
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error(ORGANIZATION_SLUG_CONFLICT)
    }

    throw error
  }
}
