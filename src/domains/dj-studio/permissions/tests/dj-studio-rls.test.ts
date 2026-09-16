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
const TENANT_RLS_MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations/20260812020000_membership_based_tenant_rls.sql',
)
const DJ_STUDIO_RLS_MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations-dj-studio/20260913240000_dj_studio_rls_and_runtime_grants.sql',
)

const DATABASE_NAME = `dj_platform_dj_rls_${randomUUID().replaceAll('-', '')}`

const ids = {
  orgA: randomUUID(),
  orgB: randomUUID(),
  ownerA: randomUUID(),
  memberA: randomUUID(),
  viewerA: randomUUID(),
  ownerB: randomUUID(),
  roleOwner: randomUUID(),
  roleMember: randomUUID(),
  roleViewer: randomUUID(),
  trackA: randomUUID(),
  trackB: randomUUID(),
  libraryA: randomUUID(),
  libraryB: randomUUID(),
  tagA: randomUUID(),
  playlistA: randomUUID(),
  playlistItemA: randomUUID(),
}

let adminClient: pg.Client
let tenantClient: pg.Client
const createdRoles: string[] = []

async function createSupabaseTestRoles() {
  const roles = await adminClient.query<{ rolname: string }>(
    `SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'app_runtime')`,
  )
  const existingRoles = new Set(roles.rows.map(({ rolname }) => rolname))

  for (const role of ['anon', 'authenticated']) {
    if (!existingRoles.has(role)) {
      await adminClient.query(`CREATE ROLE ${role} NOLOGIN`)
      createdRoles.push(role)
    }
  }

  if (!existingRoles.has('app_runtime')) {
    await adminClient.query(
      `CREATE ROLE app_runtime NOLOGIN BYPASSRLS NOSUPERUSER`,
    )
    createdRoles.push('app_runtime')
  }
}

async function applyPrismaMigrations(client: pg.Client) {
  for (const root of [
    PRISMA_MIGRATIONS_DIRECTORY,
    PRISMA_DJ_STUDIO_MIGRATIONS_DIRECTORY,
  ]) {
    const entries = await readdir(root, {
      withFileTypes: true,
    })
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

async function asUser(profileId: string) {
  await tenantClient.query('BEGIN')
  await tenantClient.query('SET LOCAL ROLE authenticated')
  await tenantClient.query(
    `SELECT set_config('request.jwt.claim.sub', $1, true)`,
    [profileId],
  )
}

async function endUser() {
  await tenantClient.query('ROLLBACK')
}

describe('DJ Studio Domain RLS', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()

    const adminUrl = new URL(process.env.DATABASE_URL!)
    adminUrl.pathname = '/postgres'
    adminClient = new pg.Client({ connectionString: adminUrl.toString() })
    await adminClient.connect()
    await adminClient.query(`CREATE DATABASE "${DATABASE_NAME}"`)

    const dbUrl = new URL(process.env.DATABASE_URL!)
    dbUrl.pathname = `/${DATABASE_NAME}`
    tenantClient = new pg.Client({ connectionString: dbUrl.toString() })
    await tenantClient.connect()

    await createSupabaseTestRoles()
    await applyPrismaMigrations(tenantClient)
    await bootstrapSupabaseAuth(tenantClient)
    await tenantClient.query(await readFile(TENANT_RLS_MIGRATION, 'utf8'))
    await tenantClient.query(await readFile(DJ_STUDIO_RLS_MIGRATION, 'utf8'))

    await tenantClient.query(
      `INSERT INTO roles (id, key, name, is_system, sort_order, created_at, updated_at) VALUES
        ($1, 'OWNER', 'Owner', true, 10, now(), now()),
        ($2, 'MEMBER', 'Member', true, 40, now(), now()),
        ($3, 'VIEWER', 'Viewer', true, 50, now(), now())`,
      [ids.roleOwner, ids.roleMember, ids.roleViewer],
    )

    await tenantClient.query(
      `INSERT INTO profiles (id, preferred_language, is_admin, created_at, updated_at) VALUES
        ($1, 'es', false, now(), now()),
        ($2, 'es', false, now(), now()),
        ($3, 'es', false, now(), now()),
        ($4, 'es', false, now(), now())`,
      [ids.ownerA, ids.memberA, ids.viewerA, ids.ownerB],
    )

    await tenantClient.query('BEGIN')
    await tenantClient.query(
      `INSERT INTO organizations (id, name, slug, status, locale, timezone, created_at, updated_at) VALUES
        ($1::uuid, 'Org A', 'org-a-' || substr($1::text, 1, 8), 'ACTIVE', 'es', 'UTC', now(), now()),
        ($2::uuid, 'Org B', 'org-b-' || substr($2::text, 1, 8), 'ACTIVE', 'es', 'UTC', now(), now())`,
      [ids.orgA, ids.orgB],
    )

    await tenantClient.query(
      `INSERT INTO organization_memberships
        (id, organization_id, profile_id, role_id, status, created_at, updated_at) VALUES
        (gen_random_uuid(), $1, $2, $3, 'ACTIVE', now(), now()),
        (gen_random_uuid(), $1, $4, $5, 'ACTIVE', now(), now()),
        (gen_random_uuid(), $1, $6, $7, 'ACTIVE', now(), now()),
        (gen_random_uuid(), $8, $9, $3, 'ACTIVE', now(), now())`,
      [
        ids.orgA,
        ids.ownerA,
        ids.roleOwner,
        ids.memberA,
        ids.roleMember,
        ids.viewerA,
        ids.roleViewer,
        ids.orgB,
        ids.ownerB,
      ],
    )
    await tenantClient.query('COMMIT')

    await tenantClient.query(
      `INSERT INTO tracks (id, title, normalized_title, created_at, updated_at) VALUES
        ($1, 'Track A', 'track a', now(), now()),
        ($2, 'Track B', 'track b', now(), now())`,
      [ids.trackA, ids.trackB],
    )

    await tenantClient.query(
      `INSERT INTO library_items
        (id, organization_id, track_id, status, is_favorite, play_count, date_added, created_at, updated_at)
       VALUES
        ($1, $2, $3, 'LIBRARY', false, 0, now(), now(), now()),
        ($4, $5, $6, 'LIBRARY', false, 0, now(), now(), now())`,
      [ids.libraryA, ids.orgA, ids.trackA, ids.libraryB, ids.orgB, ids.trackB],
    )

    await tenantClient.query(
      `INSERT INTO tags (id, organization_id, name, normalized_name, created_at, updated_at)
       VALUES ($1, $2, 'Warm', 'warm', now(), now())`,
      [ids.tagA, ids.orgA],
    )

    await tenantClient.query(
      `INSERT INTO library_item_tags (organization_id, library_item_id, tag_id)
       VALUES ($1, $2, $3)`,
      [ids.orgA, ids.libraryA, ids.tagA],
    )

    await tenantClient.query(
      `INSERT INTO playlists
        (id, organization_id, name, slug, playlist_type, visibility, metadata, created_at, updated_at)
       VALUES ($1, $2, 'Set A', 'set-a', 'MANUAL', 'PRIVATE', '{}', now(), now())`,
      [ids.playlistA, ids.orgA],
    )

    await tenantClient.query(
      `INSERT INTO playlist_items
        (id, organization_id, playlist_id, library_item_id, position, created_at)
       VALUES ($1, $2, $3, $4, 1, now())`,
      [ids.playlistItemA, ids.orgA, ids.playlistA, ids.libraryA],
    )

    await tenantClient.query(
      `INSERT INTO dj_studio_profiles (profile_id, stage_name, created_at, updated_at)
       VALUES ($1, 'Owner A', now(), now()), ($2, 'Owner B', now(), now())`,
      [ids.ownerA, ids.ownerB],
    )

    // leftover legacy row for browser deny check
    await tenantClient.query(
      `INSERT INTO legacy_user_tracks
        (id, user_id, track_id, status, is_favorite, play_count, date_added, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'LIBRARY', false, 0, now(), now(), now())`,
      [ids.ownerA, ids.trackA],
    )
  }, 120_000)

  afterAll(async () => {
    await tenantClient?.end().catch(() => undefined)
    if (adminClient) {
      await adminClient
        .query(`DROP DATABASE IF EXISTS "${DATABASE_NAME}"`)
        .catch(() => undefined)
      for (const role of createdRoles) {
        await adminClient
          .query(`DROP ROLE IF EXISTS ${role}`)
          .catch(() => undefined)
      }
      await adminClient.end().catch(() => undefined)
    }
  })

  it('A: Org A member SELECT library Org A → PASS', async () => {
    await asUser(ids.memberA)
    const result = await tenantClient.query(
      `SELECT id FROM library_items WHERE organization_id = $1`,
      [ids.orgA],
    )
    expect(result.rowCount).toBe(1)
    await endUser()
  })

  it('B: Org A member SELECT library Org B → 0', async () => {
    await asUser(ids.memberA)
    const result = await tenantClient.query(
      `SELECT id FROM library_items WHERE organization_id = $1`,
      [ids.orgB],
    )
    expect(result.rowCount).toBe(0)
    await endUser()
  })

  it('C: VIEWER Org A SELECT playlist Org A → PASS', async () => {
    await asUser(ids.viewerA)
    const result = await tenantClient.query(
      `SELECT id FROM playlists WHERE organization_id = $1`,
      [ids.orgA],
    )
    expect(result.rowCount).toBe(1)
    await endUser()
  })

  it('D: non-member sees no tenant Domain data', async () => {
    await asUser(ids.ownerB)
    const library = await tenantClient.query(
      `SELECT id FROM library_items WHERE organization_id = $1`,
      [ids.orgA],
    )
    const playlists = await tenantClient.query(
      `SELECT id FROM playlists WHERE organization_id = $1`,
      [ids.orgA],
    )
    expect(library.rowCount).toBe(0)
    expect(playlists.rowCount).toBe(0)
    await endUser()
  })

  it('E: own DjStudioProfile → PASS', async () => {
    await asUser(ids.ownerA)
    const result = await tenantClient.query(
      `SELECT profile_id FROM dj_studio_profiles WHERE profile_id = $1`,
      [ids.ownerA],
    )
    expect(result.rowCount).toBe(1)
    await endUser()
  })

  it('F: other DjStudioProfile → deny (0 rows)', async () => {
    await asUser(ids.ownerA)
    const result = await tenantClient.query(
      `SELECT profile_id FROM dj_studio_profiles WHERE profile_id = $1`,
      [ids.ownerB],
    )
    expect(result.rowCount).toBe(0)
    await endUser()
  })

  it('G: authenticated direct INSERT LibraryItem → FAIL', async () => {
    await asUser(ids.ownerA)
    await expect(
      tenantClient.query(
        `INSERT INTO library_items
          (id, organization_id, track_id, status, is_favorite, play_count, date_added, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'LIBRARY', false, 0, now(), now(), now())`,
        [ids.orgA, ids.trackB],
      ),
    ).rejects.toMatchObject({ code: '42501' })
    await endUser()
  })

  it('H: authenticated direct UPDATE Playlist → FAIL', async () => {
    await asUser(ids.ownerA)
    await expect(
      tenantClient.query(
        `UPDATE playlists SET name = 'Hacked' WHERE id = $1`,
        [ids.playlistA],
      ),
    ).rejects.toMatchObject({ code: '42501' })
    await endUser()
  })

  it('legacy browser access denied', async () => {
    await asUser(ids.ownerA)
    await expect(
      tenantClient.query(`SELECT id FROM legacy_user_tracks`),
    ).rejects.toMatchObject({ code: '42501' })
    await endUser()
  })

  it('app_runtime can DML Domain tables', async () => {
    await tenantClient.query('BEGIN')
    await tenantClient.query('SET LOCAL ROLE app_runtime')
    const inserted = await tenantClient.query(
      `INSERT INTO library_items
        (id, organization_id, track_id, status, is_favorite, play_count, date_added, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'LIBRARY', false, 0, now(), now(), now())
       RETURNING id`,
      [ids.orgA, ids.trackB],
    )
    expect(inserted.rowCount).toBe(1)
    await tenantClient.query('ROLLBACK')
  })
})
