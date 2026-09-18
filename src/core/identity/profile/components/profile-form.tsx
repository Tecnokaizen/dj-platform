import { updateProfile } from '@/core/identity/profile/actions/update-profile'

type ProfileFormProps = {
  profile: {
    display_name: string | null
    bio: string | null
    preferred_language: string
  }
}

export function ProfileForm({ profile }: ProfileFormProps) {
  return (
    <form
      action={updateProfile}
      className="space-y-6 rounded-2xl border border-white/10 bg-neutral-900 p-6"
    >
      <div>
        <label
          htmlFor="displayName"
          className="mb-2 block text-sm font-medium text-neutral-200"
        >
          Nombre visible
        </label>

        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={profile.display_name ?? ''}
          maxLength={120}
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          placeholder="Rubén"
        />

        <p className="mt-2 text-xs text-neutral-500">
          Nombre genérico de cuenta. El nombre artístico vive en Perfil DJ.
        </p>
      </div>

      <div>
        <label
          htmlFor="bio"
          className="mb-2 block text-sm font-medium text-neutral-200"
        >
          Biografía
        </label>

        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ''}
          maxLength={1000}
          rows={6}
          className="w-full resize-y rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          placeholder="Cuéntanos algo sobre tu experiencia..."
        />
      </div>

      <div>
        <label
          htmlFor="preferredLanguage"
          className="mb-2 block text-sm font-medium text-neutral-200"
        >
          Idioma
        </label>

        <select
          id="preferredLanguage"
          name="preferredLanguage"
          defaultValue={profile.preferred_language}
          className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="flex justify-end border-t border-white/10 pt-6">
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-500"
        >
          Guardar cambios
        </button>
      </div>
    </form>
  )
}
