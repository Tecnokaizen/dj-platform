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

export function createExpireInvitationService(
  support: InvitationLifecycleSupport
) {
  return async function expireInvitation(
    invitationId: string
  ): Promise<InvitationDto> {
    const invitation = await support.requireInvitation(invitationId)

    if (invitation.status !== 'PENDING') {
      support.throwInvitationStateError(invitation)
    }

    const now = support.now()

    if (invitation.expiresAt > now) {
      throw new InvitationError(INVITATION_ERROR_CODES.NOT_PENDING)
    }

    const expired = await support.invitationRepository.expirePending(
      invitation.id,
      invitation.updatedAt,
      now
    )

    if (!expired) {
      const current = await support.requireInvitation(invitation.id)
      support.throwInvitationStateError(current)
      throw new InvitationError(INVITATION_ERROR_CODES.NOT_PENDING)
    }

    return toInvitationDto(expired)
  }
}

export const expireInvitation = createExpireInvitationService(
  invitationLifecycleSupport
)
