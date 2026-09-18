import 'server-only'

import { cookies } from 'next/headers'

import { organizationIdSchema } from '@/core/modules/organizations/schemas/organization-id'

export const ACTIVE_ORGANIZATION_COOKIE = 'active_organization_id'

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export async function readActiveOrganizationCookie(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(ACTIVE_ORGANIZATION_COOKIE)?.value

  if (!raw) {
    return null
  }

  const parsed = organizationIdSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export async function setActiveOrganizationCookie(
  organizationId: string,
): Promise<void> {
  const parsed = organizationIdSchema.parse(organizationId)
  const store = await cookies()
  store.set(ACTIVE_ORGANIZATION_COOKIE, parsed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
}

export async function clearActiveOrganizationCookie(): Promise<void> {
  const store = await cookies()
  store.delete(ACTIVE_ORGANIZATION_COOKIE)
}
