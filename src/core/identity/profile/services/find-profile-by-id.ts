import 'server-only'

import { prisma } from '@/lib/prisma'

export type ProfileReference = {
  id: string
}

export async function findProfileById(
  profileId: string
): Promise<ProfileReference | null> {
  return prisma.profile.findUnique({
    where: {
      id: profileId,
    },
    select: {
      id: true,
    },
  })
}
