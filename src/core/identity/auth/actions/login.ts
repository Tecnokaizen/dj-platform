'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getSafeInternalPath } from '@/core/identity/auth/utils/get-safe-internal-path'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  const password = String(formData.get('password') ?? '')
  const nextPath = getSafeInternalPath(formData.get('next'))

  if (!email || !password) {
    redirect('/login?error=Introduce tu email y contraseña')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect(nextPath)
}
