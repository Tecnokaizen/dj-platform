import type { MembershipStatus } from '@/core/modules/memberships/types/membership-status'

export type MembershipDto = {
  id: string
  organizationId: string
  profileId: string
  roleId: string
  status: MembershipStatus
  suspendedAt: string | null
  removedAt: string | null
  createdAt: string
  updatedAt: string
}

export type MembershipWithRoleDto = {
  id: string
  organizationId: string
  profileId: string
  status: MembershipStatus
  role: {
    id: string
    key: string
    name: string
  }
}
