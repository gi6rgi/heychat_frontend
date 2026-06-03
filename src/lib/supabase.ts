import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loud in dev: every API/WS call depends on a valid session.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth will not work.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

/** Current access token, or '' if there is no session yet. */
export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}
