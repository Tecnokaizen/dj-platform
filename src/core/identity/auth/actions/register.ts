'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getPublicEnvironment } from '@/config/environment'
import {
  AUTH_PUBLIC_ERROR_CODES,
  AUTH_PUBLIC_MESSAGE_CODES,
} from '@/core/identity/auth/errors/auth-public-error'
import { getSafeInternalPath } from '@/core/identity/auth/utils/get-safe-internal-path'
import { createClient } from '@/lib/supabase/server'

export async function register(formData: FormData) {
  const displayName = String(formData.get('displayName') ?? '').trim()

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!displayName || !email || !password) {
    redirect(
      `/register?error=${AUTH_PUBLIC_ERROR_CODES.REGISTRATION_FIELDS_REQUIRED}`
    )
  }

  if (password.length < 8) {
    redirect(`/register?error=${AUTH_PUBLIC_ERROR_CODES.PASSWORD_TOO_SHORT}`)
  }

  if (password !== confirmPassword) {
    redirect(`/register?error=${AUTH_PUBLIC_ERROR_CODES.PASSWORD_MISMATCH}`)
  }

  const origin = getPublicEnvironment().NEXT_PUBLIC_APP_URL
  const nextPath = getSafeInternalPath('/dashboard')
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        preferred_language: 'es',
      },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })

  if (error) {
    redirect(
      `/register?error=${AUTH_PUBLIC_ERROR_CODES.REGISTRATION_FAILED}`
    )
  }

  revalidatePath('/', 'layout')

  // Si la confirmación por email está desactivada, habrá sesión inmediata.
  if (data.session) {
    redirect('/dashboard')
  }

  redirect(`/login?message=${AUTH_PUBLIC_MESSAGE_CODES.ACCOUNT_CREATED}`)
}
