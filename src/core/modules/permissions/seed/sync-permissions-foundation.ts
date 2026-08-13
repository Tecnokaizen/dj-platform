import {
  PERMISSION_DEFINITIONS,
  type PermissionDefinition,
  validatePermissionDefinitions,
} from '@/core/modules/permissions/constants/permission-definitions'
import { SYSTEM_ROLE_PERMISSION_POLICY } from '@/core/modules/permissions/constants/system-role-permission-policy'
import {
  PERMISSION_ERROR_CODES,
  PermissionError,
} from '@/core/modules/permissions/errors/permission-error'
import type { PrismaClient } from '@/generated/prisma/client'

type PermissionsFoundationClient = Pick<
  PrismaClient,
  'permission' | 'role' | 'rolePermission'
>

type PersistedPermission = {
  id: string
  key: string
  name: string
  description: string | null
}

type SystemPolicyState = {
  expectedMappings: ReadonlySet<string>
  rolesByKey: ReadonlyMap<string, { id: string; key: string }>
  permissionsByKey: ReadonlyMap<string, PersistedPermission>
}

export async function validatePermissionCatalog(
  client: PermissionsFoundationClient,
): Promise<void> {
  validatePermissionDefinitions()

  const persistedPermissions = await client.permission.findMany({
    orderBy: { key: 'asc' },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
    },
  })
  const definitionsByKey = new Map<string, PermissionDefinition>(
    PERMISSION_DEFINITIONS.map((definition) => [definition.key, definition]),
  )

  if (
    persistedPermissions.length !== PERMISSION_DEFINITIONS.length ||
    persistedPermissions.some((permission) => {
      const definition = definitionsByKey.get(permission.key)

      return (
        !definition ||
        permission.name !== definition.name ||
        permission.description !== definition.description
      )
    })
  ) {
    throw new PermissionError(PERMISSION_ERROR_CODES.CATALOG_DRIFT)
  }
}

export async function syncPermissionCatalog(
  client: PermissionsFoundationClient,
): Promise<void> {
  validatePermissionDefinitions()

  const approvedKeys = new Set<string>(
    PERMISSION_DEFINITIONS.map(({ key }) => key),
  )
  const persistedKeys = await client.permission.findMany({
    select: { key: true },
  })

  if (persistedKeys.some(({ key }) => !approvedKeys.has(key))) {
    throw new PermissionError(PERMISSION_ERROR_CODES.CATALOG_DRIFT)
  }

  for (const definition of PERMISSION_DEFINITIONS) {
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

  await validatePermissionCatalog(client)
}

async function resolveSystemPolicyState(
  client: PermissionsFoundationClient,
): Promise<SystemPolicyState> {
  const roleKeys = Object.keys(SYSTEM_ROLE_PERMISSION_POLICY)
  const roles = await client.role.findMany({
    where: { key: { in: roleKeys } },
    select: { id: true, key: true },
  })
  const rolesByKey = new Map(roles.map((role) => [role.key, role]))

  if (rolesByKey.size !== roleKeys.length) {
    throw new PermissionError(PERMISSION_ERROR_CODES.POLICY_DRIFT)
  }

  const permissionKeys = PERMISSION_DEFINITIONS.map(({ key }) => key)
  const permissions = await client.permission.findMany({
    where: { key: { in: permissionKeys } },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
    },
  })
  const permissionsByKey = new Map(
    permissions.map((permission) => [permission.key, permission]),
  )

  if (permissionsByKey.size !== permissionKeys.length) {
    throw new PermissionError(PERMISSION_ERROR_CODES.REQUIRED_MISSING)
  }

  const expectedMappings = new Set<string>()

  for (const [roleKey, approvedPermissionKeys] of Object.entries(
    SYSTEM_ROLE_PERMISSION_POLICY,
  )) {
    const role = rolesByKey.get(roleKey)

    if (!role) {
      throw new PermissionError(PERMISSION_ERROR_CODES.POLICY_DRIFT)
    }

    for (const permissionKey of approvedPermissionKeys) {
      const permission = permissionsByKey.get(permissionKey)

      if (!permission) {
        throw new PermissionError(PERMISSION_ERROR_CODES.REQUIRED_MISSING)
      }

      expectedMappings.add(`${role.id}:${permission.id}`)
    }
  }

  return { expectedMappings, rolesByKey, permissionsByKey }
}

export async function validateSystemRolePermissionPolicy(
  client: PermissionsFoundationClient,
): Promise<void> {
  const { expectedMappings, rolesByKey } =
    await resolveSystemPolicyState(client)
  const persistedMappings = await client.rolePermission.findMany({
    where: { roleId: { in: [...rolesByKey.values()].map(({ id }) => id) } },
    select: { roleId: true, permissionId: true },
  })

  if (
    persistedMappings.length !== expectedMappings.size ||
    persistedMappings.some(
      ({ roleId, permissionId }) =>
        !expectedMappings.has(`${roleId}:${permissionId}`),
    )
  ) {
    throw new PermissionError(PERMISSION_ERROR_CODES.POLICY_DRIFT)
  }
}

export async function syncSystemRolePermissionPolicy(
  client: PermissionsFoundationClient,
): Promise<void> {
  const { expectedMappings, rolesByKey, permissionsByKey } =
    await resolveSystemPolicyState(client)
  const persistedMappings = await client.rolePermission.findMany({
    where: { roleId: { in: [...rolesByKey.values()].map(({ id }) => id) } },
    select: { roleId: true, permissionId: true },
  })

  if (
    persistedMappings.some(
      ({ roleId, permissionId }) =>
        !expectedMappings.has(`${roleId}:${permissionId}`),
    )
  ) {
    throw new PermissionError(PERMISSION_ERROR_CODES.POLICY_DRIFT)
  }

  for (const [roleKey, permissionKeys] of Object.entries(
    SYSTEM_ROLE_PERMISSION_POLICY,
  )) {
    const role = rolesByKey.get(roleKey)

    if (!role) {
      throw new PermissionError(PERMISSION_ERROR_CODES.POLICY_DRIFT)
    }

    for (const permissionKey of permissionKeys) {
      const permission = permissionsByKey.get(permissionKey)

      if (!permission) {
        throw new PermissionError(PERMISSION_ERROR_CODES.REQUIRED_MISSING)
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

  await validateSystemRolePermissionPolicy(client)
}

export async function syncPermissionsFoundation(
  client: PermissionsFoundationClient,
): Promise<void> {
  await syncPermissionCatalog(client)
  await syncSystemRolePermissionPolicy(client)
}
