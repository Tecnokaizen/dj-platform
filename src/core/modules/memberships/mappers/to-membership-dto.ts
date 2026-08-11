import type { MembershipRecord } from '@/core/modules/memberships/repositories/membership-repository'
import type { MembershipDto } from '@/core/modules/memberships/types/membership-dto'

export function toMembershipDto(record: MembershipRecord): MembershipDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    profileId: record.profileId,
    roleId: record.roleId,
    status: record.status,
    suspendedAt: record.suspendedAt?.toISOString() ?? null,
    removedAt: record.removedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
