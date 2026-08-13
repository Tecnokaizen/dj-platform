import 'server-only'

import { toInvitationDto } from '@/core/modules/memberships/mappers/to-invitation-dto'
import { createInvitationRepository } from '@/core/modules/memberships/repositories/invitation-repository'
import type { InvitationDto } from '@/core/modules/memberships/types/invitation-dto'
import type { InvitationStatus } from '@/core/modules/memberships/types/invitation-status'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { runAuthorizedOrganizationOperation } from '@/core/modules/permissions/services/require-organization-permission'

type InvitationRepository = ReturnType<typeof createInvitationRepository>

export function createListInvitationsForOrganizationService(
  repository: InvitationRepository
) {
  return async function listInvitationsForOrganization(
    organizationId: string,
    status?: InvitationStatus
  ): Promise<InvitationDto[]> {
    const invitations = await repository.listByOrganization(
      organizationId,
      status
    )

    return invitations.map(toInvitationDto)
  }
}

export async function listInvitationsForOrganization(
  organizationId: string,
  status?: InvitationStatus
): Promise<InvitationDto[]> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.INVITATIONS_READ,
    resolveOrganizationId: async () => organizationId,
    execute: async (client) =>
      createListInvitationsForOrganizationService(
        createInvitationRepository(client)
      )(organizationId, status),
  })
}
