import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getPublicEnvironment } from '@/config/environment'

export async function createClient() {
  const cookieStore = await cookies()
  const environment = getPublicEnvironment()

  return createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // En algunos Server Components las cookies son de solo lectura.
            // src/proxy.ts se encargará de refrescar la sesión.
          }
        },
      },
    }
  )
}
