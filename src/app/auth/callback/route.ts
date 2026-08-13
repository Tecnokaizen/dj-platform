import { NextResponse } from 'next/server'

import { AUTH_PUBLIC_ERROR_CODES } from '@/core/identity/auth/errors/auth-public-error'
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
    new URL(
      `/login?error=${AUTH_PUBLIC_ERROR_CODES.AUTH_CALLBACK_FAILED}`,
      url.origin
    )
  )
}
