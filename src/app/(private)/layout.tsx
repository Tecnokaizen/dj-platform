import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { LogoutButton } from '@/modules/auth/components/logout-button'
import { getCurrentProfile } from '@/modules/profile/services/get-current-profile'

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

  const displayName =
    session.profile?.display_name ??
    session.profile?.dj_name ??
    session.user.email ??
    'Usuario'

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-violet-400"
          >
            DJ Platform
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-neutral-300 md:block">
              {displayName}
            </span>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-white/10 bg-neutral-900 p-4">
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="block rounded-lg px-3 py-2 hover:bg-white/5"
            >
              Dashboard
            </Link>

            <span className="block rounded-lg px-3 py-2 text-neutral-500">
              Biblioteca (próximamente)
            </span>

            <span className="block rounded-lg px-3 py-2 text-neutral-500">
              Playlists (próximamente)
            </span>

            <span className="block rounded-lg px-3 py-2 text-neutral-500">
              Importaciones (próximamente)
            </span>
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  )
}