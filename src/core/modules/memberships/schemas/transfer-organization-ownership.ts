import { z } from 'zod'

import { membershipIdSchema } from '@/core/modules/memberships/schemas/membership-id'
import { organizationIdSchema } from '@/core/modules/organizations/schemas/organization-id'
import { roleIdSchema } from '@/core/modules/roles/schemas/role-id'

export const transferOrganizationOwnershipSchema = z.object({
  organizationId: organizationIdSchema,
  targetMembershipId: membershipIdSchema,
  previousOwnerRoleId: roleIdSchema,
})
