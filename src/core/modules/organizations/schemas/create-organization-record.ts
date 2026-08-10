import { z } from 'zod'

import { organizationSlugSchema } from '@/core/modules/organizations/schemas/organization-slug'

export const createOrganizationRecordSchema = z.object({
  name: z.string().min(1),
  slug: organizationSlugSchema,
  logoUrl: z.string().nullable().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
})
