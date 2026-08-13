import { z } from 'zod'

export const acceptInvitationSchema = z.object({
  token: z
    .string()
    .length(43)
    .regex(/^[A-Za-z0-9_-]+$/),
})
