/**
 * Captures microphone audio and emits raw PCM16 mono 16 kHz chunks.
 *
 * The AudioContext is constructed at 16 kHz so the browser resamples the mic
 * for us; the worklet quantises Float32 -> Int16 (and resamples itself when
 * the browser ignored the requested rate). Chunks are emitted as ArrayBuffers
 * ready to be sent over the WebSocket as binary frames.
 */
import { getPreferredMic } from './devices'

const CAPTURE_SAMPLE_RATE = 16000

/** Root-mean-square amplitude of a PCM16 buffer, normalised to ~0..1. */
function rms(buf: ArrayBuffer): number {
  const pcm = new Int16Array(buf)
  if (pcm.length === 0) return 0
  let sum = 0
  for (let i = 0; i < pcm.length; i++) {
    const v = pcm[i] / 0x8000
    sum += v * v
  }
  return Math.sqrt(sum / pcm.length)
}

export class VoiceRecorder {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private node: AudioWorkletNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private muted = false

  async start(
    onChunk: (buf: ArrayBuffer) => void,
    onLevel?: (level: number) => void,
  ): Promise<void> {
    this.ctx = new AudioContext({ sampleRate: CAPTURE_SAMPLE_RATE })
    if (this.ctx.sampleRate !== CAPTURE_SAMPLE_RATE) {
      // The worklet resamples in this case — log it so a report of degraded
      // audio quality can be traced to this browser/device combination.
      console.warn(
        '[recorder] browser ignored the 16 kHz request (ctx at %d Hz) — resampling in the worklet',
        this.ctx.sampleRate,
      )
    }
    await this.ctx.audioWorklet.addModule('/worklets/pcm-capture.js')

    // start() runs from ws.onopen, i.e. outside the click handler, so the
    // context may be created suspended. A suspended context never renders the
    // graph, so the worklet's process() is never called → no audio captured.
    if (this.ctx.state === 'suspended') await this.ctx.resume()

    this.stream = await navigator.mediaDevices.getUserMedia(
      this.constraints(getPreferredMic()),
    )

    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.node = new AudioWorkletNode(this.ctx, 'pcm-capture')

    let chunkCount = 0
    this.node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (chunkCount === 0) {
        console.debug('[recorder] capture started, ctx.state=%s sampleRate=%d', this.ctx?.state, this.ctx?.sampleRate)
      }
      if (++chunkCount % 50 === 0) {
        console.debug('[recorder] %d chunks captured (last %d bytes)', chunkCount, e.data.byteLength)
      }
      if (this.muted) {
        onLevel?.(0)
        return
      }
      // Report the RMS level of exactly what we send, so the UI meter reflects
      // the audio actually reaching the backend.
      if (onLevel) onLevel(rms(e.data))
      onChunk(e.data)
    }

    this.source.connect(this.node)
    // The worklet has an output port but writes nothing into it, so a browser
    // will only schedule its process() if it has a path to the destination.
    // Connecting it there keeps it alive and stays silent (no echo).
    this.node.connect(this.ctx.destination)
  }

  private constraints(deviceId: string | null): MediaStreamConstraints {
    return {
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // `ideal` (not `exact`) falls back to the system default if the
        // remembered device has been unplugged.
        ...(deviceId ? { deviceId: { ideal: deviceId } } : {}),
      },
    }
  }

  /** Swap the capture stream to another input mid-session. */
  async setDevice(deviceId: string | null): Promise<void> {
    if (!this.ctx || !this.node) return
    const stream = await navigator.mediaDevices.getUserMedia(
      this.constraints(deviceId),
    )
    this.source?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = stream
    this.source = this.ctx.createMediaStreamSource(stream)
    this.source.connect(this.node)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  async stop(): Promise<void> {
    this.node?.port.close()
    this.source?.disconnect()
    this.node?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    await this.ctx?.close().catch(() => {})
    this.ctx = null
    this.stream = null
    this.node = null
    this.source = null
  }
}
