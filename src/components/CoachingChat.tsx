import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MessagesSquare, Send } from 'lucide-react'
import { useCoachingChat } from '@/hooks/useCoachingChat'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm leading-relaxed break-words',
          isUser
            ? 'rounded-br-sm bg-gradient-to-br from-brand via-brand-dark to-brand-dark text-white'
            : 'rounded-bl-sm border border-white/[0.08] bg-card/80 text-foreground',
        )}
      >
        {text || <span className="opacity-50">…</span>}
      </div>
    </div>
  )
}

export function CoachingChat({ conversationId }: { conversationId: string }) {
  const { messages, streaming, pending, send } = useCoachingChat(conversationId)
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // Keep the chat pinned to the latest message by scrolling the chat container
  // itself — never scrollIntoView, which would also scroll the whole page down
  // to the chat when the conversation page first opens.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streaming])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || pending) return
    setInput('')
    void send(text)
  }

  const empty = messages.length === 0 && streaming === null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-card/30 p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessagesSquare size={16} /> Ask the coach
      </h2>

      <div ref={listRef} className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto">
        {empty && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Ask anything about this conversation — e.g. “How could I have answered the project
            question more concisely?” or “Give me a stronger opening line.”
          </p>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.content} />
        ))}
        {streaming !== null && <Bubble role="assistant" text={streaming} />}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the coach…"
          disabled={pending}
          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
        />
        <Button type="submit" size="icon" disabled={pending || !input.trim()} aria-label="Send">
          <Send size={16} />
        </Button>
      </form>
    </div>
  )
}
