import { logout } from '@/modules/auth/actions/logout'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-white/20 hover:bg-white/5"
      >
        Cerrar sesión
      </button>
    </form>
  )
}