import pg from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required for database validation')
}

const client = new pg.Client({ connectionString })

try {
  await client.connect()

  const prisma = await client.query<{ count: string }>(
    'SELECT count(*)::text AS count FROM public._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'
  )
  const supabase = await client.query<{ count: string }>(
    'SELECT count(*)::text AS count FROM supabase_migrations.schema_migrations'
  )
  const roles = await client.query<{ count: string }>(
    'SELECT count(*)::text AS count FROM public.roles WHERE is_system = true'
  )
  const permissions = await client.query<{ count: string }>(
    'SELECT count(*)::text AS count FROM public.permissions'
  )

  if (Number(prisma.rows[0]?.count ?? 0) === 0) {
    throw new Error('Prisma migration ledger is empty')
  }
  if (Number(supabase.rows[0]?.count ?? 0) === 0) {
    throw new Error('Supabase migration ledger is empty')
  }
  if (Number(roles.rows[0]?.count ?? 0) !== 5) {
    throw new Error('Canonical Role seed is incomplete')
  }
  if (Number(permissions.rows[0]?.count ?? 0) !== 12) {
    throw new Error('Canonical Permission seed is incomplete')
  }

  console.log('database validation passed')
} finally {
  await client.end()
}

