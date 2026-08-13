import {
  getOrganizationPublicErrorMessage,
  getOrganizationPublicMessage,
} from '@/core/modules/organizations/errors/organization-public-notice'
import { listAuthorizedOrganizations } from '@/core/modules/organizations/services/list-authorized-organizations'
import { updateOrganizationAction } from '@/app/(private)/organizations/actions'

type OrganizationsPageProps = {
  searchParams: Promise<{
    error?: string
    success?: string
  }>
}

export default async function OrganizationsPage({
  searchParams,
}: OrganizationsPageProps) {
  const params = await searchParams
  const organizations = await listAuthorizedOrganizations()
  const errorMessage = getOrganizationPublicErrorMessage(params.error)
  const successMessage = getOrganizationPublicMessage(params.success)

  return (
    <section className="max-w-4xl">
      <p className="text-sm font-medium text-violet-400">Platform Core</p>
      <h1 className="mt-2 text-3xl font-semibold">Organizaciones</h1>
      <p className="mt-3 text-neutral-400">
        Consulta las organizaciones activas a las que perteneces. La edición
        solo aparece cuando tu rol incluye el permiso correspondiente.
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

      <div className="mt-8 space-y-6">
        {organizations.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-neutral-900 p-6 text-neutral-400">
            No tienes organizaciones activas disponibles.
          </div>
        ) : null}

        {organizations.map(({ organization, canUpdate }) => (
          <article
            key={organization.id}
            className="rounded-xl border border-white/10 bg-neutral-900 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{organization.name}</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {organization.slug}
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                {organization.status}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">Idioma</dt>
                <dd>{organization.locale}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Zona horaria</dt>
                <dd>{organization.timezone}</dd>
              </div>
            </dl>

            {canUpdate ? (
              <form
                action={updateOrganizationAction}
                className="mt-6 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2"
              >
                <input
                  type="hidden"
                  name="organizationId"
                  value={organization.id}
                />
                <label className="text-sm text-neutral-300">
                  Nombre
                  <input
                    name="name"
                    defaultValue={organization.name}
                    required
                    className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                  />
                </label>
                <label className="text-sm text-neutral-300">
                  Slug
                  <input
                    name="slug"
                    defaultValue={organization.slug}
                    minLength={3}
                    maxLength={63}
                    required
                    className="mt-2 w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                  />
                </label>
                <div className="sm:col-span-2 sm:text-right">
                  <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-500"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
