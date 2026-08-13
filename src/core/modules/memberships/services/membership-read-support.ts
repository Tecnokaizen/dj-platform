import 'server-only'

import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { prisma } from '@/lib/prisma'

export type MembershipReadRepository = ReturnType<
  typeof createMembershipRepository
>

export const membershipReadRepository = createMembershipRepository(prisma)
