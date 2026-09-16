import 'server-only'

import { hasDjStudioPermission } from '@/domains/dj-studio/permissions/has-dj-studio-permission'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import {
  listSelectableOrganizations,
  type SelectableOrganization,
} from '@/domains/dj-studio/organization/list-selectable-organizations'
import { resolveActiveOrganization } from '@/domains/dj-studio/organization/resolve-active-organization'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'

export type ProductStudioContext = {
  context: ActiveOrganizationContext
  organizations: SelectableOrganization[]
  canManageLibrary: boolean
  canManagePlaylists: boolean
}

export async function loadProductStudioContext(): Promise<ProductStudioContext> {
  const context = await resolveActiveOrganization()
  const organizations = await listSelectableOrganizations()

  const [canManageLibrary, canManagePlaylists] = await Promise.all([
    hasDjStudioPermission(context, DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE),
    hasDjStudioPermission(context, DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE),
  ])

  return {
    context,
    organizations,
    canManageLibrary,
    canManagePlaylists,
  }
}
