'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  AUTH_PUBLIC_ERROR_CODES,
  AUTH_PUBLIC_MESSAGE_CODES,
} from '@/core/identity/auth/errors/auth-public-error'
import { updateCurrentProfile } from '@/core/identity/profile/services/update-current-profile'

const ALLOWED_LANGUAGES = ['es', 'en'] as const

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get('displayName') ?? '').trim()
  const djName = String(formData.get('djName') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const preferredLanguage = String(
    formData.get('preferredLanguage') ?? 'es'
  ).trim()

  if (!displayName) {
    redirect(
      `/profile?error=${AUTH_PUBLIC_ERROR_CODES.PROFILE_DISPLAY_NAME_REQUIRED}`
    )
  }

  if (displayName.length > 120) {
    redirect(
      `/profile?error=${AUTH_PUBLIC_ERROR_CODES.PROFILE_DISPLAY_NAME_TOO_LONG}`
    )
  }

  if (djName.length > 120) {
    redirect(
      `/profile?error=${AUTH_PUBLIC_ERROR_CODES.PROFILE_DJ_NAME_TOO_LONG}`
    )
  }

  if (bio.length > 1000) {
    redirect(`/profile?error=${AUTH_PUBLIC_ERROR_CODES.PROFILE_BIO_TOO_LONG}`)
  }

  if (
    !ALLOWED_LANGUAGES.includes(
      preferredLanguage as (typeof ALLOWED_LANGUAGES)[number]
    )
  ) {
    redirect(
      `/profile?error=${AUTH_PUBLIC_ERROR_CODES.PROFILE_LANGUAGE_INVALID}`
    )
  }

  try {
    await updateCurrentProfile({
      displayName,
      djName: djName || null,
      bio: bio || null,
      preferredLanguage,
    })
  } catch {
    redirect(
      `/profile?error=${AUTH_PUBLIC_ERROR_CODES.PROFILE_UPDATE_FAILED}`
    )
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')

  redirect(`/profile?success=${AUTH_PUBLIC_MESSAGE_CODES.PROFILE_UPDATED}`)
}
