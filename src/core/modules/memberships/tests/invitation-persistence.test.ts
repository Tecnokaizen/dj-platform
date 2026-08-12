import { randomBytes, randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import type { InvitationStatus } from '@/generated/prisma/client'

const TEST_PREFIX = 'm069-m070-test-'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createTokenHash(): string {
  return randomBytes(32).toString('hex')
}

async function cleanupInvitationPersistenceRecords(): Promise<void> {
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

async function createPersistenceContext() {
  const { prisma } = await import('@/lib/prisma')
  const { seedSystemRoles } =
    await import('@/core/modules/roles/seed/seed-system-roles')

  await seedSystemRoles(prisma)

  const role = await prisma.role.findUniqueOrThrow({
    where: { key: 'MEMBER' },
  })
  const suffix = randomUUID().slice(0, 18)
  const inviterProfileId = randomUUID()
  const acceptedProfileId = randomUUID()
  const organization = await prisma.organization.create({
    data: {
      name: 'Invitation Persistence Test',
      slug: `${TEST_PREFIX}${suffix}`,
    },
  })
  await prisma.profile.create({
    data: {
      id: inviterProfileId,
      username: `${TEST_PREFIX}inviter-${suffix}`,
    },
  })
  await prisma.profile.create({
    data: {
      id: acceptedProfileId,
      username: `${TEST_PREFIX}accepted-${suffix}`,
    },
  })
  const inviterMembership = await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      profileId: inviterProfileId,
      roleId: role.id,
    },
  })

  return {
    acceptedProfileId,
    inviterMembership,
    organization,
    prisma,
    role,
  }
}

describe('Invitation persistence (M-069 and M-070)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupInvitationPersistenceRecords()
  })

  afterEach(async () => {
    await cleanupInvitationPersistenceRecords()
  })

  afterAll(async () => {
    await cleanupInvitationPersistenceRecords()
  })

  it('generates a UUID, defaults to PENDING and resolves required relations', async () => {
    const context = await createPersistenceContext()
    const expiresAt = new Date(Date.now() + 60_000)
    const invitation = await context.prisma.organizationInvitation.create({
      data: {
        organizationId: context.organization.id,
        recipientEmail: 'person@example.com',
        normalizedEmail: 'person@example.com',
        roleId: context.role.id,
        tokenHash: createTokenHash(),
        expiresAt,
        invitedByMembershipId: context.inviterMembership.id,
      },
    })
    const relatedOrganization = await context.prisma.organization.findUnique({
      where: { id: invitation.organizationId },
      select: { id: true },
    })
    const relatedRole = await context.prisma.role.findUnique({
      where: { id: invitation.roleId },
      select: { id: true },
    })
    const relatedInviter =
      await context.prisma.organizationMembership.findUnique({
        where: { id: invitation.invitedByMembershipId },
        select: { id: true },
      })

    expect(invitation.id).toMatch(UUID_PATTERN)
    expect(invitation).toMatchObject({
      organizationId: context.organization.id,
      roleId: context.role.id,
      invitedByMembershipId: context.inviterMembership.id,
      acceptedByProfileId: null,
      acceptedAt: null,
      revokedAt: null,
      status: 'PENDING',
      expiresAt,
    })
    expect(relatedOrganization).toEqual({ id: context.organization.id })
    expect(relatedRole).toEqual({ id: context.role.id })
    expect(relatedInviter).toEqual({ id: context.inviterMembership.id })
    expect(invitation.createdAt).toBeInstanceOf(Date)
    expect(invitation.updatedAt).toBeInstanceOf(Date)
  })

  it('supports the optional accepted Profile relation without weakening required fields', async () => {
    const context = await createPersistenceContext()
    const acceptedAt = new Date()
    const invitation = await context.prisma.organizationInvitation.create({
      data: {
        organizationId: context.organization.id,
        recipientEmail: 'accepted@example.com',
        normalizedEmail: 'accepted@example.com',
        roleId: context.role.id,
        status: 'ACCEPTED',
        tokenHash: createTokenHash(),
        expiresAt: new Date(acceptedAt.getTime() + 60_000),
        invitedByMembershipId: context.inviterMembership.id,
        acceptedByProfileId: context.acceptedProfileId,
        acceptedAt,
      },
    })
    const acceptedProfile = await context.prisma.profile.findUnique({
      where: { id: context.acceptedProfileId },
      select: { id: true },
    })
    const requiredColumns = await context.prisma.$queryRaw<
      Array<{ column_name: string; is_nullable: string }>
    >`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'organization_invitations'
        AND column_name IN (
          'organization_id',
          'role_id',
          'token_hash',
          'expires_at',
          'invited_by_membership_id'
        )
      ORDER BY column_name
    `

    expect(acceptedProfile).toEqual({
      id: context.acceptedProfileId,
    })
    expect(invitation.acceptedByProfileId).toBe(context.acceptedProfileId)
    expect(requiredColumns).toEqual([
      { column_name: 'expires_at', is_nullable: 'NO' },
      { column_name: 'invited_by_membership_id', is_nullable: 'NO' },
      { column_name: 'organization_id', is_nullable: 'NO' },
      { column_name: 'role_id', is_nullable: 'NO' },
      { column_name: 'token_hash', is_nullable: 'NO' },
    ])
  })

  it('enforces global tokenHash uniqueness', async () => {
    const context = await createPersistenceContext()
    const tokenHash = createTokenHash()
    const baseData = {
      organizationId: context.organization.id,
      roleId: context.role.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
      invitedByMembershipId: context.inviterMembership.id,
    }

    await context.prisma.organizationInvitation.create({
      data: {
        ...baseData,
        recipientEmail: 'first@example.com',
        normalizedEmail: 'first@example.com',
      },
    })
    await expect(
      context.prisma.organizationInvitation.create({
        data: {
          ...baseData,
          recipientEmail: 'second@example.com',
          normalizedEmail: 'second@example.com',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it.each<InvitationStatus>(['ACCEPTED', 'REVOKED', 'EXPIRED'])(
    'allows a new PENDING invitation after the prior one becomes %s',
    async (terminalStatus) => {
      const context = await createPersistenceContext()
      const normalizedEmail = `${terminalStatus.toLowerCase()}@example.com`
      const expiresAt = new Date(Date.now() + 60_000)
      const original = await context.prisma.organizationInvitation.create({
        data: {
          organizationId: context.organization.id,
          recipientEmail: normalizedEmail,
          normalizedEmail,
          roleId: context.role.id,
          tokenHash: createTokenHash(),
          expiresAt,
          invitedByMembershipId: context.inviterMembership.id,
        },
      })

      await expect(
        context.prisma.organizationInvitation.create({
          data: {
            organizationId: context.organization.id,
            recipientEmail: normalizedEmail,
            normalizedEmail,
            roleId: context.role.id,
            tokenHash: createTokenHash(),
            expiresAt,
            invitedByMembershipId: context.inviterMembership.id,
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' })

      await context.prisma.organizationInvitation.update({
        where: { id: original.id },
        data: {
          status: terminalStatus,
          ...(terminalStatus === 'ACCEPTED'
            ? {
                acceptedByProfileId: context.acceptedProfileId,
                acceptedAt: new Date(),
              }
            : {}),
          ...(terminalStatus === 'REVOKED' ? { revokedAt: new Date() } : {}),
        },
      })

      await expect(
        context.prisma.organizationInvitation.create({
          data: {
            organizationId: context.organization.id,
            recipientEmail: normalizedEmail,
            normalizedEmail,
            roleId: context.role.id,
            tokenHash: createTokenHash(),
            expiresAt,
            invitedByMembershipId: context.inviterMembership.id,
          },
        }),
      ).resolves.toMatchObject({ status: 'PENDING' })
      await expect(
        context.prisma.organizationInvitation.count({
          where: {
            organizationId: context.organization.id,
            normalizedEmail,
            status: 'PENDING',
          },
        }),
      ).resolves.toBe(1)
    },
  )
})
