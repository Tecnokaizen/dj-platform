import { z } from 'zod'

import { normalizeOrganizationSlug } from '@/core/modules/organizations/schemas/normalize-organization-slug'

export const organizationSlugSchema = z
  .string()
  .transform(normalizeOrganizationSlug)
  .pipe(z.string().min(3).max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
