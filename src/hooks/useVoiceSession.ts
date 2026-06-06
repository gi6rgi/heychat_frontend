import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getWsBaseUrl } from '@/lib/api-client'
import { getAccessToken } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import { VoicePlayer } from '@/audio/player'
import { VoiceRecorder } from '@/audio/recorder'
import { setPreferredMic, setPreferredSpeaker } from '@/audio/devices'
import type { ServerMessage, Turn } from '@/types/api'

export type SessionStatus = 'idle' | 'connecting' | 'live' | 'ended' | 'error'

const LIMIT_CODES = new Set(['daily_limit', 'capacity', 'concurrent_session'])

/**
 * Drives one voice training session: opens the backend WebSocket, streams mic
 * audio up, plays the agent's audio down, and surfaces live transcripts.
 */
export function useVoiceSession(scenarioId: string | undefined, replayOf?: string | null) {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  // Friendly usage-limit notice (daily budget, session time cap) — rendered
  // as information, not as an error.
  const [limitNotice, setLimitNotice] = useState<string | null>(null)
  // Goal verdict from the persona's end_conversation call; the server closes
  // the session right after the goodbye line plays out.
  const [goalResult, setGoalResult] = useState<{
    outcome: 'success' | 'failure'
    reason: string
  } | null>(null)
  const [transcripts, setTranscripts] = useState<Turn[]>([])
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const [muted, setMuted] = useState(false)
  const [inputLevel, setInputLevel] = useState(0)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const lastLevelTs = useRef(0)

  const wsRef = useRef<WebSocket | null>(null)
  const recorderRef = useRef<VoiceRecorder | null>(null)
  const playerRef = useRef<VoicePlayer | null>(null)
  const stoppingRef = useRef(false)
  // Mirrors goalResult for the ws handlers (their closures see the initial
  // render). Once the verdict arrived, the server tearing the socket down is
  // the NORMAL end of the session — not a connection error.
  const settledRef = useRef(false)
  const turnSeq = useRef(0)

  const appendTranscript = useCallback((role: 'user' | 'agent', text: string) => {
    setTranscripts((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === role) {
        const merged = { ...last, text: last.text + text }
        return [...prev.slice(0, -1), merged]
      }
      return [...prev, { id: `t${turnSeq.current++}`, role, text }]
    })
  }, [])

  const cleanup = useCallback(async () => {
    wsRef.current?.close()
    wsRef.current = null
    await recorderRef.current?.stop()
    recorderRef.current = null
    await playerRef.current?.close()
    playerRef.current = null
  }, [])

  const stop = useCallback(async () => {
    stoppingRef.current = true
    await cleanup()
    setIsAgentSpeaking(false)
    setInputLevel(0)
    setStatus('ended')
    // The transcript is now persisted server-side — refresh the history list.
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations() })
  }, [cleanup, queryClient])

  const start = useCallback(async () => {
    if (!scenarioId || status === 'connecting' || status === 'live') return
    stoppingRef.current = false
    settledRef.current = false
    setError(null)
    setLimitNotice(null)
    setGoalResult(null)
    setTranscripts([])
    setConversationId(null)
    setStatus('connecting')

    try {
      const player = new VoicePlayer(setIsAgentSpeaking)
      await player.resume()
      // The component may have unmounted while we awaited (StrictMode's dev
      // double-mount does exactly this) — abort instead of finishing a session
      // whose player was already torn down by cleanup().
      if (stoppingRef.current) {
        await player.close()
        return
      }
      playerRef.current = player

      const recorder = new VoiceRecorder()
      recorderRef.current = recorder

      const sessionId = crypto.randomUUID()
      // Browsers can't set headers on a WebSocket, so the token goes in the query.
      const token = await getAccessToken()
      if (stoppingRef.current) {
        await cleanup()
        return
      }
      let url =
        `${getWsBaseUrl()}/ws/sessions/${sessionId}` +
        `?scenario_id=${encodeURIComponent(scenarioId)}&token=${encodeURIComponent(token)}`
      if (replayOf) url += `&replay_of=${encodeURIComponent(replayOf)}`
      const ws = new WebSocket(url)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = async () => {
        let sent = 0
        await recorder.start(
          (chunk) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(chunk)
              if (++sent % 50 === 0) console.debug('[ws] sent %d audio frames', sent)
            }
          },
          (level) => {
            // Throttle level updates to ~15fps so we don't re-render per chunk.
            const now = performance.now()
            if (now - lastLevelTs.current >= 66) {
              lastLevelTs.current = now
              setInputLevel(level)
            }
          },
        )
        setStatus('live')
      }

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          playerRef.current?.enqueue(event.data)
          return
        }
        const msg = JSON.parse(event.data as string) as ServerMessage
        switch (msg.type) {
          case 'transcript':
            appendTranscript(msg.role, msg.text)
            break
          case 'interrupted':
            playerRef.current?.flush()
            break
          case 'turn_complete':
            break
          case 'error':
            // Limit rejections arrive right before the server closes the
            // socket — show them as a notice, not a scary error.
            if (msg.code && LIMIT_CODES.has(msg.code)) setLimitNotice(msg.message)
            else setError(msg.message)
            break
          case 'session_limit':
            setLimitNotice(
              'Time flies! This session reached its 10-minute limit. The conversation is saved to your history.',
            )
            break
          case 'goal_result':
            settledRef.current = true
            setGoalResult({ outcome: msg.outcome, reason: msg.reason })
            break
          case 'ready':
            setConversationId(msg.conversation_id)
            break
        }
      }

      ws.onerror = () => {
        // After the goal verdict, the server closes the socket — Safari can
        // surface that as an error event. The session is settled; let onclose
        // land it on 'ended' so the verdict screen shows instead of RETRY.
        if (!stoppingRef.current && !settledRef.current) {
          setError('Connection lost')
          setStatus('error')
        }
      }

      ws.onclose = () => {
        if (!stoppingRef.current) {
          cleanup()
          setStatus((s) => (s === 'error' ? s : 'ended'))
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not access the microphone')
      setStatus('error')
      await cleanup()
    }
  }, [scenarioId, replayOf, status, appendTranscript, cleanup])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      recorderRef.current?.setMuted(next)
      return next
    })
  }, [])

  // Device switches persist the preference AND apply live to the running
  // recorder/player (future sessions pick the preference up on their own).
  const setMicDevice = useCallback((deviceId: string | null) => {
    setPreferredMic(deviceId)
    void recorderRef.current?.setDevice(deviceId)
  }, [])

  const setSpeakerDevice = useCallback((deviceId: string | null) => {
    setPreferredSpeaker(deviceId)
    void playerRef.current?.setSink(deviceId)
  }, [])

  // Tear down on unmount.
  useEffect(() => {
    return () => {
      stoppingRef.current = true
      void cleanup()
    }
  }, [cleanup])

  return {
    status,
    error,
    limitNotice,
    goalResult,
    transcripts,
    isAgentSpeaking,
    muted,
    inputLevel,
    conversationId,
    start,
    stop,
    toggleMute,
    setMicDevice,
    setSpeakerDevice,
  }
}
