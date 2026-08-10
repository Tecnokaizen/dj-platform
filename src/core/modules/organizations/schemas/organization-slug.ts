import { z } from 'zod'

export const organizationSlugSchema = z.string().min(1)
