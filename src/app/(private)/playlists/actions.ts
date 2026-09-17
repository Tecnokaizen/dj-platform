'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ZodError } from 'zod'

import { resolveActiveOrganization } from '@/domains/dj-studio/organization/resolve-active-organization'
import {
  addPlaylistItem,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  removePlaylistItem,
  reorderPlaylistItems,
  updatePlaylistItem,
} from '@/domains/dj-studio/playlists/services/playlist-services'
import { DjStudioError } from '@/domains/dj-studio/shared/errors'
import {
  DJ_STUDIO_PUBLIC_NOTICE_CODES,
  mapDjStudioErrorToPublicNotice,
} from '@/domains/dj-studio/shared/public-notice'

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function playlistPath(playlistId?: string) {
  return playlistId ? `/playlists/${playlistId}` : '/playlists'
}

function redirectPlaylistError(error: unknown, playlistId?: string): never {
  const path = playlistPath(playlistId)

  if (error instanceof ZodError) {
    redirect(`${path}?error=${DJ_STUDIO_PUBLIC_NOTICE_CODES.VALIDATION_ERROR}`)
  }

  if (error instanceof DjStudioError) {
    redirect(`${path}?error=${mapDjStudioErrorToPublicNotice(error.code)}`)
  }

  redirect(`${path}?error=${DJ_STUDIO_PUBLIC_NOTICE_CODES.UPDATE_FAILED}`)
}

export async function createPlaylistAction(formData: FormData) {
  const name = getString(formData, 'name')
  const description = getString(formData, 'description')

  let playlistId = ''

  try {
    const context = await resolveActiveOrganization()
    const playlist = await createPlaylist(context, {
      name,
      description: description === '' ? null : description,
    })
    playlistId = playlist.id
  } catch (error) {
    redirectPlaylistError(error)
  }

  revalidatePath('/playlists')
  revalidatePath('/dashboard')
  redirect(
    `/playlists/${playlistId}?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_CREATED}`,
  )
}

export async function deletePlaylistAction(formData: FormData) {
  const playlistId = getString(formData, 'playlistId')

  try {
    const context = await resolveActiveOrganization()
    await deletePlaylist(context, playlistId)
  } catch (error) {
    redirectPlaylistError(error)
  }

  revalidatePath('/playlists')
  revalidatePath('/dashboard')
  redirect(
    `/playlists?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_DELETED}`,
  )
}

export async function addPlaylistItemAction(formData: FormData) {
  const playlistId = getString(formData, 'playlistId')
  const libraryItemId = getString(formData, 'libraryItemId')
  const notes = getString(formData, 'notes')
  const transitionNotes = getString(formData, 'transitionNotes')

  try {
    const context = await resolveActiveOrganization()
    await addPlaylistItem(context, playlistId, {
      libraryItemId,
      notes: notes === '' ? null : notes,
      transitionNotes: transitionNotes === '' ? null : transitionNotes,
    })
  } catch (error) {
    redirectPlaylistError(error, playlistId)
  }

  revalidatePath(`/playlists/${playlistId}`)
  revalidatePath('/playlists')
  redirect(
    `/playlists/${playlistId}?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_ITEM_ADDED}`,
  )
}

export async function updatePlaylistItemAction(formData: FormData) {
  const playlistId = getString(formData, 'playlistId')
  const playlistItemId = getString(formData, 'playlistItemId')
  const notes = getString(formData, 'notes')
  const transitionNotes = getString(formData, 'transitionNotes')

  try {
    const context = await resolveActiveOrganization()
    await updatePlaylistItem(context, playlistItemId, {
      notes: notes === '' ? null : notes,
      transitionNotes: transitionNotes === '' ? null : transitionNotes,
    })
  } catch (error) {
    redirectPlaylistError(error, playlistId)
  }

  revalidatePath(`/playlists/${playlistId}`)
  redirect(
    `/playlists/${playlistId}?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_ITEM_UPDATED}`,
  )
}

export async function removePlaylistItemAction(formData: FormData) {
  const playlistId = getString(formData, 'playlistId')
  const playlistItemId = getString(formData, 'playlistItemId')

  try {
    const context = await resolveActiveOrganization()
    await removePlaylistItem(context, playlistItemId)
  } catch (error) {
    redirectPlaylistError(error, playlistId)
  }

  revalidatePath(`/playlists/${playlistId}`)
  redirect(
    `/playlists/${playlistId}?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_ITEM_REMOVED}`,
  )
}

export async function movePlaylistItemAction(formData: FormData) {
  const playlistId = getString(formData, 'playlistId')
  const playlistItemId = getString(formData, 'playlistItemId')
  const direction = getString(formData, 'direction')

  try {
    const context = await resolveActiveOrganization()
    const playlist = await getPlaylist(context, playlistId)
    const orderedIds = playlist.items.map((item) => item.id)
    const index = orderedIds.indexOf(playlistItemId)

    if (index < 0) {
      redirect(
        `/playlists/${playlistId}?error=${DJ_STUDIO_PUBLIC_NOTICE_CODES.VALIDATION_ERROR}`,
      )
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= orderedIds.length) {
      redirect(`/playlists/${playlistId}`)
    }

    const next = [...orderedIds]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved!)

    await reorderPlaylistItems(context, playlistId, next)
  } catch (error) {
    redirectPlaylistError(error, playlistId)
  }

  revalidatePath(`/playlists/${playlistId}`)
  redirect(
    `/playlists/${playlistId}?success=${DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_REORDERED}`,
  )
}
