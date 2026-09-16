import type { OrganizationContext } from '@/core/modules/organizations/types/organization-context'

/**
 * Active Organization context for DJ Studio Domain services.
 * Alias of Core OrganizationContext — cookie preference is not authorization.
 */
export type ActiveOrganizationContext = OrganizationContext
