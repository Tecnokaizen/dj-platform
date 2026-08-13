import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function getCurrentProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
   .select(
  'id, username, display_name, dj_name, avatar_url, bio, preferred_language, experience_level, is_admin'
)
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`No se pudo cargar el perfil: ${profileError.message}`)
  }

  return {
    user,
    profile,
  }
}