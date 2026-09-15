import Link from 'next/link'

import { loadProductStudioContext } from '@/app/(private)/_lib/load-product-studio-context'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { listLibraryItems } from '@/domains/dj-studio/library/services/library-item-services'
import { listPlaylists } from '@/domains/dj-studio/playlists/services/playlist-services'
import { getOwnDjStudioProfile } from '@/domains/dj-studio/profile/services/dj-studio-profile-services'

export default async function DashboardPage() {
  const session = await getCurrentProfile()

  if (!session) {
    return null
  }

  const { context } = await loadProductStudioContext()
  const [libraryItems, playlists, studioProfile] = await Promise.all([
    listLibraryItems(context),
    listPlaylists(context),
    getOwnDjStudioProfile(),
  ])

  const displayName =
    studioProfile?.stageName?.trim() ||
    session.profile?.display_name ||
    session.user.email ||
    'DJ'

  return (
    <section>
      <p className="text-sm font-medium text-violet-400">DJ Studio</p>

      <h1 className="mt-2 text-4xl font-bold">Bienvenido, {displayName}</h1>

      <p className="mt-4 max-w-2xl text-neutral-400">
        Organización activa lista. Music Library y Playlists usan Domain
        services con RBAC.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link
          href="/library"
          className="rounded-xl border border-white/10 bg-neutral-900 p-6 transition hover:border-violet-500/40"
        >
          <p className="text-sm text-neutral-400">Biblioteca</p>
          <p className="mt-3 text-3xl font-bold">{libraryItems.length}</p>
          <p className="text-sm text-neutral-500">Library items</p>
        </Link>

        <Link
          href="/playlists"
          className="rounded-xl border border-white/10 bg-neutral-900 p-6 transition hover:border-violet-500/40"
        >
          <p className="text-sm text-neutral-400">Playlists</p>
          <p className="mt-3 text-3xl font-bold">{playlists.length}</p>
          <p className="text-sm text-neutral-500">Creadas</p>
        </Link>
      </div>

      <div className="mt-10 rounded-xl border border-white/10 bg-neutral-900 p-6">
        <h2 className="mb-4 text-xl font-semibold">Sesión</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-neutral-500">Email</p>
            <p>{session.user.email}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Idioma</p>
            <p>{session.profile?.preferred_language ?? 'es'}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Stage name</p>
            <p>{studioProfile?.stageName ?? 'Sin configurar'}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Experience</p>
            <p>{studioProfile?.experienceLevel ?? 'Sin configurar'}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
