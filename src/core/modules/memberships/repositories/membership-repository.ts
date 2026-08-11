import 'server-only'

import type { MembershipStatus, Prisma, PrismaClient } from '@/generated/prisma/client'

type MembershipRepositoryClient = Pick<PrismaClient, 'organizationMembership'>

const membershipRecordSelect = {
  id: true,
  organizationId: true,
  profileId: true,
  roleId: true,
  status: true,
  suspendedAt: true,
  removedAt: true,
  createdAt: true,
  updatedAt: true,
} as const

export type MembershipRecord = Prisma.OrganizationMembershipGetPayload<{
  select: typeof membershipRecordSelect
}>

export function createMembershipRepository(client: MembershipRepositoryClient) {
  return {
    async findById(membershipId: string): Promise<MembershipRecord | null> {
      return client.organizationMembership.findUnique({
        where: {
          id: membershipId,
        },
        select: membershipRecordSelect,
      })
    },

    async findByOrganizationAndProfile(
      organizationId: string,
      profileId: string
    ): Promise<MembershipRecord | null> {
      return client.organizationMembership.findUnique({
        where: {
          organizationId_profileId: {
            organizationId,
            profileId,
          },
        },
        select: membershipRecordSelect,
      })
    },

    async findActiveByOrganizationAndProfile(
      organizationId: string,
      profileId: string
    ): Promise<MembershipRecord | null> {
      return client.organizationMembership.findFirst({
        where: {
          organizationId,
          profileId,
          status: 'ACTIVE',
        },
        select: membershipRecordSelect,
      })
    },

    async listByOrganization(
      organizationId: string,
      status?: MembershipStatus
    ): Promise<MembershipRecord[]> {
      return client.organizationMembership.findMany({
        where: {
          organizationId,
          ...(status !== undefined ? { status } : {}),
        },
        select: membershipRecordSelect,
      })
    },

    async listActiveByOrganization(
      organizationId: string
    ): Promise<MembershipRecord[]> {
      return client.organizationMembership.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
        select: membershipRecordSelect,
      })
    },
  }
}
