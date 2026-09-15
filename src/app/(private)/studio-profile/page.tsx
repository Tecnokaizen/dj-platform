import { upsertStudioProfileAction } from '@/app/(private)/studio-profile/actions'
import { ExperienceLevel } from '@/generated/prisma/client'
import { getOwnDjStudioProfile } from '@/domains/dj-studio/profile/services/dj-studio-profile-services'
import {
  getDjStudioPublicErrorMessage,
  getDjStudioPublicMessage,
} from '@/domains/dj-studio/shared/public-notice'

type StudioProfilePageProps = {
  searchParams: Promise<{
    error?: string
    success?: string
  }>
}

const EXPERIENCE_OPTIONS = Object.values(ExperienceLevel)

export default async function StudioProfilePage({
  searchParams,
}: StudioProfilePageProps) {
  const params = await searchParams
  const profile = await getOwnDjStudioProfile()
  const errorMessage = getDjStudioPublicErrorMessage(params.error)
  const successMessage = getDjStudioPublicMessage(params.success)

  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-violet-400">DJ Studio</p>
      <h1 className="mt-2 text-3xl font-semibold">Studio Profile</h1>
      <p className="mt-3 text-neutral-400">
        Perfil de estudio (Domain SoT). No escribe campos legacy de Profile.
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

      <form
        action={upsertStudioProfileAction}
        className="mt-8 space-y-6 rounded-xl border border-white/10 bg-neutral-900 p-6"
      >
        <label className="block text-sm text-neutral-300">
          Stage name
          <input
            name="stageName"
            defaultValue={profile?.stageName ?? ''}
            maxLength={120}
            className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="DJ Kaizen"
          />
        </label>

        <label className="block text-sm text-neutral-300">
          Experience level
          <select
            name="experienceLevel"
            defaultValue={profile?.experienceLevel ?? ''}
            className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="">Sin especificar</option>
            {EXPERIENCE_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end border-t border-white/10 pt-6">
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-500"
          >
            Guardar
          </button>
        </div>
      </form>
    </section>
  )
}
