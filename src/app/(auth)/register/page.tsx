import Link from 'next/link'

import { register } from '@/core/auth/actions/register'

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-400">
            DJ Platform
          </p>

          <h1 className="text-3xl font-semibold">Crear cuenta</h1>

          <p className="mt-2 text-sm text-neutral-400">
            Empieza a organizar tu música y construir tus sesiones.
          </p>
        </div>

        {params.error ? (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {params.error}
          </div>
        ) : null}

        <form action={register} className="space-y-5">
          <div>
            <label
              htmlFor="displayName"
              className="mb-2 block text-sm font-medium"
            >
              Nombre
            </label>

            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-violet-500"
              placeholder="Rubén"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-violet-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-violet-500"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              Repetir contraseña
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-violet-500"
              placeholder="Repite la contraseña"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 px-4 py-3 font-medium transition hover:bg-violet-500"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-medium text-violet-400 hover:text-violet-300"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  )
}