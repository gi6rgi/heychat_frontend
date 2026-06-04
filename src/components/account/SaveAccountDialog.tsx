import { useState, type FormEvent } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'saving' | 'sent' | 'done'

/**
 * Lets an anonymous visitor "save" their account by attaching an email +
 * password to the SAME Supabase user. Because the user id never changes, all
 * their existing conversations carry over. If email confirmation is enabled in
 * Supabase, the change applies only after the user clicks the confirmation link.
 */
export function SaveAccountDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('saving')
    const { data, error } = await supabase.auth.updateUser({ email, password })
    if (error) {
      setError(error.message)
      setStatus('idle')
      return
    }
    // If the email is already applied (confirmations off), we're done; otherwise
    // Supabase has sent a confirmation link and the email is still pending.
    setStatus(data.user?.email && !data.user.new_email ? 'done' : 'sent')
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button variant="outline" size="sm">
            <UserPlus />
            Save progress
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-border bg-background p-6 shadow-xl',
          )}
        >
          <Dialog.Close
            render={
              <button
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            }
          />

          {status === 'sent' || status === 'done' ? (
            <div className="space-y-3">
              <Dialog.Title className="text-lg font-semibold">
                {status === 'done' ? 'Account saved' : 'Almost there'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {status === 'done'
                  ? 'Your progress is now tied to your email.'
                  : `We sent a confirmation link to ${email}. Click it to finish saving your account - your history stays linked.`}
              </Dialog.Description>
              <Button className="w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Dialog.Title className="text-lg font-semibold">Save your progress</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Add an email and password so you don't lose your conversation history.
                </Dialog.Description>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </label>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={status === 'saving'}>
                {status === 'saving' ? 'Saving…' : 'Save account'}
              </Button>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
