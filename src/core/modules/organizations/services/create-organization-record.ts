import 'server-only'

import { Prisma, type PrismaClient } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { Organization } from '@/core/modules/organizations/types/organization'
import { createOrganizationRecordSchema } from '@/core/modules/organizations/schemas/create-organization-record'

export type CreateOrganizationRecordInput = {
  name: string
  slug?: string
  logoUrl?: string | null
  locale?: string
  timezone?: string
}

type OrganizationRecordClient = Pick<PrismaClient, 'organization'>

export function createCreateOrganizationRecord(
  client: OrganizationRecordClient
) {
  return async function createOrganizationRecord(
    input: CreateOrganizationRecordInput
  ): Promise<Organization> {
    const parsed = createOrganizationRecordSchema.parse(input)

    try {
      return await client.organization.create({
        data: {
          name: parsed.name,
          slug: parsed.slug,
          ...(parsed.logoUrl !== undefined ? { logoUrl: parsed.logoUrl } : {}),
          ...(parsed.locale !== undefined ? { locale: parsed.locale } : {}),
          ...(parsed.timezone !== undefined ? { timezone: parsed.timezone } : {}),
        },
        select: organizationSelect,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new OrganizationError(ORGANIZATION_ERROR_CODES.SLUG_CONFLICT)
      }

      throw error
    }
  }
}

export const createOrganizationRecord = createCreateOrganizationRecord(prisma)
