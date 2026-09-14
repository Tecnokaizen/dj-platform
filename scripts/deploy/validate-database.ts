import pg from 'pg'

import { PERMISSION_KEYS } from '../../src/core/modules/permissions/constants/permission-keys'
import { SYSTEM_ROLE_PERMISSION_POLICY } from '../../src/core/modules/permissions/constants/system-role-permission-policy'
import { SYSTEM_ROLE_KEYS } from '../../src/core/modules/roles/constants/system-role-keys'
import { DJ_STUDIO_PERMISSION_KEYS } from '../../src/domains/dj-studio/permissions/permission-keys'
import { DJ_STUDIO_SYSTEM_ROLE_PERMISSION_POLICY } from '../../src/domains/dj-studio/permissions/system-role-permission-policy'

const FOUNDATION_PRISMA_MIGRATION_COUNT = 8
const FOUNDATION_SUPABASE_MIGRATION_COUNT = 6
const DJ_STUDIO_PRISMA_MIGRATION_COUNT = 4
const DJ_STUDIO_SUPABASE_MIGRATION_COUNT = 1

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
    const supabase = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM supabase_migrations.schema_migrations`,
    )
    const supabaseCount = Number(supabase.rows[0]?.count ?? 0)
    if (supabaseCount < FOUNDATION_SUPABASE_MIGRATION_COUNT) {
      throw new Error(
        `Foundation Supabase ledger incomplete: expected at least ${FOUNDATION_SUPABASE_MIGRATION_COUNT}, got ${supabaseCount}`,
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
  const m5 = '20260913240000'
  if (!versions.has(m5) && ![...versions].some((v) => v.startsWith(m5))) {
    throw new Error(`Missing DJ Studio Supabase migration in ledger: ${m5}`)
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
