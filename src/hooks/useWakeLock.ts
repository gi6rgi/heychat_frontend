import { useEffect } from 'react'

/**
 * Keeps the screen awake while `active` is true (the live scene — a voice
 * conversation has no touch input, so the OS would otherwise dim and lock).
 *
 * Uses the Screen Wake Lock API (iOS/iPadOS 16.4+, Chrome/Firefox/Samsung on
 * Android, all desktop). Feature-detected, so unsupported browsers simply
 * no-op. The OS auto-releases the lock whenever the page is hidden (lock
 * screen, tab switch, backgrounded), so we re-acquire on visibilitychange
 * while still active — without that, the lock never comes back after a glance
 * away.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      // Only valid while the page is visible; the request rejects otherwise.
      if (cancelled || document.visibilityState !== 'visible') return
      try {
        sentinel = await navigator.wakeLock.request('screen')
      } catch {
        // Denied or transiently unavailable — not worth surfacing; the screen
        // dimming is a soft failure, and visibilitychange will retry.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
      sentinel = null
    }
  }, [active])
}
