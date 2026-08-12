import 'server-only'

import {
  PROFILE_ERROR_CODES,
  ProfileError,
} from '@/core/identity/profile/errors/profile-error'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { organizationIdSchema } from '@/core/modules/organizations/schemas/organization-id'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import type { Organization } from '@/core/modules/organizations/types/organization'
import type { OrganizationContext } from '@/core/modules/organizations/types/organization-context'
import { prisma } from '@/lib/prisma'

type ActiveMembershipContext = {
  id: string
  organizationId: string
  profileId: string
  roleId: string
}

export type ResolveOrganizationContextDependencies = {
  getCurrentProfileId: () => Promise<string | null>
  findOrganizationById: (
    organizationId: string
  ) => Promise<Organization | null>
  findActiveMembership: (
    organizationId: string,
    profileId: string
  ) => Promise<ActiveMembershipContext | null>
}

export function createResolveOrganizationContextService(
  dependencies: ResolveOrganizationContextDependencies
) {
  return async function resolveOrganizationContext(
    organizationId: string
  ): Promise<OrganizationContext> {
    const parsedOrganizationId = organizationIdSchema.parse(organizationId)
    const profileId = await dependencies.getCurrentProfileId()

    if (!profileId) {
      throw new ProfileError(PROFILE_ERROR_CODES.NOT_FOUND)
    }

    const membership = await dependencies.findActiveMembership(
      parsedOrganizationId,
      profileId
    )

    if (!membership) {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_ACTIVE)
    }

    const organization =
      await dependencies.findOrganizationById(parsedOrganizationId)

    if (!organization) {
      throw new OrganizationError(ORGANIZATION_ERROR_CODES.NOT_FOUND)
    }

    if (organization.status !== 'ACTIVE') {
      throw new OrganizationError(ORGANIZATION_ERROR_CODES.INVALID_STATE)
    }

    return {
      profileId,
      organizationId: organization.id,
      membershipId: membership.id,
      roleId: membership.roleId,
    }
  }
}

export type SwitchActiveOrganizationDependencies = {
  resolveOrganizationContext: (
    organizationId: string
  ) => Promise<OrganizationContext>
  setActiveOrganizationContext: (
    context: OrganizationContext
  ) => Promise<void>
}

export function createSwitchActiveOrganizationService(
  dependencies: SwitchActiveOrganizationDependencies
) {
  return async function switchActiveOrganization(
    organizationId: string
  ): Promise<OrganizationContext> {
    const context =
      await dependencies.resolveOrganizationContext(organizationId)

    await dependencies.setActiveOrganizationContext(context)

    return context
  }
}

const membershipRepository = createMembershipRepository(prisma)

export const resolveOrganizationContextDependencies: ResolveOrganizationContextDependencies = {
  getCurrentProfileId: async () => {
    const session = await getCurrentProfile()
    return session?.profile?.id ?? null
  },
  findOrganizationById,
  findActiveMembership: (organizationId, profileId) =>
    membershipRepository.findActiveByOrganizationAndProfile(
      organizationId,
      profileId
    ),
}

export const resolveOrganizationContext =
  createResolveOrganizationContextService(
    resolveOrganizationContextDependencies
  )
