import Link from 'next/link'

import { login } from '@/core/auth/actions/login'

type LoginPageProps = {
  searchParams: Promise<{
    error?: string
    message?: string
    next?: string
  }>
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-400">
            DJ Platform
          </p>

          <h1 className="text-3xl font-semibold">Iniciar sesión</h1>

          <p className="mt-2 text-sm text-neutral-400">
            Accede a tu biblioteca, playlists e importaciones.
          </p>
        </div>

        {params.error ? (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {params.error}
          </div>
        ) : null}

        {params.message ? (
          <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {params.message}
          </div>
        ) : null}

        <form action={login} className="space-y-5">
          <input
            type="hidden"
            name="next"
            value={params.next ?? '/dashboard'}
          />

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
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-violet-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 px-4 py-3 font-medium transition hover:bg-violet-500"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ¿Todavía no tienes cuenta?{' '}
          <Link
            href="/register"
            className="font-medium text-violet-400 hover:text-violet-300"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  )
}