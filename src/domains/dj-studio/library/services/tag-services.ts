import 'server-only'

import { z } from 'zod'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import { requireDjStudioPermission } from '@/domains/dj-studio/permissions/require-dj-studio-permission'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { normalizeTagName } from '@/domains/dj-studio/library/validation/normalize-tag-name'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'

const createTagSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().max(20).nullable().optional(),
})

const updateTagSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    color: z.string().max(20).nullable().optional(),
  })
  .strict()

export async function listTags(context: ActiveOrganizationContext) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_READ,
  )

  return prisma.tag.findMany({
    where: { organizationId: context.organizationId },
    orderBy: { normalizedName: 'asc' },
  })
}

export async function createTag(
  context: ActiveOrganizationContext,
  input: z.infer<typeof createTagSchema>,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )

  const parsed = createTagSchema.parse(input)
  const normalizedName = normalizeTagName(parsed.name)

  try {
    return await prisma.tag.create({
      data: {
        organizationId: context.organizationId,
        name: parsed.name.trim(),
        normalizedName,
        color: parsed.color ?? null,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new DjStudioError(DJ_STUDIO_ERROR_CODES.TAG_NAME_CONFLICT)
    }

    throw error
  }
}

export async function updateTag(
  context: ActiveOrganizationContext,
  tagId: string,
  input: z.infer<typeof updateTagSchema>,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )

  const parsed = updateTagSchema.parse(input)
  const existing = await prisma.tag.findFirst({
    where: { id: tagId, organizationId: context.organizationId },
    select: { id: true },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.TAG_NOT_FOUND)
  }

  try {
    return await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(parsed.name !== undefined
          ? {
              name: parsed.name.trim(),
              normalizedName: normalizeTagName(parsed.name),
            }
          : {}),
        ...(parsed.color !== undefined ? { color: parsed.color } : {}),
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new DjStudioError(DJ_STUDIO_ERROR_CODES.TAG_NAME_CONFLICT)
    }

    throw error
  }
}

export async function deleteTag(
  context: ActiveOrganizationContext,
  tagId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )

  const existing = await prisma.tag.findFirst({
    where: { id: tagId, organizationId: context.organizationId },
    select: { id: true },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.TAG_NOT_FOUND)
  }

  await prisma.tag.delete({ where: { id: tagId } })
}

export async function addTagToLibraryItem(
  context: ActiveOrganizationContext,
  libraryItemId: string,
  tagId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )

  const [libraryItem, tag] = await Promise.all([
    prisma.libraryItem.findFirst({
      where: { id: libraryItemId, organizationId: context.organizationId },
      select: { id: true },
    }),
    prisma.tag.findFirst({
      where: { id: tagId, organizationId: context.organizationId },
      select: { id: true },
    }),
  ])

  if (!libraryItem) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_NOT_FOUND)
  }

  if (!tag) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.TAG_NOT_FOUND)
  }

  return prisma.libraryItemTag.upsert({
    where: {
      libraryItemId_tagId: { libraryItemId, tagId },
    },
    create: {
      organizationId: context.organizationId,
      libraryItemId,
      tagId,
    },
    update: {},
  })
}

export async function removeTagFromLibraryItem(
  context: ActiveOrganizationContext,
  libraryItemId: string,
  tagId: string,
) {
  await requireDjStudioPermission(
    context,
    DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
  )

  const existing = await prisma.libraryItemTag.findFirst({
    where: {
      organizationId: context.organizationId,
      libraryItemId,
      tagId,
    },
  })

  if (!existing) {
    throw new DjStudioError(DJ_STUDIO_ERROR_CODES.TAG_NOT_FOUND)
  }

  await prisma.libraryItemTag.delete({
    where: {
      libraryItemId_tagId: { libraryItemId, tagId },
    },
  })
}
