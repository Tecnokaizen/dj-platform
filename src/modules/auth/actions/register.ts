'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

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

  const requestHeaders = await headers()

  const origin =
    requestHeaders.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        preferred_language: 'es',
      },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
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