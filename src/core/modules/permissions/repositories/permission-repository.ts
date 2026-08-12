import 'server-only'

import type { Prisma, PrismaClient } from '@/generated/prisma/client'

type PermissionRepositoryClient = Pick<PrismaClient, 'permission'>

export const permissionSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const

export type PermissionRecord = Prisma.PermissionGetPayload<{
  select: typeof permissionSelect
}>

export type PermissionMetadata = {
  key: string
  name: string
  description: string | null
}

export function createPermissionRepository(client: PermissionRepositoryClient) {
  return {
    findById(permissionId: string): Promise<PermissionRecord | null> {
      return client.permission.findUnique({
        where: { id: permissionId },
        select: permissionSelect,
      })
    },

    findByKey(key: string): Promise<PermissionRecord | null> {
      return client.permission.findUnique({
        where: { key },
        select: permissionSelect,
      })
    },

    findManyByKeys(keys: readonly string[]): Promise<PermissionRecord[]> {
      return client.permission.findMany({
        where: { key: { in: [...keys] } },
        orderBy: { key: 'asc' },
        select: permissionSelect,
      })
    },

    list(): Promise<PermissionRecord[]> {
      return client.permission.findMany({
        orderBy: { key: 'asc' },
        select: permissionSelect,
      })
    },

    upsert(metadata: PermissionMetadata): Promise<PermissionRecord> {
      return client.permission.upsert({
        where: { key: metadata.key },
        create: metadata,
        update: {
          name: metadata.name,
          description: metadata.description,
        },
        select: permissionSelect,
      })
    },
  }
}
