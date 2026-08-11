import 'server-only'

import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import {
  INVITATION_ERROR_CODES,
  InvitationError,
} from '@/core/modules/memberships/errors/invitation-error'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import {
  createInvitationRepository,
  type InvitationRecord,
} from '@/core/modules/memberships/repositories/invitation-repository'
import {
  createMembershipRepository,
  type MembershipRecord,
} from '@/core/modules/memberships/repositories/membership-repository'
import {
  generateInvitationToken,
  hashInvitationToken,
} from '@/core/modules/memberships/security/invitation-token'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import type { Organization } from '@/core/modules/organizations/types/organization'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import type { Role } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

type InvitationRepository = ReturnType<typeof createInvitationRepository>
type MembershipRepository = ReturnType<typeof createMembershipRepository>

export type InvitationTransactionRepositories = {
  invitationRepository: InvitationRepository
  membershipRepository: MembershipRepository
}

export type AuthenticatedRecipientIdentity = {
  profileId: string
  email: string
}

export type InvitationLifecycleDependencies = {
  invitationRepository: InvitationRepository
  membershipRepository: MembershipRepository
  runInTransaction: <Result>(
    operation: (
      repositories: InvitationTransactionRepositories
    ) => Promise<Result>
  ) => Promise<Result>
  getCurrentActorProfileId: () => Promise<string | null>
  getCurrentRecipientIdentity: () => Promise<AuthenticatedRecipientIdentity | null>
  findOrganizationById: (
    organizationId: string
  ) => Promise<Organization | null>
  findRoleById: (roleId: string) => Promise<Role | null>
  findRecipientProfileIdByNormalizedEmail?: (
    normalizedEmail: string
  ) => Promise<string | null>
  generateInvitationToken: () => string
  hashInvitationToken: (rawToken: string) => string
  invitationLifetimeMs: number
  now: () => Date
}

export function createInvitationLifecycleSupport(
  dependencies: InvitationLifecycleDependencies
) {
  async function requireInvitation(
    invitationId: string
  ): Promise<InvitationRecord> {
    const invitation =
      await dependencies.invitationRepository.findById(invitationId)

    if (!invitation) {
      throw new InvitationError(INVITATION_ERROR_CODES.NOT_FOUND)
    }

    return invitation
  }

  async function requireActiveOrganization(
    organizationId: string
  ): Promise<void> {
    const organization = await dependencies.findOrganizationById(organizationId)

    if (!organization) {
      throw new OrganizationError(ORGANIZATION_ERROR_CODES.NOT_FOUND)
    }

    if (organization.status !== 'ACTIVE') {
      throw new OrganizationError(ORGANIZATION_ERROR_CODES.INVALID_STATE)
    }
  }

  async function requireRole(roleId: string): Promise<Role> {
    const role = await dependencies.findRoleById(roleId)

    if (!role) {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.ROLE_INVALID)
    }

    return role
  }

  function rejectOwnerRole(role: Role): void {
    if (role.key === 'OWNER') {
      throw new MembershipError(
        MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED
      )
    }
  }

  async function requireActiveActorMembership(
    organizationId: string
  ): Promise<MembershipRecord> {
    const actorProfileId = await dependencies.getCurrentActorProfileId()

    if (!actorProfileId) {
      throw new Error('UNAUTHENTICATED')
    }

    const membership =
      await dependencies.membershipRepository.findByOrganizationAndProfile(
        organizationId,
        actorProfileId
      )

    if (!membership) {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_ACTIVE)
    }

    if (membership.status === 'SUSPENDED') {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.SUSPENDED)
    }

    if (membership.status === 'REMOVED') {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.REMOVED)
    }

    return membership
  }

  async function requireAuthenticatedRecipient(): Promise<AuthenticatedRecipientIdentity> {
    const identity = await dependencies.getCurrentRecipientIdentity()

    if (!identity) {
      throw new Error('UNAUTHENTICATED')
    }

    return identity
  }

  async function findRecipientMembership(
    organizationId: string,
    normalizedEmail: string
  ): Promise<MembershipRecord | null> {
    if (!dependencies.findRecipientProfileIdByNormalizedEmail) {
      return null
    }

    const profileId =
      await dependencies.findRecipientProfileIdByNormalizedEmail(
        normalizedEmail
      )

    if (!profileId) {
      return null
    }

    return dependencies.membershipRepository.findByOrganizationAndProfile(
      organizationId,
      profileId
    )
  }

  function getExpiresAt(now: Date): Date {
    return new Date(now.getTime() + dependencies.invitationLifetimeMs)
  }

  function throwInvitationStateError(invitation: InvitationRecord): never {
    if (invitation.status === 'ACCEPTED') {
      throw new InvitationError(INVITATION_ERROR_CODES.ALREADY_ACCEPTED)
    }

    if (invitation.status === 'REVOKED') {
      throw new InvitationError(INVITATION_ERROR_CODES.REVOKED)
    }

    if (invitation.status === 'EXPIRED') {
      throw new InvitationError(INVITATION_ERROR_CODES.EXPIRED)
    }

    throw new InvitationError(INVITATION_ERROR_CODES.NOT_PENDING)
  }

  return {
    invitationRepository: dependencies.invitationRepository,
    membershipRepository: dependencies.membershipRepository,
    runInTransaction: dependencies.runInTransaction,
    findRecipientMembership,
    generateInvitationToken: dependencies.generateInvitationToken,
    getExpiresAt,
    hashInvitationToken: dependencies.hashInvitationToken,
    now: dependencies.now,
    rejectOwnerRole,
    requireActiveActorMembership,
    requireActiveOrganization,
    requireAuthenticatedRecipient,
    requireInvitation,
    requireRole,
    throwInvitationStateError,
  }
}

export type InvitationLifecycleSupport = ReturnType<
  typeof createInvitationLifecycleSupport
>

export const INVITATION_LIFETIME_HOURS = 72

export const invitationLifecycleSupport = createInvitationLifecycleSupport({
  invitationRepository: createInvitationRepository(prisma),
  membershipRepository: createMembershipRepository(prisma),
  runInTransaction: (operation) =>
    prisma.$transaction((client) =>
      operation({
        invitationRepository: createInvitationRepository(client),
        membershipRepository: createMembershipRepository(client),
      })
    ),
  getCurrentActorProfileId: async () => {
    const session = await getCurrentProfile()
    return session?.profile?.id ?? null
  },
  getCurrentRecipientIdentity: async () => {
    const session = await getCurrentProfile()

    if (!session?.profile?.id || !session.user.email) {
      return null
    }

    return {
      profileId: session.profile.id,
      email: session.user.email,
    }
  },
  findOrganizationById,
  findRoleById,
  generateInvitationToken,
  hashInvitationToken,
  invitationLifetimeMs: INVITATION_LIFETIME_HOURS * 60 * 60 * 1000,
  now: () => new Date(),
})
