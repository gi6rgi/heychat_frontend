import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { formatDateTime } from '@/lib/utils'

export default function History() {
  const { data: conversations, isLoading, isError } = useConversations()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="max-w-xl text-muted-foreground">
          Your past practice sessions. Open one to read the full transcript.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-white/[0.06] bg-card/50" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Failed to load history. Make sure the backend is running.
        </p>
      )}

      {conversations && conversations.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-card/30 py-16 text-center">
          <MessageSquare className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No sessions yet. Start a conversation and it will show up here.
          </p>
          <Link to="/" className="text-sm text-brand-light hover:underline">
            Browse scenarios
          </Link>
        </div>
      )}

      {conversations && conversations.length > 0 && (
        <div className="flex flex-col gap-3">
          {conversations.map((conv) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Link
                to={`/history/${conv.id}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-card/60 px-5 py-4 transition-colors hover:border-brand/40"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {conv.scenario_title ?? conv.scenario_id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(conv.created_at)} · {conv.message_count} messages
                  </span>
                </div>
                <ArrowRight
                  size={18}
                  className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-light"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
