import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listChat, streamChat } from '@/services/coaching'
import { queryKeys } from '@/lib/query-keys'
import type { CoachingMessage } from '@/types/api'

/**
 * Loads the persisted coaching chat and sends messages with a streamed reply.
 *
 * The persisted `history` is authoritative; `extra` holds the in-flight pair
 * (just-sent user message + completed assistant reply) until the refetch picks
 * them up, and `streaming` is the assistant text as it arrives (null when idle).
 */
export function useCoachingChat(id: string | undefined) {
  const queryClient = useQueryClient()
  const { data: history } = useQuery({
    queryKey: queryKeys.chat(id),
    queryFn: () => listChat(id!),
    enabled: !!id,
  })

  const [extra, setExtra] = useState<CoachingMessage[]>([])
  const [streaming, setStreaming] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const send = useCallback(
    async (content: string) => {
      if (!id || pending) return
      setPending(true)
      setExtra((prev) => [...prev, { role: 'user', content }])
      setStreaming('')
      let acc = ''
      await streamChat(id, content, {
        onDelta: (t) => {
          acc += t
          setStreaming(acc)
        },
        onError: (e) => {
          acc += acc ? `\n\n[${e}]` : `[${e}]`
          setStreaming(acc)
        },
      })
      setExtra((prev) => [...prev, { role: 'assistant', content: acc }])
      setStreaming(null)
      setPending(false)
      // Adopt the persisted history (now includes this pair), then drop the
      // optimistic copies once the refetch has settled.
      await queryClient.invalidateQueries({ queryKey: queryKeys.chat(id) })
      setExtra([])
    },
    [id, pending, queryClient],
  )

  const messages: CoachingMessage[] = [...(history ?? []), ...extra]
  return { messages, streaming, pending, send }
}
