import 'server-only'

import {
  INVITATION_ERROR_CODES,
  InvitationError,
} from '@/core/modules/memberships/errors/invitation-error'
import { toInvitationDto } from '@/core/modules/memberships/mappers/to-invitation-dto'
import {
  invitationLifecycleSupport,
  type InvitationLifecycleSupport,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import type { InvitationDto } from '@/core/modules/memberships/types/invitation-dto'

export function createRevokeInvitationService(
  support: InvitationLifecycleSupport
) {
  return async function revokeInvitation(
    invitationId: string
  ): Promise<InvitationDto> {
    const invitation = await support.requireInvitation(invitationId)
    await support.requireActiveActorMembership(invitation.organizationId)

    if (invitation.status !== 'PENDING') {
      support.throwInvitationStateError(invitation)
    }

    const now = support.now()

    if (invitation.expiresAt <= now) {
      await support.invitationRepository.expirePending(
        invitation.id,
        invitation.updatedAt,
        now
      )
      throw new InvitationError(INVITATION_ERROR_CODES.EXPIRED)
    }

    const revoked = await support.invitationRepository.revokePending(
      invitation.id,
      invitation.updatedAt,
      now
    )

    if (!revoked) {
      const current = await support.requireInvitation(invitation.id)
      support.throwInvitationStateError(current)
      throw new InvitationError(INVITATION_ERROR_CODES.NOT_PENDING)
    }

    return toInvitationDto(revoked)
  }
}

export const revokeInvitation = createRevokeInvitationService(
  invitationLifecycleSupport
)
