import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'

const ORGANIZATION_UPDATE_EMPTY = 'ORGANIZATION_UPDATE_EMPTY'
const ORGANIZATION_SLUG_CONFLICT = 'ORGANIZATION_SLUG_CONFLICT'
const ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND'

export type UpdateOrganizationInput = {
  name?: string
  slug?: string
  logoUrl?: string | null
  locale?: string
  timezone?: string
}

export async function updateOrganization(
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
    throw new Error(ORGANIZATION_UPDATE_EMPTY)
  }

  const data = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    ...(input.locale !== undefined ? { locale: input.locale } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
  }

  try {
    return await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data,
      select: organizationSelect,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error(ORGANIZATION_SLUG_CONFLICT)
      }

      if (error.code === 'P2025') {
        throw new Error(ORGANIZATION_NOT_FOUND)
      }
    }

    throw error
  }
}
