import { loadProductStudioContext } from '@/app/(private)/_lib/load-product-studio-context'
import { SessionBuilderForm } from '@/components/dj-studio/session-builder/session-builder-form'

export default async function SessionBuilderPage() {
  const { canManagePlaylists } = await loadProductStudioContext()

  return (
    <section className="max-w-4xl">
      <p className="text-sm font-medium text-violet-400">Session Builder</p>
      <h1 className="mt-2 text-3xl font-semibold">Crear sesión</h1>
      <p className="mt-3 text-neutral-400">
        Describe la sesión que quieres preparar y DJ Kaizen Studio propondrá una
        selección ordenada desde tu biblioteca.
      </p>

      <div className="mt-8">
        <SessionBuilderForm canGenerate={canManagePlaylists} />
      </div>
    </section>
  )
}
