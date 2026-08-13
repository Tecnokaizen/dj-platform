import 'server-only'

import {
  INVITATION_ERROR_CODES,
  InvitationError,
} from '@/core/modules/memberships/errors/invitation-error'
import { toInvitationDto } from '@/core/modules/memberships/mappers/to-invitation-dto'
import { createInvitationRepository } from '@/core/modules/memberships/repositories/invitation-repository'
import { createInvitationService } from '@/core/modules/memberships/services/create-invitation'
import {
  createInvitationLifecycleSupportForClient,
  type InvitationLifecycleSupport,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import type { CreatedInvitationSecret } from '@/core/modules/memberships/types/created-invitation-secret'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { runAuthorizedOrganizationOperation } from '@/core/modules/permissions/services/require-organization-permission'

export function createResendInvitationService(
  support: InvitationLifecycleSupport
) {
  const createInvitation = createInvitationService(support)

  return async function resendInvitation(
    invitationId: string
  ): Promise<CreatedInvitationSecret> {
    const invitation = await support.requireInvitation(invitationId)
    await support.requireActiveActorMembership(invitation.organizationId)

    if (invitation.status === 'ACCEPTED') {
      throw new InvitationError(INVITATION_ERROR_CODES.ALREADY_ACCEPTED)
    }

    if (invitation.status === 'REVOKED') {
      throw new InvitationError(INVITATION_ERROR_CODES.REVOKED)
    }

    const role = await support.requireRole(invitation.roleId)
    support.rejectOwnerRole(role)

    const now = support.now()

    if (invitation.status === 'EXPIRED' || invitation.expiresAt <= now) {
      return createInvitation({
        organizationId: invitation.organizationId,
        recipientEmail: invitation.recipientEmail,
        roleId: invitation.roleId,
      })
    }

    const rawToken = support.generateInvitationToken()
    const tokenHash = support.hashInvitationToken(rawToken)
    const rotated = await support.invitationRepository.rotatePendingToken(
      invitation.id,
      invitation.updatedAt,
      tokenHash,
      now
    )

    if (!rotated) {
      const current = await support.requireInvitation(invitation.id)
      support.throwInvitationStateError(current)
      throw new InvitationError(INVITATION_ERROR_CODES.NOT_PENDING)
    }

    return {
      invitation: toInvitationDto(rotated),
      rawToken,
    }
  }
}

export async function resendInvitation(
  invitationId: string
): Promise<CreatedInvitationSecret> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.INVITATIONS_RESEND,
    resolveOrganizationId: async (client) => {
      const invitation =
        await createInvitationRepository(client).findById(invitationId)

      if (!invitation) {
        throw new InvitationError(INVITATION_ERROR_CODES.NOT_FOUND)
      }

      return invitation.organizationId
    },
    execute: async (client, context) =>
      createResendInvitationService(
        createInvitationLifecycleSupportForClient(client, {
          actorProfileId: context.profileId,
        })
      )(invitationId),
  })
}
