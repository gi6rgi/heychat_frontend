import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getWsBaseUrl } from '@/lib/api-client'
import { getAccessToken } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import { VoicePlayer } from '@/audio/player'
import { VoiceRecorder } from '@/audio/recorder'
import { setPreferredMic, setPreferredSpeaker } from '@/audio/devices'
import { useLocale, useT } from '@/i18n'
import type { ServerMessage, Turn } from '@/types/api'

export type SessionStatus = 'idle' | 'connecting' | 'live' | 'ended' | 'error'

const LIMIT_CODES = new Set(['daily_limit', 'capacity', 'concurrent_session'])

/**
 * Drives one voice training session: opens the backend WebSocket, streams mic
 * audio up, plays the agent's audio down, and surfaces live transcripts.
 */
export function useVoiceSession(scenarioId: string | undefined, replayOf?: string | null) {
  // The UI language rides along to the backend: it picks the agent's spoken
  // language and the language of the eventual feedback report.
  const locale = useLocale()
  const t = useT()
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
  // Gate mic frames until the server confirms the session ('ready'): audio
  // sent before that would pile up server-side while the voice provider is
  // still connecting and reach the model as one stale burst.
  const readyRef = useRef(false)
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
    readyRef.current = false
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
      // Acquire the microphone BEFORE any backend work. The permission prompt
      // (or a denial) must not happen while a created conversation and a live
      // Gemini session are already burning minutes — and failing here lands in
      // this try/catch, instead of an unhandled rejection inside ws.onopen
      // that left the UI stuck on "connecting" forever. Chunks captured
      // before the socket opens are simply dropped by the readyState guard.
      let sent = 0
      await recorder.start(
        (chunk) => {
          const ws = wsRef.current
          if (ws && ws.readyState === WebSocket.OPEN && readyRef.current) {
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

      const sessionId = crypto.randomUUID()
      // Browsers can't set headers on a WebSocket; the token goes as the FIRST
      // message instead of a query param so the JWT never lands in access logs.
      const token = await getAccessToken()
      if (stoppingRef.current) {
        await cleanup()
        return
      }
      let url =
        `${getWsBaseUrl()}/ws/sessions/${sessionId}` +
        `?scenario_id=${encodeURIComponent(scenarioId)}` +
        `&lang=${locale}`
      if (replayOf) url += `&replay_of=${encodeURIComponent(replayOf)}`
      const ws = new WebSocket(url)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token }))
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
            setLimitNotice(t.live.sessionLimit)
            break
          case 'goal_result':
            settledRef.current = true
            setGoalResult({ outcome: msg.outcome, reason: msg.reason })
            break
          case 'ready':
            readyRef.current = true
            setConversationId(msg.conversation_id)
            break
        }
      }

      ws.onerror = () => {
        // After the goal verdict, the server closes the socket — Safari can
        // surface that as an error event. The session is settled; let onclose
        // land it on 'ended' so the verdict screen shows instead of RETRY.
        if (!stoppingRef.current && !settledRef.current) {
          setError(t.live.connectionLost)
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
      setError(e instanceof Error ? e.message : t.live.micError)
      setStatus('error')
      await cleanup()
    }
  }, [scenarioId, replayOf, status, appendTranscript, cleanup, locale, t])

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
