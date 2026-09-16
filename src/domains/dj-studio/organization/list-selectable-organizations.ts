import 'server-only'

import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { prisma } from '@/lib/prisma'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

export type SelectableOrganization = {
  organizationId: string
  name: string
  slug: string
  membershipId: string
}

/**
 * ACTIVE memberships on ACTIVE organizations for Product context switcher.
 */
export async function listSelectableOrganizations(): Promise<
  SelectableOrganization[]
> {
  const session = await getCurrentProfile()
  const profileId = session?.profile?.id

  if (!profileId) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED)
  }

  const memberships = await prisma.organizationMembership.findMany({
    where: {
      profileId,
      status: 'ACTIVE',
      organization: { status: 'ACTIVE' },
    },
    select: {
      id: true,
      organizationId: true,
      organization: {
        select: { name: true, slug: true },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { organizationId: 'asc' }],
  })

  return memberships.map((membership) => ({
    organizationId: membership.organizationId,
    name: membership.organization.name,
    slug: membership.organization.slug,
    membershipId: membership.id,
  }))
}
