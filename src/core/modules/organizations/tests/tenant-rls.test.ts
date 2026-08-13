import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const PRISMA_MIGRATIONS_DIRECTORY = path.join(process.cwd(), 'prisma/migrations')
const TENANT_RLS_MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations/20260812020000_membership_based_tenant_rls.sql'
)
const PERMISSIONS_SERVER_ONLY_MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations/20260812150200_permissions_server_only.sql'
)
const DATABASE_NAME = `dj_platform_rls_${randomUUID().replaceAll('-', '')}`

const ids = {
  activeOrganization: randomUUID(),
  activeMembership: randomUUID(),
  activeProfile: randomUUID(),
  archivedOrganization: randomUUID(),
  archivedOrganizationMembership: randomUUID(),
  otherOrganization: randomUUID(),
  otherMembership: randomUUID(),
  otherProfile: randomUUID(),
  removedMembership: randomUUID(),
  removedOrganization: randomUUID(),
  role: randomUUID(),
  suspendedMembership: randomUUID(),
  suspendedMembershipOrganization: randomUUID(),
  suspendedOrganization: randomUUID(),
  suspendedOrganizationMembership: randomUUID(),
}

let adminClient: pg.Client
let tenantClient: pg.Client
const createdRoles: string[] = []

async function createSupabaseTestRoles() {
  const roles = await adminClient.query<{ rolname: string }>(
    `SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')`
  )
  const existingRoles = new Set(roles.rows.map(({ rolname }) => rolname))

  for (const role of ['anon', 'authenticated']) {
    if (!existingRoles.has(role)) {
      await adminClient.query(`CREATE ROLE ${role} NOLOGIN`)
      createdRoles.push(role)
    }
  }
}

async function applyPrismaMigrations(client: pg.Client) {
  const entries = await readdir(PRISMA_MIGRATIONS_DIRECTORY, {
    withFileTypes: true,
  })
  const migrationDirectories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const directory of migrationDirectories) {
    const migration = await readFile(
      path.join(PRISMA_MIGRATIONS_DIRECTORY, directory, 'migration.sql'),
      'utf8'
    )
    await client.query(migration)
  }
}

async function bootstrapSupabaseAuth(client: pg.Client) {
  await client.query(`
    CREATE SCHEMA auth;

    CREATE FUNCTION auth.uid()
    RETURNS UUID
    LANGUAGE sql
    STABLE
    SET search_path = ''
    AS $$
      SELECT NULLIF(
        current_setting('request.jwt.claim.sub', true),
        ''
      )::UUID;
    $$;

    REVOKE ALL ON FUNCTION auth.uid() FROM PUBLIC;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
  `)
}

async function seedTenantFixtures(client: pg.Client) {
  const organizations = [
    [ids.activeOrganization, 'Active tenant', 'ACTIVE'],
    [ids.otherOrganization, 'Other tenant', 'ACTIVE'],
    [ids.suspendedMembershipOrganization, 'Suspended membership', 'ACTIVE'],
    [ids.removedOrganization, 'Removed membership', 'ACTIVE'],
    [ids.suspendedOrganization, 'Suspended tenant', 'SUSPENDED'],
    [ids.archivedOrganization, 'Archived tenant', 'ARCHIVED'],
  ] as const

  await client.query('BEGIN')

  try {
    await client.query(
      `INSERT INTO public.roles (
        id, key, name, is_system, sort_order, created_at, updated_at
      ) VALUES
        ($1, 'RLS_MEMBER', 'RLS Member', TRUE, 100, NOW(), NOW()),
        ($2, 'OWNER', 'Owner', TRUE, 10, NOW(), NOW())`,
      [ids.role, randomUUID()]
    )
    const ownerRole = await client.query<{ id: string }>(
      `SELECT id FROM public.roles WHERE key = 'OWNER'`
    )
    const ownerRoleId = ownerRole.rows[0]?.id

    if (!ownerRoleId) {
      throw new Error('OWNER Role fixture was not created')
    }

    for (const [id, name, status] of organizations) {
      await client.query(
        `INSERT INTO public.organizations (
          id, name, slug, status, locale, timezone, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'es', 'UTC', NOW(), NOW())`,
        [id, name, `rls-${id}`, status]
      )

      const ownerProfileId = randomUUID()
      await client.query(
        `INSERT INTO public.profiles (id, username, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [ownerProfileId, `rls-owner-${id.slice(0, 8)}`]
      )
      await client.query(
        `INSERT INTO public.organization_memberships (
          id, organization_id, profile_id, role_id, status,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())`,
        [randomUUID(), id, ownerProfileId, ownerRoleId]
      )
    }

    await client.query(
      `INSERT INTO public.profiles (id, username, created_at, updated_at)
       VALUES
         ($1, 'rls-active-profile', NOW(), NOW()),
         ($2, 'rls-other-profile', NOW(), NOW())`,
      [ids.activeProfile, ids.otherProfile]
    )

  const memberships = [
    [
      ids.activeMembership,
      ids.activeOrganization,
      ids.activeProfile,
      'ACTIVE',
    ],
    [ids.otherMembership, ids.otherOrganization, ids.otherProfile, 'ACTIVE'],
    [
      ids.suspendedMembership,
      ids.suspendedMembershipOrganization,
      ids.activeProfile,
      'SUSPENDED',
    ],
    [
      ids.removedMembership,
      ids.removedOrganization,
      ids.activeProfile,
      'REMOVED',
    ],
    [
      ids.suspendedOrganizationMembership,
      ids.suspendedOrganization,
      ids.activeProfile,
      'ACTIVE',
    ],
    [
      ids.archivedOrganizationMembership,
      ids.archivedOrganization,
      ids.activeProfile,
      'ACTIVE',
    ],
  ] as const

    for (const [id, organizationId, profileId, status] of memberships) {
      await client.query(
        `INSERT INTO public.organization_memberships (
          id, organization_id, profile_id, role_id, status,
          suspended_at, removed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5::membership_status,
          CASE WHEN $5::text = 'SUSPENDED' THEN NOW() ELSE NULL END,
          CASE WHEN $5::text = 'REMOVED' THEN NOW() ELSE NULL END,
          NOW(), NOW()
        )`,
        [id, organizationId, profileId, ids.role, status]
      )
    }

    await client.query(
      `INSERT INTO public.organization_invitations (
        id, organization_id, recipient_email, normalized_email, role_id,
        status, token_hash, expires_at, invited_by_membership_id,
        created_at, updated_at
      ) VALUES (
        $1, $2, 'recipient@example.com', 'recipient@example.com', $3,
        'PENDING', $4, NOW() + INTERVAL '72 hours', $5,
        NOW(), NOW()
      )`,
      [
        randomUUID(),
        ids.activeOrganization,
        ids.role,
        'a'.repeat(64),
        ids.activeMembership,
      ]
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function queryAsAuthenticated<Row extends pg.QueryResultRow>(
  profileId: string,
  text: string,
  values: unknown[] = []
): Promise<pg.QueryResult<Row>> {
  await tenantClient.query('BEGIN')

  try {
    await tenantClient.query('SET LOCAL ROLE authenticated')
    await tenantClient.query(
      `SELECT set_config('request.jwt.claim.sub', $1, true)`,
      [profileId]
    )
    const result = await tenantClient.query<Row>(text, values)
    await tenantClient.query('ROLLBACK')
    return result
  } catch (error) {
    await tenantClient.query('ROLLBACK')
    throw error
  }
}

async function queryAsAnon(text: string): Promise<pg.QueryResult> {
  await tenantClient.query('BEGIN')

  try {
    await tenantClient.query('SET LOCAL ROLE anon')
    const result = await tenantClient.query(text)
    await tenantClient.query('ROLLBACK')
    return result
  } catch (error) {
    await tenantClient.query('ROLLBACK')
    throw error
  }
}

function expectInsufficientPrivilege(error: unknown) {
  expect(error).toMatchObject({ code: '42501' })
}

describe('Membership-based tenant RLS (M-087)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    adminClient = new pg.Client({ connectionString: process.env.DATABASE_URL })
    await adminClient.connect()
    await createSupabaseTestRoles()
    await adminClient.query(`CREATE DATABASE ${DATABASE_NAME}`)

    const databaseUrl = new URL(process.env.DATABASE_URL as string)
    databaseUrl.pathname = `/${DATABASE_NAME}`
    tenantClient = new pg.Client({ connectionString: databaseUrl.toString() })
    await tenantClient.connect()
    await applyPrismaMigrations(tenantClient)
    await bootstrapSupabaseAuth(tenantClient)
    const migration = await readFile(TENANT_RLS_MIGRATION, 'utf8')
    await tenantClient.query(migration)
    const permissionsMigration = await readFile(
      PERMISSIONS_SERVER_ONLY_MIGRATION,
      'utf8'
    )
    await tenantClient.query(permissionsMigration)
    await seedTenantFixtures(tenantClient)
  }, 30_000)

  afterAll(async () => {
    if (tenantClient) {
      await tenantClient.end()
    }

    if (adminClient) {
      await adminClient.query(`DROP DATABASE IF EXISTS ${DATABASE_NAME}`)

      for (const role of createdRoles.reverse()) {
        await adminClient.query(`DROP ROLE IF EXISTS ${role}`)
      }

      await adminClient.end()
    }
  })

  it('allows an authenticated Profile to read only its active Organization', async () => {
    const result = await queryAsAuthenticated<{ id: string }>(
      ids.activeProfile,
      `SELECT id FROM public.organizations ORDER BY id`
    )

    expect(result.rows).toEqual([{ id: ids.activeOrganization }])
  })

  it('excludes SUSPENDED and REMOVED Memberships and inactive Organizations', async () => {
    const organizationResult = await queryAsAuthenticated<{ id: string }>(
      ids.activeProfile,
      `SELECT id FROM public.organizations`
    )
    const membershipResult = await queryAsAuthenticated<{ id: string }>(
      ids.activeProfile,
      `SELECT id FROM public.organization_memberships`
    )

    expect(organizationResult.rows.map(({ id }) => id)).toEqual([
      ids.activeOrganization,
    ])
    expect(membershipResult.rows.map(({ id }) => id)).toEqual([
      ids.activeMembership,
    ])
  })

  it('does not expose another Profile Organization or Membership', async () => {
    const organizations = await queryAsAuthenticated<{ id: string }>(
      ids.otherProfile,
      `SELECT id FROM public.organizations`
    )
    const memberships = await queryAsAuthenticated<{ id: string }>(
      ids.otherProfile,
      `SELECT id FROM public.organization_memberships`
    )

    expect(organizations.rows).toEqual([{ id: ids.otherOrganization }])
    expect(memberships.rows).toEqual([{ id: ids.otherMembership }])
  })

  it('returns no tenant rows when authenticated has no Profile subject', async () => {
    const result = await queryAsAuthenticated<{ id: string }>(
      '',
      `SELECT id FROM public.organizations`
    )

    expect(result.rows).toEqual([])
  })

  it('denies all direct access to Invitations and their token hash', async () => {
    await expect(
      queryAsAuthenticated(
        ids.activeProfile,
        `SELECT id, token_hash FROM public.organization_invitations`
      )
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })
  })

  it('keeps the Permission catalog and Role policy server-only', async () => {
    for (const table of ['permissions', 'role_permissions']) {
      await expect(
        queryAsAuthenticated(
          ids.activeProfile,
          `SELECT * FROM public.${table}`
        )
      ).rejects.toSatisfy((error: unknown) => {
        expectInsufficientPrivilege(error)
        return true
      })
      await expect(
        queryAsAnon(`SELECT * FROM public.${table}`)
      ).rejects.toSatisfy((error: unknown) => {
        expectInsufficientPrivilege(error)
        return true
      })
    }
  })

  it('denies authenticated writes to tenant foundation tables', async () => {
    const statements = [
      `UPDATE public.organizations SET name = 'forbidden' WHERE id = '${ids.activeOrganization}'`,
      `DELETE FROM public.organization_memberships WHERE id = '${ids.activeMembership}'`,
      `INSERT INTO public.organization_invitations (
        id, organization_id, recipient_email, normalized_email, role_id,
        status, token_hash, expires_at, invited_by_membership_id,
        created_at, updated_at
      ) VALUES (
        '${randomUUID()}', '${ids.activeOrganization}', 'x@example.com',
        'x@example.com', '${ids.role}', 'PENDING', '${'b'.repeat(64)}',
        NOW() + INTERVAL '1 hour', '${ids.activeMembership}', NOW(), NOW()
      )`,
    ]

    for (const statement of statements) {
      await expect(
        queryAsAuthenticated(ids.activeProfile, statement)
      ).rejects.toSatisfy((error: unknown) => {
        expectInsufficientPrivilege(error)
        return true
      })
    }
  })

  it('gives anon no tenant table access', async () => {
    await expect(
      queryAsAnon(`SELECT id FROM public.organizations`)
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })
  })

  it('keeps trusted server access independent from client RLS', async () => {
    const organizations = await tenantClient.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM public.organizations`
    )
    const invitations = await tenantClient.query<{ tokenHash: string }>(
      `SELECT token_hash AS "tokenHash" FROM public.organization_invitations`
    )

    expect(organizations.rows).toEqual([{ count: '6' }])
    expect(invitations.rows).toEqual([{ tokenHash: 'a'.repeat(64) }])
  })

  it('installs only the approved client policies and grants', async () => {
    const policies = await tenantClient.query<{
      policyName: string
      tableName: string
    }>(`
      SELECT tablename AS "tableName", policyname AS "policyName"
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (
          'organizations',
          'organization_memberships',
          'organization_invitations'
        )
      ORDER BY tablename, policyname
    `)
    const grants = await tenantClient.query<{
      grantee: string
      privilegeType: string
      tableName: string
    }>(`
      SELECT
        grantee,
        table_name AS "tableName",
        privilege_type AS "privilegeType"
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (
          'organizations',
          'organization_memberships',
          'organization_invitations'
        )
        AND grantee IN ('anon', 'authenticated')
      ORDER BY grantee, table_name, privilege_type
    `)
    const unsafeColumnPrivileges = await tenantClient.query<{
      columnName: string
      grantee: string
      privilegeType: string
      tableName: string
    }>(`
      SELECT
        grantee,
        table_name AS "tableName",
        column_name AS "columnName",
        privilege_type AS "privilegeType"
      FROM information_schema.role_column_grants
      WHERE table_schema = 'public'
        AND table_name IN (
          'organizations',
          'organization_memberships',
          'organization_invitations'
        )
        AND grantee IN ('anon', 'authenticated')
        AND (
          privilege_type <> 'SELECT'
          OR table_name = 'organization_invitations'
        )
      ORDER BY grantee, table_name, column_name, privilege_type
    `)

    expect(policies.rows).toEqual([
      {
        policyName: 'organization_memberships_select_own_active',
        tableName: 'organization_memberships',
      },
      {
        policyName: 'organizations_select_active_member',
        tableName: 'organizations',
      },
    ])
    expect(grants.rows).toEqual([
      {
        grantee: 'authenticated',
        privilegeType: 'SELECT',
        tableName: 'organization_memberships',
      },
      {
        grantee: 'authenticated',
        privilegeType: 'SELECT',
        tableName: 'organizations',
      },
    ])
    expect(unsafeColumnPrivileges.rows).toEqual([])
    expect(
      await tenantClient.query<{ canReadTokenHash: boolean }>(`
        SELECT has_column_privilege(
          'authenticated',
          'public.organization_invitations',
          'token_hash',
          'SELECT'
        ) AS "canReadTokenHash"
      `)
    ).toMatchObject({ rows: [{ canReadTokenHash: false }] })
  })
})
