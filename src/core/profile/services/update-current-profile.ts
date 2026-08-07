import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type UpdateCurrentProfileInput = {
  displayName: string
  djName: string | null
  bio: string | null
  preferredLanguage: string
}

export async function updateCurrentProfile(
  input: UpdateCurrentProfileInput
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('No hay una sesión válida')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName,
      dj_name: input.djName,
      bio: input.bio,
      preferred_language: input.preferredLanguage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    throw new Error(`No se pudo actualizar el perfil: ${error.message}`)
  }
}