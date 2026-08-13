import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { createTransferOrganizationOwnershipService } from '@/core/modules/memberships/services/transfer-organization-ownership'
import { createRolePermissionRepository } from '@/core/modules/permissions/repositories/role-permission-repository'
import { createPermissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import { createAuthorizedOrganizationOperationRunner } from '@/core/modules/permissions/services/require-organization-permission'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { organizationSelect } from '@/core/modules/organizations/persistence/organization-select'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import {
  assertOrganizationsTestDatabase,
  createOrganizationTestSlug,
} from '@/core/modules/organizations/tests/assert-test-database'
import {
  createOwnedOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'

const TEST_PREFIX = 'owner-inv-port-'
const RUNTIME_ROLE = 'owner_invariant_app_runtime'
const HARDEN_MIGRATION = path.join(
  process.cwd(),
  'prisma/migrations/20260813181000_harden_organization_owner_invariant_functions/migration.sql'
)

let adminClient: pg.Client

async function cleanupFixtures(prisma: PrismaClient) {
  await deleteOrganizationTestRecords(prisma, {
    slug: { startsWith: TEST_PREFIX },
  })
  await prisma.profile.deleteMany({
    where: { username: { startsWith: TEST_PREFIX } },
  })
}

async function ensureHardenedFunctions(client: pg.Client) {
  const status = await client.query<{ prosecdef: boolean; config: string | null }>(
    `SELECT p.prosecdef,
            COALESCE(array_to_string(p.proconfig, ','), '') AS config
     FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = 'check_organization_owner_from_membership'`
  )

  const row = status.rows[0]
  if (row?.prosecdef && row.config.includes('search_path=')) {
    return
  }

  const sql = await readFile(HARDEN_MIGRATION, 'utf8')
  await client.query(sql)
}

async function ensureRuntimeRole(client: pg.Client) {
  await client.query(`DROP ROLE IF EXISTS ${RUNTIME_ROLE}`)
  await client.query(`CREATE ROLE ${RUNTIME_ROLE} NOLOGIN`)
  await client.query(`GRANT USAGE ON SCHEMA public TO ${RUNTIME_ROLE}`)
  await client.query(`
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
      public.profiles,
      public.organizations,
      public.organization_memberships
    TO ${RUNTIME_ROLE}
  `)
  await client.query(`GRANT SELECT ON TABLE public.roles TO ${RUNTIME_ROLE}`)
  await client.query(`GRANT ${RUNTIME_ROLE} TO CURRENT_USER`)
}

async function asRuntime<T>(
  client: pg.Client,
  operation: (client: pg.Client) => Promise<T>
): Promise<T> {
  await client.query('BEGIN')
  try {
    await client.query(`SET LOCAL ROLE ${RUNTIME_ROLE}`)
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

function createAuthorizedRunner(profileId: string, prisma: PrismaClient) {
  return createAuthorizedOrganizationOperationRunner<Prisma.TransactionClient>({
    getCurrentProfileId: async () => profileId,
    runInTransaction: (operation) =>
      prisma.$transaction(operation, { isolationLevel: 'Serializable' }),
    resolveOrganizationContext: async (
      client,
      actorProfileId,
      organizationId,
      allowedOrganizationStatuses
    ) => {
      const membershipRepository = createMembershipRepository(client)
      return createResolveOrganizationContextService({
        getCurrentProfileId: async () => actorProfileId,
        findOrganizationById: (id) =>
          client.organization.findUnique({
            where: { id },
            select: organizationSelect,
          }),
        findActiveMembership:
          membershipRepository.findActiveByOrganizationAndProfile,
        findRoleById: (id) => client.role.findUnique({ where: { id } }),
        allowedOrganizationStatuses,
      })(organizationId)
    },
    requirePermission: async (client, context, permissionKey) => {
      const membershipRepository = createMembershipRepository(client)
      const rolePermissionRepository = createRolePermissionRepository(client)
      return createPermissionAuthorizationServices({
        findMembershipById: membershipRepository.findById,
        findRoleById: (roleId) =>
          client.role.findUnique({ where: { id: roleId } }),
        roleHasPermission: rolePermissionRepository.exists,
      }).requirePermission(context, permissionKey)
    },
  })
}

describe('Organization owner invariant privilege portability', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    adminClient = new pg.Client({ connectionString: process.env.DATABASE_URL })
    await adminClient.connect()
    await ensureHardenedFunctions(adminClient)
    await ensureRuntimeRole(adminClient)

    const { prisma } = await import('@/lib/prisma')
    await seedSystemRoles(prisma)
    await syncPermissionsFoundation(prisma)
    await cleanupFixtures(prisma)
  }, 60_000)

  afterAll(async () => {
    const { prisma } = await import('@/lib/prisma')
    await cleanupFixtures(prisma)
    if (adminClient) {
      await adminClient.query(`REASSIGN OWNED BY ${RUNTIME_ROLE} TO CURRENT_USER`).catch(() => undefined)
      await adminClient.query(`DROP OWNED BY ${RUNTIME_ROLE}`).catch(() => undefined)
      await adminClient.query(`DROP ROLE IF EXISTS ${RUNTIME_ROLE}`)
      await adminClient.end()
    }
  })

  it('keeps only the required check_* helpers SECURITY DEFINER', async () => {
    const result = await adminClient.query<{
      proname: string
      prosecdef: boolean
      config: string
    }>(`
      SELECT p.proname,
             p.prosecdef,
             COALESCE(array_to_string(p.proconfig, ','), '') AS config
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname IN (
          'assert_organization_owner_invariant',
          'lock_organization_owner_invariant_scope',
          'check_organization_owner_from_organization',
          'check_organization_owner_from_membership',
          'check_organization_owner_from_role'
        )
      ORDER BY p.proname
    `)

    const byName = Object.fromEntries(
      result.rows.map((row) => [row.proname, row])
    )

    expect(byName.assert_organization_owner_invariant).toMatchObject({
      prosecdef: false,
      config: expect.stringContaining('search_path='),
    })
    expect(byName.lock_organization_owner_invariant_scope).toMatchObject({
      prosecdef: false,
      config: expect.stringContaining('search_path='),
    })
    expect(byName.check_organization_owner_from_organization).toMatchObject({
      prosecdef: true,
      config: expect.stringContaining('search_path='),
    })
    expect(byName.check_organization_owner_from_membership).toMatchObject({
      prosecdef: true,
      config: expect.stringContaining('search_path='),
    })
    expect(byName.check_organization_owner_from_role).toMatchObject({
      prosecdef: true,
      config: expect.stringContaining('search_path='),
    })
  })

  it('lets a distinct runtime role mutate Memberships without EXECUTE on assert_*', async () => {
    const privileges = await adminClient.query<{
      canExecuteAssert: boolean
      canExecuteCheckMembership: boolean
    }>(`
      SELECT
        has_function_privilege(
          $1,
          'public.assert_organization_owner_invariant(uuid)',
          'EXECUTE'
        ) AS "canExecuteAssert",
        has_function_privilege(
          $1,
          'public.check_organization_owner_from_membership()',
          'EXECUTE'
        ) AS "canExecuteCheckMembership"
    `, [RUNTIME_ROLE])

    expect(privileges.rows[0]).toEqual({
      canExecuteAssert: false,
      canExecuteCheckMembership: false,
    })

    const { prisma } = await import('@/lib/prisma')
    const ownerProfileId = randomUUID()
    const memberProfileId = randomUUID()
    await prisma.profile.create({
      data: {
        id: ownerProfileId,
        username: `${TEST_PREFIX}owner-${randomUUID().slice(0, 8)}`,
      },
    })
    await prisma.profile.create({
      data: {
        id: memberProfileId,
        username: `${TEST_PREFIX}member-${randomUUID().slice(0, 8)}`,
      },
    })

    const { organization, ownerMembership } =
      await createOwnedOrganizationTestRecord(
        prisma,
        {
          name: 'Portability Org',
          slug: createOrganizationTestSlug(TEST_PREFIX),
        },
        ownerProfileId
      )

    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { key: 'MEMBER' },
    })
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { key: 'ADMIN' },
    })
    const ownerRole = await prisma.role.findUniqueOrThrow({
      where: { key: 'OWNER' },
    })

    const memberMembershipId = randomUUID()

    await asRuntime(adminClient, async (client) => {
      await client.query(
        `INSERT INTO public.organization_memberships (
          id, organization_id, profile_id, role_id, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())`,
        [memberMembershipId, organization.id, memberProfileId, memberRole.id]
      )
    })

    await expect(
      asRuntime(adminClient, async (client) => {
        await client.query(
          `UPDATE public.organization_memberships
           SET status = 'SUSPENDED', suspended_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [ownerMembership.id]
        )
      })
    ).rejects.toMatchObject({ code: '23514' })

    await expect(
      asRuntime(adminClient, async (client) => {
        await client.query(
          `UPDATE public.organization_memberships
           SET role_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [ownerRole.id, memberMembershipId]
        )
      })
    ).rejects.toMatchObject({ code: '23514' })

    const transfer = createTransferOrganizationOwnershipService(
      createAuthorizedRunner(ownerProfileId, prisma)
    )
    const transferred = await transfer({
      organizationId: organization.id,
      targetMembershipId: memberMembershipId,
      previousOwnerRoleId: adminRole.id,
    })

    expect(transferred.newOwner.id).toBe(memberMembershipId)
    await expect(
      prisma.organizationMembership.count({
        where: {
          organizationId: organization.id,
          status: 'ACTIVE',
          role: { key: 'OWNER' },
        },
      })
    ).resolves.toBe(1)

    // Runtime still cannot execute privileged helpers directly.
    await expect(
      asRuntime(adminClient, async (client) => {
        await client.query(
          `SELECT public.assert_organization_owner_invariant($1::uuid)`,
          [organization.id]
        )
      })
    ).rejects.toMatchObject({ code: '42501' })
  })
})
