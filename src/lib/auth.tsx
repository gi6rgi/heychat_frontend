import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthState = {
  session: Session | null
  userId: string | null
  /** True while the user is an anonymous (not-yet-saved) account. */
  isAnonymous: boolean
  /** Email once the account has been saved, else null. */
  email: string | null
}

const AuthContext = createContext<AuthState>({
  session: null,
  userId: null,
  isAnonymous: false,
  email: null,
})

/**
 * Ensures there is always a Supabase session: if the visitor has none, signs
 * them in anonymously. Children render only once a session exists, so every
 * downstream API/WS call can rely on a token being present.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function ensureSession() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) {
        setSession(data.session)
        setReady(true)
        return
      }
      const { data: signed, error } = await supabase.auth.signInAnonymously()
      if (cancelled) return
      if (error) {
        console.error('Anonymous sign-in failed:', error.message)
      }
      setSession(signed.session ?? null)
      setReady(true)
    }

    void ensureSession()

    // Keep state in sync on token refresh / sign-out.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        userId: session?.user.id ?? null,
        isAnonymous: session?.user.is_anonymous ?? false,
        email: session?.user.email ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
