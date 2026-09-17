import pg from 'pg'

import {
  getPublicEnvironment,
  getServerEnvironment,
  type PublicEnvironment,
  type ServerEnvironment,
} from '@/config/environment'

const DEFAULT_TIMEOUT_MS = 2_000

type ReadinessDependencies = {
  publicEnvironment?: PublicEnvironment
  serverEnvironment?: ServerEnvironment
  fetch?: typeof fetch
  checkDatabase?: (databaseUrl: string) => Promise<void>
  timeoutMs?: number
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('readiness dependency timeout'))
        })
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}

async function checkDatabase(databaseUrl: string): Promise<void> {
  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: DEFAULT_TIMEOUT_MS,
    query_timeout: DEFAULT_TIMEOUT_MS,
  })

  try {
    await client.connect()
    await client.query('SELECT 1')
  } finally {
    await client.end()
  }
}

async function requireHealthyResponse(
  responsePromise: Promise<Response>,
  service: 'auth' | 'rest'
): Promise<void> {
  const response = await responsePromise

  if (service === 'auth' && !response.ok) {
    throw new Error('auth readiness failed')
  }

  // PostgREST may correctly return 401/403 because anon has no access to Core
  // tables. Any non-5xx response proves that gateway routing and PostgREST are
  // responding without weakening grants solely for a health probe.
  if (service === 'rest' && response.status >= 500) {
    throw new Error('rest readiness failed')
  }
}

export async function checkReadiness(
  dependencies: ReadinessDependencies = {}
): Promise<void> {
  const publicEnvironment =
    dependencies.publicEnvironment ?? getPublicEnvironment()
  const serverEnvironment =
    dependencies.serverEnvironment ?? getServerEnvironment()
  const fetchImplementation = dependencies.fetch ?? fetch
  const databaseCheck = dependencies.checkDatabase ?? checkDatabase
  const timeoutMs = dependencies.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const headers = {
    apikey: publicEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${publicEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  }

  await Promise.all([
    withTimeout(databaseCheck(serverEnvironment.DATABASE_URL), timeoutMs),
    withTimeout(
      requireHealthyResponse(
        fetchImplementation(
          `${publicEnvironment.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
          { headers, signal: AbortSignal.timeout(timeoutMs) }
        ),
        'auth'
      ),
      timeoutMs
    ),
    withTimeout(
      requireHealthyResponse(
        fetchImplementation(
          `${publicEnvironment.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
          { headers, signal: AbortSignal.timeout(timeoutMs) }
        ),
        'rest'
      ),
      timeoutMs
    ),
  ])
}
