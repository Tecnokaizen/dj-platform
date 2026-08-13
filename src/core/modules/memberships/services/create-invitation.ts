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
import {
  createInvitationLifecycleSupportForClient,
  type InvitationLifecycleSupport,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import type { CreatedInvitationSecret } from '@/core/modules/memberships/types/created-invitation-secret'
import { normalizeEmail } from '@/core/modules/memberships/utils/normalize-email'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { runAuthorizedOrganizationOperation } from '@/core/modules/permissions/services/require-organization-permission'
import { Prisma } from '@/generated/prisma/client'

export type CreateInvitationInput = {
  organizationId: string
  recipientEmail: string
  roleId: string
}

export function createInvitationService(support: InvitationLifecycleSupport) {
  return async function createInvitation(
    input: CreateInvitationInput
  ): Promise<CreatedInvitationSecret> {
    await support.requireActiveOrganization(input.organizationId)
    const actorMembership = await support.requireActiveActorMembership(
      input.organizationId
    )
    const role = await support.requireRole(input.roleId)
    support.rejectOwnerRole(role)

    const recipientEmail = input.recipientEmail.trim()
    const normalizedEmail = normalizeEmail(recipientEmail)

    const now = support.now()
    const rawToken = support.generateInvitationToken()
    const tokenHash = support.hashInvitationToken(rawToken)

    try {
      const invitation = await support.runInTransaction(
        async ({
          invitationRepository,
          membershipRepository,
          findProfileIdByNormalizedAuthEmail,
        }) => {
          const currentActorMembership =
            await membershipRepository.findActiveByOrganizationAndProfile(
              input.organizationId,
              actorMembership.profileId
            )

          if (!currentActorMembership) {
            throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_ACTIVE)
          }

          const recipientProfileId =
            await findProfileIdByNormalizedAuthEmail(normalizedEmail)
          const recipientMembership = recipientProfileId
            ? await membershipRepository.findByOrganizationAndProfile(
                input.organizationId,
                recipientProfileId
              )
            : null

          if (recipientMembership?.status === 'ACTIVE') {
            throw new InvitationError(INVITATION_ERROR_CODES.ALREADY_MEMBER)
          }

          if (recipientMembership?.status === 'SUSPENDED') {
            throw new MembershipError(MEMBERSHIP_ERROR_CODES.SUSPENDED)
          }

          const existing =
            await invitationRepository.findPendingByOrganizationAndEmail(
              input.organizationId,
              normalizedEmail
            )

          if (existing) {
            if (existing.expiresAt > now) {
              throw new InvitationError(INVITATION_ERROR_CODES.ALREADY_PENDING)
            }

            const expired = await invitationRepository.expirePending(
              existing.id,
              existing.updatedAt,
              now
            )

            if (!expired) {
              throw new InvitationError(INVITATION_ERROR_CODES.ALREADY_PENDING)
            }
          }

          return invitationRepository.create({
            organizationId: input.organizationId,
            recipientEmail,
            normalizedEmail,
            roleId: role.id,
            tokenHash,
            expiresAt: support.getExpiresAt(now),
            invitedByMembershipId: currentActorMembership.id,
          })
        }
      )

      return {
        invitation: toInvitationDto(invitation),
        rawToken,
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new InvitationError(INVITATION_ERROR_CODES.ALREADY_PENDING)
      }

      throw error
    }
  }
}

export async function createInvitation(
  input: CreateInvitationInput
): Promise<CreatedInvitationSecret> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.INVITATIONS_CREATE,
    resolveOrganizationId: async () => input.organizationId,
    execute: async (client, context) =>
      createInvitationService(
        createInvitationLifecycleSupportForClient(client, {
          actorProfileId: context.profileId,
        })
      )(input),
  })
}
