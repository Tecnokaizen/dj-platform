import { randomUUID } from 'node:crypto'

import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { createCreateOrganizationRecord } from '@/core/modules/organizations/services/create-organization-record'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'

const OWNER_FIXTURE_PREFIX = 'oown-'

type CreateOwnedOrganizationInput = {
  name: string
  slug?: string
  logoUrl?: string | null
  locale?: string
  timezone?: string
}

export async function createOwnedOrganizationTestRecord(
  prisma: PrismaClient,
  input: CreateOwnedOrganizationInput,
  ownerProfileId?: string
) {
  await seedSystemRoles(prisma)
  const ownerRole = await prisma.role.findUniqueOrThrow({
    where: { key: SYSTEM_ROLE_KEYS.OWNER },
  })
  const resolvedOwnerProfileId = ownerProfileId ?? randomUUID()

  return prisma.$transaction(async (client) => {
    if (!ownerProfileId) {
      await client.profile.create({
        data: {
          id: resolvedOwnerProfileId,
          username: `${OWNER_FIXTURE_PREFIX}${randomUUID()}`,
        },
      })
    }

    const organization = await createCreateOrganizationRecord(client)(input)
    const ownerMembership = await createMembershipRepository(client).create({
      organizationId: organization.id,
      profileId: resolvedOwnerProfileId,
      roleId: ownerRole.id,
    })

    return { organization, ownerMembership, ownerProfileId: resolvedOwnerProfileId }
  })
}

export async function createOrganizationTestRecord(
  input: CreateOwnedOrganizationInput
) {
  const { prisma } = await import('@/lib/prisma')
  const { organization } = await createOwnedOrganizationTestRecord(
    prisma,
    input
  )
  return organization
}

export async function deleteOrganizationTestRecords(
  prisma: PrismaClient,
  where: Prisma.OrganizationWhereInput
): Promise<void> {
  await prisma.$transaction(async (client) => {
    const organizations = await client.organization.findMany({
      where,
      select: { id: true },
    })
    const organizationIds = organizations.map(({ id }) => id)

    if (organizationIds.length > 0) {
      await client.organizationInvitation.deleteMany({
        where: { organizationId: { in: organizationIds } },
      })
      await client.organizationMembership.deleteMany({
        where: { organizationId: { in: organizationIds } },
      })
      await client.organization.deleteMany({
        where: { id: { in: organizationIds } },
      })
    }

    await client.profile.deleteMany({
      where: {
        username: { startsWith: OWNER_FIXTURE_PREFIX },
        memberships: { none: {} },
      },
    })
  })
}
