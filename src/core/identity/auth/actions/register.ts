'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { AUTH_PUBLIC_ERROR_CODES } from '@/core/identity/auth/errors/auth-public-error'
import { getSafeInternalPath } from '@/core/identity/auth/utils/get-safe-internal-path'
import { createClient } from '@/lib/supabase/server'

function getTrustedAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return 'http://localhost:3000'
}

export async function register(formData: FormData) {
  const displayName = String(formData.get('displayName') ?? '').trim()

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!displayName || !email || !password) {
    redirect('/register?error=Completa todos los campos')
  }

  if (password.length < 8) {
    redirect('/register?error=La contraseña debe tener al menos 8 caracteres')
  }

  if (password !== confirmPassword) {
    redirect('/register?error=Las contraseñas no coinciden')
  }

  const origin = getTrustedAppOrigin()
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

  redirect(
    '/login?message=Cuenta creada. Revisa tu correo para confirmar el registro.'
  )
}
