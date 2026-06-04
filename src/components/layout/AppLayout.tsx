import { Link, NavLink, Outlet } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

export function AppLayout() {
  const { email } = useAuth()
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Pink/purple ambient glow behind everything. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(55% 45% at 50% 0%, oklch(0.67 0.24 322 / 0.16), transparent 70%),' +
            ' radial-gradient(40% 35% at 85% 80%, oklch(0.55 0.22 295 / 0.10), transparent 70%)',
        }}
      />
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white">
              <Mic size={16} />
            </span>
            HeyRizz
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn('transition-colors hover:text-foreground', isActive ? 'text-foreground' : 'text-muted-foreground')
              }
            >
              Scenes
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
          {/* Save-progress (email upgrade) is hidden for now - anonymous
              sessions only. Bring back <SaveAccountDialog /> to re-enable. */}
          <div className="ml-auto flex items-center">
            {email && (
              <span className="text-sm text-muted-foreground">{email}</span>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
