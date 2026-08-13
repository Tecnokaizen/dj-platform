import { z } from 'zod'

export const roleKeySchema = z.string().min(1).max(50)
