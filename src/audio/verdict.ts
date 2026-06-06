/**
 * Procedural goal-verdict stingers (Web Audio, no assets).
 *
 * Played the moment the goal_result message lands — the character is usually
 * still speaking its closing line, so both cues are deliberately quiet and
 * short: they layer under the voice like a game UI cue, not over it.
 *
 *   success  warm ascending major triad chime with a soft octave shimmer
 *   failure  two muted descending tones, dark and brief
 */

function note(
  ctx: AudioContext,
  out: AudioNode,
  freq: number,
  at: number,
  peak: number,
  seconds: number,
  type: OscillatorType,
): void {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(peak, at + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds)
  osc.connect(gain)
  gain.connect(out)
  osc.start(at)
  osc.stop(at + seconds + 0.05)
}

export function playVerdictSound(outcome: 'success' | 'failure'): void {
  const ctx = new AudioContext()

  // Soften the top end so the stinger sits behind the voice.
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 4200
  lp.connect(ctx.destination)

  const t = ctx.currentTime + 0.02
  if (outcome === 'success') {
    // C5 → E5 → G5, each note a triangle body + a quiet sine an octave up.
    const steps: Array<[number, number]> = [
      [523.25, 0],
      [659.25, 0.1],
      [783.99, 0.2],
    ]
    for (const [freq, delay] of steps) {
      note(ctx, lp, freq, t + delay, 0.28, 1.1, 'triangle')
      note(ctx, lp, freq * 2, t + delay + 0.01, 0.08, 0.9, 'sine')
    }
  } else {
    // A3 → F3, muted and brief — a quiet "scene over", not a buzzer.
    note(ctx, lp, 220.0, t, 0.22, 0.5, 'sine')
    note(ctx, lp, 174.61, t + 0.16, 0.2, 0.7, 'sine')
  }

  // One-shot context: let the tail ring out, then release the hardware.
  setTimeout(() => void ctx.close().catch(() => {}), 2200)
}
