import 'server-only'

import {
  INVITATION_ERROR_CODES,
  InvitationError,
} from '@/core/modules/memberships/errors/invitation-error'
import { toInvitationDto } from '@/core/modules/memberships/mappers/to-invitation-dto'
import { createInvitationService } from '@/core/modules/memberships/services/create-invitation'
import {
  invitationLifecycleSupport,
  type InvitationLifecycleSupport,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import type { CreatedInvitationSecret } from '@/core/modules/memberships/types/created-invitation-secret'

export function createResendInvitationService(
  support: InvitationLifecycleSupport,
) {
  const createInvitation = createInvitationService(support)

  return async function resendInvitation(
    invitationId: string,
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
      now,
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

export const resendInvitation = createResendInvitationService(
  invitationLifecycleSupport,
)
