import { useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Hourglass,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  Repeat2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useScenario } from '@/hooks/useScenarios'
import { useVoiceSession } from '@/hooks/useVoiceSession'
import { useAmbience } from '@/hooks/useAmbience'
import { scenarioAmbience } from '@/audio/ambience'
import { MicOrb } from '@/components/voice/MicOrb'
import { MicLevelMeter } from '@/components/voice/MicLevelMeter'
import { TranscriptFeed } from '@/components/voice/TranscriptFeed'
import { Button } from '@/components/ui/button'

const STATUS_LABEL: Record<string, string> = {
  idle: 'Ready to start',
  connecting: 'Connecting…',
  live: 'Live',
  ended: 'Conversation ended',
  error: 'Error',
}

export default function Session() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const replayOf = searchParams.get('replay_of')
  const { data: scenario } = useScenario(scenarioId)
  const {
    status,
    error,
    limitNotice,
    transcripts,
    isAgentSpeaking,
    muted,
    inputLevel,
    conversationId,
    start,
    stop,
    toggleMute,
  } = useVoiceSession(scenarioId, replayOf)

  const [ambienceOn, setAmbienceOn] = useState(true)
  useAmbience(ambienceOn ? scenarioAmbience(scenarioId) : 'none', status === 'live')

  const live = status === 'live'
  const connecting = status === 'connecting'

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> All scenarios
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: scenario + orb + controls */}
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/[0.08] bg-card/50 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{scenario?.title ?? '…'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{scenario?.description}</p>
            {replayOf && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-light">
                <Repeat2 size={13} />
                Replaying your last attempt — same flow
              </span>
            )}
          </div>

          <MicOrb status={status} isAgentSpeaking={isAgentSpeaking} muted={muted} />

          {live && <MicLevelMeter level={inputLevel} active={!muted} />}

          <div className="flex items-center gap-2 text-sm">
            <span
              className={`size-2 rounded-full ${live ? 'animate-pulse bg-brand' : 'bg-muted-foreground/50'}`}
            />
            <span className="text-muted-foreground">{STATUS_LABEL[status]}</span>
          </div>

          {limitNotice && (
            <p className="flex max-w-sm items-start gap-2 rounded-xl border border-brand/30 bg-brand/10 px-3.5 py-2.5 text-sm text-brand-light">
              <Hourglass size={15} className="mt-0.5 shrink-0" />
              {limitNotice}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            {!live && !connecting && (
              <Button size="xl" onClick={start} disabled={!scenario}>
                <Play size={18} />
                {status === 'ended' ? 'Start over' : 'Start conversation'}
              </Button>
            )}

            {status === 'ended' && conversationId && (
              <Link to={`/history/${conversationId}`}>
                <Button size="xl" variant="outline">
                  <FileText size={18} />
                  View transcript
                </Button>
              </Link>
            )}

            {(live || connecting) && (
              <>
                <Button
                  size="icon-lg"
                  variant={muted ? 'secondary' : 'outline'}
                  onClick={toggleMute}
                  disabled={!live}
                  aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {muted ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>
                <Button
                  size="icon-lg"
                  variant={ambienceOn ? 'outline' : 'secondary'}
                  onClick={() => setAmbienceOn((v) => !v)}
                  aria-label={ambienceOn ? 'Turn off background noise' : 'Turn on background noise'}
                >
                  {ambienceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </Button>
                <Button size="xl" variant="destructive" onClick={stop}>
                  <PhoneOff size={18} />
                  End
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Right: live transcript */}
        <div className="flex max-h-[70vh] flex-col overflow-y-auto rounded-2xl border border-white/[0.08] bg-card/30 p-5">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">Transcript</h2>
          <TranscriptFeed turns={transcripts} />
        </div>
      </div>
    </div>
  )
}
