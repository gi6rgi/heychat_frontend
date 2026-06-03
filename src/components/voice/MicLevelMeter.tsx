interface MicLevelMeterProps {
  /** RMS level ~0..1 of the audio being sent to the backend. */
  level: number
  active: boolean
}

const SEGMENTS = 14

/** Segmented bar that lights up with the mic input actually reaching the server.
 * If you speak and nothing lights up, audio is NOT being captured/sent. */
export function MicLevelMeter({ level, active }: MicLevelMeterProps) {
  // RMS of speech is small (~0.05–0.3); scale up and clamp for a lively meter.
  const scaled = Math.min(1, level * 6)
  const lit = active ? Math.round(scaled * SEGMENTS) : 0

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-1.5">
      <div className="flex h-3 w-full items-stretch gap-0.5">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const on = i < lit
          return (
            <div
              key={i}
              className={`flex-1 rounded-[2px] transition-colors duration-75 ${
                on
                  ? i > SEGMENTS - 3
                    ? 'bg-destructive'
                    : 'bg-brand'
                  : 'bg-white/[0.06]'
              }`}
            />
          )
        })}
      </div>
      <span className="text-[11px] text-muted-foreground">
        {active ? 'Mic input' : 'Mic off'}
      </span>
    </div>
  )
}
