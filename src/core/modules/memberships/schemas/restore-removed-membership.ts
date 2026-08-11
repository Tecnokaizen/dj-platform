import { z } from 'zod'

import { membershipIdSchema } from '@/core/modules/memberships/schemas/membership-id'
import { roleIdSchema } from '@/core/modules/roles/schemas/role-id'

export const restoreRemovedMembershipSchema = z.object({
  membershipId: membershipIdSchema,
  targetRoleId: roleIdSchema,
})
