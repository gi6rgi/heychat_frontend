import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Diegetic projector timer — counts up mm:ss in serif (font-display), paper.
 * Starts ticking when `running` flips true and freezes (holding its value) when
 * it goes false, so the elapsed time survives into the 'ended' beat.
 */
export function SceneTimer({
  running,
  className,
}: {
  running: boolean;
  className?: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const base = useRef(0);

  useEffect(() => {
    if (!running) {
      start.current = null;
      return;
    }
    start.current = performance.now();
    let raf = 0;
    const tick = () => {
      if (start.current != null) {
        setElapsed(base.current + (performance.now() - start.current) / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (start.current != null) {
        base.current += (performance.now() - start.current) / 1000;
      }
    };
  }, [running]);

  const total = Math.floor(elapsed);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");

  return (
    <span
      className={cn(
        "font-display text-3xl leading-none text-paper tabular-nums",
        className,
      )}
    >
      {mm}:{ss}
    </span>
  );
}
