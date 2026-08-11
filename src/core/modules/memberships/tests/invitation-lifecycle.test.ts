import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createFindProfileIdByNormalizedAuthEmail } from '@/core/identity/profile/services/find-profile-id-by-normalized-auth-email'
import {
  INVITATION_ERROR_CODES,
  InvitationError,
  type InvitationErrorCode,
} from '@/core/modules/memberships/errors/invitation-error'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { createInvitationRepository } from '@/core/modules/memberships/repositories/invitation-repository'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { hashInvitationToken } from '@/core/modules/memberships/security/invitation-token'
import { createInvitationService } from '@/core/modules/memberships/services/create-invitation'
import { createExpireInvitationService } from '@/core/modules/memberships/services/expire-invitation'
import {
  createInvitationLifecycleSupport,
  INVITATION_LIFETIME_HOURS,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import { createResendInvitationService } from '@/core/modules/memberships/services/resend-invitation'
import { createRevokeInvitationService } from '@/core/modules/memberships/services/revoke-invitation'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const TEST_PREFIX = 'm042-m046-test-'
const INITIAL_NOW = new Date('2026-08-11T12:00:00.000Z')
const INVITATION_LIFETIME_MS = INVITATION_LIFETIME_HOURS * 60 * 60 * 1000

type TestContext = Awaited<ReturnType<typeof createTestContext>>

async function cleanupInvitationLifecycleRecords(): Promise<void> {
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

async function createTestContext(options?: {
  beforeTransaction?: () => Promise<void>
}) {
  const { prisma } = await import('@/lib/prisma')
  const { seedSystemRoles } =
    await import('@/core/modules/roles/seed/seed-system-roles')

  await seedSystemRoles(prisma)

  const [memberRole, ownerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'OWNER' } }),
  ])
  const suffix = randomUUID().slice(0, 18)
  const actorProfileId = randomUUID()
  const activeRecipientProfileId = randomUUID()
  const suspendedRecipientProfileId = randomUUID()
  const removedRecipientProfileId = randomUUID()
  const [organization] = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Invitation Lifecycle Test',
        slug: `${TEST_PREFIX}${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: actorProfileId,
        username: `${TEST_PREFIX}actor-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: activeRecipientProfileId,
        username: `${TEST_PREFIX}active-${suffix}`,
        authEmailNormalized: 'active@example.com',
      },
    }),
    prisma.profile.create({
      data: {
        id: suspendedRecipientProfileId,
        username: `${TEST_PREFIX}suspended-${suffix}`,
        authEmailNormalized: 'suspended@example.com',
      },
    }),
    prisma.profile.create({
      data: {
        id: removedRecipientProfileId,
        username: `${TEST_PREFIX}removed-${suffix}`,
        authEmailNormalized: 'removed@example.com',
      },
    }),
  ])

  const [actorMembership] = await Promise.all([
    prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: actorProfileId,
        roleId: memberRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: activeRecipientProfileId,
        roleId: memberRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: suspendedRecipientProfileId,
        roleId: memberRole.id,
        status: 'SUSPENDED',
        suspendedAt: INITIAL_NOW,
      },
    }),
    prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: removedRecipientProfileId,
        roleId: memberRole.id,
        status: 'REMOVED',
        removedAt: INITIAL_NOW,
      },
    }),
  ])

  const clock = {
    now: new Date(INITIAL_NOW),
  }
  let tokenSequence = 0
  const support = createInvitationLifecycleSupport({
    invitationRepository: createInvitationRepository(prisma),
    membershipRepository: createMembershipRepository(prisma),
    runInTransaction: async (operation) => {
      await options?.beforeTransaction?.()

      return prisma.$transaction((client) =>
        operation({
          invitationRepository: createInvitationRepository(client),
          membershipRepository: createMembershipRepository(client),
          findProfileIdByNormalizedAuthEmail:
            createFindProfileIdByNormalizedAuthEmail(client),
        }),
      )
    },
    getCurrentActorProfileId: async () => actorProfileId,
    getCurrentRecipientIdentity: async () => ({
      profileId: actorProfileId,
      email: 'actor@example.com',
    }),
    findOrganizationById: (organizationId) =>
      prisma.organization.findUnique({ where: { id: organizationId } }),
    findRoleById: (roleId) => prisma.role.findUnique({ where: { id: roleId } }),
    generateInvitationToken: () => {
      tokenSequence += 1
      return Buffer.alloc(32, tokenSequence).toString('base64url')
    },
    hashInvitationToken,
    invitationLifetimeMs: INVITATION_LIFETIME_MS,
    now: () => new Date(clock.now),
  })

  return {
    actorMembership,
    clock,
    memberRole,
    organization,
    ownerRole,
    prisma,
    activeRecipientProfileId,
    createInvitation: createInvitationService(support),
    expireInvitation: createExpireInvitationService(support),
    resendInvitation: createResendInvitationService(support),
    revokeInvitation: createRevokeInvitationService(support),
  }
}

async function expectInvitationError(
  promise: Promise<unknown>,
  code: InvitationErrorCode,
): Promise<void> {
  try {
    await promise
    expect.unreachable('Expected InvitationError to be thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(InvitationError)
    expect((error as InvitationError).code).toBe(code)
  }
}

async function createInvitationForTest(
  context: TestContext,
  recipientEmail = 'recipient@example.com',
) {
  return context.createInvitation({
    organizationId: context.organization.id,
    recipientEmail,
    roleId: context.memberRole.id,
  })
}

describe('Invitation lifecycle services (M-042 → M-046)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupInvitationLifecycleRecords()
  })

  afterEach(async () => {
    await cleanupInvitationLifecycleRecords()
  })

  afterAll(async () => {
    await cleanupInvitationLifecycleRecords()
  })

  it('creates a secure PENDING invitation with a 72-hour lifetime', async () => {
    const context = await createTestContext()
    const created = await createInvitationForTest(
      context,
      '  Person@Example.COM  ',
    )
    const persisted =
      await context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      })

    expect(created.rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(created.invitation).toMatchObject({
      organizationId: context.organization.id,
      recipientEmail: 'Person@Example.COM',
      roleId: context.memberRole.id,
      status: 'PENDING',
    })
    expect(persisted.normalizedEmail).toBe('person@example.com')
    expect(persisted.invitedByMembershipId).toBe(context.actorMembership.id)
    expect(persisted.tokenHash).toBe(hashInvitationToken(created.rawToken))
    expect(persisted.tokenHash).not.toBe(created.rawToken)
    expect(persisted.expiresAt).toEqual(
      new Date(INITIAL_NOW.getTime() + INVITATION_LIFETIME_MS),
    )
    expect(JSON.stringify(created.invitation)).not.toMatch(/tokenHash|rawToken/)
  })

  it('rejects active and suspended recipients while allowing removed rejoin intent', async () => {
    const context = await createTestContext()

    await expectInvitationError(
      createInvitationForTest(context, 'active@example.com'),
      INVITATION_ERROR_CODES.ALREADY_MEMBER,
    )
    await expect(
      createInvitationForTest(context, 'suspended@example.com'),
    ).rejects.toMatchObject({
      name: 'MembershipError',
      code: MEMBERSHIP_ERROR_CODES.SUSPENDED,
    } satisfies Partial<MembershipError>)
    await expect(
      createInvitationForTest(context, 'removed@example.com'),
    ).resolves.toMatchObject({
      invitation: {
        status: 'PENDING',
      },
    })
  })

  it('revalidates recipient Membership inside the transaction', async () => {
    const contextRef: { current: TestContext | null } = { current: null }
    const context = await createTestContext({
      beforeTransaction: async () => {
        if (!contextRef.current) {
          throw new Error('Test context is not initialized')
        }

        await contextRef.current.prisma.organizationMembership.update({
          where: {
            organizationId_profileId: {
              organizationId: contextRef.current.organization.id,
              profileId: contextRef.current.activeRecipientProfileId,
            },
          },
          data: {
            status: 'ACTIVE',
            suspendedAt: null,
            removedAt: null,
          },
        })
      },
    })
    contextRef.current = context
    await context.prisma.organizationMembership.update({
      where: {
        organizationId_profileId: {
          organizationId: context.organization.id,
          profileId: context.activeRecipientProfileId,
        },
      },
      data: {
        status: 'REMOVED',
        removedAt: INITIAL_NOW,
      },
    })

    await expectInvitationError(
      createInvitationForTest(context, 'active@example.com'),
      INVITATION_ERROR_CODES.ALREADY_MEMBER,
    )
  })

  it('rejects OWNER invitations and actors without ACTIVE Membership', async () => {
    const context = await createTestContext()

    await expect(
      context.createInvitation({
        organizationId: context.organization.id,
        recipientEmail: 'owner@example.com',
        roleId: context.ownerRole.id,
      }),
    ).rejects.toMatchObject({
      name: 'MembershipError',
      code: MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED,
    } satisfies Partial<MembershipError>)

    await context.prisma.organizationMembership.update({
      where: { id: context.actorMembership.id },
      data: {
        status: 'SUSPENDED',
        suspendedAt: INITIAL_NOW,
      },
    })

    await expect(
      createInvitationForTest(context, 'blocked@example.com'),
    ).rejects.toMatchObject({
      name: 'MembershipError',
      code: MEMBERSHIP_ERROR_CODES.SUSPENDED,
    } satisfies Partial<MembershipError>)
  })

  it('prevents concurrent duplicate PENDING invitations deterministically', async () => {
    const context = await createTestContext()
    const results = await Promise.allSettled([
      createInvitationForTest(context),
      createInvitationForTest(context),
    ])
    const invitations = await context.prisma.organizationInvitation.findMany({
      where: {
        organizationId: context.organization.id,
        normalizedEmail: 'recipient@example.com',
        status: 'PENDING',
      },
    })

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    )
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    )
    expect(invitations).toHaveLength(1)

    const rejection = results.find(({ status }) => status === 'rejected')
    expect(rejection).toMatchObject({
      reason: {
        name: 'InvitationError',
        code: INVITATION_ERROR_CODES.ALREADY_PENDING,
      },
    })
  })

  it('expires a stale duplicate before creating a new PENDING record', async () => {
    const context = await createTestContext()
    const original = await createInvitationForTest(context)
    context.clock.now = new Date(
      INITIAL_NOW.getTime() + INVITATION_LIFETIME_MS + 1,
    )

    const replacement = await createInvitationForTest(context)
    const records = await context.prisma.organizationInvitation.findMany({
      where: {
        organizationId: context.organization.id,
        normalizedEmail: 'recipient@example.com',
      },
      orderBy: { createdAt: 'asc' },
    })

    expect(replacement.invitation.id).not.toBe(original.invitation.id)
    expect(records.map(({ status }) => status).sort()).toEqual([
      'EXPIRED',
      'PENDING',
    ])
    expect(
      records.find(({ id }) => id === original.invitation.id)?.updatedAt,
    ).toEqual(context.clock.now)
  })

  it('revokes only a live PENDING invitation without mutating Memberships', async () => {
    const context = await createTestContext()
    const created = await createInvitationForTest(context)
    const membershipCount = await context.prisma.organizationMembership.count({
      where: { organizationId: context.organization.id },
    })

    const revoked = await context.revokeInvitation(created.invitation.id)

    expect(revoked.status).toBe('REVOKED')
    expect(revoked.revokedAt).toBe(INITIAL_NOW.toISOString())
    expect(revoked.updatedAt).toBe(INITIAL_NOW.toISOString())
    await expectInvitationError(
      context.revokeInvitation(created.invitation.id),
      INVITATION_ERROR_CODES.REVOKED,
    )
    await expect(
      context.prisma.organizationMembership.count({
        where: { organizationId: context.organization.id },
      }),
    ).resolves.toBe(membershipCount)
  })

  it('formally expires only overdue PENDING invitations', async () => {
    const context = await createTestContext()
    const created = await createInvitationForTest(context)

    await expectInvitationError(
      context.expireInvitation(created.invitation.id),
      INVITATION_ERROR_CODES.NOT_PENDING,
    )

    context.clock.now = new Date(
      INITIAL_NOW.getTime() + INVITATION_LIFETIME_MS + 1,
    )

    await expect(
      context.expireInvitation(created.invitation.id),
    ).resolves.toMatchObject({
      status: 'EXPIRED',
      updatedAt: context.clock.now.toISOString(),
    })
  })

  it('rotates a live resend token without extending expiration', async () => {
    const context = await createTestContext()
    const created = await createInvitationForTest(context)
    const originalHash = hashInvitationToken(created.rawToken)
    const originalExpiresAt = created.invitation.expiresAt

    const resent = await context.resendInvitation(created.invitation.id)

    expect(resent.invitation.id).toBe(created.invitation.id)
    expect(resent.invitation.expiresAt).toBe(originalExpiresAt)
    expect(resent.invitation.updatedAt).toBe(INITIAL_NOW.toISOString())
    expect(resent.rawToken).not.toBe(created.rawToken)
    await expect(
      context.prisma.organizationInvitation.findUnique({
        where: { tokenHash: originalHash },
      }),
    ).resolves.toBeNull()
    await expect(
      context.prisma.organizationInvitation.findUnique({
        where: { tokenHash: hashInvitationToken(resent.rawToken) },
      }),
    ).resolves.toMatchObject({ id: created.invitation.id })
  })

  it('allows only one of two concurrent token resends to win', async () => {
    const context = await createTestContext()
    const created = await createInvitationForTest(context)

    const results = await Promise.allSettled([
      context.resendInvitation(created.invitation.id),
      context.resendInvitation(created.invitation.id),
    ])
    const successes = results.filter(
      (result): result is PromiseFulfilledResult<Awaited<typeof created>> =>
        result.status === 'fulfilled',
    )
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
    const persisted =
      await context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      })

    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    expect(failures[0]?.reason).toMatchObject({
      name: 'InvitationError',
      code: INVITATION_ERROR_CODES.NOT_PENDING,
    })
    expect(persisted.tokenHash).toBe(
      hashInvitationToken(successes[0]!.value.rawToken),
    )
    expect(persisted.updatedAt).toEqual(INITIAL_NOW)
  })

  it('rejects resending a persisted OWNER invitation', async () => {
    const context = await createTestContext()
    const invitation = await context.prisma.organizationInvitation.create({
      data: {
        organizationId: context.organization.id,
        recipientEmail: 'owner-resend@example.com',
        normalizedEmail: 'owner-resend@example.com',
        roleId: context.ownerRole.id,
        status: 'PENDING',
        tokenHash: hashInvitationToken(
          Buffer.alloc(32, 99).toString('base64url'),
        ),
        expiresAt: new Date(INITIAL_NOW.getTime() + INVITATION_LIFETIME_MS),
        invitedByMembershipId: context.actorMembership.id,
      },
    })

    await expect(context.resendInvitation(invitation.id)).rejects.toMatchObject(
      {
        name: 'MembershipError',
        code: MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED,
      } satisfies Partial<MembershipError>,
    )
  })

  it('reinvites an expired record with a new row and rejects terminal resends', async () => {
    const context = await createTestContext()
    const expired = await createInvitationForTest(
      context,
      'expired@example.com',
    )
    const revoked = await createInvitationForTest(
      context,
      'revoked@example.com',
    )
    const accepted = await createInvitationForTest(
      context,
      'accepted@example.com',
    )
    await context.revokeInvitation(revoked.invitation.id)
    await context.prisma.organizationInvitation.update({
      where: { id: accepted.invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: INITIAL_NOW,
        acceptedByProfileId: context.actorMembership.profileId,
      },
    })
    context.clock.now = new Date(
      INITIAL_NOW.getTime() + INVITATION_LIFETIME_MS + 1,
    )

    const reinvited = await context.resendInvitation(expired.invitation.id)
    const expiredRecord =
      await context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: expired.invitation.id },
      })

    expect(expiredRecord.status).toBe('EXPIRED')
    expect(reinvited.invitation.id).not.toBe(expired.invitation.id)
    expect(reinvited.invitation.expiresAt).toBe(
      new Date(
        context.clock.now.getTime() + INVITATION_LIFETIME_MS,
      ).toISOString(),
    )
    await expectInvitationError(
      context.resendInvitation(revoked.invitation.id),
      INVITATION_ERROR_CODES.REVOKED,
    )
    await expectInvitationError(
      context.resendInvitation(accepted.invitation.id),
      INVITATION_ERROR_CODES.ALREADY_ACCEPTED,
    )
  })
})
