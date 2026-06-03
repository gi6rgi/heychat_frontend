/**
 * Procedural background ambience for practice sessions (Web Audio, no assets).
 *
 * A looping brown-noise bed is shaped with high/low-pass filters into a subtle
 * "room tone"; livelier scenarios add a slow gain swell to suggest a murmuring
 * crowd. It plays only in the browser for immersion — it is never sent to the
 * agent nor mixed into the recording.
 */
export type Ambience = 'bar' | 'cafe' | 'office' | 'room' | 'none'

/** Map a scenario to an ambience character. */
export function scenarioAmbience(scenarioId: string | undefined): Ambience {
  switch (scenarioId) {
    case 'flirt-bar':
      return 'bar'
    case 'small-talk':
      return 'cafe'
    case 'job-interview':
      return 'office'
    default:
      return 'room'
  }
}

type Preset = { gain: number; highpass: number; lowpass: number; swell: boolean }

const PRESETS: Record<Exclude<Ambience, 'none'>, Preset> = {
  bar: { gain: 0.1, highpass: 200, lowpass: 3500, swell: true },
  cafe: { gain: 0.07, highpass: 250, lowpass: 3000, swell: true },
  office: { gain: 0.045, highpass: 40, lowpass: 700, swell: false },
  room: { gain: 0.05, highpass: 50, lowpass: 1200, swell: false },
}

function brownNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  return buf
}

export class AmbiencePlayer {
  private ctx: AudioContext | null = null
  private src: AudioBufferSourceNode | null = null
  private gain: GainNode | null = null
  private lfo: OscillatorNode | null = null

  async start(kind: Ambience): Promise<void> {
    if (kind === 'none') return
    const preset = PRESETS[kind]
    const ctx = new AudioContext()
    if (ctx.state === 'suspended') await ctx.resume()

    const src = ctx.createBufferSource()
    src.buffer = brownNoiseBuffer(ctx, 4)
    src.loop = true

    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = preset.highpass
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = preset.lowpass

    const gain = ctx.createGain()
    gain.gain.value = 0
    src.connect(hp)
    hp.connect(lp)
    lp.connect(gain)
    gain.connect(ctx.destination)
    src.start()

    // Fade in so it doesn't pop.
    gain.gain.linearRampToValueAtTime(preset.gain, ctx.currentTime + 1.2)

    // Slow swell for crowd-like scenes.
    if (preset.swell) {
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.12
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = preset.gain * 0.4
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()
      this.lfo = lfo
    }

    this.ctx = ctx
    this.src = src
    this.gain = gain
  }

  async stop(): Promise<void> {
    const ctx = this.ctx
    const now = ctx?.currentTime ?? 0
    try {
      this.gain?.gain.linearRampToValueAtTime(0, now + 0.3)
      this.src?.stop(now + 0.35)
      this.lfo?.stop(now + 0.35)
    } catch {
      /* already stopped */
    }
    this.src = null
    this.gain = null
    this.lfo = null
    this.ctx = null
    if (ctx) setTimeout(() => void ctx.close().catch(() => {}), 450)
  }
}
