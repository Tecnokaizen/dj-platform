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

export type CreateMembershipRecordInput = {
  organizationId: string
  profileId: string
  roleId: string
}

export function createMembershipRepository(client: MembershipRepositoryClient) {
  return {
    async create(
      input: CreateMembershipRecordInput
    ): Promise<MembershipRecord> {
      return client.organizationMembership.create({
        data: {
          organizationId: input.organizationId,
          profileId: input.profileId,
          roleId: input.roleId,
          status: 'ACTIVE',
          suspendedAt: null,
          removedAt: null,
        },
        select: membershipRecordSelect,
      })
    },

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

    async listByProfile(profileId: string): Promise<MembershipRecord[]> {
      return client.organizationMembership.findMany({
        where: {
          profileId,
        },
        select: membershipRecordSelect,
      })
    },

    async listActiveByProfile(profileId: string): Promise<MembershipRecord[]> {
      return client.organizationMembership.findMany({
        where: {
          profileId,
          status: 'ACTIVE',
        },
        select: membershipRecordSelect,
      })
    },

    async suspendActive(
      membershipId: string,
      expectedRoleId: string,
      suspendedAt: Date
    ): Promise<MembershipRecord | null> {
      const [updated] = await client.organizationMembership.updateManyAndReturn({
        where: {
          id: membershipId,
          roleId: expectedRoleId,
          status: 'ACTIVE',
        },
        data: {
          status: 'SUSPENDED',
          suspendedAt,
          removedAt: null,
        },
        select: membershipRecordSelect,
      })

      return updated ?? null
    },

    async restoreSuspended(
      membershipId: string,
      expectedRoleId: string
    ): Promise<MembershipRecord | null> {
      const [updated] = await client.organizationMembership.updateManyAndReturn({
        where: {
          id: membershipId,
          roleId: expectedRoleId,
          status: 'SUSPENDED',
        },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
          removedAt: null,
        },
        select: membershipRecordSelect,
      })

      return updated ?? null
    },

    async removeActiveOrSuspended(
      membershipId: string,
      expectedRoleId: string,
      removedAt: Date
    ): Promise<MembershipRecord | null> {
      const [updated] = await client.organizationMembership.updateManyAndReturn({
        where: {
          id: membershipId,
          roleId: expectedRoleId,
          status: {
            in: ['ACTIVE', 'SUSPENDED'],
          },
        },
        data: {
          status: 'REMOVED',
          suspendedAt: null,
          removedAt,
        },
        select: membershipRecordSelect,
      })

      return updated ?? null
    },

    async restoreRemoved(
      membershipId: string,
      expectedRoleId: string,
      targetRoleId: string
    ): Promise<MembershipRecord | null> {
      const [updated] = await client.organizationMembership.updateManyAndReturn({
        where: {
          id: membershipId,
          roleId: expectedRoleId,
          status: 'REMOVED',
        },
        data: {
          roleId: targetRoleId,
          status: 'ACTIVE',
          suspendedAt: null,
          removedAt: null,
        },
        select: membershipRecordSelect,
      })

      return updated ?? null
    },

    async changeActiveRole(
      membershipId: string,
      expectedRoleId: string,
      targetRoleId: string
    ): Promise<MembershipRecord | null> {
      const [updated] = await client.organizationMembership.updateManyAndReturn({
        where: {
          id: membershipId,
          roleId: expectedRoleId,
          status: 'ACTIVE',
        },
        data: {
          roleId: targetRoleId,
        },
        select: membershipRecordSelect,
      })

      return updated ?? null
    },

    async transferActiveRole(
      membershipId: string,
      expectedRoleId: string,
      targetRoleId: string
    ): Promise<MembershipRecord | null> {
      const [updated] = await client.organizationMembership.updateManyAndReturn({
        where: {
          id: membershipId,
          roleId: expectedRoleId,
          status: 'ACTIVE',
        },
        data: {
          roleId: targetRoleId,
        },
        select: membershipRecordSelect,
      })

      return updated ?? null
    },
  }
}
