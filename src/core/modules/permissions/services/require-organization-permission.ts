import 'server-only'

import {
  PROFILE_ERROR_CODES,
  ProfileError,
} from '@/core/identity/profile/errors/profile-error'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import type { PermissionKey } from '@/core/modules/permissions/constants/permission-keys'
import { createRolePermissionRepository } from '@/core/modules/permissions/repositories/role-permission-repository'
import { createPermissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import type { AuthorizationContext } from '@/core/modules/permissions/types/authorization-context'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export type AuthorizedOrganizationOperation<Client, Result> = {
  permissionKey: PermissionKey
  resolveOrganizationId: (client: Client) => Promise<string>
  execute: (client: Client, context: AuthorizationContext) => Promise<Result>
}

export type OrganizationPermissionTransactionDependencies<Client> = {
  getCurrentProfileId: () => Promise<string | null>
  runInTransaction: <Result>(
    operation: (client: Client) => Promise<Result>
  ) => Promise<Result>
  resolveOrganizationContext: (
    client: Client,
    profileId: string,
    organizationId: string
  ) => Promise<AuthorizationContext>
  requirePermission: (
    client: Client,
    context: AuthorizationContext,
    permissionKey: PermissionKey
  ) => Promise<AuthorizationContext>
}

const SERIALIZABLE_RETRY_LIMIT = 3

function isSerializableConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  )
}

export function createAuthorizedOrganizationOperationRunner<Client>(
  dependencies: OrganizationPermissionTransactionDependencies<Client>
) {
  return async function runAuthorizedOrganizationOperation<Result>({
    permissionKey,
    resolveOrganizationId,
    execute,
  }: AuthorizedOrganizationOperation<Client, Result>): Promise<Result> {
    // Supabase is consulted before the database transaction. All tenant and
    // permission state is then revalidated transactionally from PostgreSQL.
    const profileId = await dependencies.getCurrentProfileId()

    if (!profileId) {
      throw new ProfileError(PROFILE_ERROR_CODES.NOT_FOUND)
    }

    let attempt = 0

    while (true) {
      attempt += 1

      try {
        return await dependencies.runInTransaction(async (client) => {
          const organizationId = await resolveOrganizationId(client)
          const context = await dependencies.resolveOrganizationContext(
            client,
            profileId,
            organizationId
          )

          await dependencies.requirePermission(client, context, permissionKey)

          return execute(client, context)
        })
      } catch (error) {
        if (
          !isSerializableConflict(error) ||
          attempt >= SERIALIZABLE_RETRY_LIMIT
        ) {
          throw error
        }
      }
    }
  }
}

async function resolveTransactionOrganizationContext(
  client: Prisma.TransactionClient,
  profileId: string,
  organizationId: string
): Promise<AuthorizationContext> {
  const membershipRepository = createMembershipRepository(client)
  const resolveOrganizationContext = createResolveOrganizationContextService({
    getCurrentProfileId: async () => profileId,
    findOrganizationById: (id) =>
      client.organization.findUnique({
        where: { id },
        select: organizationSelect,
      }),
    findActiveMembership:
      membershipRepository.findActiveByOrganizationAndProfile,
    findRoleById: (id) => client.role.findUnique({ where: { id } }),
  })

  return resolveOrganizationContext(organizationId)
}

async function requireTransactionPermission(
  client: Prisma.TransactionClient,
  context: AuthorizationContext,
  permissionKey: PermissionKey
): Promise<AuthorizationContext> {
  const membershipRepository = createMembershipRepository(client)
  const rolePermissionRepository = createRolePermissionRepository(client)
  const authorization = createPermissionAuthorizationServices({
    findMembershipById: membershipRepository.findById,
    findRoleById: (roleId) => client.role.findUnique({ where: { id: roleId } }),
    roleHasPermission: rolePermissionRepository.exists,
  })

  return authorization.requirePermission(context, permissionKey)
}

export const runAuthorizedOrganizationOperation =
  createAuthorizedOrganizationOperationRunner<Prisma.TransactionClient>({
    getCurrentProfileId: async () => {
      const session = await getCurrentProfile()
      return session?.profile?.id ?? null
    },
    runInTransaction: (operation) =>
      prisma.$transaction(operation, {
        isolationLevel: 'Serializable',
      }),
    resolveOrganizationContext: resolveTransactionOrganizationContext,
    requirePermission: requireTransactionPermission,
  })
