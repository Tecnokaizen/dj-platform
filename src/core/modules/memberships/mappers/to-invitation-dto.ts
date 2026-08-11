import type { InvitationRecord } from '@/core/modules/memberships/repositories/invitation-repository'
import type { InvitationDto } from '@/core/modules/memberships/types/invitation-dto'

export function toInvitationDto(record: InvitationRecord): InvitationDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    recipientEmail: record.recipientEmail,
    roleId: record.roleId,
    status: record.status,
    expiresAt: record.expiresAt.toISOString(),
    acceptedAt: record.acceptedAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
