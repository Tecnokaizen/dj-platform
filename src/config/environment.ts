import { z } from 'zod'

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
})

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z
    .url()
    .refine(
      (value) => value.startsWith('postgresql:') || value.startsWith('postgres:'),
      'DATABASE_URL must use the postgres or postgresql protocol'
    ),
})

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>
type EnvironmentSource = Record<string, string | undefined>

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getPublicEnvironment(
  environment: EnvironmentSource = process.env
): PublicEnvironment {
  const parsed = publicEnvironmentSchema.parse({
    NEXT_PUBLIC_APP_URL: environment.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: environment.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: environment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  return {
    ...parsed,
    NEXT_PUBLIC_APP_URL: withoutTrailingSlash(parsed.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_SUPABASE_URL: withoutTrailingSlash(
      parsed.NEXT_PUBLIC_SUPABASE_URL
    ),
  }
}

export function getServerEnvironment(
  environment: EnvironmentSource = process.env
): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    DATABASE_URL: environment.DATABASE_URL,
  })
}
