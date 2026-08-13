import { z } from 'zod'

import { organizationIdSchema } from '@/core/modules/organizations/schemas/organization-id'
import { roleIdSchema } from '@/core/modules/roles/schemas/role-id'

export const createInvitationSchema = z.object({
  organizationId: organizationIdSchema,
  recipientEmail: z.string().trim().email().max(320),
  roleId: roleIdSchema,
})
