import 'server-only'

import {
  PERMISSION_ERROR_CODES,
  PermissionError,
} from '@/core/modules/permissions/errors/permission-error'
import {
  createPermissionRepository,
  type PermissionRecord,
} from '@/core/modules/permissions/repositories/permission-repository'
import {
  createRolePermissionRepository,
  type MappedPermissionRecord,
} from '@/core/modules/permissions/repositories/role-permission-repository'
import { prisma } from '@/lib/prisma'

export type PermissionReadDependencies = {
  permissionRepository: ReturnType<typeof createPermissionRepository>
  rolePermissionRepository: ReturnType<typeof createRolePermissionRepository>
}

export function createPermissionReadServices(
  dependencies: PermissionReadDependencies,
) {
  return {
    async getPermission(permissionId: string): Promise<PermissionRecord> {
      const permission =
        await dependencies.permissionRepository.findById(permissionId)

      if (!permission) {
        throw new PermissionError(PERMISSION_ERROR_CODES.NOT_FOUND)
      }

      return permission
    },

    getPermissionByKey(key: string): Promise<PermissionRecord | null> {
      return dependencies.permissionRepository.findByKey(key)
    },

    listPermissions(): Promise<PermissionRecord[]> {
      return dependencies.permissionRepository.list()
    },

    async resolveRequiredPermission(key: string): Promise<PermissionRecord> {
      const permission = await dependencies.permissionRepository.findByKey(key)

      if (!permission) {
        throw new PermissionError(PERMISSION_ERROR_CODES.REQUIRED_MISSING)
      }

      return permission
    },

    resolvePermissionsByKeys(keys: readonly string[]): Promise<PermissionRecord[]> {
      return dependencies.permissionRepository.findManyByKeys(keys)
    },

    getPermissionsForRole(roleId: string): Promise<MappedPermissionRecord[]> {
      return dependencies.rolePermissionRepository.listPermissionsForRole(roleId)
    },

    async getPermissionKeysForRole(roleId: string): Promise<string[]> {
      const permissions =
        await dependencies.rolePermissionRepository.listPermissionsForRole(
          roleId,
        )

      return permissions.map((permission) => permission.key)
    },

    roleHasPermission(roleId: string, permissionKey: string): Promise<boolean> {
      return dependencies.rolePermissionRepository.exists(roleId, permissionKey)
    },
  }
}

export const permissionReadServices = createPermissionReadServices({
  permissionRepository: createPermissionRepository(prisma),
  rolePermissionRepository: createRolePermissionRepository(prisma),
})
