import type { Organization } from '@/core/modules/organizations/types/organization'
import type { OrganizationDto } from '@/core/modules/organizations/types/organization-dto'

export function toOrganizationDto(
  organization: Organization
): OrganizationDto {
  return {
    ...organization,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
    archivedAt: organization.archivedAt?.toISOString() ?? null,
  }
}
