import 'server-only'

import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { createCreateOrganizationRecord } from '@/core/modules/organizations/services/create-organization-record'
import { findOrganizationBySlug } from '@/core/modules/organizations/services/find-organization-by-slug'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { resolveRequiredRole } from '@/core/modules/roles/services/resolve-required-role'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import { prisma } from '@/lib/prisma'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'

export function personalOrganizationSlug(profileId: string): string {
  return `personal-${profileId.replaceAll('-', '')}`
}

export type EnsurePersonalOrganizationDependencies = {
  listActiveMembershipsOrdered: (profileId: string) => Promise<
    Array<{
      id: string
      organizationId: string
      profileId: string
      roleId: string
      createdAt: Date
    }>
  >
  resolveOrganizationContext: (
    organizationId: string,
    profileId: string,
  ) => Promise<ActiveOrganizationContext>
  findOrganizationBySlug: (
    slug: string,
  ) => Promise<{ id: string; name: string } | null>
  createPersonalOrganization: (input: {
    profileId: string
    name: string
    slug: string
  }) => Promise<{ id: string }>
  getProfileDisplayName: (profileId: string) => Promise<{
    displayName: string | null
    username: string | null
  } | null>
}

function pickDeterministicMembership<T extends { createdAt: Date; organizationId: string }>(
  memberships: T[],
): T {
  return [...memberships].sort((a, b) => {
    const byCreated = a.createdAt.getTime() - b.createdAt.getTime()
    if (byCreated !== 0) return byCreated
    return a.organizationId.localeCompare(b.organizationId)
  })[0]!
}

export function createEnsurePersonalOrganizationService(
  dependencies: EnsurePersonalOrganizationDependencies,
) {
  return async function ensurePersonalOrganization(
    profileId: string,
  ): Promise<ActiveOrganizationContext> {
    const active = await dependencies.listActiveMembershipsOrdered(profileId)

    if (active.length > 0) {
      const chosen = pickDeterministicMembership(active)
      return dependencies.resolveOrganizationContext(
        chosen.organizationId,
        profileId,
      )
    }

    const profile = await dependencies.getProfileDisplayName(profileId)

    if (!profile) {
      throw new DjStudioError(DJ_STUDIO_ERROR_CODES.PROFILE_NOT_FOUND)
    }

    const slug = personalOrganizationSlug(profileId)
    const name =
      profile.displayName?.trim() ||
      profile.username?.trim() ||
      'Personal Studio'

    try {
      const organization = await dependencies.createPersonalOrganization({
        profileId,
        name,
        slug,
      })
      return dependencies.resolveOrganizationContext(organization.id, profileId)
    } catch (error) {
      if (
        error instanceof OrganizationError &&
        error.code === ORGANIZATION_ERROR_CODES.SLUG_CONFLICT
      ) {
        const existing = await dependencies.findOrganizationBySlug(slug)

        if (!existing) {
          throw error
        }

        // Concurrent ensure: org exists; membership should exist from winner.
        const again = await dependencies.listActiveMembershipsOrdered(profileId)

        if (again.length === 0) {
          throw new DjStudioError(DJ_STUDIO_ERROR_CODES.NO_ACTIVE_ORGANIZATION)
        }

        const chosen = pickDeterministicMembership(again)
        return dependencies.resolveOrganizationContext(
          chosen.organizationId,
          profileId,
        )
      }

      throw error
    }
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

export const ensurePersonalOrganization =
  createEnsurePersonalOrganizationService({
    listActiveMembershipsOrdered,
    resolveOrganizationContext: async (organizationId, profileId) => {
      const membershipRepository = createMembershipRepository(prisma)
      const resolve = createResolveOrganizationContextService({
        getCurrentProfileId: async () => profileId,
        findOrganizationById,
        findRoleById,
        findActiveMembership: (orgId, pid) =>
          membershipRepository.findActiveByOrganizationAndProfile(orgId, pid),
      })
      return resolve(organizationId)
    },
    findOrganizationBySlug,
    createPersonalOrganization: async ({ profileId, name, slug }) => {
      const ownerRole = await resolveRequiredRole(SYSTEM_ROLE_KEYS.OWNER)

      return prisma.$transaction(async (client) => {
        const createOrganizationRecord = createCreateOrganizationRecord(client)
        const membershipRepository = createMembershipRepository(client)
        const organization = await createOrganizationRecord({ name, slug })
        await membershipRepository.create({
          organizationId: organization.id,
          profileId,
          roleId: ownerRole.id,
        })
        return organization
      })
    },
    getProfileDisplayName: async (profileId) =>
      prisma.profile.findUnique({
        where: { id: profileId },
        select: { displayName: true, username: true },
      }),
  })

/** Session-bound ensure using authenticated Profile. */
export async function ensurePersonalOrganizationForCurrentProfile(): Promise<ActiveOrganizationContext> {
  const session = await getCurrentProfile()
  const profileId = session?.profile?.id

  if (!profileId) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED)
  }

  return ensurePersonalOrganization(profileId)
}

export { pickDeterministicMembership }
