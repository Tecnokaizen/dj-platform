import { redirect } from 'next/navigation'

import {
  getAuthPublicErrorMessage,
  getAuthPublicMessage,
} from '@/core/identity/auth/errors/auth-public-error'
import { ProfileForm } from '@/core/identity/profile/components/profile-form'
import { getCurrentProfile } from '@/core/identity/profile/services/get-current-profile'

type ProfilePageProps = {
  searchParams: Promise<{
    success?: string
    error?: string
  }>
}

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const params = await searchParams
  const session = await getCurrentProfile()
  const errorMessage = getAuthPublicErrorMessage(params.error)
  const successMessage = getAuthPublicMessage(params.success)

  if (!session) {
    redirect('/login')
  }

  if (!session.profile) {
    throw new Error('No se ha encontrado el perfil del usuario')
  }

  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-violet-400">
        Configuración de cuenta
      </p>

      <h1 className="mt-2 text-3xl font-semibold">Mi perfil</h1>

      <p className="mt-3 text-neutral-400">
        Gestiona la información con la que te identificas dentro de DJ
        Platform.
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

      <div className="mt-8">
        <ProfileForm
          profile={{
            display_name: session.profile.display_name,
            dj_name: session.profile.dj_name,
            bio: session.profile.bio,
            preferred_language:
              session.profile.preferred_language ?? 'es',
          }}
        />
      </div>
    </section>
  )
}
