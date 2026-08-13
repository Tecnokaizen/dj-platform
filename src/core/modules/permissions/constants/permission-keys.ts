export const PERMISSION_KEYS = {
  ORGANIZATIONS_READ: 'organizations.read',
  ORGANIZATIONS_UPDATE: 'organizations.update',
  ORGANIZATIONS_TRANSFER_OWNERSHIP: 'organizations.transfer_ownership',
  MEMBERSHIPS_READ: 'memberships.read',
  MEMBERSHIPS_SUSPEND: 'memberships.suspend',
  MEMBERSHIPS_RESTORE: 'memberships.restore',
  MEMBERSHIPS_REMOVE: 'memberships.remove',
  MEMBERSHIPS_CHANGE_ROLE: 'memberships.change_role',
  INVITATIONS_READ: 'invitations.read',
  INVITATIONS_CREATE: 'invitations.create',
  INVITATIONS_REVOKE: 'invitations.revoke',
  INVITATIONS_RESEND: 'invitations.resend',
} as const

export type PermissionKey =
  (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS]
