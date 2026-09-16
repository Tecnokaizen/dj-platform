'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getSafeInternalPath } from '@/core/identity/auth/utils/get-safe-internal-path'
import { DjStudioError } from '@/domains/dj-studio/shared/errors'
import {
  DJ_STUDIO_PUBLIC_NOTICE_CODES,
  mapDjStudioErrorToPublicNotice,
} from '@/domains/dj-studio/shared/public-notice'
import { switchActiveOrganization } from '@/domains/dj-studio/organization/switch-active-organization'

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function switchActiveOrganizationAction(formData: FormData) {
  const organizationId = getString(formData, 'organizationId')
  const returnTo = getSafeInternalPath(formData.get('returnTo'), '/dashboard')

  try {
    await switchActiveOrganization(organizationId)
  } catch (error) {
    const code =
      error instanceof DjStudioError
        ? mapDjStudioErrorToPublicNotice(error.code)
        : DJ_STUDIO_PUBLIC_NOTICE_CODES.FORBIDDEN
    redirect(`${returnTo}?error=${code}`)
  }

  revalidatePath('/', 'layout')
  redirect(`${returnTo}?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.ORGANIZATION_SWITCHED}`)
}
