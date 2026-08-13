import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const PRISMA_MIGRATIONS_DIRECTORY = path.join(process.cwd(), 'prisma/migrations')
const ROLES_CATALOG_GRANTS_MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations/20260813180000_roles_catalog_client_grants.sql'
)
const DATABASE_NAME = `dj_platform_roles_rls_${randomUUID().replaceAll('-', '')}`

let adminClient: pg.Client
let catalogClient: pg.Client
const createdRoles: string[] = []
const fixtureRoleId = randomUUID()

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

async function grantDangerousDefaultPrivileges(client: pg.Client) {
  // Simulate common Supabase/public-table defaults before hardening.
  await client.query(`
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.roles TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.roles TO authenticated;
  `)
}

async function tablePrivileges(
  client: pg.Client,
  roleName: 'anon' | 'authenticated'
) {
  const result = await client.query<{
    canSelect: boolean
    canInsert: boolean
    canUpdate: boolean
    canDelete: boolean
  }>(
    `SELECT
      has_table_privilege($1, 'public.roles', 'SELECT') AS "canSelect",
      has_table_privilege($1, 'public.roles', 'INSERT') AS "canInsert",
      has_table_privilege($1, 'public.roles', 'UPDATE') AS "canUpdate",
      has_table_privilege($1, 'public.roles', 'DELETE') AS "canDelete"`,
    [roleName]
  )

  return result.rows[0]
}

async function queryAsRole(
  roleName: 'anon' | 'authenticated',
  text: string,
  values: unknown[] = []
) {
  await catalogClient.query('BEGIN')

  try {
    await catalogClient.query(`SET LOCAL ROLE ${roleName}`)
    const result = await catalogClient.query(text, values)
    await catalogClient.query('ROLLBACK')
    return result
  } catch (error) {
    await catalogClient.query('ROLLBACK')
    throw error
  }
}

function expectInsufficientPrivilege(error: unknown) {
  expect(error).toMatchObject({ code: '42501' })
}

describe('Roles catalog client grants (R-020 / R-021)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    adminClient = new pg.Client({ connectionString: process.env.DATABASE_URL })
    await adminClient.connect()
    await createSupabaseTestRoles()
    await adminClient.query(`CREATE DATABASE ${DATABASE_NAME}`)

    const databaseUrl = new URL(process.env.DATABASE_URL as string)
    databaseUrl.pathname = `/${DATABASE_NAME}`
    catalogClient = new pg.Client({ connectionString: databaseUrl.toString() })
    await catalogClient.connect()
    await applyPrismaMigrations(catalogClient)
    await catalogClient.query(`
      INSERT INTO public.roles (
        id, key, name, description, is_system, sort_order, created_at, updated_at
      ) VALUES (
        $1, 'CATALOG_FIXTURE', 'Catalog Fixture', 'fixture', TRUE, 999, NOW(), NOW()
      )
    `, [fixtureRoleId])
    await grantDangerousDefaultPrivileges(catalogClient)
  }, 60_000)

  afterAll(async () => {
    if (catalogClient) {
      await catalogClient.end()
    }

    if (adminClient) {
      await adminClient.query(`DROP DATABASE IF EXISTS ${DATABASE_NAME}`)

      for (const role of createdRoles.reverse()) {
        await adminClient.query(`DROP ROLE IF EXISTS ${role}`)
      }

      await adminClient.end()
    }
  })

  it('starts from a dangerous privilege precondition, then hardens writes and approved SELECT', async () => {
    expect(await tablePrivileges(catalogClient, 'anon')).toEqual({
      canSelect: true,
      canInsert: true,
      canUpdate: true,
      canDelete: true,
    })
    expect(await tablePrivileges(catalogClient, 'authenticated')).toEqual({
      canSelect: true,
      canInsert: true,
      canUpdate: true,
      canDelete: true,
    })

    const migration = await readFile(ROLES_CATALOG_GRANTS_MIGRATION, 'utf8')
    await catalogClient.query(migration)

    expect(await tablePrivileges(catalogClient, 'anon')).toEqual({
      canSelect: false,
      canInsert: false,
      canUpdate: false,
      canDelete: false,
    })
    expect(await tablePrivileges(catalogClient, 'authenticated')).toEqual({
      canSelect: true,
      canInsert: false,
      canUpdate: false,
      canDelete: false,
    })

    const rls = await catalogClient.query<{ relrowsecurity: boolean }>(
      `SELECT c.relrowsecurity
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = 'roles'`
    )
    expect(rls.rows[0]?.relrowsecurity).toBe(true)

    const policies = await catalogClient.query<{ policyname: string }>(
      `SELECT policyname
       FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'roles'`
    )
    expect(policies.rows.map(({ policyname }) => policyname)).toEqual([
      'roles_select_authenticated',
    ])

    const authenticatedSelect = await queryAsRole(
      'authenticated',
      `SELECT key FROM public.roles WHERE id = $1`,
      [fixtureRoleId]
    )
    expect(authenticatedSelect.rows).toEqual([{ key: 'CATALOG_FIXTURE' }])

    await expect(
      queryAsRole('anon', `SELECT key FROM public.roles WHERE id = $1`, [
        fixtureRoleId,
      ])
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })

    const writeAttempts = [
      `INSERT INTO public.roles (
        id, key, name, is_system, sort_order, created_at, updated_at
      ) VALUES (
        '${randomUUID()}', 'HACKED_ROLE', 'Hacked', TRUE, 1000, NOW(), NOW()
      )`,
      `UPDATE public.roles SET name = 'mutated' WHERE id = '${fixtureRoleId}'`,
      `DELETE FROM public.roles WHERE id = '${fixtureRoleId}'`,
    ] as const

    for (const roleName of ['anon', 'authenticated'] as const) {
      for (const statement of writeAttempts) {
        await expect(queryAsRole(roleName, statement)).rejects.toSatisfy(
          (error: unknown) => {
            expectInsufficientPrivilege(error)
            return true
          }
        )
      }
    }

    const stillPresent = await catalogClient.query<{ key: string }>(
      `SELECT key FROM public.roles WHERE id = $1`,
      [fixtureRoleId]
    )
    expect(stillPresent.rows).toEqual([{ key: 'CATALOG_FIXTURE' }])
  })
})
