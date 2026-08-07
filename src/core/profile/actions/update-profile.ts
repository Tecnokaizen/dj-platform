'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { updateCurrentProfile } from '@/core/profile/services/update-current-profile'

const ALLOWED_LANGUAGES = ['es', 'en'] as const

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get('displayName') ?? '').trim()
  const djName = String(formData.get('djName') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const preferredLanguage = String(
    formData.get('preferredLanguage') ?? 'es'
  ).trim()

  if (!displayName) {
    redirect('/profile?error=El nombre visible es obligatorio')
  }

  if (displayName.length > 120) {
    redirect(
      '/profile?error=El nombre visible no puede superar los 120 caracteres'
    )
  }

  if (djName.length > 120) {
    redirect(
      '/profile?error=El nombre DJ no puede superar los 120 caracteres'
    )
  }

  if (bio.length > 1000) {
    redirect('/profile?error=La biografía no puede superar los 1000 caracteres')
  }

  if (
    !ALLOWED_LANGUAGES.includes(
      preferredLanguage as (typeof ALLOWED_LANGUAGES)[number]
    )
  ) {
    redirect('/profile?error=El idioma seleccionado no es válido')
  }

  try {
    await updateCurrentProfile({
      displayName,
      djName: djName || null,
      bio: bio || null,
      preferredLanguage,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo actualizar el perfil'

    redirect(`/profile?error=${encodeURIComponent(message)}`)
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')

  redirect('/profile?success=Perfil actualizado correctamente')
}