import { useEffect, useRef } from 'react'
import { AmbiencePlayer, type Ambience } from '@/audio/ambience'

/**
 * Plays procedural background ambience while `active` is true. Restarts when the
 * ambience kind changes (e.g. toggled off → 'none'), and stops on unmount.
 */
export function useAmbience(kind: Ambience, active: boolean): void {
  const ref = useRef<AmbiencePlayer | null>(null)

  useEffect(() => {
    if (!active || kind === 'none') return
    const player = new AmbiencePlayer()
    ref.current = player
    void player.start(kind)
    return () => {
      void player.stop()
      ref.current = null
    }
  }, [kind, active])
}
