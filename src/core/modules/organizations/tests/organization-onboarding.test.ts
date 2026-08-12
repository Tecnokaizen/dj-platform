import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  PROFILE_ERROR_CODES,
} from '@/core/identity/profile/errors/profile-error'
import { MEMBERSHIP_ERROR_CODES } from '@/core/modules/memberships/errors/membership-error'
import {
  ORGANIZATION_ERROR_CODES,
} from '@/core/modules/organizations/errors/organization-error'
import {
  createOrganizationService,
  organizationOnboardingDependencies,
} from '@/core/modules/organizations/services/create-organization'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'

const SLUG_PREFIX = 'test-tenancy-onboarding-'
const PROFILE_PREFIX = 'test-tenancy-'

async function cleanupOnboardingRecords() {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')
  const organizations = await prisma.organization.findMany({
    where: {
      slug: {
        startsWith: SLUG_PREFIX,
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
        startsWith: PROFILE_PREFIX,
      },
    },
  })
}

async function createProfile(label: string) {
  const { prisma } = await import('@/lib/prisma')

  return prisma.profile.create({
    data: {
      id: randomUUID(),
      username: `${PROFILE_PREFIX}${label}-${randomUUID().slice(0, 8)}`,
    },
  })
}

describe('Organization onboarding (M-084)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupOnboardingRecords()
    const { prisma } = await import('@/lib/prisma')
    await seedSystemRoles(prisma)
  })

  afterAll(async () => {
    await cleanupOnboardingRecords()
    const { prisma } = await import('@/lib/prisma')
    await prisma.$disconnect()
  })

  it('creates an Organization and its initial ACTIVE OWNER atomically', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('owner')
    const createOrganization = createOrganizationService({
      ...organizationOnboardingDependencies,
      getCurrentProfileId: async () => profile.id,
    })
    const slug = `${SLUG_PREFIX}${randomUUID()}`

    const organization = await createOrganization({
      name: 'Test Tenant',
      slug,
      locale: 'es',
      timezone: 'Europe/Madrid',
    })

    const memberships = await prisma.organizationMembership.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        role: true,
      },
    })

    expect(organization.slug).toBe(slug)
    expect(memberships).toHaveLength(1)
    expect(memberships[0]).toMatchObject({
      profileId: profile.id,
      status: 'ACTIVE',
      suspendedAt: null,
      removedAt: null,
    })
    expect(memberships[0]?.role.key).toBe('OWNER')
  })

  it('rejects onboarding without an authenticated Profile', async () => {
    const { prisma } = await import('@/lib/prisma')
    const slug = `${SLUG_PREFIX}${randomUUID()}`
    const createOrganization = createOrganizationService({
      ...organizationOnboardingDependencies,
      getCurrentProfileId: async () => null,
    })

    await expect(
      createOrganization({ name: 'No Profile', slug })
    ).rejects.toMatchObject({
      code: PROFILE_ERROR_CODES.NOT_FOUND,
    })

    await expect(
      prisma.organization.findUnique({ where: { slug } })
    ).resolves.toBeNull()
  })

  it('rolls back Organization creation when OWNER Membership creation fails', async () => {
    const { prisma } = await import('@/lib/prisma')
    const slug = `${SLUG_PREFIX}${randomUUID()}`
    const createOrganization = createOrganizationService({
      ...organizationOnboardingDependencies,
      getCurrentProfileId: async () => randomUUID(),
    })

    await expect(
      createOrganization({ name: 'Rollback Tenant', slug })
    ).rejects.toBeDefined()

    await expect(
      prisma.organization.findUnique({ where: { slug } })
    ).resolves.toBeNull()
  })

  it('rejects a non-OWNER Role returned by the onboarding dependency', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('wrong-role')
    const slug = `${SLUG_PREFIX}${randomUUID()}`
    const admin = await prisma.role.findUniqueOrThrow({
      where: { key: 'ADMIN' },
    })
    const createOrganization = createOrganizationService({
      ...organizationOnboardingDependencies,
      getCurrentProfileId: async () => profile.id,
      resolveOwnerRole: async () => admin,
    })

    await expect(
      createOrganization({ name: 'Wrong Role Tenant', slug })
    ).rejects.toMatchObject({
      code: MEMBERSHIP_ERROR_CODES.OWNER_INVARIANT_VIOLATION,
    })

    await expect(
      prisma.organization.findUnique({ where: { slug } })
    ).resolves.toBeNull()
  })

  it('keeps slug conflicts deterministic without creating another owner', async () => {
    const { prisma } = await import('@/lib/prisma')
    const firstProfile = await createProfile('first-owner')
    const secondProfile = await createProfile('second-owner')
    const slug = `${SLUG_PREFIX}${randomUUID()}`
    const createFirst = createOrganizationService({
      ...organizationOnboardingDependencies,
      getCurrentProfileId: async () => firstProfile.id,
    })
    const createSecond = createOrganizationService({
      ...organizationOnboardingDependencies,
      getCurrentProfileId: async () => secondProfile.id,
    })

    const organization = await createFirst({ name: 'Unique Tenant', slug })

    await expect(
      createSecond({ name: 'Duplicate Tenant', slug })
    ).rejects.toMatchObject({
      code: ORGANIZATION_ERROR_CODES.SLUG_CONFLICT,
    })

    await expect(
      prisma.organizationMembership.count({
        where: { organizationId: organization.id },
      })
    ).resolves.toBe(1)
  })

  it('allows only one concurrent onboarding attempt for the same slug', async () => {
    const { prisma } = await import('@/lib/prisma')
    const firstProfile = await createProfile('concurrent-first')
    const secondProfile = await createProfile('concurrent-second')
    const slug = `${SLUG_PREFIX}${randomUUID()}`
    const first = createOrganizationService({
      ...organizationOnboardingDependencies,
      getCurrentProfileId: async () => firstProfile.id,
    })
    const second = createOrganizationService({
      ...organizationOnboardingDependencies,
      getCurrentProfileId: async () => secondProfile.id,
    })

    const results = await Promise.allSettled([
      first({ name: 'Concurrent Tenant A', slug }),
      second({ name: 'Concurrent Tenant B', slug }),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1)

    const organization = await prisma.organization.findUniqueOrThrow({
      where: { slug },
    })
    const memberships = await prisma.organizationMembership.findMany({
      where: { organizationId: organization.id },
      include: { role: true },
    })

    expect(memberships).toHaveLength(1)
    expect(memberships[0]?.role.key).toBe('OWNER')
  })
})
