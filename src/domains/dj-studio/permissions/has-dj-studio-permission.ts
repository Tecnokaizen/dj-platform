import 'server-only'

import { permissionAuthorizationServices } from '@/core/modules/permissions/services/permission-authorization'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import type { DjStudioPermissionKey } from '@/domains/dj-studio/permissions/permission-keys'

export async function hasDjStudioPermission(
  context: ActiveOrganizationContext,
  permissionKey: DjStudioPermissionKey,
): Promise<boolean> {
  return permissionAuthorizationServices.hasPermission(context, permissionKey)
}
