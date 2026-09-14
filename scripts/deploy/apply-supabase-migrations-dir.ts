/**
 * Apply pending SQL migrations from a directory into Supabase's ledger.
 *
 * Version keys match Supabase CLI convention: leading digit run from the
 * filename (e.g. `20260806_auth_profiles_rls.sql` → `20260806`).
 *
 * Used for:
 * - Foundation S1–S7 (`supabase/migrations`) so Domain M5 can live outside
 *   that folder without breaking idempotent `migrate-release` re-runs
 * - Domain M5 (`supabase/migrations-dj-studio`)
 *
 * Env: DATABASE_URL (or MIGRATION_DATABASE_URL)
 * Arg: absolute or repo-relative directory path
 */

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'

const connectionString =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL or MIGRATION_DATABASE_URL is required to apply Supabase migrations',
  )
}

const migrationsDir = process.argv[2]

if (!migrationsDir) {
  throw new Error(
    'Usage: node --import tsx scripts/deploy/apply-supabase-migrations-dir.ts <dir>',
  )
}

const resolvedDir = path.resolve(migrationsDir)

/** Match Supabase CLI version extraction from migration filenames. */
export function supabaseMigrationVersion(filename: string): string {
  const stem = filename.replace(/\.sql$/u, '')
  const match = /^(\d+)/u.exec(stem)
  if (!match) {
    throw new Error(`Cannot derive Supabase migration version from ${filename}`)
  }
  return match[1]!
}

async function ensureLedger(client: pg.Client) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY
    );
  `)
}

async function isApplied(client: pg.Client, version: string): Promise<boolean> {
  const exact = await client.query(
    `SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1 LIMIT 1`,
    [version],
  )
  if (exact.rowCount && exact.rowCount > 0) {
    return true
  }

  // Tolerate older full-stem inserts from interim tooling
  const prefixed = await client.query(
    `SELECT 1 FROM supabase_migrations.schema_migrations WHERE version LIKE $1 LIMIT 1`,
    [`${version}%`],
  )
  return Boolean(prefixed.rowCount && prefixed.rowCount > 0)
}

async function main() {
  const entries = await readdir(resolvedDir)
  const files = entries
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))

  if (files.length === 0) {
    console.log(`No SQL migrations in ${resolvedDir}`)
    return
  }

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    await ensureLedger(client)

    for (const file of files) {
      const version = supabaseMigrationVersion(file)

      if (await isApplied(client, version)) {
        console.log(`skip ${file} (version ${version} already applied)`)
        continue
      }

      const sql = await readFile(path.join(resolvedDir, file), 'utf8')
      console.log(`apply ${file} as ${version}`)
      await client.query(sql)
      await client.query(
        `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)
         ON CONFLICT (version) DO NOTHING`,
        [version],
      )
    }

    console.log('supabase directory migrations applied')
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
