'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { ORGANIZATION_PUBLIC_NOTICE_CODES } from '@/core/modules/organizations/errors/organization-public-notice'
import { organizationIdSchema } from '@/core/modules/organizations/schemas/organization-id'
import { updateOrganizationSchema } from '@/core/modules/organizations/schemas/update-organization'
import { updateOrganization } from '@/core/modules/organizations/services/update-organization'
import {
  PERMISSION_ERROR_CODES,
  PermissionError,
} from '@/core/modules/permissions/errors/permission-error'

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function updateOrganizationAction(formData: FormData) {
  const organizationId = organizationIdSchema.safeParse(
    getString(formData, 'organizationId')
  )
  const input = updateOrganizationSchema.safeParse({
    name: getString(formData, 'name'),
    slug: getString(formData, 'slug'),
  })

  if (!organizationId.success || !input.success) {
    redirect(
      `/organizations?error=${ORGANIZATION_PUBLIC_NOTICE_CODES.INVALID_INPUT}`
    )
  }

  try {
    await updateOrganization(organizationId.data, input.data)
  } catch (error) {
    if (error instanceof PermissionError) {
      const code =
        error.code === PERMISSION_ERROR_CODES.DENIED
          ? ORGANIZATION_PUBLIC_NOTICE_CODES.FORBIDDEN
          : ORGANIZATION_PUBLIC_NOTICE_CODES.UPDATE_FAILED
      redirect(`/organizations?error=${code}`)
    }

    if (error instanceof OrganizationError) {
      const code =
        error.code === ORGANIZATION_ERROR_CODES.SLUG_CONFLICT
          ? ORGANIZATION_PUBLIC_NOTICE_CODES.SLUG_CONFLICT
          : error.code === ORGANIZATION_ERROR_CODES.NOT_FOUND
            ? ORGANIZATION_PUBLIC_NOTICE_CODES.NOT_FOUND
            : ORGANIZATION_PUBLIC_NOTICE_CODES.UPDATE_FAILED
      redirect(`/organizations?error=${code}`)
    }

    redirect(
      `/organizations?error=${ORGANIZATION_PUBLIC_NOTICE_CODES.UPDATE_FAILED}`
    )
  }

  revalidatePath('/organizations')
  redirect(
    `/organizations?success=${ORGANIZATION_PUBLIC_NOTICE_CODES.UPDATED}`
  )
}
