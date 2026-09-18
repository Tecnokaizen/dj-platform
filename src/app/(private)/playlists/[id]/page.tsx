import Link from 'next/link'
import { notFound } from 'next/navigation'

import { loadProductStudioContext } from '@/app/(private)/_lib/load-product-studio-context'
import {
  formatArtistCredits,
  formatBpm,
} from '@/app/(private)/_lib/format-track'
import {
  addPlaylistItemAction,
  movePlaylistItemAction,
  removePlaylistItemAction,
  updatePlaylistItemAction,
} from '@/app/(private)/playlists/actions'
import { PlaylistReviewSequence } from '@/app/(private)/playlists/playlist-review-sequence'
import { listLibraryItems } from '@/domains/dj-studio/library/services/library-item-services'
import { getPlaylist } from '@/domains/dj-studio/playlists/services/playlist-services'
import { DjStudioError, DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'
import {
  getDjStudioPublicErrorMessage,
  getDjStudioPublicMessage,
} from '@/domains/dj-studio/shared/public-notice'

type PlaylistDetailPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    error?: string
    success?: string
    view?: string
  }>
}

export default async function PlaylistDetailPage({
  params,
  searchParams,
}: PlaylistDetailPageProps) {
  const { id } = await params
  const query = await searchParams
  const { context, canManagePlaylists } = await loadProductStudioContext()
  const isEditView = query.view === 'edit'

  let playlist

  try {
    playlist = await getPlaylist(context, id)
  } catch (error) {
    if (
      error instanceof DjStudioError &&
      (error.code === DJ_STUDIO_ERROR_CODES.PLAYLIST_NOT_FOUND ||
        error.code === DJ_STUDIO_ERROR_CODES.FORBIDDEN)
    ) {
      notFound()
    }
    throw error
  }

  const libraryItems = canManagePlaylists && isEditView
    ? await listLibraryItems(context)
    : []

  const errorMessage = getDjStudioPublicErrorMessage(query.error)
  const successMessage = getDjStudioPublicMessage(query.success)
  const showTransitionNotes = playlist.playlistType === 'AI_GENERATED'
  const reviewHref = `/playlists/${playlist.id}`
  const editHref = `/playlists/${playlist.id}?view=edit`

  return (
    <section className="max-w-6xl">
      <p className="text-sm font-medium text-violet-400">
        <Link href="/playlists" className="hover:underline">
          Playlists
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{playlist.name}</h1>
      {playlist.description ? (
        <p className="mt-3 text-neutral-400">{playlist.description}</p>
      ) : null}
      <p className="mt-2 text-sm text-neutral-500">
        {playlist.visibility} · {playlist.playlistType} · {playlist.items.length}{' '}
        items
      </p>

      <div
        className="mt-6 inline-flex rounded-lg border border-white/10 p-1 text-sm"
        role="tablist"
        aria-label="Playlist view mode"
      >
        <Link
          href={reviewHref}
          role="tab"
          aria-selected={!isEditView}
          className={
            !isEditView
              ? 'rounded-md bg-white/10 px-3 py-1.5 font-medium text-white'
              : 'rounded-md px-3 py-1.5 text-neutral-400 hover:text-neutral-200'
          }
        >
          Review
        </Link>
        <Link
          href={editHref}
          role="tab"
          aria-selected={isEditView}
          className={
            isEditView
              ? 'rounded-md bg-white/10 px-3 py-1.5 font-medium text-white'
              : 'rounded-md px-3 py-1.5 text-neutral-400 hover:text-neutral-200'
          }
        >
          Edit
        </Link>
      </div>

      {successMessage ? (
        <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {!isEditView ? (
        <PlaylistReviewSequence
          items={playlist.items}
          showTransitionNotes={showTransitionNotes}
        />
      ) : (
        <>
          {canManagePlaylists ? (
            <form
              action={addPlaylistItemAction}
              className="mt-8 grid gap-4 rounded-xl border border-white/10 bg-neutral-900 p-6"
            >
              <h2 className="text-lg font-semibold">Añadir LibraryItem</h2>
              <input type="hidden" name="playlistId" value={playlist.id} />
              <label className="text-sm text-neutral-300">
                Elemento de biblioteca
                <select
                  name="libraryItemId"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3"
                >
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {libraryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.track.title} —{' '}
                      {formatArtistCredits(item.track.artists)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-neutral-300">
                Notes (opcional)
                <input
                  name="notes"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3"
                />
              </label>
              <label className="text-sm text-neutral-300">
                Transition notes (opcional)
                <input
                  name="transitionNotes"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3"
                />
              </label>
              <div className="text-right">
                <button
                  type="submit"
                  className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-500"
                  disabled={libraryItems.length === 0}
                >
                  Añadir
                </button>
              </div>
              {libraryItems.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Añade tracks a la{' '}
                  <Link
                    href="/library"
                    className="text-violet-300 hover:underline"
                  >
                    biblioteca
                  </Link>{' '}
                  primero. Se permite repetir el mismo LibraryItem.
                </p>
              ) : (
                <p className="text-sm text-neutral-500">
                  Puedes añadir el mismo LibraryItem varias veces.
                </p>
              )}
            </form>
          ) : null}

          {playlist.items.length === 0 ? (
            <div className="mt-8 rounded-xl border border-white/10 bg-neutral-900 p-8 text-neutral-400">
              Esta playlist está vacía.
            </div>
          ) : (
            <ol className="mt-8 space-y-4">
              {playlist.items.map((item, index) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-neutral-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-neutral-500">#{item.position}</p>
                      <h2 className="text-lg font-semibold">
                        {item.libraryItem.track.title}
                      </h2>
                      <p className="text-sm text-neutral-400">
                        {formatArtistCredits(item.libraryItem.track.artists)} ·
                        BPM {formatBpm(item.libraryItem.track.bpm)}
                      </p>
                    </div>
                    {canManagePlaylists ? (
                      <div className="flex gap-2">
                        <form action={movePlaylistItemAction}>
                          <input
                            type="hidden"
                            name="playlistId"
                            value={playlist.id}
                          />
                          <input
                            type="hidden"
                            name="playlistItemId"
                            value={item.id}
                          />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            disabled={index === 0}
                            className="rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-40"
                            aria-label="Subir"
                          >
                            ↑
                          </button>
                        </form>
                        <form action={movePlaylistItemAction}>
                          <input
                            type="hidden"
                            name="playlistId"
                            value={playlist.id}
                          />
                          <input
                            type="hidden"
                            name="playlistItemId"
                            value={item.id}
                          />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={index === playlist.items.length - 1}
                            className="rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-40"
                            aria-label="Bajar"
                          >
                            ↓
                          </button>
                        </form>
                        <form action={removePlaylistItemAction}>
                          <input
                            type="hidden"
                            name="playlistId"
                            value={playlist.id}
                          />
                          <input
                            type="hidden"
                            name="playlistItemId"
                            value={item.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-200"
                          >
                            Quitar
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>

                  {canManagePlaylists ? (
                    <form
                      action={updatePlaylistItemAction}
                      className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2"
                    >
                      <input
                        type="hidden"
                        name="playlistId"
                        value={playlist.id}
                      />
                      <input
                        type="hidden"
                        name="playlistItemId"
                        value={item.id}
                      />
                      <label className="text-sm text-neutral-300">
                        Notes
                        <input
                          name="notes"
                          defaultValue={item.notes ?? ''}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        />
                      </label>
                      <label className="text-sm text-neutral-300">
                        Transition notes
                        <input
                          name="transitionNotes"
                          defaultValue={item.transitionNotes ?? ''}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        />
                      </label>
                      <div className="sm:col-span-2 sm:text-right">
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                        >
                          Guardar notas
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 text-sm text-neutral-500">
                      {item.notes ? <p>Notes: {item.notes}</p> : null}
                      {item.transitionNotes ? (
                        <p>Transition: {item.transitionNotes}</p>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  )
}
