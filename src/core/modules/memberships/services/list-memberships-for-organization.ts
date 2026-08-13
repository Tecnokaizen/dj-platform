import 'server-only'

import { toMembershipDto } from '@/core/modules/memberships/mappers/to-membership-dto'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import type { MembershipReadRepository } from '@/core/modules/memberships/services/membership-read-support'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'
import type { MembershipStatus } from '@/core/modules/memberships/types/membership-status'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import { runAuthorizedOrganizationOperation } from '@/core/modules/permissions/services/require-organization-permission'

export function createOrganizationMembershipListingServices(
  repository: MembershipReadRepository
) {
  return {
    async listMembershipsForOrganization(
      organizationId: string,
      status?: MembershipStatus
    ): Promise<MembershipDto[]> {
      const memberships = await repository.listByOrganization(
        organizationId,
        status
      )

      return memberships.map(toMembershipDto)
    },

    async listActiveMembershipsForOrganization(
      organizationId: string
    ): Promise<MembershipDto[]> {
      const memberships =
        await repository.listActiveByOrganization(organizationId)

      return memberships.map(toMembershipDto)
    },
  }
}

export async function listMembershipsForOrganization(
  organizationId: string,
  status?: MembershipStatus
): Promise<MembershipDto[]> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.MEMBERSHIPS_READ,
    resolveOrganizationId: async () => organizationId,
    execute: async (client) =>
      createOrganizationMembershipListingServices(
        createMembershipRepository(client)
      ).listMembershipsForOrganization(organizationId, status),
  })
}

export async function listActiveMembershipsForOrganization(
  organizationId: string
): Promise<MembershipDto[]> {
  return runAuthorizedOrganizationOperation({
    permissionKey: PERMISSION_KEYS.MEMBERSHIPS_READ,
    resolveOrganizationId: async () => organizationId,
    execute: async (client) =>
      createOrganizationMembershipListingServices(
        createMembershipRepository(client)
      ).listActiveMembershipsForOrganization(organizationId),
  })
}
