import Link from 'next/link'

import { loadProductStudioContext } from '@/app/(private)/_lib/load-product-studio-context'
import {
  formatArtistCredits,
  formatBpm,
} from '@/app/(private)/_lib/format-track'
import {
  addTrackToLibraryAction,
  attachTagAction,
  createTagAction,
  detachTagAction,
  removeLibraryItemAction,
  updateLibraryItemAction,
} from '@/app/(private)/library/actions'
import { searchCatalogTracks } from '@/domains/dj-studio/catalog/services/search-catalog-tracks'
import { listLibraryItems } from '@/domains/dj-studio/library/services/library-item-services'
import { listTags } from '@/domains/dj-studio/library/services/tag-services'
import {
  getDjStudioPublicErrorMessage,
  getDjStudioPublicMessage,
} from '@/domains/dj-studio/shared/public-notice'

type LibraryPageProps = {
  searchParams: Promise<{
    error?: string
    success?: string
    q?: string
  }>
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams
  const { context, canManageLibrary } = await loadProductStudioContext()
  const [items, tags] = await Promise.all([
    listLibraryItems(context),
    listTags(context),
  ])

  const query = params.q?.trim() ?? ''
  const searchResults =
    canManageLibrary && query.length > 0
      ? await searchCatalogTracks({ query, limit: 15 })
      : []

  const errorMessage = getDjStudioPublicErrorMessage(params.error)
  const successMessage = getDjStudioPublicMessage(params.success)

  return (
    <section className="max-w-5xl">
      <p className="text-sm font-medium text-violet-400">Music Library</p>
      <h1 className="mt-2 text-3xl font-semibold">Biblioteca</h1>
      <p className="mt-3 text-neutral-400">
        Tracks de la organización activa. La autorización se aplica en servidor.
      </p>

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

      {canManageLibrary ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold">Añadir track</h2>
          <form method="get" className="mt-4 flex flex-wrap gap-3">
            <label htmlFor="catalog-search" className="sr-only">
              Buscar en catálogo
            </label>
            <input
              id="catalog-search"
              name="q"
              defaultValue={query}
              placeholder="Buscar por título o artista"
              className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-500"
            >
              Buscar
            </button>
          </form>

          {query && searchResults.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              No hay resultados para “{query}”.
            </p>
          ) : null}

          {searchResults.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {searchResults.map((track) => (
                <li
                  key={track.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-neutral-950 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{track.title}</p>
                    <p className="text-sm text-neutral-400">
                      {formatArtistCredits(track.artists)} · BPM{' '}
                      {formatBpm(track.bpm)} ·{' '}
                      {track.camelotKey ?? track.musicalKey ?? '—'}
                    </p>
                  </div>
                  <form action={addTrackToLibraryAction}>
                    <input type="hidden" name="trackId" value={track.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-violet-500/40 px-3 py-2 text-sm text-violet-200 transition hover:bg-violet-500/10"
                    >
                      Añadir
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-neutral-900 p-8 text-neutral-400">
          <p>La biblioteca está vacía.</p>
          {canManageLibrary ? (
            <p className="mt-2 text-sm">
              Usa la búsqueda de catálogo para añadir el primer track.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {items.map((item) => {
            const attachedTagIds = new Set(item.tags.map((entry) => entry.tagId))
            const availableTags = tags.filter((tag) => !attachedTagIds.has(tag.id))

            return (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-neutral-900 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{item.track.title}</h2>
                    <p className="mt-1 text-sm text-neutral-400">
                      {formatArtistCredits(item.track.artists)}
                    </p>
                    <p className="mt-2 text-sm text-neutral-500">
                      BPM {formatBpm(item.customBpm ?? item.track.bpm)} · Key{' '}
                      {item.customKey ??
                        item.track.camelotKey ??
                        item.track.musicalKey ??
                        '—'}{' '}
                      · {item.status}
                      {item.isFavorite ? ' · Favorito' : ''}
                    </p>
                  </div>
                  <div className="text-sm text-neutral-400">
                    Rating {item.rating ?? '—'} · Energy {item.energy ?? '—'}
                  </div>
                </div>

                {item.tags.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((entry) => (
                      <li
                        key={entry.tagId}
                        className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-200"
                      >
                        {entry.tag.name}
                        {canManageLibrary ? (
                          <form action={detachTagAction}>
                            <input
                              type="hidden"
                              name="libraryItemId"
                              value={item.id}
                            />
                            <input type="hidden" name="tagId" value={entry.tagId} />
                            <button
                              type="submit"
                              className="text-neutral-400 hover:text-red-300"
                              aria-label={`Quitar tag ${entry.tag.name}`}
                            >
                              ×
                            </button>
                          </form>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {canManageLibrary ? (
                  <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                    <form
                      action={updateLibraryItemAction}
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      <input type="hidden" name="libraryItemId" value={item.id} />
                      <label className="text-sm text-neutral-300">
                        Estado
                        <select
                          name="status"
                          defaultValue={item.status}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        >
                          <option value="LIBRARY">LIBRARY</option>
                          <option value="WISHLIST">WISHLIST</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </label>
                      <label className="text-sm text-neutral-300">
                        Rating
                        <input
                          name="rating"
                          type="number"
                          min={0}
                          max={10}
                          defaultValue={item.rating ?? ''}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        />
                      </label>
                      <label className="text-sm text-neutral-300">
                        Energy
                        <input
                          name="energy"
                          type="number"
                          min={0}
                          max={10}
                          defaultValue={item.energy ?? ''}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        />
                      </label>
                      <label className="text-sm text-neutral-300">
                        Familiarity
                        <input
                          name="familiarity"
                          type="number"
                          min={0}
                          max={10}
                          defaultValue={item.familiarity ?? ''}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        />
                      </label>
                      <label className="text-sm text-neutral-300">
                        Custom BPM
                        <input
                          name="customBpm"
                          type="number"
                          step="0.001"
                          defaultValue={
                            item.customBpm != null
                              ? Number(item.customBpm.toString())
                              : ''
                          }
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        />
                      </label>
                      <label className="text-sm text-neutral-300">
                        Custom key
                        <input
                          name="customKey"
                          defaultValue={item.customKey ?? ''}
                          maxLength={20}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        />
                      </label>
                      <label className="sm:col-span-2 text-sm text-neutral-300">
                        Notes
                        <textarea
                          name="notes"
                          rows={3}
                          defaultValue={item.notes ?? ''}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-neutral-300">
                        <input
                          type="checkbox"
                          name="isFavorite"
                          defaultChecked={item.isFavorite}
                        />
                        Favorito
                      </label>
                      <div className="sm:text-right">
                        <button
                          type="submit"
                          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>

                    <div className="flex flex-wrap gap-3">
                      {availableTags.length > 0 ? (
                        <form action={attachTagAction} className="flex gap-2">
                          <input
                            type="hidden"
                            name="libraryItemId"
                            value={item.id}
                          />
                          <label htmlFor={`tag-${item.id}`} className="sr-only">
                            Añadir tag existente
                          </label>
                          <select
                            id={`tag-${item.id}`}
                            name="tagId"
                            className="rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm"
                            defaultValue=""
                            required
                          >
                            <option value="" disabled>
                              Tag existente…
                            </option>
                            {availableTags.map((tag) => (
                              <option key={tag.id} value={tag.id}>
                                {tag.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                          >
                            Attach
                          </button>
                        </form>
                      ) : null}

                      <form action={createTagAction} className="flex gap-2">
                        <input
                          type="hidden"
                          name="libraryItemId"
                          value={item.id}
                        />
                        <label htmlFor={`new-tag-${item.id}`} className="sr-only">
                          Crear tag
                        </label>
                        <input
                          id={`new-tag-${item.id}`}
                          name="name"
                          required
                          maxLength={80}
                          placeholder="Nuevo tag"
                          className="rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                        >
                          Crear tag
                        </button>
                      </form>

                      <form action={removeLibraryItemAction}>
                        <input
                          type="hidden"
                          name="libraryItemId"
                          value={item.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-8 text-sm text-neutral-500">
        <Link href="/playlists" className="text-violet-300 hover:underline">
          Ir a Playlists
        </Link>
      </p>
    </section>
  )
}
