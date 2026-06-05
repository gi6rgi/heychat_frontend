import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Kicker } from "@/components/cinema";

/** One sampled rapport reading: t = seconds into the scene, v = rapport 0..1. */
export type RapportPoint = { t: number; v: number };

/** An annotated moment pinned to the curve (the best line, the fumble). */
export type RapportMark = {
  /** seconds into the scene — must fall inside the sampled range */
  t: number;
  /** mono label, e.g. "BEST LINE 02:14" */
  label: string;
  /** short italic serif quote shown beside the dot */
  quote: string;
  /** cream dot for a high point, amber dot for the dip */
  tone: "paper" | "amber";
};

/* ---- fixed SVG viewBox; the chart scales fluidly to its container ---- */
const W = 1000;
const H = 300;
const PAD = { l: 8, r: 8, t: 28, b: 36 };
const PLOT = { w: W - PAD.l - PAD.r, h: H - PAD.t - PAD.b };

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * RAPPORT OVER TIME — the shareable artifact of the debrief. A single thin amber
 * curve over a faint hairline grid, mono time marks along the x-axis, and two
 * annotated dots (a cream high point + an amber dip) each with an italic serif
 * quote. The curve draws in left→right on load; annotations fade in after.
 */
export function RapportChart({
  points,
  marks,
  duration,
}: {
  points: RapportPoint[];
  marks: RapportMark[];
  /** total scene length in seconds — the x-axis maps 0..duration */
  duration: number;
}) {
  const reduce = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  const [drawn, setDrawn] = useState(false);

  const x = (t: number) => PAD.l + (t / duration) * PLOT.w;
  const y = (v: number) => PAD.t + (1 - Math.max(0, Math.min(1, v))) * PLOT.h;

  // smooth Catmull-Rom → cubic-bezier curve through the sampled points
  const d = buildPath(points.map((p) => ({ x: x(p.t), y: y(p.v) })));

  // value at an arbitrary t, linearly interpolated, for placing the dots
  const valueAt = (t: number) => {
    if (points.length === 0) return 0.5;
    if (t <= points[0].t) return points[0].v;
    for (let i = 1; i < points.length; i++) {
      if (t <= points[i].t) {
        const a = points[i - 1];
        const b = points[i];
        const f = (t - a.t) / (b.t - a.t || 1);
        return a.v + (b.v - a.v) * f;
      }
    }
    return points[points.length - 1].v;
  };

  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    setLen(p.getTotalLength());
    if (reduce) {
      setDrawn(true);
      return;
    }
    // next frame so the dashoffset starts at full length before transitioning
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, [reduce, d]);

  // even time marks across the axis (start … end, four ticks)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * duration);

  return (
    <section aria-label="Rapport over time">
      <Kicker as="h2">Rapport Over Time</Kicker>

      <div className="mt-5 w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          style={{ height: "auto" }}
          role="img"
          aria-label="A line showing rapport rising, peaking near the best line, then dipping at the fumble before recovering."
          preserveAspectRatio="none"
        >
          {/* faint horizontal grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={PAD.l}
              x2={W - PAD.r}
              y1={PAD.t + g * PLOT.h}
              y2={PAD.t + g * PLOT.h}
              stroke="var(--color-hairline-soft)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* baseline (slightly stronger) */}
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={PAD.t + PLOT.h}
            y2={PAD.t + PLOT.h}
            stroke="var(--color-hairline)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          {/* faint vertical guides at each annotated moment */}
          {marks.map((m) => (
            <line
              key={`g-${m.t}`}
              x1={x(m.t)}
              x2={x(m.t)}
              y1={PAD.t}
              y2={PAD.t + PLOT.h}
              stroke="var(--color-hairline-soft)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* the rapport curve — draws in left→right via stroke-dashoffset */}
          <path
            ref={pathRef}
            d={d}
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{
              strokeDasharray: len || undefined,
              strokeDashoffset: drawn ? 0 : len || undefined,
              transition: reduce
                ? undefined
                : "stroke-dashoffset 700ms var(--ease-cinema)",
            }}
          />

          {/* annotated dots — fade in after the curve has drawn */}
          {marks.map((m, i) => {
            const cx = x(m.t);
            const cy = y(valueAt(m.t));
            const amber = m.tone === "amber";
            return (
              <motion.g
                key={m.label}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: reduce ? 0 : 0.75 + i * 0.12,
                }}
              >
                {/* outer ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill="none"
                  stroke={amber ? "var(--color-amber)" : "var(--color-paper)"}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                {/* core dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={2.2}
                  fill={amber ? "var(--color-amber)" : "var(--color-paper)"}
                />
              </motion.g>
            );
          })}

          {/* mono time marks along the x-axis */}
          {ticks.map((t, i) => (
            <text
              key={t}
              x={i === 0 ? PAD.l : i === ticks.length - 1 ? W - PAD.r : x(t)}
              y={H - 12}
              fill="var(--color-paper-faint)"
              fontFamily="var(--font-mono)"
              fontSize={13}
              textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
            >
              {mmss(t)}
            </text>
          ))}
        </svg>
      </div>

      {/* annotation legend — italic serif quotes beside each labelled moment */}
      <div className="mt-7 grid gap-x-12 gap-y-6 sm:grid-cols-2">
        {marks.map((m, i) => (
          <motion.figure
            key={m.label}
            className="flex gap-4"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              ease: "easeOut",
              delay: reduce ? 0 : 0.85 + i * 0.12,
            }}
          >
            <span
              aria-hidden
              className={
                "mt-[7px] size-1.5 shrink-0 rounded-full " +
                (m.tone === "amber" ? "bg-amber" : "bg-paper")
              }
            />
            <div>
              <div className="font-mono text-[12px] tracking-[0.12em] text-paper-dim">
                {m.label}
              </div>
              <blockquote className="mt-1.5 font-display text-[18px] italic leading-snug text-paper">
                “{m.quote}”
              </blockquote>
            </div>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/** Smooth a polyline into a cubic-bezier path (Catmull-Rom → Bézier). */
function buildPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}
