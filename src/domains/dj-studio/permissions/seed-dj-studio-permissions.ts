import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { DJ_STUDIO_PERMISSION_DEFINITIONS } from '@/domains/dj-studio/permissions/permission-definitions'
import { DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY } from '@/domains/dj-studio/permissions/system-role-permission-policy'
import type { PrismaClient } from '@/generated/prisma/client'

type DjStudioSeedClient = Pick<
  PrismaClient,
  'permission' | 'role' | 'rolePermission'
>

const REQUIRED_ROLE_KEYS = Object.values(SYSTEM_ROLE_KEYS)

/**
 * Idempotent DJ Studio Domain permission registration.
 * Invoked from Product seed composition — never from Core seed modules.
 */
export async function seedDjStudioDomainPermissions(
  client: DjStudioSeedClient,
): Promise<void> {
  for (const definition of DJ_STUDIO_PERMISSION_DEFINITIONS) {
    await client.permission.upsert({
      where: { key: definition.key },
      create: {
        key: definition.key,
        name: definition.name,
        description: definition.description,
      },
      update: {
        name: definition.name,
        description: definition.description,
      },
    })
  }

  const roles = await client.role.findMany({
    where: { key: { in: [...REQUIRED_ROLE_KEYS] } },
    select: { id: true, key: true },
  })
  const rolesByKey = new Map(roles.map((role) => [role.key, role]))

  for (const roleKey of REQUIRED_ROLE_KEYS) {
    if (!rolesByKey.has(roleKey)) {
      throw new Error(
        `DJ Studio Domain seed ABORT: required system Role missing: ${roleKey}`,
      )
    }
  }

  const domainKeys = DJ_STUDIO_PERMISSION_DEFINITIONS.map(({ key }) => key)
  const permissions = await client.permission.findMany({
    where: { key: { in: [...domainKeys] } },
    select: { id: true, key: true },
  })
  const permissionsByKey = new Map(
    permissions.map((permission) => [permission.key, permission]),
  )

  for (const key of domainKeys) {
    if (!permissionsByKey.has(key)) {
      throw new Error(
        `DJ Studio Domain seed ABORT: permission missing after upsert: ${key}`,
      )
    }
  }

  for (const [roleKey, permissionKeys] of Object.entries(
    DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY,
  )) {
    const role = rolesByKey.get(roleKey)

    if (!role) {
      throw new Error(
        `DJ Studio Domain seed ABORT: role missing for policy: ${roleKey}`,
      )
    }

    for (const permissionKey of permissionKeys) {
      const permission = permissionsByKey.get(permissionKey)

      if (!permission) {
        throw new Error(
          `DJ Studio Domain seed ABORT: permission missing for policy: ${permissionKey}`,
        )
      }

      await client.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
        update: {},
      })
    }
  }
}
