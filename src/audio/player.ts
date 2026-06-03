/**
 * Gapless playback of streamed PCM16 mono 24 kHz audio (the agent's voice).
 *
 * Incoming chunks are scheduled back-to-back as AudioBufferSourceNodes on a
 * shared timeline. On barge-in (the user interrupting), `flush()` stops every
 * queued source so the agent goes silent immediately.
 */
const PLAYBACK_SAMPLE_RATE = 24000

export class VoicePlayer {
  private ctx: AudioContext
  private nextStartTime = 0
  private sources = new Set<AudioBufferSourceNode>()
  private onActiveChange?: (active: boolean) => void

  constructor(onActiveChange?: (active: boolean) => void) {
    this.ctx = new AudioContext()
    this.onActiveChange = onActiveChange
  }

  /** Must be called from a user gesture to satisfy autoplay policies. */
  async resume(): Promise<void> {
    await this.ctx.resume()
  }

  enqueue(pcm: ArrayBuffer): void {
    const int16 = new Int16Array(pcm)
    if (int16.length === 0) return

    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000

    const buffer = this.ctx.createBuffer(1, float32.length, PLAYBACK_SAMPLE_RATE)
    buffer.copyToChannel(float32, 0)

    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    src.connect(this.ctx.destination)

    const startAt = Math.max(this.ctx.currentTime, this.nextStartTime)
    src.start(startAt)
    this.nextStartTime = startAt + buffer.duration

    const wasIdle = this.sources.size === 0
    this.sources.add(src)
    if (wasIdle) this.onActiveChange?.(true)

    src.onended = () => {
      this.sources.delete(src)
      if (this.sources.size === 0) this.onActiveChange?.(false)
    }
  }

  /** Stop everything currently queued (barge-in / interruption). */
  flush(): void {
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
    this.flush()
    await this.ctx.close().catch(() => {})
  }
}
