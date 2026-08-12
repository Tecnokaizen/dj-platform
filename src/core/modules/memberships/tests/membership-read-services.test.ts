import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { createOrganizationMembershipListingServices } from '@/core/modules/memberships/services/list-memberships-for-organization'
import { membershipReadRepository } from '@/core/modules/memberships/services/membership-read-support'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const TEST_PREFIX = 'm029-m032-test-'

type ReadTestContext = {
  activeMembershipId: string
  suspendedMembershipId: string
  removedMembershipId: string
  organizationAId: string
  organizationBId: string
  profileAId: string
  profileBId: string
}

async function cleanupMembershipReadRecords(): Promise<void> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')
  const organizations = await prisma.organization.findMany({
    where: {
      slug: {
        startsWith: TEST_PREFIX,
      },
    },
    select: {
      id: true,
    },
  })
  const organizationIds = organizations.map(({ id }) => id)

  if (organizationIds.length > 0) {
    await prisma.organizationInvitation.deleteMany({
      where: {
        organizationId: {
          in: organizationIds,
        },
      },
    })
    await prisma.organizationMembership.deleteMany({
      where: {
        organizationId: {
          in: organizationIds,
        },
      },
    })
    await prisma.organization.deleteMany({
      where: {
        id: {
          in: organizationIds,
        },
      },
    })
  }

  await prisma.profile.deleteMany({
    where: {
      username: {
        startsWith: TEST_PREFIX,
      },
    },
  })
}

async function createReadTestContext(): Promise<ReadTestContext> {
  const { prisma } = await import('@/lib/prisma')
  const { seedSystemRoles } = await import(
    '@/core/modules/roles/seed/seed-system-roles'
  )

  await seedSystemRoles(prisma)

  const memberRole = await prisma.role.findUniqueOrThrow({
    where: { key: 'MEMBER' },
  })
  const suffix = randomUUID().slice(0, 18)
  const profileAId = randomUUID()
  const profileBId = randomUUID()
  const [organizationA, organizationB] = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Membership Reads A',
        slug: `${TEST_PREFIX}a-${suffix}`,
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Membership Reads B',
        slug: `${TEST_PREFIX}b-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: profileAId,
        username: `${TEST_PREFIX}a-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: profileBId,
        username: `${TEST_PREFIX}b-${suffix}`,
      },
    }),
  ])

  const [activeMembership, suspendedMembership, removedMembership] =
    await Promise.all([
      prisma.organizationMembership.create({
        data: {
          organizationId: organizationA.id,
          profileId: profileAId,
          roleId: memberRole.id,
          status: 'ACTIVE',
        },
      }),
      prisma.organizationMembership.create({
        data: {
          organizationId: organizationA.id,
          profileId: profileBId,
          roleId: memberRole.id,
          status: 'SUSPENDED',
          suspendedAt: new Date(),
        },
      }),
      prisma.organizationMembership.create({
        data: {
          organizationId: organizationB.id,
          profileId: profileAId,
          roleId: memberRole.id,
          status: 'REMOVED',
          removedAt: new Date(),
        },
      }),
    ])

  return {
    activeMembershipId: activeMembership.id,
    suspendedMembershipId: suspendedMembership.id,
    removedMembershipId: removedMembership.id,
    organizationAId: organizationA.id,
    organizationBId: organizationB.id,
    profileAId,
    profileBId,
  }
}

describe('Membership read services (M-029 → M-032)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupMembershipReadRecords()
  })

  afterEach(async () => {
    await cleanupMembershipReadRecords()
  })

  afterAll(async () => {
    await cleanupMembershipReadRecords()
  })

  it('gets Membership by id as a stable DTO and rejects missing records', async () => {
    const context = await createReadTestContext()
    const { getMembership } = await import(
      '@/core/modules/memberships/services/get-membership'
    )

    const membership = await getMembership(context.activeMembershipId)
    expect(membership).toMatchObject({
      id: context.activeMembershipId,
      organizationId: context.organizationAId,
      profileId: context.profileAId,
      status: 'ACTIVE',
      suspendedAt: null,
      removedAt: null,
    })
    expect(membership.createdAt).toEqual(expect.any(String))
    expect(membership.updatedAt).toEqual(expect.any(String))

    await expect(getMembership(randomUUID())).rejects.toMatchObject({
      name: 'MembershipError',
      code: MEMBERSHIP_ERROR_CODES.NOT_FOUND,
    } satisfies Partial<MembershipError>)
  })

  it('gets the canonical Organization/Profile relationship or null', async () => {
    const context = await createReadTestContext()
    const { getMembershipForProfile } = await import(
      '@/core/modules/memberships/services/get-membership-for-profile'
    )

    await expect(
      getMembershipForProfile(context.organizationAId, context.profileBId)
    ).resolves.toMatchObject({
      id: context.suspendedMembershipId,
      status: 'SUSPENDED',
    })
    await expect(
      getMembershipForProfile(context.organizationBId, context.profileBId)
    ).resolves.toBeNull()
  })

  it('reports active belonging only for an ACTIVE Membership', async () => {
    const context = await createReadTestContext()
    const { hasActiveMembership } = await import(
      '@/core/modules/memberships/services/has-active-membership'
    )

    await expect(
      hasActiveMembership(context.organizationAId, context.profileAId)
    ).resolves.toBe(true)
    await expect(
      hasActiveMembership(context.organizationAId, context.profileBId)
    ).resolves.toBe(false)
    await expect(
      hasActiveMembership(context.organizationBId, context.profileAId)
    ).resolves.toBe(false)
  })

  it('lists Memberships by Organization with optional and ACTIVE filters', async () => {
    const context = await createReadTestContext()
    const {
      listActiveMembershipsForOrganization,
      listMembershipsForOrganization,
    } = createOrganizationMembershipListingServices(membershipReadRepository)

    const all = await listMembershipsForOrganization(context.organizationAId)
    const suspended = await listMembershipsForOrganization(
      context.organizationAId,
      'SUSPENDED'
    )
    const active = await listActiveMembershipsForOrganization(
      context.organizationAId
    )

    expect(all).toHaveLength(2)
    expect(suspended).toHaveLength(1)
    expect(suspended[0]?.id).toBe(context.suspendedMembershipId)
    expect(active).toHaveLength(1)
    expect(active[0]?.id).toBe(context.activeMembershipId)
  })

  it('lists Memberships by Profile with a strict ACTIVE variant', async () => {
    const context = await createReadTestContext()
    const {
      listActiveMembershipsForProfile,
      listMembershipsForProfile,
    } = await import(
      '@/core/modules/memberships/services/list-memberships-for-profile'
    )

    const all = await listMembershipsForProfile(context.profileAId)
    const active = await listActiveMembershipsForProfile(context.profileAId)

    expect(all.map(({ id }) => id).sort()).toEqual(
      [context.activeMembershipId, context.removedMembershipId].sort()
    )
    expect(active).toHaveLength(1)
    expect(active[0]?.id).toBe(context.activeMembershipId)
  })
})
