'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ZodError } from 'zod'

import { resolveActiveOrganization } from '@/domains/dj-studio/organization/resolve-active-organization'
import {
  addTrackToLibrary,
  removeLibraryItem,
  updateLibraryItem,
} from '@/domains/dj-studio/library/services/library-item-services'
import {
  addTagToLibraryItem,
  createTag,
  removeTagFromLibraryItem,
} from '@/domains/dj-studio/library/services/tag-services'
import { DjStudioError } from '@/domains/dj-studio/shared/errors'
import {
  DJ_STUDIO_PUBLIC_NOTICE_CODES,
  mapDjStudioErrorToPublicNotice,
} from '@/domains/dj-studio/shared/public-notice'

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function redirectLibraryError(error: unknown): never {
  if (error instanceof ZodError) {
    redirect(`/library?error=${DJ_STUDIO_PUBLIC_NOTICE_CODES.VALIDATION_ERROR}`)
  }

  if (error instanceof DjStudioError) {
    redirect(`/library?error=${mapDjStudioErrorToPublicNotice(error.code)}`)
  }

  redirect(`/library?error=${DJ_STUDIO_PUBLIC_NOTICE_CODES.UPDATE_FAILED}`)
}

export async function addTrackToLibraryAction(formData: FormData) {
  const trackId = getString(formData, 'trackId')

  try {
    const context = await resolveActiveOrganization()
    await addTrackToLibrary(context, trackId)
  } catch (error) {
    redirectLibraryError(error)
  }

  revalidatePath('/library')
  revalidatePath('/dashboard')
  redirect(
    `/library?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_ADDED}`,
  )
}

export async function updateLibraryItemAction(formData: FormData) {
  const libraryItemId = getString(formData, 'libraryItemId')
  const ratingRaw = getString(formData, 'rating')
  const energyRaw = getString(formData, 'energy')
  const familiarityRaw = getString(formData, 'familiarity')
  const customBpmRaw = getString(formData, 'customBpm')
  const notes = getString(formData, 'notes')
  const customKey = getString(formData, 'customKey')
  const status = getString(formData, 'status')
  const isFavorite = formData.get('isFavorite') === 'on'

  try {
    const context = await resolveActiveOrganization()
    await updateLibraryItem(context, libraryItemId, {
      status: status as 'LIBRARY' | 'WISHLIST' | 'ARCHIVED' | 'REJECTED',
      rating: ratingRaw === '' ? null : Number(ratingRaw),
      energy: energyRaw === '' ? null : Number(energyRaw),
      familiarity: familiarityRaw === '' ? null : Number(familiarityRaw),
      notes: notes === '' ? null : notes,
      customBpm: customBpmRaw === '' ? null : Number(customBpmRaw),
      customKey: customKey === '' ? null : customKey,
      isFavorite,
    })
  } catch (error) {
    redirectLibraryError(error)
  }

  revalidatePath('/library')
  redirect(
    `/library?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_UPDATED}`,
  )
}

export async function removeLibraryItemAction(formData: FormData) {
  const libraryItemId = getString(formData, 'libraryItemId')

  try {
    const context = await resolveActiveOrganization()
    await removeLibraryItem(context, libraryItemId)
  } catch (error) {
    redirectLibraryError(error)
  }

  revalidatePath('/library')
  revalidatePath('/playlists')
  redirect(
    `/library?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_REMOVED}`,
  )
}

export async function createTagAction(formData: FormData) {
  const name = getString(formData, 'name')
  const libraryItemId = getString(formData, 'libraryItemId')

  try {
    const context = await resolveActiveOrganization()
    const tag = await createTag(context, { name })
    if (libraryItemId) {
      await addTagToLibraryItem(context, libraryItemId, tag.id)
    }
  } catch (error) {
    redirectLibraryError(error)
  }

  revalidatePath('/library')
  redirect(`/library?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_CREATED}`)
}

export async function attachTagAction(formData: FormData) {
  const libraryItemId = getString(formData, 'libraryItemId')
  const tagId = getString(formData, 'tagId')

  try {
    const context = await resolveActiveOrganization()
    await addTagToLibraryItem(context, libraryItemId, tagId)
  } catch (error) {
    redirectLibraryError(error)
  }

  revalidatePath('/library')
  redirect(`/library?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_ATTACHED}`)
}

export async function detachTagAction(formData: FormData) {
  const libraryItemId = getString(formData, 'libraryItemId')
  const tagId = getString(formData, 'tagId')

  try {
    const context = await resolveActiveOrganization()
    await removeTagFromLibraryItem(context, libraryItemId, tagId)
  } catch (error) {
    redirectLibraryError(error)
  }

  revalidatePath('/library')
  redirect(`/library?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_DETACHED}`)
}
