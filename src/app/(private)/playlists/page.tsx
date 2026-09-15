import Link from 'next/link'

import { loadProductStudioContext } from '@/app/(private)/_lib/load-product-studio-context'
import {
  createPlaylistAction,
  deletePlaylistAction,
} from '@/app/(private)/playlists/actions'
import { listPlaylists } from '@/domains/dj-studio/playlists/services/playlist-services'
import {
  getDjStudioPublicErrorMessage,
  getDjStudioPublicMessage,
} from '@/domains/dj-studio/shared/public-notice'

type PlaylistsPageProps = {
  searchParams: Promise<{
    error?: string
    success?: string
  }>
}

export default async function PlaylistsPage({
  searchParams,
}: PlaylistsPageProps) {
  const params = await searchParams
  const { context, canManagePlaylists } = await loadProductStudioContext()
  const playlists = await listPlaylists(context)
  const errorMessage = getDjStudioPublicErrorMessage(params.error)
  const successMessage = getDjStudioPublicMessage(params.success)

  return (
    <section className="max-w-4xl">
      <p className="text-sm font-medium text-violet-400">Playlists</p>
      <h1 className="mt-2 text-3xl font-semibold">Playlists</h1>
      <p className="mt-3 text-neutral-400">
        Listas de la organización activa. Visibility MVP: PRIVATE.
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

      {canManagePlaylists ? (
        <form
          action={createPlaylistAction}
          className="mt-8 grid gap-4 rounded-xl border border-white/10 bg-neutral-900 p-6 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-lg font-semibold">
            Crear playlist
          </h2>
          <label className="text-sm text-neutral-300">
            Nombre
            <input
              name="name"
              required
              maxLength={255}
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </label>
          <label className="text-sm text-neutral-300">
            Descripción (opcional)
            <input
              name="description"
              maxLength={1000}
              className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
          </label>
          <div className="sm:col-span-2 sm:text-right">
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-500"
            >
              Crear
            </button>
          </div>
        </form>
      ) : null}

      {playlists.length === 0 ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-neutral-900 p-8 text-neutral-400">
          <p>No hay playlists todavía.</p>
          {canManagePlaylists ? (
            <p className="mt-2 text-sm">Crea la primera con el formulario de arriba.</p>
          ) : null}
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900 p-5"
            >
              <div>
                <Link
                  href={`/playlists/${playlist.id}`}
                  className="text-lg font-semibold text-violet-200 hover:underline"
                >
                  {playlist.name}
                </Link>
                <p className="mt-1 text-sm text-neutral-400">
                  {playlist._count.items} items · {playlist.visibility} ·{' '}
                  {playlist.updatedAt.toISOString().slice(0, 10)}
                </p>
              </div>
              {canManagePlaylists ? (
                <form action={deletePlaylistAction}>
                  <input type="hidden" name="playlistId" value={playlist.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
