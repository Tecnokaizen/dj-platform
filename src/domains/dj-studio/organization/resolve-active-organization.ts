import 'server-only'

import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import { prisma } from '@/lib/prisma'
import {
  readActiveOrganizationCookie,
  setActiveOrganizationCookie,
} from '@/domains/dj-studio/organization/active-organization-cookie'
import {
  ensurePersonalOrganization,
  pickDeterministicMembership,
} from '@/domains/dj-studio/organization/ensure-personal-organization'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

export type ResolveActiveOrganizationDependencies = {
  getCurrentProfileId: () => Promise<string | null>
  listActiveMembershipsOrdered: (profileId: string) => Promise<
    Array<{
      id: string
      organizationId: string
      profileId: string
      roleId: string
      createdAt: Date
    }>
  >
  readPreferredOrganizationId: () => Promise<string | null>
  persistPreferredOrganizationId: (organizationId: string) => Promise<void>
  ensurePersonalOrganization: (
    profileId: string,
  ) => Promise<ActiveOrganizationContext>
  resolveOrganizationContext: (
    organizationId: string,
    profileId: string,
  ) => Promise<ActiveOrganizationContext>
}

export function createResolveActiveOrganizationService(
  dependencies: ResolveActiveOrganizationDependencies,
) {
  return async function resolveActiveOrganization(): Promise<ActiveOrganizationContext> {
    const profileId = await dependencies.getCurrentProfileId()

    if (!profileId) {
      throw new DjStudioError(DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED)
    }

    const memberships =
      await dependencies.listActiveMembershipsOrdered(profileId)

    if (memberships.length === 0) {
      const context = await dependencies.ensurePersonalOrganization(profileId)
      await dependencies.persistPreferredOrganizationId(context.organizationId)
      return context
    }

    if (memberships.length === 1) {
      const only = memberships[0]!
      const context = await dependencies.resolveOrganizationContext(
        only.organizationId,
        profileId,
      )
      await dependencies.persistPreferredOrganizationId(context.organizationId)
      return context
    }

    const preferred = await dependencies.readPreferredOrganizationId()

    if (
      preferred &&
      memberships.some((membership) => membership.organizationId === preferred)
    ) {
      return dependencies.resolveOrganizationContext(preferred, profileId)
    }

    const fallback = pickDeterministicMembership(memberships)
    const context = await dependencies.resolveOrganizationContext(
      fallback.organizationId,
      profileId,
    )
    await dependencies.persistPreferredOrganizationId(context.organizationId)
    return context
  }
}

async function listActiveMembershipsOrdered(profileId: string) {
  return prisma.organizationMembership.findMany({
    where: {
      profileId,
      status: 'ACTIVE',
      organization: { status: 'ACTIVE' },
    },
    select: {
      id: true,
      organizationId: true,
      profileId: true,
      roleId: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'asc' }, { organizationId: 'asc' }],
  })
}

function resolveContextForProfile(profileId: string) {
  const membershipRepository = createMembershipRepository(prisma)
  return createResolveOrganizationContextService({
    getCurrentProfileId: async () => profileId,
    findOrganizationById,
    findRoleById,
    findActiveMembership: (organizationId, pid) =>
      membershipRepository.findActiveByOrganizationAndProfile(
        organizationId,
        pid,
      ),
  })
}

export const resolveActiveOrganization =
  createResolveActiveOrganizationService({
    getCurrentProfileId: async () => {
      const session = await getCurrentProfile()
      return session?.profile?.id ?? null
    },
    listActiveMembershipsOrdered,
    readPreferredOrganizationId: readActiveOrganizationCookie,
    persistPreferredOrganizationId: setActiveOrganizationCookie,
    ensurePersonalOrganization,
    resolveOrganizationContext: async (organizationId, profileId) =>
      resolveContextForProfile(profileId)(organizationId),
  })
