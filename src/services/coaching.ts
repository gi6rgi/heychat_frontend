import { apiFetch, buildApiUrl } from '@/lib/api-client'
import { getAccessToken } from '@/lib/supabase'
import type { CoachingMessage } from '@/types/api'

export function listChat(id: string): Promise<CoachingMessage[]> {
  return apiFetch<CoachingMessage[]>(`/conversations/${id}/chat`)
}

type StreamHandlers = {
  onDelta: (text: string) => void
  onError?: (message: string) => void
}

/**
 * POST a coaching message and stream the reply (SSE-over-fetch). Uses fetch
 * rather than EventSource because we need the Authorization header.
 */
export async function streamChat(
  id: string,
  content: string,
  { onDelta, onError }: StreamHandlers,
): Promise<void> {
  const token = await getAccessToken()
  const res = await fetch(buildApiUrl(`/conversations/${id}/chat`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  })
  if (!res.ok || !res.body) {
    onError?.(`Request failed (${res.status})`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let sep: number
    // Frames are separated by a blank line: "data: {...}\n\n".
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, sep).trim()
      buf = buf.slice(sep + 2)
      if (!frame.startsWith('data:')) continue
      try {
        const obj = JSON.parse(frame.slice(5).trim())
        if (obj.delta) onDelta(obj.delta)
        else if (obj.error) onError?.(obj.error)
      } catch {
        /* ignore malformed frame */
      }
    }
  }
}
