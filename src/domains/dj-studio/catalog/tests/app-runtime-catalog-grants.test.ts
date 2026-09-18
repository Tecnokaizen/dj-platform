import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'

const PRISMA_MIGRATIONS_DIRECTORY = path.join(process.cwd(), 'prisma/migrations')
const PRISMA_DJ_STUDIO_MIGRATIONS_DIRECTORY = path.join(
  process.cwd(),
  'prisma/migrations-dj-studio',
)
const CATALOG_RUNTIME_GRANTS_MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations-dj-studio/20260915150000_dj_studio_catalog_runtime_grants.sql',
)

const DATABASE_NAME = `dj_platform_catalog_grants_${randomUUID().replaceAll('-', '')}`
const CATALOG_TABLES = ['tracks', 'track_artists', 'artists'] as const

let adminClient: pg.Client
let grantsClient: pg.Client
const createdRoles: string[] = []

async function ensureAppRuntimeRole() {
  const roles = await adminClient.query<{ rolname: string }>(
    `SELECT rolname FROM pg_roles WHERE rolname = 'app_runtime'`,
  )
  if (roles.rowCount) {
    return
  }

  await adminClient.query(
    `CREATE ROLE app_runtime NOLOGIN BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE`,
  )
  createdRoles.push('app_runtime')
}

async function applyPrismaMigrations(client: pg.Client) {
  for (const root of [
    PRISMA_MIGRATIONS_DIRECTORY,
    PRISMA_DJ_STUDIO_MIGRATIONS_DIRECTORY,
  ]) {
    const entries = await readdir(root, { withFileTypes: true })
    const migrationDirectories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()

    for (const directory of migrationDirectories) {
      const migration = await readFile(
        path.join(root, directory, 'migration.sql'),
        'utf8',
      )
      await client.query(migration)
    }
  }
}

async function tablePrivileges(client: pg.Client, tableName: string) {
  const result = await client.query<{
    canSelect: boolean
    canInsert: boolean
    canUpdate: boolean
    canDelete: boolean
  }>(
    `SELECT
      has_table_privilege('app_runtime', format('public.%I', $1::text), 'SELECT') AS "canSelect",
      has_table_privilege('app_runtime', format('public.%I', $1::text), 'INSERT') AS "canInsert",
      has_table_privilege('app_runtime', format('public.%I', $1::text), 'UPDATE') AS "canUpdate",
      has_table_privilege('app_runtime', format('public.%I', $1::text), 'DELETE') AS "canDelete"`,
    [tableName],
  )

  return result.rows[0]
}

async function asAppRuntime(text: string, values: unknown[] = []) {
  await grantsClient.query('BEGIN')

  try {
    await grantsClient.query(`SET LOCAL ROLE app_runtime`)
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

describe('app_runtime catalog SELECT grants (Domain M6)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    adminClient = new pg.Client({ connectionString: process.env.DATABASE_URL })
    await adminClient.connect()
    await ensureAppRuntimeRole()
    await adminClient.query(`CREATE DATABASE ${DATABASE_NAME}`)

    const databaseUrl = new URL(process.env.DATABASE_URL as string)
    databaseUrl.pathname = `/${DATABASE_NAME}`
    grantsClient = new pg.Client({ connectionString: databaseUrl.toString() })
    await grantsClient.connect()
    await applyPrismaMigrations(grantsClient)
    await grantsClient.query(`GRANT USAGE ON SCHEMA public TO app_runtime`)
  }, 90_000)

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

  it('grants SELECT only on tracks / track_artists / artists and enables runtime reads', async () => {
    for (const tableName of CATALOG_TABLES) {
      expect(await tablePrivileges(grantsClient, tableName)).toEqual({
        canSelect: false,
        canInsert: false,
        canUpdate: false,
        canDelete: false,
      })
    }

    const migration = await readFile(CATALOG_RUNTIME_GRANTS_MIGRATION, 'utf8')
    await grantsClient.query(migration)

    for (const tableName of CATALOG_TABLES) {
      expect(await tablePrivileges(grantsClient, tableName)).toEqual({
        canSelect: true,
        canInsert: false,
        canUpdate: false,
        canDelete: false,
      })
    }

    const trackId = randomUUID()
    const artistId = randomUUID()

    await grantsClient.query(
      `INSERT INTO public.artists (id, name, normalized_name, slug, created_at, updated_at)
       VALUES ($1, 'Catalog Artist', 'catalog artist', 'catalog-artist', NOW(), NOW())`,
      [artistId],
    )
    await grantsClient.query(
      `INSERT INTO public.tracks (id, title, normalized_title, created_at, updated_at)
       VALUES ($1, 'Catalog Track', 'catalog track', NOW(), NOW())`,
      [trackId],
    )
    await grantsClient.query(
      `INSERT INTO public.track_artists (track_id, artist_id, role, position)
       VALUES ($1, $2, 'PRIMARY', 0)`,
      [trackId, artistId],
    )

    const trackRows = await asAppRuntime(
      `SELECT title FROM public.tracks WHERE id = $1`,
      [trackId],
    )
    expect(trackRows.rows).toEqual([{ title: 'Catalog Track' }])

    const joined = await asAppRuntime(
      `SELECT t.title, a.name
       FROM public.tracks t
       INNER JOIN public.track_artists ta ON ta.track_id = t.id
       INNER JOIN public.artists a ON a.id = ta.artist_id
       WHERE t.id = $1`,
      [trackId],
    )
    expect(joined.rows).toEqual([
      { title: 'Catalog Track', name: 'Catalog Artist' },
    ])

    await expect(
      asAppRuntime(
        `INSERT INTO public.tracks (id, title, normalized_title, created_at, updated_at)
         VALUES ($1, 'Hacked', 'hacked', NOW(), NOW())`,
        [randomUUID()],
      ),
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })

    await expect(
      asAppRuntime(`UPDATE public.tracks SET title = 'x' WHERE id = $1`, [
        trackId,
      ]),
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })

    await expect(
      asAppRuntime(`DELETE FROM public.artists WHERE id = $1`, [artistId]),
    ).rejects.toSatisfy((error: unknown) => {
      expectInsufficientPrivilege(error)
      return true
    })
  })
})
