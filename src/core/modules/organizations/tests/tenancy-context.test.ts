import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { PROFILE_ERROR_CODES } from '@/core/identity/profile/errors/profile-error'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import {
  ORGANIZATION_ERROR_CODES,
} from '@/core/modules/organizations/errors/organization-error'
import {
  createListUserOrganizationsService,
  listUserOrganizationsDependencies,
} from '@/core/modules/organizations/services/list-user-organizations'
import {
  createResolveOrganizationContextService,
  createSwitchActiveOrganizationService,
  resolveOrganizationContextDependencies,
} from '@/core/modules/organizations/services/switch-active-organization'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import {
  createOwnedOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'
import type { OrganizationStatus } from '@/core/modules/organizations/types/organization-status'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'

const SLUG_PREFIX = 'test-tenancy-context-'
const PROFILE_PREFIX = 'test-context-'

async function cleanupTenancyContextRecords() {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')
  await deleteOrganizationTestRecords(prisma, {
    slug: { startsWith: SLUG_PREFIX },
  })

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

async function createOrganization(
  label: string,
  status: OrganizationStatus = 'ACTIVE'
) {
  const { prisma } = await import('@/lib/prisma')

  const { organization } = await createOwnedOrganizationTestRecord(prisma, {
    name: `Context ${label}`,
    slug: `${SLUG_PREFIX}${label}-${randomUUID().slice(0, 8)}`,
  })

  if (status !== 'ACTIVE') {
    return prisma.organization.update({
      where: { id: organization.id },
      data: {
        status,
        ...(status === 'ARCHIVED' ? { archivedAt: new Date() } : {}),
      },
    })
  }

  return organization
}

describe('Tenancy discovery and context (M-085 → M-086)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupTenancyContextRecords()
    const { prisma } = await import('@/lib/prisma')
    await seedSystemRoles(prisma)
  })

  afterAll(async () => {
    await cleanupTenancyContextRecords()
    const { prisma } = await import('@/lib/prisma')
    await prisma.$disconnect()
  })

  it('lists only Organizations reached through the current Profile ACTIVE Memberships', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('list-owner')
    const otherProfile = await createProfile('list-other')
    const role = await prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } })
    const activeOrganization = await createOrganization('list-active')
    const suspendedMembershipOrganization =
      await createOrganization('list-suspended-membership')
    const removedMembershipOrganization =
      await createOrganization('list-removed-membership')
    const unrelatedOrganization = await createOrganization('list-unrelated')

    await prisma.organizationMembership.createMany({
      data: [
        {
          organizationId: activeOrganization.id,
          profileId: profile.id,
          roleId: role.id,
          status: 'ACTIVE',
        },
        {
          organizationId: suspendedMembershipOrganization.id,
          profileId: profile.id,
          roleId: role.id,
          status: 'SUSPENDED',
          suspendedAt: new Date(),
        },
        {
          organizationId: removedMembershipOrganization.id,
          profileId: profile.id,
          roleId: role.id,
          status: 'REMOVED',
          removedAt: new Date(),
        },
        {
          organizationId: unrelatedOrganization.id,
          profileId: otherProfile.id,
          roleId: role.id,
          status: 'ACTIVE',
        },
      ],
    })
    const listUserOrganizations = createListUserOrganizationsService({
      ...listUserOrganizationsDependencies,
      getCurrentProfileId: async () => profile.id,
    })

    const organizations = await listUserOrganizations()

    expect(organizations.map(({ id }) => id)).toEqual([activeOrganization.id])
  })

  it('returns an empty list for an authenticated Profile without Memberships', async () => {
    const profile = await createProfile('empty')
    const listUserOrganizations = createListUserOrganizationsService({
      ...listUserOrganizationsDependencies,
      getCurrentProfileId: async () => profile.id,
    })

    await expect(listUserOrganizations()).resolves.toEqual([])
  })

  it('rejects Organization discovery without an authenticated Profile', async () => {
    const listUserOrganizations = createListUserOrganizationsService({
      ...listUserOrganizationsDependencies,
      getCurrentProfileId: async () => null,
    })

    await expect(listUserOrganizations()).rejects.toMatchObject({
      code: PROFILE_ERROR_CODES.NOT_FOUND,
    })
  })

  it('builds a trusted context from persisted Profile, Membership and Organization data', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('context')
    const organization = await createOrganization('context')
    const role = await prisma.role.findUniqueOrThrow({ where: { key: 'ADMIN' } })
    const membership = await prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: profile.id,
        roleId: role.id,
        status: 'ACTIVE',
      },
    })
    const resolveOrganizationContext =
      createResolveOrganizationContextService({
        ...resolveOrganizationContextDependencies,
        getCurrentProfileId: async () => profile.id,
      })

    await expect(
      resolveOrganizationContext(organization.id)
    ).resolves.toEqual({
      profileId: profile.id,
      organizationId: organization.id,
      membershipId: membership.id,
      roleId: role.id,
      roleKey: 'ADMIN',
    })
  })

  it('rejects tenant context without an authenticated Profile', async () => {
    const resolveOrganizationContext =
      createResolveOrganizationContextService({
        ...resolveOrganizationContextDependencies,
        getCurrentProfileId: async () => null,
      })

    await expect(
      resolveOrganizationContext(randomUUID())
    ).rejects.toMatchObject({
      code: PROFILE_ERROR_CODES.NOT_FOUND,
    })
  })

  it('does not accept another Profile Membership for tenant context', async () => {
    const { prisma } = await import('@/lib/prisma')
    const memberProfile = await createProfile('member-profile')
    const currentProfile = await createProfile('current-profile')
    const organization = await createOrganization('other-profile')
    const role = await prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } })

    await prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: memberProfile.id,
        roleId: role.id,
        status: 'ACTIVE',
      },
    })
    const resolveOrganizationContext =
      createResolveOrganizationContextService({
        ...resolveOrganizationContextDependencies,
        getCurrentProfileId: async () => currentProfile.id,
      })

    await expect(
      resolveOrganizationContext(organization.id)
    ).rejects.toMatchObject({
      code: MEMBERSHIP_ERROR_CODES.NOT_ACTIVE,
    })
  })

  it.each([
    ['SUSPENDED', { suspendedAt: new Date() }],
    ['REMOVED', { removedAt: new Date() }],
  ] as const)('rejects a %s Membership as tenant context', async (status, dates) => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile(`membership-${status.toLowerCase()}`)
    const organization = await createOrganization(`membership-${status.toLowerCase()}`)
    const role = await prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } })

    await prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: profile.id,
        roleId: role.id,
        status,
        ...dates,
      },
    })
    const resolveOrganizationContext =
      createResolveOrganizationContextService({
        ...resolveOrganizationContextDependencies,
        getCurrentProfileId: async () => profile.id,
      })

    await expect(
      resolveOrganizationContext(organization.id)
    ).rejects.toMatchObject({
      code: MEMBERSHIP_ERROR_CODES.NOT_ACTIVE,
    })
  })

  it.each(['SUSPENDED', 'ARCHIVED'] as const)(
    'rejects an %s Organization as active tenant context',
    async (status) => {
      const { prisma } = await import('@/lib/prisma')
      const profile = await createProfile(`organization-${status.toLowerCase()}`)
      const organization = await createOrganization(
        `organization-${status.toLowerCase()}`,
        status
      )
      const role = await prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } })

      await prisma.organizationMembership.create({
        data: {
          organizationId: organization.id,
          profileId: profile.id,
          roleId: role.id,
          status: 'ACTIVE',
        },
      })
      const resolveOrganizationContext =
        createResolveOrganizationContextService({
          ...resolveOrganizationContextDependencies,
          getCurrentProfileId: async () => profile.id,
        })

      await expect(
        resolveOrganizationContext(organization.id)
      ).rejects.toMatchObject({
        code: ORGANIZATION_ERROR_CODES.INVALID_STATE,
      })
    }
  )

  it('updates the injected context only after trusted validation succeeds', async () => {
    const context = {
      profileId: randomUUID(),
      organizationId: randomUUID(),
      membershipId: randomUUID(),
      roleId: randomUUID(),
      roleKey: 'MEMBER' as const,
    }
    const setActiveOrganizationContext = vi.fn(async () => undefined)
    const switchActiveOrganization = createSwitchActiveOrganizationService({
      resolveOrganizationContext: async () => context,
      setActiveOrganizationContext,
    })

    await expect(
      switchActiveOrganization(context.organizationId)
    ).resolves.toEqual(context)
    expect(setActiveOrganizationContext).toHaveBeenCalledOnce()
    expect(setActiveOrganizationContext).toHaveBeenCalledWith(context)
  })

  it('does not update context when tenant validation fails', async () => {
    const setActiveOrganizationContext = vi.fn(async () => undefined)
    const switchActiveOrganization = createSwitchActiveOrganizationService({
      resolveOrganizationContext: async () => {
        throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_ACTIVE)
      },
      setActiveOrganizationContext,
    })

    await expect(
      switchActiveOrganization(randomUUID())
    ).rejects.toMatchObject({
      code: MEMBERSHIP_ERROR_CODES.NOT_ACTIVE,
    })
    expect(setActiveOrganizationContext).not.toHaveBeenCalled()
  })
})
