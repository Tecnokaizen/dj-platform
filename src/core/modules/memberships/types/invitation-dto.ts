import type { InvitationStatus } from '@/core/modules/memberships/types/invitation-status'

export type InvitationDto = {
  id: string
  organizationId: string
  recipientEmail: string
  roleId: string
  status: InvitationStatus
  expiresAt: string
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}
