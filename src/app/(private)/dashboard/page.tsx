import { getCurrentProfile } from '@/core/profile/services/get-current-profile'

export default async function DashboardPage() {
  const session = await getCurrentProfile()

  if (!session) {
    return null
  }

  const displayName =
    session.profile?.display_name ??
    session.profile?.dj_name ??
    session.user.email ??
    'DJ'

  return (
    <section>
      <p className="text-sm font-medium text-violet-400">
        Milestone 2 · Sprint 1
      </p>

      <h1 className="mt-2 text-4xl font-bold">
        Bienvenido, {displayName}
      </h1>

      <p className="mt-4 max-w-2xl text-neutral-400">
        Ya tienes funcionando la autenticación SSR con Supabase y el perfil
        sincronizado automáticamente mediante la tabla <strong>profiles</strong>.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">Biblioteca</p>
          <p className="mt-3 text-3xl font-bold">0</p>
          <p className="text-sm text-neutral-500">Tracks</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">Playlists</p>
          <p className="mt-3 text-3xl font-bold">0</p>
          <p className="text-sm text-neutral-500">Creadas</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">Importaciones</p>
          <p className="mt-3 text-3xl font-bold">0</p>
          <p className="text-sm text-neutral-500">Realizadas</p>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-white/10 bg-neutral-900 p-6">
        <h2 className="mb-4 text-xl font-semibold">Información del perfil</h2>

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
            <p className="text-sm text-neutral-500">Nombre DJ</p>
            <p>{session.profile?.dj_name ?? 'Sin configurar'}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Administrador</p>
            <p>{session.profile?.is_admin ? 'Sí' : 'No'}</p>
          </div>
        </div>
      </div>
    </section>
  )
}