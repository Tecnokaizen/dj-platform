import 'server-only'

import type {
  InvitationStatus,
  Prisma,
  PrismaClient,
} from '@/generated/prisma/client'

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

export type CreateInvitationRecordInput = {
  organizationId: string
  recipientEmail: string
  normalizedEmail: string
  roleId: string
  tokenHash: string
  expiresAt: Date
  invitedByMembershipId: string
}

export function createInvitationRepository(client: InvitationRepositoryClient) {
  return {
    async create(
      input: CreateInvitationRecordInput,
    ): Promise<InvitationRecord> {
      return client.organizationInvitation.create({
        data: {
          organizationId: input.organizationId,
          recipientEmail: input.recipientEmail,
          normalizedEmail: input.normalizedEmail,
          roleId: input.roleId,
          status: 'PENDING',
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          invitedByMembershipId: input.invitedByMembershipId,
          acceptedByProfileId: null,
          acceptedAt: null,
          revokedAt: null,
        },
        select: invitationRecordSelect,
      })
    },

    async findById(invitationId: string): Promise<InvitationRecord | null> {
      return client.organizationInvitation.findUnique({
        where: {
          id: invitationId,
        },
        select: invitationRecordSelect,
      })
    },

    async findByTokenHash(tokenHash: string): Promise<InvitationRecord | null> {
      return client.organizationInvitation.findUnique({
        where: {
          tokenHash,
        },
        select: invitationRecordSelect,
      })
    },

    async findPendingByOrganizationAndEmail(
      organizationId: string,
      normalizedEmail: string,
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
      status?: InvitationStatus,
    ): Promise<InvitationRecord[]> {
      return client.organizationInvitation.findMany({
        where: {
          organizationId,
          ...(status !== undefined ? { status } : {}),
        },
        select: invitationRecordSelect,
      })
    },

    async expirePending(
      invitationId: string,
      expectedUpdatedAt: Date,
      now: Date,
    ): Promise<InvitationRecord | null> {
      const [updated] = await client.organizationInvitation.updateManyAndReturn(
        {
          where: {
            id: invitationId,
            status: 'PENDING',
            expiresAt: {
              lte: now,
            },
            updatedAt: expectedUpdatedAt,
          },
          data: {
            status: 'EXPIRED',
            updatedAt: now,
          },
          select: invitationRecordSelect,
        },
      )

      return updated ?? null
    },

    async revokePending(
      invitationId: string,
      expectedUpdatedAt: Date,
      now: Date,
    ): Promise<InvitationRecord | null> {
      const [updated] = await client.organizationInvitation.updateManyAndReturn(
        {
          where: {
            id: invitationId,
            status: 'PENDING',
            expiresAt: {
              gt: now,
            },
            updatedAt: expectedUpdatedAt,
          },
          data: {
            status: 'REVOKED',
            revokedAt: now,
            updatedAt: now,
          },
          select: invitationRecordSelect,
        },
      )

      return updated ?? null
    },

    async rotatePendingToken(
      invitationId: string,
      expectedUpdatedAt: Date,
      tokenHash: string,
      now: Date,
    ): Promise<InvitationRecord | null> {
      const [updated] = await client.organizationInvitation.updateManyAndReturn(
        {
          where: {
            id: invitationId,
            status: 'PENDING',
            expiresAt: {
              gt: now,
            },
            updatedAt: expectedUpdatedAt,
          },
          data: {
            tokenHash,
            updatedAt: now,
          },
          select: invitationRecordSelect,
        },
      )

      return updated ?? null
    },

    async acceptPending(
      invitationId: string,
      expectedUpdatedAt: Date,
      acceptedByProfileId: string,
      acceptedAt: Date,
    ): Promise<InvitationRecord | null> {
      const [updated] = await client.organizationInvitation.updateManyAndReturn(
        {
          where: {
            id: invitationId,
            status: 'PENDING',
            expiresAt: {
              gt: acceptedAt,
            },
            updatedAt: expectedUpdatedAt,
          },
          data: {
            status: 'ACCEPTED',
            acceptedByProfileId,
            acceptedAt,
            updatedAt: acceptedAt,
          },
          select: invitationRecordSelect,
        },
      )

      return updated ?? null
    },
  }
}
