import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const PRISMA_MIGRATIONS_DIRECTORY = path.join(process.cwd(), 'prisma/migrations')
const PROFILES_AUTHENTICATED_GRANTS_MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations/20260914230000_profiles_authenticated_grants.sql'
)
const DATABASE_NAME = `dj_platform_profiles_grants_${randomUUID().replaceAll('-', '')}`

const profileA = randomUUID()
const profileB = randomUUID()

let adminClient: pg.Client
let grantsClient: pg.Client
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

async function bootstrapAuthUid(client: pg.Client) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS auth;

    CREATE OR REPLACE FUNCTION auth.uid()
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

async function installExistingProfilePolicies(client: pg.Client) {
  // Mirror Foundation S1 policies without re-running the full historical file
  // (which also targets legacy Domain tables renamed by later Prisma migrations).
  await client.query(`
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
    DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

    CREATE POLICY profiles_select_own
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

    CREATE POLICY profiles_update_own
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
  `)
}

async function grantDangerousDefaultPrivileges(client: pg.Client) {
  await client.query(`
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
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
      has_table_privilege($1, 'public.profiles', 'SELECT') AS "canSelect",
      has_table_privilege($1, 'public.profiles', 'INSERT') AS "canInsert",
      has_table_privilege($1, 'public.profiles', 'UPDATE') AS "canUpdate",
      has_table_privilege($1, 'public.profiles', 'DELETE') AS "canDelete"`,
    [roleName]
  )

  return result.rows[0]
}

async function asAuthenticated(
  profileId: string,
  text: string,
  values: unknown[] = []
) {
  await grantsClient.query('BEGIN')

  try {
    await grantsClient.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [
      profileId,
    ])
    await grantsClient.query(`SET LOCAL ROLE authenticated`)
    const result = await grantsClient.query(text, values)
    await grantsClient.query('ROLLBACK')
    return result
  } catch (error) {
    await grantsClient.query('ROLLBACK')
    throw error
  }
}

async function asAnon(text: string, values: unknown[] = []) {
  await grantsClient.query('BEGIN')

  try {
    await grantsClient.query(`SET LOCAL ROLE anon`)
    const result = await grantsClient.query(text, values)
    await grantsClient.query('ROLLBACK')
    return result
  } catch (error) {
    await grantsClient.query('ROLLBACK')
    throw error
  }
}

function expectInsufficientPrivilege(error: unknown) {
  expect(error).toMatchObject({ code: '42501' })
}

describe('Profiles authenticated PostgREST grants (Foundation S7)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    adminClient = new pg.Client({ connectionString: process.env.DATABASE_URL })
    await adminClient.connect()
    await createSupabaseTestRoles()
    await adminClient.query(`CREATE DATABASE ${DATABASE_NAME}`)

    const databaseUrl = new URL(process.env.DATABASE_URL as string)
    databaseUrl.pathname = `/${DATABASE_NAME}`
    grantsClient = new pg.Client({ connectionString: databaseUrl.toString() })
    await grantsClient.connect()
    await applyPrismaMigrations(grantsClient)
    await bootstrapAuthUid(grantsClient)
    await installExistingProfilePolicies(grantsClient)
    await grantsClient.query(
      `INSERT INTO public.profiles (id, username, display_name, preferred_language, created_at, updated_at)
       VALUES
         ($1, 'profile_a', 'Profile A', 'es', NOW(), NOW()),
         ($2, 'profile_b', 'Profile B', 'es', NOW(), NOW())`,
      [profileA, profileB]
    )
    await grantDangerousDefaultPrivileges(grantsClient)
  }, 60_000)

  afterAll(async () => {
    if (grantsClient) {
      await grantsClient.end()
    }

    if (adminClient) {
      await adminClient.query(`DROP DATABASE IF EXISTS ${DATABASE_NAME}`)

      for (const role of createdRoles.reverse()) {
        await adminClient.query(`DROP ROLE IF EXISTS ${role}`)
      }

      await adminClient.end()
    }
  })

  it('grants authenticated SELECT/UPDATE only and keeps RLS row scope', async () => {
    expect(await tablePrivileges(grantsClient, 'anon')).toEqual({
      canSelect: true,
      canInsert: true,
      canUpdate: true,
      canDelete: true,
    })
    expect(await tablePrivileges(grantsClient, 'authenticated')).toEqual({
      canSelect: true,
      canInsert: true,
      canUpdate: true,
      canDelete: true,
    })

    const migration = await readFile(PROFILES_AUTHENTICATED_GRANTS_MIGRATION, 'utf8')
    await grantsClient.query(migration)

    expect(await tablePrivileges(grantsClient, 'anon')).toEqual({
      canSelect: false,
      canInsert: false,
      canUpdate: false,
      canDelete: false,
    })
    expect(await tablePrivileges(grantsClient, 'authenticated')).toEqual({
      canSelect: true,
      canInsert: false,
      canUpdate: true,
      canDelete: false,
    })

    const ownSelect = await asAuthenticated(
      profileA,
      `SELECT display_name FROM public.profiles WHERE id = $1`,
      [profileA]
    )
    expect(ownSelect.rows).toEqual([{ display_name: 'Profile A' }])

    const otherSelect = await asAuthenticated(
      profileA,
      `SELECT display_name FROM public.profiles WHERE id = $1`,
      [profileB]
    )
    expect(otherSelect.rows).toEqual([])

    const ownUpdate = await asAuthenticated(
      profileA,
      `UPDATE public.profiles SET display_name = 'Updated A' WHERE id = $1 RETURNING display_name`,
      [profileA]
    )
    expect(ownUpdate.rows).toEqual([{ display_name: 'Updated A' }])

    const otherUpdate = await asAuthenticated(
      profileA,
      `UPDATE public.profiles SET display_name = 'Hijacked' WHERE id = $1 RETURNING display_name`,
      [profileB]
    )
    expect(otherUpdate.rows).toEqual([])

    await expect(
      asAuthenticated(
        profileA,
        `INSERT INTO public.profiles (id, username, created_at, updated_at)
         VALUES ($1, 'hacked', NOW(), NOW())`,
        [randomUUID()]
      )
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })

    await expect(
      asAuthenticated(profileA, `DELETE FROM public.profiles WHERE id = $1`, [
        profileA,
      ])
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })

    await expect(
      asAnon(`SELECT display_name FROM public.profiles WHERE id = $1`, [profileA])
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })

    const stillB = await grantsClient.query<{ display_name: string }>(
      `SELECT display_name FROM public.profiles WHERE id = $1`,
      [profileB]
    )
    expect(stillB.rows).toEqual([{ display_name: 'Profile B' }])
  })
})
