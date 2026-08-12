import 'server-only'

import {
  INVITATION_ERROR_CODES,
  InvitationError,
} from '@/core/modules/memberships/errors/invitation-error'
import { toInvitationDto } from '@/core/modules/memberships/mappers/to-invitation-dto'
import { createInvitationRepository } from '@/core/modules/memberships/repositories/invitation-repository'
import {
  createInvitationLifecycleSupportForClient,
  type InvitationLifecycleSupport,
} from '@/core/modules/memberships/services/invitation-lifecycle-support'
import type { InvitationDto } from '@/core/modules/memberships/types/invitation-dto'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { runAuthorizedOrganizationOperation } from '@/core/modules/permissions/services/require-organization-permission'

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

export async function revokeInvitation(
  invitationId: string
): Promise<InvitationDto> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.INVITATIONS_REVOKE,
    resolveOrganizationId: async (client) => {
      const invitation =
        await createInvitationRepository(client).findById(invitationId)

      if (!invitation) {
        throw new InvitationError(INVITATION_ERROR_CODES.NOT_FOUND)
      }

      return invitation.organizationId
    },
    execute: async (client, context) =>
      createRevokeInvitationService(
        createInvitationLifecycleSupportForClient(client, {
          actorProfileId: context.profileId,
        })
      )(invitationId),
  })
}
