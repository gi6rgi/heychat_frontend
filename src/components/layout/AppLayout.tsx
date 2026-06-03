import { Link, NavLink, Outlet } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { SaveAccountDialog } from '@/components/account/SaveAccountDialog'

export function AppLayout() {
  const { isAnonymous, email } = useAuth()
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Warm radial glow behind everything for the orange brand feel. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, oklch(0.70 0.19 50 / 0.18), transparent 70%)',
        }}
      />
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white">
              <Mic size={16} />
            </span>
            HeyChat
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn('transition-colors hover:text-foreground', isActive ? 'text-foreground' : 'text-muted-foreground')
              }
            >
              Scenarios
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                cn('transition-colors hover:text-foreground', isActive ? 'text-foreground' : 'text-muted-foreground')
              }
            >
              History
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center">
            {isAnonymous ? (
              <SaveAccountDialog />
            ) : email ? (
              <span className="text-sm text-muted-foreground">{email}</span>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
