import 'server-only'

import type { InvitationStatus, Prisma, PrismaClient } from '@/generated/prisma/client'

type InvitationRepositoryClient = Pick<PrismaClient, 'organizationInvitation'>

const invitationRecordSelect = {
  id: true,
  organizationId: true,
  recipientEmail: true,
  normalizedEmail: true,
  roleId: true,
  status: true,
  expiresAt: true,
  invitedByMembershipId: true,
  acceptedByProfileId: true,
  acceptedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
} as const

export type InvitationRecord = Prisma.OrganizationInvitationGetPayload<{
  select: typeof invitationRecordSelect
}>

export function createInvitationRepository(client: InvitationRepositoryClient) {
  return {
    async findByTokenHash(
      tokenHash: string
    ): Promise<InvitationRecord | null> {
      return client.organizationInvitation.findUnique({
        where: {
          tokenHash,
        },
        select: invitationRecordSelect,
      })
    },

    async findPendingByOrganizationAndEmail(
      organizationId: string,
      normalizedEmail: string
    ): Promise<InvitationRecord | null> {
      return client.organizationInvitation.findFirst({
        where: {
          organizationId,
          normalizedEmail,
          status: 'PENDING',
        },
        select: invitationRecordSelect,
      })
    },

    async listByOrganization(
      organizationId: string,
      status?: InvitationStatus
    ): Promise<InvitationRecord[]> {
      return client.organizationInvitation.findMany({
        where: {
          organizationId,
          ...(status !== undefined ? { status } : {}),
        },
        select: invitationRecordSelect,
      })
    },
  }
}
