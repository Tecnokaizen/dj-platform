import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { LogoutButton } from '@/core/identity/auth/components/logout-button'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'
import { getOwnDjStudioProfile } from '@/domains/dj-studio/profile/services/dj-studio-profile-services'
import { switchActiveOrganizationAction } from '@/app/(private)/_lib/organization-actions'
import { loadProductStudioContext } from '@/app/(private)/_lib/load-product-studio-context'

type PrivateLayoutProps = {
  children: ReactNode
}

export default async function PrivateLayout({
  children,
}: PrivateLayoutProps) {
  const session = await getCurrentProfile()

  if (!session) {
    redirect('/login')
  }

  const studio = await loadProductStudioContext()
  const studioProfile = session.profile?.id
    ? await getOwnDjStudioProfile()
    : null

  const displayName =
    studioProfile?.stageName?.trim() ||
    session.profile?.display_name ||
    session.user.email ||
    'Usuario'

  const activeOrg =
    studio.organizations.find(
      (org) => org.organizationId === studio.context.organizationId,
    ) ?? null

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/dashboard"
            className="text-lg font-bold text-violet-400 sm:text-xl"
          >
            DJ Kaizen Studio
          </Link>

          <div className="flex flex-wrap items-center gap-4">
            {studio.organizations.length > 1 ? (
              <form
                action={switchActiveOrganizationAction}
                className="flex items-center gap-2"
              >
                <input type="hidden" name="returnTo" value="/dashboard" />
                <label htmlFor="active-organization" className="sr-only">
                  Organización activa
                </label>
                <select
                  id="active-organization"
                  name="organizationId"
                  defaultValue={studio.context.organizationId}
                  className="rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
                >
                  {studio.organizations.map((org) => (
                    <option key={org.organizationId} value={org.organizationId}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-200 transition hover:bg-white/5"
                >
                  Cambiar
                </button>
              </form>
            ) : activeOrg ? (
              <span className="hidden text-sm text-neutral-400 md:block">
                {activeOrg.name}
              </span>
            ) : null}

            <span className="hidden text-sm text-neutral-300 md:block">
              {displayName}
            </span>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-white/10 bg-neutral-900 p-4">
          <nav className="space-y-2" aria-label="Principal">
            <Link
              href="/dashboard"
              className="block rounded-lg px-3 py-2 hover:bg-white/5"
            >
              Inicio
            </Link>
            <Link
              href="/library"
              className="block rounded-lg px-3 py-2 transition hover:bg-white/5"
            >
              Biblioteca
            </Link>
            <Link
              href="/playlists"
              className="block rounded-lg px-3 py-2 transition hover:bg-white/5"
            >
              Playlists
            </Link>
            <Link
              href="/studio-profile"
              className="block rounded-lg px-3 py-2 transition hover:bg-white/5"
            >
              Perfil DJ
            </Link>
            <Link
              href="/profile"
              className="block rounded-lg px-3 py-2 transition hover:bg-white/5"
            >
              Cuenta
            </Link>
            <Link
              href="/organizations"
              className="block rounded-lg px-3 py-2 transition hover:bg-white/5"
            >
              Organizaciones
            </Link>
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  )
}
