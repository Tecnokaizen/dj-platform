import type { SystemRoleKey } from '@/core/modules/roles/constants/system-role-keys'

export type OrganizationContext = {
  profileId: string
  organizationId: string
  membershipId: string
  roleId: string
  roleKey: SystemRoleKey
}
