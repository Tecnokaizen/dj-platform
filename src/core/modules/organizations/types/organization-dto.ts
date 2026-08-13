import type { OrganizationStatus } from '@/core/modules/organizations/types/organization-status'

export type OrganizationDto = {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  logoUrl: string | null
  locale: string
  timezone: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}
