import { z } from 'zod'

import { organizationIdSchema } from '@/core/modules/organizations/schemas/organization-id'

export const organizationProfileMembershipSchema = z.object({
  organizationId: organizationIdSchema,
  profileId: z.uuid(),
})
