import { randomBytes, randomUUID } from 'node:crypto'

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
  type MembershipErrorCode,
} from '@/core/modules/memberships/errors/membership-error'
import { createInvitationRepository } from '@/core/modules/memberships/repositories/invitation-repository'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { hashInvitationToken } from '@/core/modules/memberships/security/invitation-token'
import { createAcceptInvitationService } from '@/core/modules/memberships/services/accept-invitation'
import { createExpireInvitationService } from '@/core/modules/memberships/services/expire-invitation'
import {
  createInvitationLifecycleSupport,
  INVITATION_LIFETIME_HOURS,
  type AuthenticatedRecipientIdentity,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import { createResendInvitationService } from '@/core/modules/memberships/services/resend-invitation'
import { createRevokeInvitationService } from '@/core/modules/memberships/services/revoke-invitation'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const TEST_PREFIX = 'm047-m054-test-'
const INITIAL_NOW = new Date('2026-08-11T12:00:00.000Z')
const INVITATION_LIFETIME_MS = INVITATION_LIFETIME_HOURS * 60 * 60 * 1000

async function cleanupInvitationAcceptanceRecords(): Promise<void> {
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
  transactionMembershipStatusOverride?: string
}) {
  const { prisma } = await import('@/lib/prisma')
  const { seedSystemRoles } =
    await import('@/core/modules/roles/seed/seed-system-roles')

  await seedSystemRoles(prisma)

  const [memberRole, managerRole, ownerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { key: 'MEMBER' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'MANAGER' } }),
    prisma.role.findUniqueOrThrow({ where: { key: 'OWNER' } }),
  ])
  const suffix = randomUUID().slice(0, 18)
  const inviterProfileId = randomUUID()
  const recipientProfileId = randomUUID()
  const [organization] = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Invitation Acceptance Test',
        slug: `${TEST_PREFIX}${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: inviterProfileId,
        username: `${TEST_PREFIX}inviter-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: recipientProfileId,
        username: `${TEST_PREFIX}recipient-${suffix}`,
      },
    }),
  ])
  const inviterMembership = await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      profileId: inviterProfileId,
      roleId: memberRole.id,
      status: 'ACTIVE',
    },
  })
  const clock = {
    now: new Date(INITIAL_NOW),
  }
  const identity: {
    current: AuthenticatedRecipientIdentity | null
    onResolve?: () => void | Promise<void>
  } = {
    current: {
      profileId: recipientProfileId,
      email: ' Recipient@Example.COM ',
    },
  }
  const support = createInvitationLifecycleSupport({
    invitationRepository: createInvitationRepository(prisma),
    membershipRepository: createMembershipRepository(prisma),
    runInTransaction: (operation) =>
      prisma.$transaction((client) => {
        const repository = createMembershipRepository(client)
        const membershipRepository =
          options?.transactionMembershipStatusOverride === undefined
            ? repository
            : {
                ...repository,
                async findByOrganizationAndProfile(
                  organizationId: string,
                  profileId: string,
                ) {
                  const membership =
                    await repository.findByOrganizationAndProfile(
                      organizationId,
                      profileId,
                    )

                  return membership
                    ? {
                        ...membership,
                        status:
                          options.transactionMembershipStatusOverride as never,
                      }
                    : null
                },
              }

        return operation({
          invitationRepository: createInvitationRepository(client),
          membershipRepository,
          findProfileIdByNormalizedAuthEmail:
            createFindProfileIdByNormalizedAuthEmail(client),
        })
      }),
    getCurrentActorProfileId: async () => inviterProfileId,
    getCurrentRecipientIdentity: async () => {
      await identity.onResolve?.()
      return identity.current
    },
    findOrganizationById: (organizationId) =>
      prisma.organization.findUnique({ where: { id: organizationId } }),
    findRoleById: (roleId) => prisma.role.findUnique({ where: { id: roleId } }),
    generateInvitationToken: () => Buffer.alloc(32, 1).toString('base64url'),
    hashInvitationToken,
    invitationLifetimeMs: INVITATION_LIFETIME_MS,
    now: () => new Date(clock.now),
  })
  async function createInvitation(options?: {
    email?: string
    roleId?: string
    status?: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
    expiresAt?: Date
  }) {
    const rawToken = randomBytes(32).toString('base64url')
    const status = options?.status ?? 'PENDING'
    const accepted = status === 'ACCEPTED'

    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: organization.id,
        recipientEmail: options?.email ?? 'recipient@example.com',
        normalizedEmail: (options?.email ?? 'recipient@example.com')
          .trim()
          .toLowerCase(),
        roleId: options?.roleId ?? memberRole.id,
        status,
        tokenHash: hashInvitationToken(rawToken),
        expiresAt:
          options?.expiresAt ??
          new Date(INITIAL_NOW.getTime() + INVITATION_LIFETIME_MS),
        invitedByMembershipId: inviterMembership.id,
        acceptedByProfileId: accepted ? recipientProfileId : null,
        acceptedAt: accepted ? INITIAL_NOW : null,
        revokedAt: status === 'REVOKED' ? INITIAL_NOW : null,
      },
    })

    return {
      invitation,
      rawToken,
    }
  }

  return {
    acceptInvitation: createAcceptInvitationService(support),
    clock,
    createInvitation,
    expireInvitation: createExpireInvitationService(support),
    identity,
    managerRole,
    memberRole,
    organization,
    ownerRole,
    prisma,
    recipientProfileId,
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

async function expectMembershipError(
  promise: Promise<unknown>,
  code: MembershipErrorCode,
): Promise<void> {
  try {
    await promise
    expect.unreachable('Expected MembershipError to be thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(MembershipError)
    expect((error as MembershipError).code).toBe(code)
  }
}

describe('Invitation acceptance services (M-047 → M-054)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupInvitationAcceptanceRecords()
  })

  afterEach(async () => {
    await cleanupInvitationAcceptanceRecords()
  })

  afterAll(async () => {
    await cleanupInvitationAcceptanceRecords()
  })

  it('resolves only the SHA-256 token hash and validates canonical recipient identity', async () => {
    const context = await createTestContext()
    const created = await context.createInvitation()
    const wrongToken = Buffer.alloc(32, 99).toString('base64url')

    await expectInvitationError(
      context.acceptInvitation({ token: wrongToken }),
      INVITATION_ERROR_CODES.TOKEN_INVALID,
    )

    context.identity.current = {
      profileId: context.recipientProfileId,
      email: 'someone-else@example.com',
    }

    await expectInvitationError(
      context.acceptInvitation({ token: created.rawToken }),
      INVITATION_ERROR_CODES.RECIPIENT_MISMATCH,
    )

    await expect(
      context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      }),
    ).resolves.toMatchObject({ status: 'PENDING' })
    await expect(
      context.prisma.organizationMembership.findUnique({
        where: {
          organizationId_profileId: {
            organizationId: context.organization.id,
            profileId: context.recipientProfileId,
          },
        },
      }),
    ).resolves.toBeNull()
  })

  it('atomically creates an ACTIVE Membership and accepts the invitation', async () => {
    const context = await createTestContext()
    const created = await context.createInvitation()

    const result = await context.acceptInvitation({ token: created.rawToken })

    expect(result.membership).toMatchObject({
      organizationId: context.organization.id,
      profileId: context.recipientProfileId,
      roleId: context.memberRole.id,
      status: 'ACTIVE',
    })
    expect(result.invitation).toMatchObject({
      id: created.invitation.id,
      status: 'ACCEPTED',
      acceptedAt: INITIAL_NOW.toISOString(),
      updatedAt: INITIAL_NOW.toISOString(),
    })
    await expect(
      context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      }),
    ).resolves.toMatchObject({
      acceptedByProfileId: context.recipientProfileId,
      acceptedAt: INITIAL_NOW,
      status: 'ACCEPTED',
      updatedAt: INITIAL_NOW,
    })
  })

  it('rejects an existing ACTIVE Membership without changing its Role or invitation', async () => {
    const context = await createTestContext()
    const membership = await context.prisma.organizationMembership.create({
      data: {
        organizationId: context.organization.id,
        profileId: context.recipientProfileId,
        roleId: context.managerRole.id,
        status: 'ACTIVE',
      },
    })
    const created = await context.createInvitation()

    await expectInvitationError(
      context.acceptInvitation({ token: created.rawToken }),
      INVITATION_ERROR_CODES.ALREADY_MEMBER,
    )

    await expect(
      context.prisma.organizationMembership.findUniqueOrThrow({
        where: { id: membership.id },
      }),
    ).resolves.toMatchObject({
      roleId: context.managerRole.id,
      status: 'ACTIVE',
    })
    await expect(
      context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      }),
    ).resolves.toMatchObject({ status: 'PENDING' })
  })

  it('does not allow invitation acceptance to bypass suspension', async () => {
    const context = await createTestContext()
    const membership = await context.prisma.organizationMembership.create({
      data: {
        organizationId: context.organization.id,
        profileId: context.recipientProfileId,
        roleId: context.managerRole.id,
        status: 'SUSPENDED',
        suspendedAt: INITIAL_NOW,
      },
    })
    const created = await context.createInvitation()

    await expectMembershipError(
      context.acceptInvitation({ token: created.rawToken }),
      MEMBERSHIP_ERROR_CODES.SUSPENDED,
    )

    await expect(
      context.prisma.organizationMembership.findUniqueOrThrow({
        where: { id: membership.id },
      }),
    ).resolves.toMatchObject({
      roleId: context.managerRole.id,
      status: 'SUSPENDED',
    })
  })

  it('restores a REMOVED Membership using the invitation Role and existing row', async () => {
    const context = await createTestContext()
    const membership = await context.prisma.organizationMembership.create({
      data: {
        organizationId: context.organization.id,
        profileId: context.recipientProfileId,
        roleId: context.managerRole.id,
        status: 'REMOVED',
        removedAt: INITIAL_NOW,
      },
    })
    const created = await context.createInvitation()

    const result = await context.acceptInvitation({ token: created.rawToken })
    const memberships = await context.prisma.organizationMembership.findMany({
      where: {
        organizationId: context.organization.id,
        profileId: context.recipientProfileId,
      },
    })

    expect(result.membership).toMatchObject({
      id: membership.id,
      roleId: context.memberRole.id,
      status: 'ACTIVE',
      removedAt: null,
      suspendedAt: null,
    })
    expect(memberships).toHaveLength(1)
    expect(result.invitation.status).toBe('ACCEPTED')
  })

  it('checks real-time expiration even while persisted status is PENDING', async () => {
    const context = await createTestContext()
    const created = await context.createInvitation({
      expiresAt: new Date(INITIAL_NOW.getTime() - 1),
    })

    await expectInvitationError(
      context.acceptInvitation({ token: created.rawToken }),
      INVITATION_ERROR_CODES.EXPIRED,
    )

    await expect(
      context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      }),
    ).resolves.toMatchObject({ status: 'PENDING' })
  })

  it('uses a fresh transaction clock after identity I/O', async () => {
    const context = await createTestContext()
    const expiresAt = new Date(INITIAL_NOW.getTime() + 1)
    const created = await context.createInvitation({ expiresAt })
    context.identity.onResolve = () => {
      context.clock.now = new Date(expiresAt)
    }

    await expectInvitationError(
      context.acceptInvitation({ token: created.rawToken }),
      INVITATION_ERROR_CODES.EXPIRED,
    )
    await expect(
      context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      }),
    ).resolves.toMatchObject({ status: 'PENDING' })
    await expect(
      context.prisma.organizationMembership.findUnique({
        where: {
          organizationId_profileId: {
            organizationId: context.organization.id,
            profileId: context.recipientProfileId,
          },
        },
      }),
    ).resolves.toBeNull()
  })

  it('fails closed for an unrecognized Membership state', async () => {
    const context = await createTestContext({
      transactionMembershipStatusOverride: 'FUTURE_STATE',
    })
    await context.prisma.organizationMembership.create({
      data: {
        organizationId: context.organization.id,
        profileId: context.recipientProfileId,
        roleId: context.managerRole.id,
        status: 'REMOVED',
        removedAt: INITIAL_NOW,
      },
    })
    const created = await context.createInvitation()

    await expectMembershipError(
      context.acceptInvitation({ token: created.rawToken }),
      MEMBERSHIP_ERROR_CODES.INVALID_STATE,
    )
    await expect(
      context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      }),
    ).resolves.toMatchObject({ status: 'PENDING' })
  })

  it('requires an authenticated Profile with a canonical identity email', async () => {
    const context = await createTestContext()
    const created = await context.createInvitation()
    context.identity.current = null

    await expect(
      context.acceptInvitation({ token: created.rawToken }),
    ).rejects.toThrow('UNAUTHENTICATED')
    await expect(
      context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      }),
    ).resolves.toMatchObject({ status: 'PENDING' })
  })

  it('rejects inactive Organizations and protected OWNER Roles', async () => {
    const inactiveContext = await createTestContext()
    const inactiveInvitation = await inactiveContext.createInvitation()
    await inactiveContext.prisma.organization.update({
      where: { id: inactiveContext.organization.id },
      data: { status: 'SUSPENDED' },
    })

    await expect(
      inactiveContext.acceptInvitation({ token: inactiveInvitation.rawToken }),
    ).rejects.toMatchObject({
      name: 'OrganizationError',
      code: 'INVALID_ORGANIZATION_STATE',
    })

    const ownerContext = await createTestContext()
    const ownerInvitation = await ownerContext.createInvitation({
      roleId: ownerContext.ownerRole.id,
    })

    await expectMembershipError(
      ownerContext.acceptInvitation({ token: ownerInvitation.rawToken }),
      MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED,
    )
  })

  it('conditionally claims a PENDING invitation so only one concurrent acceptance succeeds', async () => {
    const context = await createTestContext()
    const created = await context.createInvitation()

    const results = await Promise.allSettled([
      context.acceptInvitation({ token: created.rawToken }),
      context.acceptInvitation({ token: created.rawToken }),
    ])
    const memberships = await context.prisma.organizationMembership.findMany({
      where: {
        organizationId: context.organization.id,
        profileId: context.recipientProfileId,
      },
    })
    const invitation =
      await context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      })

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    )
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    )
    expect(results.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: {
        name: 'InvitationError',
        code: INVITATION_ERROR_CODES.ALREADY_ACCEPTED,
      },
    })
    expect(memberships).toHaveLength(1)
    expect(invitation).toMatchObject({
      status: 'ACCEPTED',
      acceptedByProfileId: context.recipientProfileId,
    })
  })

  it('invalidates the old raw token after resend while the new token resolves', async () => {
    const context = await createTestContext()
    const created = await context.createInvitation()
    const resent = await context.resendInvitation(created.invitation.id)

    await expectInvitationError(
      context.acceptInvitation({ token: created.rawToken }),
      INVITATION_ERROR_CODES.TOKEN_INVALID,
    )
    await expect(
      context.acceptInvitation({ token: resent.rawToken }),
    ).resolves.toMatchObject({
      invitation: {
        id: created.invitation.id,
        status: 'ACCEPTED',
      },
    })
  })

  it('allows only accept or revoke to win the same PENDING invitation', async () => {
    const context = await createTestContext()
    const created = await context.createInvitation()
    const results = await Promise.allSettled([
      context.acceptInvitation({ token: created.rawToken }),
      context.revokeInvitation(created.invitation.id),
    ])
    const invitation =
      await context.prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: created.invitation.id },
      })
    const memberships = await context.prisma.organizationMembership.findMany({
      where: {
        organizationId: context.organization.id,
        profileId: context.recipientProfileId,
      },
    })

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    )
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    )
    expect(['ACCEPTED', 'REVOKED']).toContain(invitation.status)
    expect(memberships).toHaveLength(invitation.status === 'ACCEPTED' ? 1 : 0)
  })

  it('cannot accept after expiration wins during recipient identity I/O', async () => {
    const context = await createTestContext()
    const expiresAt = new Date(INITIAL_NOW.getTime() + 1)
    const created = await context.createInvitation({ expiresAt })
    let releaseIdentity!: () => void
    let reportIdentityReached!: () => void
    const identityReached = new Promise<void>((resolve) => {
      reportIdentityReached = resolve
    })
    const identityRelease = new Promise<void>((resolve) => {
      releaseIdentity = resolve
    })
    context.identity.onResolve = async () => {
      reportIdentityReached()
      await identityRelease
    }

    const acceptance = context.acceptInvitation({ token: created.rawToken })
    await identityReached
    context.clock.now = new Date(expiresAt)
    await expect(
      context.expireInvitation(created.invitation.id),
    ).resolves.toMatchObject({ status: 'EXPIRED' })
    releaseIdentity()

    await expectInvitationError(acceptance, INVITATION_ERROR_CODES.EXPIRED)
    await expect(
      context.prisma.organizationMembership.findUnique({
        where: {
          organizationId_profileId: {
            organizationId: context.organization.id,
            profileId: context.recipientProfileId,
          },
        },
      }),
    ).resolves.toBeNull()
  })
})
