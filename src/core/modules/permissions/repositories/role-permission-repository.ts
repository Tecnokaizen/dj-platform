import 'server-only'

import type { Prisma, PrismaClient } from '@/generated/prisma/client'

type RolePermissionRepositoryClient = Pick<PrismaClient, 'rolePermission'>

const mappedPermissionSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const

export type MappedPermissionRecord = Prisma.PermissionGetPayload<{
  select: typeof mappedPermissionSelect
}>

export type RolePermissionMapping = {
  roleId: string
  permissionId: string
}

export function createRolePermissionRepository(
  client: RolePermissionRepositoryClient,
) {
  return {
    async exists(roleId: string, permissionKey: string): Promise<boolean> {
      const mapping = await client.rolePermission.findFirst({
        where: {
          roleId,
          permission: { key: permissionKey },
        },
        select: { id: true },
      })

      return mapping !== null
    },

    async listPermissionsForRole(
      roleId: string,
    ): Promise<MappedPermissionRecord[]> {
      const mappings = await client.rolePermission.findMany({
        where: { roleId },
        orderBy: { permission: { key: 'asc' } },
        select: { permission: { select: mappedPermissionSelect } },
      })

      return mappings.map(({ permission }) => permission)
    },

    async listMappings(): Promise<RolePermissionMapping[]> {
      return client.rolePermission.findMany({
        select: { roleId: true, permissionId: true },
      })
    },

    async createMapping(
      roleId: string,
      permissionId: string,
    ): Promise<void> {
      await client.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        create: { roleId, permissionId },
        update: {},
      })
    },
  }
}
