/**
 * Gapless playback of streamed PCM16 mono 24 kHz audio (the agent's voice).
 *
 * Incoming chunks are coalesced into ~100 ms blocks and scheduled back-to-back
 * as AudioBufferSourceNodes on a shared timeline. One node per block (instead
 * of one per WS frame) keeps the node churn low on mobile, and the first block
 * after silence is scheduled with a small cushion so network jitter lands
 * inside the cushion instead of tearing the stream into clicky fragments. On
 * barge-in (the user interrupting), `flush()` stops every queued source so the
 * agent goes silent immediately.
 *
 * Playback is routed through a MediaStreamDestination into an <audio> element
 * rather than straight to AudioContext.destination: browser echo cancellation
 * reliably subtracts media-element output from the mic, but not (on all
 * platforms) raw WebAudio output. Without this, on speakers the model hears
 * its own voice — phantom "user" speech and self-barge-ins. The element also
 * gives us setSinkId on browsers where AudioContext lacks it.
 *
 * Mobile WebKit parks the context in 'interrupted'/'suspended' after a call,
 * notification, route change or screen lock and never resumes it by itself —
 * sometimes looping the last rendered quantum as a stuck monotone tone. A
 * state-change hook plus a watchdog (currentTime frozen while sources are
 * queued) detect both and try to kick the context back into 'running'.
 */
import { getPreferredSpeaker } from './devices'

const PLAYBACK_SAMPLE_RATE = 24000
/** Coalesce incoming chunks into blocks of at least this many seconds. */
const MIN_BLOCK_SECONDS = 0.1
/** Cushion scheduled ahead of the first block after silence (utterance start
 * or underrun) so a late next chunk doesn't open an audible gap. */
const PREBUFFER_SECONDS = 0.15
/** How long to wait for more audio before scheduling a partial block — the
 * tail of an utterance never fills MIN_BLOCK_SECONDS on its own. */
const PARTIAL_FLUSH_MS = 60

export class VoicePlayer {
  private ctx: AudioContext
  private dest: MediaStreamAudioDestinationNode
  private el: HTMLAudioElement
  private nextStartTime = 0
  private sources = new Set<AudioBufferSourceNode>()
  private onActiveChange?: (active: boolean) => void
  private pending: Float32Array[] = []
  private pendingSamples = 0
  private partialTimer: number | null = null
  private watchdog: number
  private lastRenderTime = -1
  private onVisible = () => {
    if (!document.hidden) void this.recover('visibilitychange')
  }

  constructor(onActiveChange?: (active: boolean) => void) {
    this.ctx = new AudioContext()
    this.dest = this.ctx.createMediaStreamDestination()
    this.el = new Audio()
    this.el.srcObject = this.dest.stream
    this.onActiveChange = onActiveChange
    const sink = getPreferredSpeaker()
    if (sink) void this.setSink(sink)

    this.ctx.onstatechange = () => {
      const state = this.ctx.state as string
      console.warn('[player] ctx state →', state)
      if (state !== 'running' && state !== 'closed') void this.recover('statechange')
    }
    document.addEventListener('visibilitychange', this.onVisible)

    // Stuck-buffer watchdog: when the render thread stalls, currentTime stops
    // advancing while sources are queued (audible as a looping monotone tone).
    this.watchdog = window.setInterval(() => {
      const t = this.ctx.currentTime
      if (this.sources.size > 0 && t === this.lastRenderTime) {
        console.error('[player] render stalled at %f (state=%s)', t, this.ctx.state)
        void this.recover('watchdog')
      }
      this.lastRenderTime = t
    }, 500)
  }

  /** Try to get a non-running / stalled context rendering again. May fail
   * outside a user gesture; harmless — the watchdog retries every tick. */
  private async recover(why: string): Promise<void> {
    if ((this.ctx.state as string) === 'closed') return
    console.warn('[player] recover (%s)', why)
    await this.ctx.resume().catch(() => {})
    await this.el.play().catch(() => {})
  }

  /** Route playback to an output device; no-op where unsupported. */
  async setSink(deviceId: string | null): Promise<void> {
    const el = this.el as HTMLAudioElement & {
      setSinkId?: (id: string) => Promise<void>
    }
    if (!el.setSinkId) return
    await el.setSinkId(deviceId ?? '').catch(() => {})
  }

  /** Must be called from a user gesture to satisfy autoplay policies. */
  async resume(): Promise<void> {
    await this.ctx.resume()
    await this.el.play().catch(() => {})
  }

  enqueue(pcm: ArrayBuffer): void {
    const int16 = new Int16Array(pcm)
    if (int16.length === 0) return

    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000

    this.pending.push(float32)
    this.pendingSamples += float32.length

    if (this.pendingSamples >= MIN_BLOCK_SECONDS * PLAYBACK_SAMPLE_RATE) {
      this.schedulePending()
    } else {
      if (this.partialTimer !== null) clearTimeout(this.partialTimer)
      this.partialTimer = window.setTimeout(
        () => this.schedulePending(),
        PARTIAL_FLUSH_MS,
      )
    }
  }

  private schedulePending(): void {
    if (this.partialTimer !== null) {
      clearTimeout(this.partialTimer)
      this.partialTimer = null
    }
    if (this.pendingSamples === 0) return

    const block = new Float32Array(this.pendingSamples)
    let offset = 0
    for (const chunk of this.pending) {
      block.set(chunk, offset)
      offset += chunk.length
    }
    this.pending = []
    this.pendingSamples = 0

    const buffer = this.ctx.createBuffer(1, block.length, PLAYBACK_SAMPLE_RATE)
    buffer.copyToChannel(block, 0)

    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    src.connect(this.dest)

    const wasIdle = this.sources.size === 0
    const cushion = wasIdle ? PREBUFFER_SECONDS : 0
    const startAt = Math.max(this.ctx.currentTime + cushion, this.nextStartTime)
    src.start(startAt)
    this.nextStartTime = startAt + buffer.duration

    this.sources.add(src)
    if (wasIdle) this.onActiveChange?.(true)

    src.onended = () => {
      this.sources.delete(src)
      if (this.sources.size === 0) this.onActiveChange?.(false)
    }
  }

  /** Stop everything queued or pending (barge-in / interruption). */
  flush(): void {
    if (this.partialTimer !== null) {
      clearTimeout(this.partialTimer)
      this.partialTimer = null
    }
    this.pending = []
    this.pendingSamples = 0
    for (const src of this.sources) {
      try {
        src.onended = null
        src.stop()
      } catch {
        /* already stopped */
      }
    }
    this.sources.clear()
    this.nextStartTime = 0
    this.onActiveChange?.(false)
  }

  async close(): Promise<void> {
    clearInterval(this.watchdog)
    document.removeEventListener('visibilitychange', this.onVisible)
    this.ctx.onstatechange = null
    this.flush()
    this.el.pause()
    this.el.srcObject = null
    await this.ctx.close().catch(() => {})
  }
}
