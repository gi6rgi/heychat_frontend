/**
 * Gapless playback of streamed PCM16 mono 24 kHz audio (the agent's voice).
 *
 * Incoming chunks are coalesced into ~100 ms blocks and scheduled back-to-back
 * as AudioBufferSourceNodes on a shared timeline. One node per block (instead
 * of one per WS frame) keeps the node churn low on mobile, and the first block
 * after silence is scheduled with a small cushion so network jitter lands
 * inside the cushion instead of tearing the stream into clicky fragments.
 *
 * All sources feed a master GainNode. Barge-in (`flush()`) fades the master
 * bus out over ~30 ms and only then stops the sources: a hard stop leaves a
 * waveform discontinuity, and mobile WebKit answered exactly that with a
 * stuck, looping last quantum on every interruption. A silent
 * ConstantSourceNode keeps the graph rendering through the gaps, so the sink
 * never sees the stream go dead.
 *
 * Playback is routed through a MediaStreamDestination into an <audio> element
 * rather than straight to AudioContext.destination: browser echo cancellation
 * reliably subtracts media-element output from the mic, but not (on all
 * platforms) raw WebAudio output. Without this, on speakers the model hears
 * its own voice — phantom "user" speech and self-barge-ins. The element also
 * gives us setSinkId on browsers where AudioContext lacks it. `?rawout=1`
 * bypasses the element (forfeiting those benefits) — a diagnostic switch to
 * tell element-path glitches from context-path ones.
 *
 * Mobile WebKit parks the context in 'interrupted'/'suspended' after a call,
 * notification, route change or screen lock and never resumes it by itself.
 * A state-change hook plus a watchdog (currentTime frozen while 'running')
 * detect that and try to kick the context back into 'running'.
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
/** Barge-in fade: long enough to avoid a discontinuity, short enough to still
 * read as "the agent shut up instantly". */
const FLUSH_FADE_SECONDS = 0.03

export class VoicePlayer {
  private ctx: AudioContext
  private master: GainNode
  private el: HTMLAudioElement | null = null
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
    this.onActiveChange = onActiveChange
    this.master = this.ctx.createGain()

    const rawOut = new URLSearchParams(window.location.search).has('rawout')
    let sink: AudioNode
    if (rawOut) {
      console.warn('[player] rawout: bypassing the <audio> element path')
      sink = this.ctx.destination
    } else {
      const dest = this.ctx.createMediaStreamDestination()
      this.el = new Audio()
      this.el.srcObject = dest.stream
      sink = dest
      const speaker = getPreferredSpeaker()
      if (speaker) void this.setSink(speaker)
    }
    this.master.connect(sink)

    // Constant zero into the sink: the graph keeps rendering through silence,
    // so the sink never sees the stream go dead between utterances.
    const keepAlive = this.ctx.createConstantSource()
    keepAlive.offset.value = 0
    keepAlive.connect(sink)
    keepAlive.start()

    this.ctx.onstatechange = () => {
      const state = this.ctx.state as string
      console.warn('[player] ctx state →', state)
      if (state !== 'running' && state !== 'closed') void this.recover('statechange')
    }
    document.addEventListener('visibilitychange', this.onVisible)

    // Stuck-buffer watchdog: a running context whose currentTime stops
    // advancing means the render thread stalled (audible as a looping tone).
    this.watchdog = window.setInterval(() => {
      const t = this.ctx.currentTime
      if ((this.ctx.state as string) === 'running' && t === this.lastRenderTime) {
        console.error('[player] render stalled at %f', t)
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
    if (this.el) await this.el.play().catch(() => {})
  }

  /** Route playback to an output device; no-op where unsupported. */
  async setSink(deviceId: string | null): Promise<void> {
    const el = this.el as
      | (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> })
      | null
    if (!el?.setSinkId) return
    await el.setSinkId(deviceId ?? '').catch(() => {})
  }

  /** Must be called from a user gesture to satisfy autoplay policies. */
  async resume(): Promise<void> {
    await this.ctx.resume()
    if (this.el) await this.el.play().catch(() => {})
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
    src.connect(this.master)

    const wasIdle = this.sources.size === 0
    const cushion = wasIdle ? PREBUFFER_SECONDS : 0
    const startAt = Math.max(this.ctx.currentTime + cushion, this.nextStartTime)
    if (wasIdle) {
      // Re-arm the master bus after a flush fade. The ramp completes inside
      // the cushion, before the first sample plays; only silence is rendered
      // meanwhile, so it is inaudible.
      const gain = this.master.gain
      gain.cancelScheduledValues(this.ctx.currentTime)
      gain.setValueAtTime(0, this.ctx.currentTime)
      gain.linearRampToValueAtTime(1, startAt)
    }
    src.start(startAt)
    this.nextStartTime = startAt + buffer.duration

    this.sources.add(src)
    if (wasIdle) this.onActiveChange?.(true)

    src.onended = () => {
      this.sources.delete(src)
      if (this.sources.size === 0) this.onActiveChange?.(false)
    }
  }

  /** Stop everything queued or pending (barge-in / interruption): fade the
   * master bus to zero, then stop the sources at the bottom of the fade. */
  flush(): void {
    if (this.partialTimer !== null) {
      clearTimeout(this.partialTimer)
      this.partialTimer = null
    }
    this.pending = []
    this.pendingSamples = 0

    const t = this.ctx.currentTime
    console.debug('[player] flush (barge-in) at %f', t)
    const gain = this.master.gain
    gain.cancelScheduledValues(t)
    gain.setValueAtTime(gain.value, t)
    gain.linearRampToValueAtTime(0, t + FLUSH_FADE_SECONDS)

    for (const src of this.sources) {
      try {
        src.onended = null
        src.stop(t + FLUSH_FADE_SECONDS)
      } catch {
        /* already stopped */
      }
    }
    this.sources.clear()
    this.nextStartTime = 0
    this.onActiveChange?.(false)
  }

  /** Let everything already buffered play out to the end, then resolve.
   *
   * Used on a server-initiated session close (goal settled, time cap): by
   * the time the socket closes, the goodbye line's audio has been fully
   * delivered and sits in the local queue — close() would cut it mid-word.
   * Safe to race with flush()/close(): both empty the source set (or close
   * the context), which ends the wait immediately. The cap is a safety net
   * for a wedged render thread, not an expected path.
   */
  async drain(maxWaitMs = 20000): Promise<void> {
    // Whatever is still coalescing goes out now — no more audio is coming.
    this.schedulePending()
    const deadline = performance.now() + maxWaitMs
    while (
      this.sources.size > 0 &&
      (this.ctx.state as string) !== 'closed' &&
      performance.now() < deadline
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  async close(): Promise<void> {
    clearInterval(this.watchdog)
    document.removeEventListener('visibilitychange', this.onVisible)
    this.ctx.onstatechange = null
    this.flush()
    this.el?.pause()
    if (this.el) this.el.srcObject = null
    await this.ctx.close().catch(() => {})
  }
}
