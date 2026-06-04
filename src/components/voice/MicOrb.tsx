import { motion } from 'motion/react'
import { Mic, MicOff } from 'lucide-react'
import type { SessionStatus } from '@/hooks/useVoiceSession'

interface MicOrbProps {
  status: SessionStatus
  isAgentSpeaking: boolean
  muted: boolean
}

/** Pulsing brand-gradient orb that reflects who is "talking". */
export function MicOrb({ status, isAgentSpeaking, muted }: MicOrbProps) {
  const live = status === 'live'
  const active = live && isAgentSpeaking

  return (
    <div className="relative flex size-48 items-center justify-center">
      {/* Animated halo */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-light via-brand to-brand-dark blur-xl"
        animate={{
          scale: active ? [1, 1.15, 1] : live ? [1, 1.05, 1] : 1,
          opacity: active ? 0.85 : live ? 0.5 : 0.25,
        }}
        transition={{
          duration: active ? 1 : 2.4,
          repeat: live ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
      <div className="relative flex size-32 items-center justify-center rounded-full border border-white/10 bg-card/80 backdrop-blur">
        {muted ? (
          <MicOff size={40} className="text-muted-foreground" />
        ) : (
          <Mic size={40} className={live ? 'text-brand-light' : 'text-muted-foreground'} />
        )}
      </div>
    </div>
  )
}
