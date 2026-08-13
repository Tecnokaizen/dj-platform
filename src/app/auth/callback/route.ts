import { NextResponse } from 'next/server'

import { getSafeInternalPath } from '@/core/identity/auth/utils/get-safe-internal-path'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = getSafeInternalPath(url.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=auth_callback_failed', url.origin)
  )
}
