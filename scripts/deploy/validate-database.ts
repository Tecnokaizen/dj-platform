import pg from 'pg'

import { PERMISSION_KEYS } from '../../src/core/modules/permissions/constants/permission-keys'
import { SYSTEM_ROLE_PERMISSION_POLICY } from '../../src/core/modules/permissions/constants/system-role-permission-policy'
import { SYSTEM_ROLE_KEYS } from '../../src/core/modules/roles/constants/system-role-keys'
import { DJ_STUDIO_PERMISSION_KEYS } from '../../src/domains/dj-studio/permissions/permission-keys'
import { DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY } from '../../src/domains/dj-studio/permissions/system-role-permission-policy'

export const FOUNDATION_PRISMA_MIGRATION_COUNT = 8
export const FOUNDATION_SUPABASE_MIGRATION_COUNT = 7
export const DJ_STUDIO_PRISMA_MIGRATION_COUNT = 4
export const DJ_STUDIO_SUPABASE_MIGRATION_COUNT = 2

/** Foundation Supabase S7 — profiles authenticated PostgREST grants */
export const FOUNDATION_SUPABASE_S7_VERSION = '20260914230000'

/** DJ Studio Domain Supabase M5 — Domain RLS + runtime DML */
export const DJ_STUDIO_SUPABASE_M5_VERSION = '20260913240000'

/** DJ Studio Domain Supabase M6 — catalog SELECT for app_runtime */
export const DJ_STUDIO_SUPABASE_M6_VERSION = '20260915150000'

export type ValidateMode = 'foundation' | 'product'

function parseMode(argv: string[]): ValidateMode {
  if (argv.includes('--foundation')) {
    return 'foundation'
  }
  if (argv.includes('--product')) {
    return 'product'
  }
  // Release default: full Product validation
  return 'product'
}

async function assertFoundation(
  client: pg.Client,
  options: { expectSupabaseLedger: boolean },
) {
  const prismaFinished = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM public._prisma_migrations
     WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
  )
  const finishedCount = Number(prismaFinished.rows[0]?.count ?? 0)

  if (finishedCount < FOUNDATION_PRISMA_MIGRATION_COUNT) {
    throw new Error(
      `Foundation Prisma ledger incomplete: expected at least ${FOUNDATION_PRISMA_MIGRATION_COUNT}, got ${finishedCount}`,
    )
  }

  if (options.expectSupabaseLedger) {
    const supabase = await client.query<{ version: string }>(
      `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version`,
    )
    const versions = new Set(supabase.rows.map((row) => row.version))
    if (versions.size < FOUNDATION_SUPABASE_MIGRATION_COUNT) {
      throw new Error(
        `Foundation Supabase ledger incomplete: expected at least ${FOUNDATION_SUPABASE_MIGRATION_COUNT}, got ${versions.size}`,
      )
    }
    if (
      !versions.has(FOUNDATION_SUPABASE_S7_VERSION) &&
      ![...versions].some((version) =>
        version.startsWith(FOUNDATION_SUPABASE_S7_VERSION),
      )
    ) {
      throw new Error(
        `Missing Foundation Supabase S7 in ledger: ${FOUNDATION_SUPABASE_S7_VERSION}`,
      )
    }
  }

  const roles = await client.query<{ key: string }>(
    `SELECT key FROM public.roles WHERE is_system = true ORDER BY key`,
  )
  const roleKeys = new Set(roles.rows.map((row) => row.key))
  for (const key of Object.values(SYSTEM_ROLE_KEYS)) {
    if (!roleKeys.has(key)) {
      throw new Error(`Missing Foundation system role: ${key}`)
    }
  }

  const permissions = await client.query<{ key: string }>(
    `SELECT key FROM public.permissions`,
  )
  const permissionKeys = new Set(permissions.rows.map((row) => row.key))
  for (const key of Object.values(PERMISSION_KEYS)) {
    if (!permissionKeys.has(key)) {
      throw new Error(`Missing Core permission key: ${key}`)
    }
  }

  for (const [roleKey, expectedKeys] of Object.entries(
    SYSTEM_ROLE_PERMISSION_POLICY,
  )) {
    for (const permissionKey of expectedKeys) {
      const mapping = await client.query(
        `SELECT 1
         FROM public.role_permissions rp
         INNER JOIN public.roles r ON r.id = rp.role_id
         INNER JOIN public.permissions p ON p.id = rp.permission_id
         WHERE r.key = $1 AND p.key = $2
         LIMIT 1`,
        [roleKey, permissionKey],
      )
      if (!mapping.rowCount) {
        throw new Error(
          `Missing Core RolePermission: ${roleKey} → ${permissionKey}`,
        )
      }
    }
  }

  const profileGrants = await client.query<{
    auth_select: boolean
    auth_insert: boolean
    auth_update: boolean
    auth_delete: boolean
    anon_select: boolean
    anon_insert: boolean
    anon_update: boolean
    anon_delete: boolean
  }>(
    `SELECT
       has_table_privilege('authenticated', 'public.profiles', 'SELECT') AS auth_select,
       has_table_privilege('authenticated', 'public.profiles', 'INSERT') AS auth_insert,
       has_table_privilege('authenticated', 'public.profiles', 'UPDATE') AS auth_update,
       has_table_privilege('authenticated', 'public.profiles', 'DELETE') AS auth_delete,
       has_table_privilege('anon', 'public.profiles', 'SELECT') AS anon_select,
       has_table_privilege('anon', 'public.profiles', 'INSERT') AS anon_insert,
       has_table_privilege('anon', 'public.profiles', 'UPDATE') AS anon_update,
       has_table_privilege('anon', 'public.profiles', 'DELETE') AS anon_delete`,
  )
  const grants = profileGrants.rows[0]
  if (
    !grants?.auth_select ||
    !grants.auth_update ||
    grants.auth_insert ||
    grants.auth_delete ||
    grants.anon_select ||
    grants.anon_insert ||
    grants.anon_update ||
    grants.anon_delete
  ) {
    throw new Error(
      'profiles privilege contract failed: authenticated needs SELECT+UPDATE only; anon needs none',
    )
  }

  console.log('foundation database validation passed')
}

async function assertDjStudio(client: pg.Client) {
  const prismaFinished = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM public._prisma_migrations
     WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
  )
  const finishedCount = Number(prismaFinished.rows[0]?.count ?? 0)
  const expectedPrisma =
    FOUNDATION_PRISMA_MIGRATION_COUNT + DJ_STUDIO_PRISMA_MIGRATION_COUNT

  if (finishedCount < expectedPrisma) {
    throw new Error(
      `DJ Studio Prisma ledger incomplete: expected at least ${expectedPrisma}, got ${finishedCount}`,
    )
  }

  const supabase = await client.query<{ version: string }>(
    `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version`,
  )
  const versions = new Set(supabase.rows.map((row) => row.version))
  for (const version of [
    DJ_STUDIO_SUPABASE_M5_VERSION,
    DJ_STUDIO_SUPABASE_M6_VERSION,
  ]) {
    if (
      !versions.has(version) &&
      ![...versions].some((entry) => entry.startsWith(version))
    ) {
      throw new Error(
        `Missing DJ Studio Supabase migration in ledger: ${version}`,
      )
    }
  }

  if (versions.size < FOUNDATION_SUPABASE_MIGRATION_COUNT + DJ_STUDIO_SUPABASE_MIGRATION_COUNT) {
    throw new Error(
      `Supabase ledger incomplete for Product install: got ${versions.size}`,
    )
  }

  const domainTable = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'library_items'
     LIMIT 1`,
  )
  if (!domainTable.rowCount) {
    throw new Error('DJ Studio Domain tables missing (library_items)')
  }

  const catalogGrants = await client.query<{
    table_name: string
    can_select: boolean
    can_insert: boolean
    can_update: boolean
    can_delete: boolean
  }>(
    `SELECT
       t.table_name,
       has_table_privilege('app_runtime', format('public.%I', t.table_name), 'SELECT') AS can_select,
       has_table_privilege('app_runtime', format('public.%I', t.table_name), 'INSERT') AS can_insert,
       has_table_privilege('app_runtime', format('public.%I', t.table_name), 'UPDATE') AS can_update,
       has_table_privilege('app_runtime', format('public.%I', t.table_name), 'DELETE') AS can_delete
     FROM (VALUES ('tracks'), ('track_artists'), ('artists')) AS t(table_name)`,
  )

  for (const row of catalogGrants.rows) {
    if (
      !row.can_select ||
      row.can_insert ||
      row.can_update ||
      row.can_delete
    ) {
      throw new Error(
        `app_runtime catalog privilege contract failed for ${row.table_name}: expected SELECT only`,
      )
    }
  }

  const permissions = await client.query<{ key: string }>(
    `SELECT key FROM public.permissions`,
  )
  const permissionKeys = new Set(permissions.rows.map((row) => row.key))
  for (const key of Object.values(DJ_STUDIO_PERMISSION_KEYS)) {
    if (!permissionKeys.has(key)) {
      throw new Error(`Missing DJ Studio permission key: ${key}`)
    }
  }

  for (const [roleKey, expectedKeys] of Object.entries(
    DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY,
  )) {
    for (const permissionKey of expectedKeys) {
      const mapping = await client.query(
        `SELECT 1
         FROM public.role_permissions rp
         INNER JOIN public.roles r ON r.id = rp.role_id
         INNER JOIN public.permissions p ON p.id = rp.permission_id
         WHERE r.key = $1 AND p.key = $2
         LIMIT 1`,
        [roleKey, permissionKey],
      )
      if (!mapping.rowCount) {
        throw new Error(
          `Missing DJ Studio RolePermission: ${roleKey} → ${permissionKey}`,
        )
      }
    }
  }

  // VIEWER must not receive manage keys
  for (const manageKey of [
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
    DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
  ]) {
    const forbidden = await client.query(
      `SELECT 1
       FROM public.role_permissions rp
       INNER JOIN public.roles r ON r.id = rp.role_id
       INNER JOIN public.permissions p ON p.id = rp.permission_id
       WHERE r.key = $1 AND p.key = $2
       LIMIT 1`,
      [SYSTEM_ROLE_KEYS.VIEWER, manageKey],
    )
    if (forbidden.rowCount) {
      throw new Error(`VIEWER must not have ${manageKey}`)
    }
  }

  console.log('dj-studio database validation passed')
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for database validation')
  }

  const mode = parseMode(process.argv.slice(2))
  const client = new pg.Client({ connectionString })

  try {
    await client.connect()

    if (mode === 'foundation') {
      await assertFoundation(client, { expectSupabaseLedger: true })
      return
    }

    await assertFoundation(client, { expectSupabaseLedger: true })
    await assertDjStudio(client)
    console.log('product database validation passed')
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
