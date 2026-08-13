import { z } from 'zod'

import { organizationSlugSchema } from '@/core/modules/organizations/schemas/organization-slug'

export const createOrganizationRecordSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
}).transform(({ name, slug, ...input }) => ({
  ...input,
  name,
  slug: organizationSlugSchema.parse(slug ?? name),
}))
