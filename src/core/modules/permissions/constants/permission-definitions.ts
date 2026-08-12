import {
  PERMISSION_KEYS,
  type PermissionKey,
} from '@/core/modules/permissions/constants/permission-keys'

export type PermissionDefinition = {
  key: PermissionKey
  name: string
  description: string
  owner: 'Platform Core'
}

export const PERMISSION_DEFINITIONS = [
  {
    key: PERMISSION_KEYS.ORGANIZATIONS_READ,
    name: 'Read organizations',
    description: 'Read tenant Organization information.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.ORGANIZATIONS_UPDATE,
    name: 'Update organizations',
    description: 'Update tenant Organization settings.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.ORGANIZATIONS_TRANSFER_OWNERSHIP,
    name: 'Transfer organization ownership',
    description: 'Transfer the protected OWNER position.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.MEMBERSHIPS_READ,
    name: 'Read memberships',
    description: 'Read Organization Membership administration data.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.MEMBERSHIPS_SUSPEND,
    name: 'Suspend memberships',
    description: 'Suspend an eligible Organization Membership.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.MEMBERSHIPS_RESTORE,
    name: 'Restore memberships',
    description: 'Restore an eligible suspended Organization Membership.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.MEMBERSHIPS_REMOVE,
    name: 'Remove memberships',
    description: 'Soft-remove an eligible Organization Membership.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.MEMBERSHIPS_CHANGE_ROLE,
    name: 'Change membership roles',
    description: 'Change the Role of an eligible Organization Membership.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.INVITATIONS_READ,
    name: 'Read invitations',
    description: 'Read safe Organization Invitation administration data.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.INVITATIONS_CREATE,
    name: 'Create invitations',
    description: 'Create an Organization Invitation.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.INVITATIONS_REVOKE,
    name: 'Revoke invitations',
    description: 'Revoke an eligible pending Organization Invitation.',
    owner: 'Platform Core',
  },
  {
    key: PERMISSION_KEYS.INVITATIONS_RESEND,
    name: 'Resend invitations',
    description: 'Securely rotate or recreate an Organization Invitation.',
    owner: 'Platform Core',
  },
] as const satisfies readonly PermissionDefinition[]

const PERMISSION_KEY_PATTERN = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/

export function validatePermissionDefinitions(
  definitions: readonly PermissionDefinition[] = PERMISSION_DEFINITIONS,
): void {
  const keys = new Set<string>()

  for (const definition of definitions) {
    if (
      !definition.name.trim() ||
      !PERMISSION_KEY_PATTERN.test(definition.key) ||
      definition.key.includes('*') ||
      keys.has(definition.key)
    ) {
      throw new Error('INVALID_PERMISSION_REGISTRY')
    }

    keys.add(definition.key)
  }
}
