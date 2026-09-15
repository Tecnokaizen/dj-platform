'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ZodError } from 'zod'

import { ExperienceLevel } from '@/generated/prisma/client'
import { upsertOwnDjStudioProfile } from '@/domains/dj-studio/profile/services/dj-studio-profile-services'
import { DjStudioError } from '@/domains/dj-studio/shared/errors'
import {
  DJ_STUDIO_PUBLIC_NOTICE_CODES,
  mapDjStudioErrorToPublicNotice,
} from '@/domains/dj-studio/shared/public-notice'

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function upsertStudioProfileAction(formData: FormData) {
  const stageName = getString(formData, 'stageName').trim()
  const experienceLevelRaw = getString(formData, 'experienceLevel')

  let experienceLevel: ExperienceLevel | null = null

  if (experienceLevelRaw !== '') {
    if (
      !Object.values(ExperienceLevel).includes(
        experienceLevelRaw as ExperienceLevel,
      )
    ) {
      redirect(
        `/studio-profile?error=${DJ_STUDIO_PUBLIC_NOTICE_CODES.VALIDATION_ERROR}`,
      )
    }
    experienceLevel = experienceLevelRaw as ExperienceLevel
  }

  try {
    await upsertOwnDjStudioProfile({
      stageName: stageName === '' ? null : stageName,
      experienceLevel,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      redirect(
        `/studio-profile?error=${DJ_STUDIO_PUBLIC_NOTICE_CODES.VALIDATION_ERROR}`,
      )
    }

    if (error instanceof DjStudioError) {
      redirect(
        `/studio-profile?error=${mapDjStudioErrorToPublicNotice(error.code)}`,
      )
    }

    redirect(
      `/studio-profile?error=${DJ_STUDIO_PUBLIC_NOTICE_CODES.UPDATE_FAILED}`,
    )
  }

  revalidatePath('/studio-profile')
  revalidatePath('/', 'layout')
  redirect(
    `/studio-profile?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.STUDIO_PROFILE_SAVED}`,
  )
}
