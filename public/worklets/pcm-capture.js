// AudioWorklet that converts mono Float32 mic frames into PCM16 (little-endian)
// and posts them to the main thread. The AudioContext is created at 16 kHz, so
// no resampling is needed here — we only quantise to Int16.
class PCMCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input[0]) {
      const channel = input[0] // Float32Array, range [-1, 1]
      const pcm = new Int16Array(channel.length)
      for (let i = 0; i < channel.length; i++) {
        const s = Math.max(-1, Math.min(1, channel[i]))
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      // Transfer the buffer to avoid a copy.
      this.port.postMessage(pcm.buffer, [pcm.buffer])
    }
    return true // keep the processor alive
  }
}

registerProcessor('pcm-capture', PCMCaptureProcessor)
