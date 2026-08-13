import { randomUUID } from 'node:crypto'

import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import {
  createOwnedOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'
import { PrismaClient } from '@/generated/prisma/client'

const TEST_PREFIX = 'm064-m068-test-'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createIndependentTestClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida')
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

async function cleanupMembershipPersistenceRecords(): Promise<void> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')
  await deleteOrganizationTestRecords(prisma, {
    slug: { startsWith: TEST_PREFIX },
  })

  await prisma.profile.deleteMany({
    where: {
      username: {
        startsWith: TEST_PREFIX,
      },
    },
  })
}

async function createPersistenceContext() {
  const { prisma } = await import('@/lib/prisma')
  const { seedSystemRoles } =
    await import('@/core/modules/roles/seed/seed-system-roles')

  await seedSystemRoles(prisma)

  const role = await prisma.role.findUniqueOrThrow({
    where: { key: 'MEMBER' },
  })
  const suffix = randomUUID().slice(0, 18)
  const profileId = randomUUID()
  const { organization } = await createOwnedOrganizationTestRecord(prisma, {
    name: 'Membership Persistence Test',
    slug: `${TEST_PREFIX}${suffix}`,
  })
  await prisma.profile.create({
    data: {
      id: profileId,
      username: `${TEST_PREFIX}${suffix}`,
    },
  })

  return {
    organization,
    prisma,
    profileId,
    role,
  }
}

describe('Membership persistence (M-064 and M-068)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupMembershipPersistenceRecords()
  })

  afterEach(async () => {
    await cleanupMembershipPersistenceRecords()
  })

  afterAll(async () => {
    await cleanupMembershipPersistenceRecords()
  })

  it('generates a UUID and applies ACTIVE and timestamp defaults', async () => {
    const context = await createPersistenceContext()
    const membership = await context.prisma.organizationMembership.create({
      data: {
        organizationId: context.organization.id,
        profileId: context.profileId,
        roleId: context.role.id,
      },
    })
    const relatedOrganization = await context.prisma.organization.findUnique({
      where: { id: membership.organizationId },
      select: { id: true },
    })
    const relatedProfile = await context.prisma.profile.findUnique({
      where: { id: membership.profileId },
      select: { id: true },
    })
    const relatedRole = await context.prisma.role.findUnique({
      where: { id: membership.roleId },
      select: { id: true },
    })

    expect(membership.id).toMatch(UUID_PATTERN)
    expect(membership).toMatchObject({
      organizationId: context.organization.id,
      profileId: context.profileId,
      roleId: context.role.id,
      status: 'ACTIVE',
      suspendedAt: null,
      removedAt: null,
    })
    expect(relatedOrganization).toEqual({ id: context.organization.id })
    expect(relatedProfile).toEqual({ id: context.profileId })
    expect(relatedRole).toEqual({ id: context.role.id })
    expect(membership.createdAt).toBeInstanceOf(Date)
    expect(membership.updatedAt).toBeInstanceOf(Date)
  })

  it('keeps Organization, Profile and Role foreign keys required', async () => {
    const context = await createPersistenceContext()
    const columns = await context.prisma.$queryRaw<
      Array<{ column_name: string; is_nullable: string }>
    >`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'organization_memberships'
        AND column_name IN ('organization_id', 'profile_id', 'role_id')
      ORDER BY column_name
    `

    expect(columns).toEqual([
      { column_name: 'organization_id', is_nullable: 'NO' },
      { column_name: 'profile_id', is_nullable: 'NO' },
      { column_name: 'role_id', is_nullable: 'NO' },
    ])

    await expect(
      context.prisma.organizationMembership.create({
        data: {
          organizationId: context.organization.id,
          profileId: context.profileId,
          roleId: randomUUID(),
        },
      }),
    ).rejects.toMatchObject({ code: 'P2003' })
  })

  it('prevents repeated Organization/Profile relationships', async () => {
    const context = await createPersistenceContext()
    const data = {
      organizationId: context.organization.id,
      profileId: context.profileId,
      roleId: context.role.id,
    }

    await context.prisma.organizationMembership.create({ data })
    await expect(
      context.prisma.organizationMembership.create({ data }),
    ).rejects.toMatchObject({ code: 'P2002' })
    await expect(
      context.prisma.organizationMembership.count({
        where: {
          organizationId: context.organization.id,
          profileId: context.profileId,
        },
      }),
    ).resolves.toBe(1)
  })

  it('allows exactly one concurrent Organization/Profile creation', async () => {
    const context = await createPersistenceContext()
    const clientA = createIndependentTestClient()
    const clientB = createIndependentTestClient()
    const data = {
      organizationId: context.organization.id,
      profileId: context.profileId,
      roleId: context.role.id,
    }
    const results = await Promise.allSettled([
      clientA.organizationMembership.create({ data }),
      clientB.organizationMembership.create({ data }),
    ]).finally(async () => {
      await Promise.all([clientA.$disconnect(), clientB.$disconnect()])
    })

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    )
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    )
    await expect(
      context.prisma.organizationMembership.count({
        where: {
          organizationId: context.organization.id,
          profileId: context.profileId,
        },
      }),
    ).resolves.toBe(1)
  })
})
