import 'server-only'

import {
  PROFILE_ERROR_CODES,
  ProfileError,
} from '@/core/identity/profile/errors/profile-error'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { createOrganizationRecordSchema } from '@/core/modules/organizations/schemas/create-organization-record'
import {
  createCreateOrganizationRecord,
  type CreateOrganizationRecordInput,
} from '@/core/modules/organizations/services/create-organization-record'
import type { Organization } from '@/core/modules/organizations/types/organization'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { resolveRequiredRole } from '@/core/modules/roles/services/resolve-required-role'
import type { RoleDto } from '@/core/modules/roles/types/role-dto'
import { prisma } from '@/lib/prisma'

type OrganizationOnboardingTransaction = {
  createOrganizationRecord: ReturnType<typeof createCreateOrganizationRecord>
  membershipRepository: ReturnType<typeof createMembershipRepository>
}

export type OrganizationOnboardingDependencies = {
  getCurrentProfileId: () => Promise<string | null>
  resolveOwnerRole: () => Promise<RoleDto>
  runInTransaction: <Result>(
    operation: (
      transaction: OrganizationOnboardingTransaction
    ) => Promise<Result>
  ) => Promise<Result>
}

export function createOrganizationService(
  dependencies: OrganizationOnboardingDependencies
) {
  return async function createOrganization(
    input: CreateOrganizationRecordInput
  ): Promise<Organization> {
    const parsed = createOrganizationRecordSchema.parse(input)
    const profileId = await dependencies.getCurrentProfileId()

    if (!profileId) {
      throw new ProfileError(PROFILE_ERROR_CODES.NOT_FOUND)
    }

    const ownerRole = await dependencies.resolveOwnerRole()

    if (ownerRole.key !== SYSTEM_ROLE_KEYS.OWNER) {
      throw new MembershipError(
        MEMBERSHIP_ERROR_CODES.OWNER_INVARIANT_VIOLATION
      )
    }

    return dependencies.runInTransaction(
      async ({ createOrganizationRecord, membershipRepository }) => {
        const organization = await createOrganizationRecord(parsed)

        await membershipRepository.create({
          organizationId: organization.id,
          profileId,
          roleId: ownerRole.id,
        })

        return organization
      }
    )
  }
}

export const organizationOnboardingDependencies: OrganizationOnboardingDependencies = {
  getCurrentProfileId: async () => {
    const session = await getCurrentProfile()
    return session?.profile?.id ?? null
  },
  resolveOwnerRole: () => resolveRequiredRole(SYSTEM_ROLE_KEYS.OWNER),
  runInTransaction: (operation) =>
    prisma.$transaction((client) =>
      operation({
        createOrganizationRecord: createCreateOrganizationRecord(client),
        membershipRepository: createMembershipRepository(client),
      })
    ),
}

export const createOrganization = createOrganizationService(
  organizationOnboardingDependencies
)
