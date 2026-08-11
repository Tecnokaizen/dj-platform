import 'server-only'

import {
  PROFILE_ERROR_CODES,
  ProfileError,
} from '@/core/identity/profile/errors/profile-error'
import { findProfileById } from '@/core/identity/profile/services/find-profile-by-id'
import type { ProfileReference } from '@/core/identity/profile/services/find-profile-by-id'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import {
  createMembershipRepository,
  type MembershipRecord,
} from '@/core/modules/memberships/repositories/membership-repository'
import { isOwnerRole } from '@/core/modules/memberships/services/owner-safety'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import type { Organization } from '@/core/modules/organizations/types/organization'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import type { Role } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

type MembershipRepository = ReturnType<typeof createMembershipRepository>

export type MembershipLifecycleDependencies = {
  membershipRepository: MembershipRepository
  findOrganizationById: (
    organizationId: string
  ) => Promise<Organization | null>
  findProfileById: (
    profileId: string
  ) => Promise<ProfileReference | null>
  findRoleById: (roleId: string) => Promise<Role | null>
  now: () => Date
}

export function createMembershipLifecycleSupport(
  dependencies: MembershipLifecycleDependencies
) {
  async function requireMembership(
    membershipId: string
  ): Promise<MembershipRecord> {
    const membership = await dependencies.membershipRepository.findById(
      membershipId
    )

    if (!membership) {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_FOUND)
    }

    return membership
  }

  async function requireActiveOrganization(
    organizationId: string
  ): Promise<void> {
    const organization = await dependencies.findOrganizationById(organizationId)

    if (!organization) {
      throw new OrganizationError(ORGANIZATION_ERROR_CODES.NOT_FOUND)
    }

    if (organization.status !== 'ACTIVE') {
      throw new OrganizationError(ORGANIZATION_ERROR_CODES.INVALID_STATE)
    }
  }

  async function requireProfile(profileId: string): Promise<void> {
    const profile = await dependencies.findProfileById(profileId)

    if (!profile) {
      throw new ProfileError(PROFILE_ERROR_CODES.NOT_FOUND)
    }
  }

  async function requireRole(roleId: string): Promise<Role> {
    const role = await dependencies.findRoleById(roleId)

    if (!role) {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.ROLE_INVALID)
    }

    return role
  }

  function rejectOwnerRole(role: Role): void {
    if (isOwnerRole(role)) {
      throw new MembershipError(
        MEMBERSHIP_ERROR_CODES.OWNER_TRANSFER_REQUIRED
      )
    }
  }

  function throwMembershipStateError(record: MembershipRecord): never {
    if (record.status === 'SUSPENDED') {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.SUSPENDED)
    }

    if (record.status === 'REMOVED') {
      throw new MembershipError(MEMBERSHIP_ERROR_CODES.REMOVED)
    }

    throw new MembershipError(MEMBERSHIP_ERROR_CODES.INVALID_STATE)
  }

  return {
    membershipRepository: dependencies.membershipRepository,
    now: dependencies.now,
    rejectOwnerRole,
    requireActiveOrganization,
    requireMembership,
    requireProfile,
    requireRole,
    throwMembershipStateError,
  }
}

export type MembershipLifecycleSupport = ReturnType<
  typeof createMembershipLifecycleSupport
>

export const membershipLifecycleSupport = createMembershipLifecycleSupport({
  membershipRepository: createMembershipRepository(prisma),
  findOrganizationById,
  findProfileById,
  findRoleById,
  now: () => new Date(),
})
