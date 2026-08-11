import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type ProfileAuthEmailLookupClient = Pick<PrismaClient, "profile">;

export function createFindProfileIdByNormalizedAuthEmail(
  client: ProfileAuthEmailLookupClient,
) {
  return async function findProfileIdByNormalizedAuthEmail(
    normalizedEmail: string,
  ): Promise<string | null> {
    const profile = await client.profile.findUnique({
      where: {
        authEmailNormalized: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    return profile?.id ?? null;
  };
}

export const findProfileIdByNormalizedAuthEmail =
  createFindProfileIdByNormalizedAuthEmail(prisma);
