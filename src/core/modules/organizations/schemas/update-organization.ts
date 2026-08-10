import { z } from 'zod'

import { organizationSlugSchema } from '@/core/modules/organizations/schemas/organization-slug'

export const updateOrganizationSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: organizationSlugSchema.optional(),
    logoUrl: z.string().nullable().optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.slug !== undefined ||
      value.logoUrl !== undefined ||
      value.locale !== undefined ||
      value.timezone !== undefined
  )
