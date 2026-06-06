/**
 * Gapless playback of streamed PCM16 mono 24 kHz audio (the agent's voice).
 *
 * Incoming chunks are scheduled back-to-back as AudioBufferSourceNodes on a
 * shared timeline. On barge-in (the user interrupting), `flush()` stops every
 * queued source so the agent goes silent immediately.
 *
 * Playback is routed through a MediaStreamDestination into an <audio> element
 * rather than straight to AudioContext.destination: browser echo cancellation
 * reliably subtracts media-element output from the mic, but not (on all
 * platforms) raw WebAudio output. Without this, on speakers the model hears
 * its own voice — phantom "user" speech and self-barge-ins. The element also
 * gives us setSinkId on browsers where AudioContext lacks it.
 */
import { getPreferredSpeaker } from './devices'

const PLAYBACK_SAMPLE_RATE = 24000

export class VoicePlayer {
  private ctx: AudioContext
  private dest: MediaStreamAudioDestinationNode
  private el: HTMLAudioElement
  private nextStartTime = 0
  private sources = new Set<AudioBufferSourceNode>()
  private onActiveChange?: (active: boolean) => void

  constructor(onActiveChange?: (active: boolean) => void) {
    this.ctx = new AudioContext()
    this.dest = this.ctx.createMediaStreamDestination()
    this.el = new Audio()
    this.el.srcObject = this.dest.stream
    this.onActiveChange = onActiveChange
    const sink = getPreferredSpeaker()
    if (sink) void this.setSink(sink)
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

    const buffer = this.ctx.createBuffer(1, float32.length, PLAYBACK_SAMPLE_RATE)
    buffer.copyToChannel(float32, 0)

    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    src.connect(this.dest)

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
    this.el.pause()
    this.el.srcObject = null
    await this.ctx.close().catch(() => {})
  }
}
