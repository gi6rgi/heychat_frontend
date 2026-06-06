// AudioWorklet that converts mono Float32 mic frames into PCM16 (little-endian)
// and posts them to the main thread. The AudioContext is requested at 16 kHz,
// but a browser may ignore that and run at the hardware rate — the backend
// labels our PCM as 16 kHz regardless, so in that case we must resample here
// or the model hears slow-motion garbage.
const TARGET_RATE = 16000

class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    // `sampleRate` is the AudioWorkletGlobalScope global: the ACTUAL context
    // rate, whatever the constructor request was honoured as.
    this.ratio = sampleRate / TARGET_RATE
    this.pos = 0 // fractional read index into the current frame; -1 = `tail`
    this.tail = 0 // last sample of the previous frame, for interpolation
  }

  // Linear resample of one render quantum down to 16 kHz, carrying the
  // fractional read position (and one sample of history) across frames so
  // the output stream stays continuous.
  resample(frame) {
    const out = []
    let pos = this.pos
    while (pos < frame.length - 1) {
      const i = Math.floor(pos)
      const frac = pos - i
      const s0 = i < 0 ? this.tail : frame[i]
      const s1 = frame[i + 1]
      out.push(s0 + (s1 - s0) * frac)
      pos += this.ratio
    }
    this.pos = pos - frame.length
    this.tail = frame[frame.length - 1]
    return out
  }

  process(inputs) {
    const input = inputs[0]
    if (input && input[0]) {
      const channel = this.ratio === 1 ? input[0] : this.resample(input[0])
      if (channel.length > 0) {
        const pcm = new Int16Array(channel.length)
        for (let i = 0; i < channel.length; i++) {
          const s = Math.max(-1, Math.min(1, channel[i]))
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }
        // Transfer the buffer to avoid a copy.
        this.port.postMessage(pcm.buffer, [pcm.buffer])
      }
    }
    return true // keep the processor alive
  }
}

registerProcessor('pcm-capture', PCMCaptureProcessor)
