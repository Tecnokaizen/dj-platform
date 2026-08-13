import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createInvitationRepository } from '@/core/modules/memberships/repositories/invitation-repository'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { createHasActiveMembershipService } from '@/core/modules/memberships/services/has-active-membership'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import {
  createOwnedOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'

const TEST_PREFIX = 'm060-m063-test-'

type ClientRoleRow = {
  rolname: string
}

type GrantRow = {
  grantee: string
  tableName: string
  privilegeType: string
}

type TableSecurityRow = {
  tableName: string
  rlsEnabled: boolean
  rlsForced: boolean
}

type PolicyRow = {
  tableName: string
  policyName: string
}

async function cleanupMembershipAccessRecords(): Promise<void> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')
  await deleteOrganizationTestRecords(prisma, {
    slug: { startsWith: TEST_PREFIX },
  })

  await prisma.profile.deleteMany({
    where: {
      username: {
        startsWith: TEST_PREFIX,
      },
    },
  })
}

async function createTestContext() {
  const { prisma } = await import('@/lib/prisma')
  const { seedSystemRoles } = await import(
    '@/core/modules/roles/seed/seed-system-roles'
  )

  await seedSystemRoles(prisma)

  const memberRole = await prisma.role.findUniqueOrThrow({
    where: { key: 'MEMBER' },
  })
  const suffix = randomUUID().slice(0, 18)
  const activeProfileId = randomUUID()
  const suspendedProfileId = randomUUID()
  const removedProfileId = randomUUID()
  const [{ organization }] = await Promise.all([
    createOwnedOrganizationTestRecord(prisma, {
      name: 'Membership Access Foundation Test',
      slug: `${TEST_PREFIX}${suffix}`,
    }),
    prisma.profile.create({
      data: {
        id: activeProfileId,
        username: `${TEST_PREFIX}active-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: suspendedProfileId,
        username: `${TEST_PREFIX}suspended-${suffix}`,
      },
    }),
    prisma.profile.create({
      data: {
        id: removedProfileId,
        username: `${TEST_PREFIX}removed-${suffix}`,
      },
    }),
  ])
  const [activeMembership] = await Promise.all([
    prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: activeProfileId,
        roleId: memberRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: suspendedProfileId,
        roleId: memberRole.id,
        status: 'SUSPENDED',
        suspendedAt: new Date(),
      },
    }),
    prisma.organizationMembership.create({
      data: {
        organizationId: organization.id,
        profileId: removedProfileId,
        roleId: memberRole.id,
        status: 'REMOVED',
        removedAt: new Date(),
      },
    }),
  ])

  return {
    activeMembership,
    activeProfileId,
    memberRole,
    organization,
    prisma,
    removedProfileId,
    suspendedProfileId,
  }
}

describe('Memberships table access foundation (M-060 → M-063)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupMembershipAccessRecords()
  })

  afterEach(async () => {
    await cleanupMembershipAccessRecords()
  })

  afterAll(async () => {
    await cleanupMembershipAccessRecords()
  })

  it('uses only an ACTIVE OrganizationMembership as the canonical tenant relationship', async () => {
    const context = await createTestContext()
    const hasActiveMembership = createHasActiveMembershipService(
      createMembershipRepository(context.prisma)
    )

    await expect(
      hasActiveMembership(
        context.organization.id,
        context.activeProfileId
      )
    ).resolves.toBe(true)
    await expect(
      hasActiveMembership(
        context.organization.id,
        context.suspendedProfileId
      )
    ).resolves.toBe(false)
    await expect(
      hasActiveMembership(
        context.organization.id,
        context.removedProfileId
      )
    ).resolves.toBe(false)
  })

  it('contains no competing tenant-membership persistence model', async () => {
    const schema = await readFile(
      path.join(process.cwd(), 'prisma/schema.prisma'),
      'utf8'
    )

    expect(schema).toMatch(/model OrganizationMembership\s*{/)
    expect(schema).not.toMatch(
      /model\s+(OrganizationUser|OrganizationUsers|UserOrganization)\s*{/
    )
    expect(schema).not.toMatch(/\borganizationIds\s+/)
    expect(schema).not.toMatch(/@@map\("(organization_users|user_organizations)"\)/)
  })

  it('requires deny-by-default RLS if a Supabase client role has table grants', async () => {
    const { prisma } = await import('@/lib/prisma')
    const clientRoles = await prisma.$queryRaw<ClientRoleRow[]>`
      SELECT rolname
      FROM pg_roles
      WHERE rolname IN ('anon', 'authenticated')
      ORDER BY rolname
    `
    const grants = await prisma.$queryRaw<GrantRow[]>`
      SELECT
        grantee,
        table_name AS "tableName",
        privilege_type AS "privilegeType"
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (
          'organization_memberships',
          'organization_invitations'
        )
        AND grantee IN ('anon', 'authenticated')
      ORDER BY grantee, table_name, privilege_type
    `
    const tableSecurity = await prisma.$queryRaw<TableSecurityRow[]>`
      SELECT
        pg_class.relname AS "tableName",
        pg_class.relrowsecurity AS "rlsEnabled",
        pg_class.relforcerowsecurity AS "rlsForced"
      FROM pg_class
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE pg_namespace.nspname = 'public'
        AND pg_class.relname IN (
          'organization_memberships',
          'organization_invitations'
        )
      ORDER BY pg_class.relname
    `
    const policies = await prisma.$queryRaw<PolicyRow[]>`
      SELECT
        tablename AS "tableName",
        policyname AS "policyName"
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (
          'organization_memberships',
          'organization_invitations'
        )
      ORDER BY tablename, policyname
    `

    expect(tableSecurity).toHaveLength(2)
    expect(
      clientRoles.every(({ rolname }) =>
        ['anon', 'authenticated'].includes(rolname)
      )
    ).toBe(true)

    if (grants.length === 0) {
      expect(policies).toEqual([])
      return
    }

    expect(tableSecurity.every(({ rlsEnabled }) => rlsEnabled)).toBe(true)
    expect(policies).toEqual([])
  })

  it('keeps tokenHash inside server-only persistence and outside normal records', async () => {
    const context = await createTestContext()
    const tokenHash = 'a'.repeat(64)
    const repository = createInvitationRepository(context.prisma)
    const invitation = await context.prisma.organizationInvitation.create({
      data: {
        organizationId: context.organization.id,
        recipientEmail: 'recipient@example.com',
        normalizedEmail: 'recipient@example.com',
        roleId: context.memberRole.id,
        status: 'PENDING',
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
        invitedByMembershipId: context.activeMembership.id,
      },
    })

    const projected = await repository.findByTokenHash(tokenHash)
    const repositorySource = await readFile(
      path.join(
        process.cwd(),
        'src/core/modules/memberships/repositories/invitation-repository.ts'
      ),
      'utf8'
    )

    expect(projected).toMatchObject({ id: invitation.id })
    expect(projected).not.toHaveProperty('tokenHash')
    expect(JSON.stringify(projected)).not.toContain(tokenHash)
    expect(repositorySource.startsWith("import 'server-only'")).toBe(true)
  })
})
