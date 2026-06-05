import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The live amber waveform line in the scene view — a thin continuous line that
 * comes alive while someone is speaking and settles to a flat hairline when
 * idle. `active` swells it; `level` (0–1) tracks the actual mic/voice amplitude.
 * Purely decorative — it reflects who's speaking, it isn't a real spectrogram.
 */
export function Waveform({
  active,
  level = 0.5,
  className,
}: {
  active: boolean;
  level?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const phase = useRef(0);
  const amp = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      const mid = h / 2;
      // ease amplitude toward the target so swells/settles are smooth
      const target = active ? 0.35 + 0.65 * Math.min(1, Math.max(0, level)) : 0.04;
      amp.current += (target - amp.current) * 0.08;
      phase.current += reduce ? 0 : 0.05;

      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      const maxA = mid * 0.82;
      for (let x = 0; x <= w; x += 2) {
        const t = x / w;
        // a few detuned sines + an envelope that tapers at both ends
        const env = Math.sin(Math.PI * t);
        const y =
          Math.sin(t * 22 + phase.current) * 0.6 +
          Math.sin(t * 41 - phase.current * 1.7) * 0.3 +
          Math.sin(t * 9 + phase.current * 0.5) * 0.5;
        const yy = mid + y * env * maxA * amp.current;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = "#E8A33D";
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = active ? 0.95 : 0.5;
      ctx.stroke();
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [active, level]);

  return <canvas ref={ref} aria-hidden className={cn("h-8 w-full", className)} />;
}
