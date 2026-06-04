import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Repeat2, RotateCcw, Sparkles } from 'lucide-react'
import { useConversation, useFeedback, useGenerateFeedback } from '@/hooks/useConversations'
import { TranscriptFeed } from '@/components/voice/TranscriptFeed'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { Turn } from '@/types/api'

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { data: conversation, isLoading, isError } = useConversation(conversationId)
  const { data: feedback } = useFeedback(conversationId)
  const generate = useGenerateFeedback(conversationId)
  // If this is a replay, pull the original attempt's report to show deltas.
  const { data: parentFeedback } = useFeedback(conversation?.replay_of ?? undefined)
  const previousReport = parentFeedback?.report ?? undefined

  const status = feedback?.status ?? 'none'
  const analyzing = status === 'generating' || generate.isPending

  const turns = useMemo<Turn[]>(
    () =>
      (conversation?.messages ?? []).map((m, i) => ({
        id: `m${i}`,
        role: m.role,
        text: m.text,
      })),
    [conversation],
  )

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/history')}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> History
      </button>

      {isError && <p className="text-sm text-destructive">Conversation not found.</p>}

      {isLoading && (
        <div className="h-64 animate-pulse rounded-2xl border border-white/[0.06] bg-card/50" />
      )}

      {conversation && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">
                {conversation.scenario_title ?? conversation.scenario_id}
              </h1>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(conversation.created_at)}
              </span>
            </div>
            <Link to={`/session/${conversation.scenario_id}?replay_of=${conversation.id}`}>
              <Button size="lg">
                <Repeat2 size={16} />
                Try again - same flow
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            {/* Feedback - full-width scorecard once ready, otherwise a prompt card. */}
            {status === 'ready' && feedback?.report ? (
              <FeedbackPanel report={feedback.report} previous={previousReport} />
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-card/30 p-5">
                <h2 className="text-sm font-medium text-muted-foreground">Feedback</h2>
                {analyzing ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Loader2 size={28} className="animate-spin text-brand-light" />
                    <p className="text-sm font-medium">Analyzing your conversation…</p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      This takes a few seconds. You can leave this page - it keeps running
                      and will be here when you come back.
                    </p>
                  </div>
                ) : status === 'error' ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <p className="max-w-xs text-sm text-destructive">
                      Analysis failed{feedback?.error ? `: ${feedback.error}` : ''}.
                    </p>
                    <Button size="lg" variant="outline" onClick={() => generate.mutate()}>
                      <RotateCcw size={16} /> Try again
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Get an AI coach's breakdown of your performance - scores per metric
                      plus advice on what to improve.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => generate.mutate()}
                      disabled={turns.length === 0}
                    >
                      <Sparkles size={16} />
                      Analyze conversation
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Transcript (bottom of the page) */}
            <div className="rounded-2xl border border-white/[0.08] bg-card/30 p-5">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">Transcript</h2>
              <TranscriptFeed turns={turns} autoScroll={false} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
