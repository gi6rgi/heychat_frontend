import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import type { Turn } from '@/types/api'

export function TranscriptFeed({
  turns,
  autoScroll = true,
}: {
  turns: Turn[]
  autoScroll?: boolean
}) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, autoScroll])

  if (turns.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        The transcript will appear here as you talk…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {turns.map((turn) => {
        const isUser = turn.role === 'user'
        return (
          <motion.div
            key={turn.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                isUser
                  ? 'rounded-br-sm bg-gradient-to-br from-brand via-brand-dark to-brand-dark text-white'
                  : 'rounded-bl-sm border border-white/[0.08] bg-card/80 text-foreground'
              }`}
            >
              {turn.text}
            </div>
          </motion.div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
