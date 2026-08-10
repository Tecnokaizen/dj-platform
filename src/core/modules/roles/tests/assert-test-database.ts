const ALLOWED_PROTOCOLS = new Set(['postgresql:', 'postgres:'])
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1'])
const REQUIRED_PORT = '5433'
const REQUIRED_DATABASE = 'dj_platform_test'

export function createRoleTestKey(prefix: string): string {
  return `${prefix}${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`
}

export function assertRolesTestDatabase(): void {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required and must target dj_platform_test on localhost:5433'
    )
  }

  let parsed: URL

  try {
    parsed = new URL(connectionString)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL')
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `DATABASE_URL protocol must be postgresql: or postgres:, received ${parsed.protocol}`
    )
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `DATABASE_URL hostname must be localhost or 127.0.0.1, received ${parsed.hostname}`
    )
  }

  const port = parsed.port || '5432'

  if (port !== REQUIRED_PORT) {
    throw new Error(
      `DATABASE_URL port must be ${REQUIRED_PORT}, received ${port}`
    )
  }

  const databaseName = parsed.pathname.replace(/^\//, '').split('/')[0]

  if (databaseName !== REQUIRED_DATABASE) {
    throw new Error(
      `DATABASE_URL database must be exactly ${REQUIRED_DATABASE}, received ${databaseName}`
    )
  }
}
