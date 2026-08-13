import type { InvitationDto } from '@/core/modules/memberships/types/invitation-dto'

export type CreatedInvitationSecret = {
  invitation: InvitationDto
  rawToken: string
}
