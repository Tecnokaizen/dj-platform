import 'server-only'

import { z } from 'zod'

import { ExperienceLevel } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import type { DjStudioProfile } from '@/domains/dj-studio/profile/types'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

const upsertSchema = z
  .object({
    stageName: z.string().trim().max(120).nullable().optional(),
    experienceLevel: z.nativeEnum(ExperienceLevel).nullable().optional(),
  })
  .strict()

function mapProfile(row: {
  profileId: string
  stageName: string | null
  experienceLevel: ExperienceLevel | null
  createdAt: Date
  updatedAt: Date
}): DjStudioProfile {
  return {
    profileId: row.profileId,
    stageName: row.stageName,
    experienceLevel: row.experienceLevel,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getDjStudioProfile(
  actorProfileId: string,
): Promise<DjStudioProfile | null> {
  const row = await prisma.djStudioProfile.findUnique({
    where: { profileId: actorProfileId },
  })

  return row ? mapProfile(row) : null
}

export async function upsertDjStudioProfile(
  actorProfileId: string,
  input: z.infer<typeof upsertSchema>,
): Promise<DjStudioProfile> {
  const parsed = upsertSchema.parse(input)

  const row = await prisma.djStudioProfile.upsert({
    where: { profileId: actorProfileId },
    create: {
      profileId: actorProfileId,
      stageName: parsed.stageName ?? null,
      experienceLevel: parsed.experienceLevel ?? null,
    },
    update: {
      ...(parsed.stageName !== undefined ? { stageName: parsed.stageName } : {}),
      ...(parsed.experienceLevel !== undefined
        ? { experienceLevel: parsed.experienceLevel }
        : {}),
    },
  })

  return mapProfile(row)
}

export async function getOwnDjStudioProfile(): Promise<DjStudioProfile | null> {
  const session = await getCurrentProfile()
  const profileId = session?.profile?.id

  if (!profileId) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED)
  }

  return getDjStudioProfile(profileId)
}

export async function upsertOwnDjStudioProfile(
  input: z.infer<typeof upsertSchema>,
): Promise<DjStudioProfile> {
  const session = await getCurrentProfile()
  const profileId = session?.profile?.id

  if (!profileId) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED)
  }

  return upsertDjStudioProfile(profileId, input)
}
