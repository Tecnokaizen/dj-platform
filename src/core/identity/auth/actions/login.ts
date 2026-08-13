'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { AUTH_PUBLIC_ERROR_CODES } from '@/core/identity/auth/errors/auth-public-error'
import { getSafeInternalPath } from '@/core/identity/auth/utils/get-safe-internal-path'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  const password = String(formData.get('password') ?? '')
  const nextPath = getSafeInternalPath(formData.get('next'))

  if (!email || !password) {
    redirect(`/login?error=${AUTH_PUBLIC_ERROR_CODES.REQUIRED_CREDENTIALS}`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(
      `/login?error=${AUTH_PUBLIC_ERROR_CODES.INVALID_CREDENTIALS}`
    )
  }

  revalidatePath('/', 'layout')
  redirect(nextPath)
}
