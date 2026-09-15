import 'server-only'

import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { createRolePermissionRepository } from '@/core/modules/permissions/repositories/role-permission-repository'
import { createPermissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import {
  PERMISSION_ERROR_CODES,
  PermissionError,
} from '@/core/modules/permissions/errors/permission-error'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import { prisma } from '@/lib/prisma'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import type { DjStudioPermissionKey } from '@/domains/dj-studio/permissions/permission-keys'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

export async function requireDjStudioPermission(
  context: ActiveOrganizationContext,
  permissionKey: DjStudioPermissionKey,
): Promise<ActiveOrganizationContext> {
  const membershipRepository = createMembershipRepository(prisma)
  const rolePermissionRepository = createRolePermissionRepository(prisma)
  const authorization = createPermissionAuthorizationServices({
    findMembershipById: membershipRepository.findById,
    findRoleById,
    roleHasPermission: rolePermissionRepository.exists,
  })

  try {
    await authorization.requirePermission(context, permissionKey)
    return context
  } catch (error) {
    if (
      error instanceof PermissionError &&
      error.code === PERMISSION_ERROR_CODES.DENIED
    ) {
      throw new DjStudioError(DJ_STUDIO_ERROR_CODES.FORBIDDEN)
    }

    throw error
  }
}
