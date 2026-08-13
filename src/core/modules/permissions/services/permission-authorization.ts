import 'server-only'

import {
  PERMISSION_KEYS,
  type PermissionKey,
} from '@/core/modules/permissions/constants/permission-keys'
import {
  PERMISSION_ERROR_CODES,
  PermissionError,
} from '@/core/modules/permissions/errors/permission-error'
import { createRolePermissionRepository } from '@/core/modules/permissions/repositories/role-permission-repository'
import type { AuthorizationContext } from '@/core/modules/permissions/types/authorization-context'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import type { Role } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

const SYSTEM_ROLE_KEY_SET = new Set<string>(Object.values(SYSTEM_ROLE_KEYS))
const PERMISSION_KEY_SET = new Set<string>(Object.values(PERMISSION_KEYS))

export type PermissionAuthorizationDependencies = {
  findMembershipById: (
    membershipId: string,
  ) => Promise<{
    id: string
    organizationId: string
    profileId: string
    roleId: string
    status: 'ACTIVE' | 'SUSPENDED' | 'REMOVED'
  } | null>
  findRoleById: (roleId: string) => Promise<Role | null>
  roleHasPermission: (
    roleId: string,
    permissionKey: string,
  ) => Promise<boolean>
}

export function createPermissionAuthorizationServices(
  dependencies: PermissionAuthorizationDependencies,
) {
  async function hasPermission(
    context: AuthorizationContext,
    permissionKey: string,
  ): Promise<boolean> {
    if (
      !SYSTEM_ROLE_KEY_SET.has(context.roleKey) ||
      !PERMISSION_KEY_SET.has(permissionKey)
    ) {
      return false
    }

    const membership = await dependencies.findMembershipById(
      context.membershipId,
    )

    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      membership.organizationId !== context.organizationId ||
      membership.profileId !== context.profileId ||
      membership.roleId !== context.roleId
    ) {
      return false
    }

    const role = await dependencies.findRoleById(context.roleId)

    if (!role || role.key !== context.roleKey) {
      return false
    }

    return dependencies.roleHasPermission(context.roleId, permissionKey)
  }

  async function requirePermission(
    context: AuthorizationContext,
    permissionKey: PermissionKey,
  ): Promise<AuthorizationContext> {
    if (!(await hasPermission(context, permissionKey))) {
      throw new PermissionError(PERMISSION_ERROR_CODES.DENIED)
    }

    return context
  }

  return { hasPermission, requirePermission }
}

const membershipRepository = createMembershipRepository(prisma)
const rolePermissionRepository = createRolePermissionRepository(prisma)

export const permissionAuthorizationServices =
  createPermissionAuthorizationServices({
    findMembershipById: membershipRepository.findById,
    findRoleById,
    roleHasPermission: rolePermissionRepository.exists,
  })
