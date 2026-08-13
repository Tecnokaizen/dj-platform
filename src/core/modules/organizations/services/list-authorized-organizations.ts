import 'server-only'

import {
  PROFILE_ERROR_CODES,
  ProfileError,
} from '@/core/identity/profile/errors/profile-error'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { toOrganizationDto } from '@/core/modules/organizations/mappers/to-organization-dto'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import type { OrganizationDto } from '@/core/modules/organizations/types/organization-dto'
import { PERMISSION_KEYS } from '@/core/modules/permissions/constants/permission-keys'
import type { PrismaClient } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export type AuthorizedOrganizationListItem = {
  organization: OrganizationDto
  canUpdate: boolean
}

type AuthorizedOrganizationListClient = Pick<
  PrismaClient,
  'organizationMembership' | 'rolePermission'
>

export type ListAuthorizedOrganizationsDependencies = {
  getCurrentProfileId: () => Promise<string | null>
  runInTransaction: <Result>(
    operation: (client: AuthorizedOrganizationListClient) => Promise<Result>
  ) => Promise<Result>
}

async function listForProfile(
  client: AuthorizedOrganizationListClient,
  profileId: string
): Promise<AuthorizedOrganizationListItem[]> {
  const memberships = await client.organizationMembership.findMany({
    where: {
      profileId,
      status: 'ACTIVE',
      organization: { status: 'ACTIVE' },
    },
    orderBy: { organization: { name: 'asc' } },
    select: {
      roleId: true,
      organization: { select: organizationSelect },
    },
  })
  const roleIds = [...new Set(memberships.map(({ roleId }) => roleId))]

  if (roleIds.length === 0) {
    return []
  }

  const mappings = await client.rolePermission.findMany({
    where: {
      roleId: { in: roleIds },
      permission: {
        key: {
          in: [
            PERMISSION_KEYS.ORGANIZATIONS_READ,
            PERMISSION_KEYS.ORGANIZATIONS_UPDATE,
          ],
        },
      },
    },
    select: {
      roleId: true,
      permission: { select: { key: true } },
    },
  })
  const permissionKeysByRole = new Map<string, Set<string>>()

  for (const mapping of mappings) {
    const keys = permissionKeysByRole.get(mapping.roleId) ?? new Set<string>()
    keys.add(mapping.permission.key)
    permissionKeysByRole.set(mapping.roleId, keys)
  }

  return memberships.flatMap(({ organization, roleId }) => {
    const permissionKeys = permissionKeysByRole.get(roleId)

    if (!permissionKeys?.has(PERMISSION_KEYS.ORGANIZATIONS_READ)) {
      return []
    }

    return [
      {
        organization: toOrganizationDto(organization),
        canUpdate: permissionKeys.has(
          PERMISSION_KEYS.ORGANIZATIONS_UPDATE
        ),
      },
    ]
  })
}

export function createListAuthorizedOrganizationsService(
  dependencies: ListAuthorizedOrganizationsDependencies
) {
  return async function listAuthorizedOrganizations(): Promise<
    AuthorizedOrganizationListItem[]
  > {
    const profileId = await dependencies.getCurrentProfileId()

    if (!profileId) {
      throw new ProfileError(PROFILE_ERROR_CODES.NOT_FOUND)
    }

    return dependencies.runInTransaction((client) =>
      listForProfile(client, profileId)
    )
  }
}

export const listAuthorizedOrganizations =
  createListAuthorizedOrganizationsService({
    getCurrentProfileId: async () => {
      const session = await getCurrentProfile()
      return session?.profile?.id ?? null
    },
    runInTransaction: (operation) => prisma.$transaction(operation),
  })
