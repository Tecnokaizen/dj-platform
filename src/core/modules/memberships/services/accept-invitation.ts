import 'server-only'

import {
  INVITATION_ERROR_CODES,
  InvitationError,
} from '@/core/modules/memberships/errors/invitation-error'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { toInvitationDto } from '@/core/modules/memberships/mappers/to-invitation-dto'
import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import {
  invitationLifecycleSupport,
  type InvitationLifecycleSupport,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import type { InvitationDto } from '@/core/modules/memberships/types/invitation-dto'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'
import { normalizeEmail } from '@/core/modules/memberships/utils/normalize-email'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { Prisma } from '@/generated/prisma/client'

export type AcceptInvitationInput = {
  token: string
}

export type AcceptInvitationResult = {
  membership: MembershipDto
  invitation: InvitationDto
}

export function createAcceptInvitationService(
  support: InvitationLifecycleSupport,
) {
  return async function acceptInvitation(
    input: AcceptInvitationInput,
  ): Promise<AcceptInvitationResult> {
    const tokenHash = support.hashInvitationToken(input.token)
    const invitation =
      await support.invitationRepository.findByTokenHash(tokenHash)

    if (!invitation) {
      throw new InvitationError(INVITATION_ERROR_CODES.TOKEN_INVALID)
    }

    if (invitation.status !== 'PENDING') {
      support.throwInvitationStateError(invitation)
    }

    const observedAt = support.now()

    if (invitation.expiresAt <= observedAt) {
      throw new InvitationError(INVITATION_ERROR_CODES.EXPIRED)
    }

    const identity = await support.requireAuthenticatedRecipient()

    if (normalizeEmail(identity.email) !== invitation.normalizedEmail) {
      throw new InvitationError(INVITATION_ERROR_CODES.RECIPIENT_MISMATCH)
    }

    await support.requireActiveOrganization(invitation.organizationId)
    const preliminaryRole = await support.requireRole(invitation.roleId)
    support.rejectOwnerRole(preliminaryRole)

    try {
      const accepted = await support.runInTransaction(
        async ({
          invitationRepository,
          membershipRepository,
          findOrganizationById,
          findRoleById,
        }) => {
          const claimAt = support.now()
          const currentInvitation =
            await invitationRepository.findByTokenHash(tokenHash)

          if (!currentInvitation) {
            throw new InvitationError(INVITATION_ERROR_CODES.TOKEN_INVALID)
          }

          if (currentInvitation.status !== 'PENDING') {
            support.throwInvitationStateError(currentInvitation)
          }

          if (currentInvitation.expiresAt <= claimAt) {
            throw new InvitationError(INVITATION_ERROR_CODES.EXPIRED)
          }

          const organization = await findOrganizationById(
            currentInvitation.organizationId,
          )

          if (!organization) {
            throw new OrganizationError(ORGANIZATION_ERROR_CODES.NOT_FOUND)
          }

          if (organization.status !== 'ACTIVE') {
            throw new OrganizationError(ORGANIZATION_ERROR_CODES.INVALID_STATE)
          }

          const role = await findRoleById(currentInvitation.roleId)

          if (!role) {
            throw new MembershipError(MEMBERSHIP_ERROR_CODES.ROLE_INVALID)
          }

          support.rejectOwnerRole(role)

          const currentMembership =
            await membershipRepository.findByOrganizationAndProfile(
              currentInvitation.organizationId,
              identity.profileId,
            )

          if (currentMembership) {
            switch (currentMembership.status) {
              case 'ACTIVE':
                throw new InvitationError(INVITATION_ERROR_CODES.ALREADY_MEMBER)
              case 'SUSPENDED':
                throw new MembershipError(MEMBERSHIP_ERROR_CODES.SUSPENDED)
              case 'REMOVED':
                break
              default:
                throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
            }
          }

          const claimed = await invitationRepository.acceptPending(
            currentInvitation.id,
            currentInvitation.updatedAt,
            identity.profileId,
            claimAt,
          )

          if (!claimed) {
            const latest = await invitationRepository.findById(
              currentInvitation.id,
            )

            if (!latest) {
              throw new InvitationError(INVITATION_ERROR_CODES.NOT_FOUND)
            }

            if (latest.status !== 'PENDING') {
              support.throwInvitationStateError(latest)
            }

            if (latest.expiresAt <= claimAt) {
              throw new InvitationError(INVITATION_ERROR_CODES.EXPIRED)
            }

            throw new InvitationError(INVITATION_ERROR_CODES.NOT_PENDING)
          }

          const membership =
            currentMembership?.status === 'REMOVED'
              ? await membershipRepository.restoreRemoved(
                  currentMembership.id,
                  currentMembership.roleId,
                  role.id,
                )
              : await membershipRepository.create({
                  organizationId: currentInvitation.organizationId,
                  profileId: identity.profileId,
                  roleId: role.id,
                })

          if (!membership) {
            throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
          }

          return {
            membership,
            invitation: claimed,
          }
        },
      )

      return {
        membership: toMembershipDto(accepted.membership),
        invitation: toInvitationDto(accepted.invitation),
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new InvitationError(INVITATION_ERROR_CODES.ALREADY_MEMBER)
      }

      throw error
    }
  }
}

export const acceptInvitation = createAcceptInvitationService(
  invitationLifecycleSupport,
)
