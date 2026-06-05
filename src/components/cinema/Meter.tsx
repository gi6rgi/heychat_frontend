import { cn } from "@/lib/utils";

/**
 * A thin hairline track with an amber fill — used for the rapport meter (live +
 * debrief) and the debrief sub-score rows. `value` is 0–1. `head` adds the small
 * amber dot at the leading edge (the rapport "playhead").
 */
export function Meter({
  value,
  head = false,
  className,
  trackClassName,
}: {
  value: number;
  head?: boolean;
  className?: string;
  trackClassName?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn("relative h-px w-full bg-hairline", trackClassName, className)}>
      <div
        className="absolute inset-y-0 left-0 bg-amber transition-[width] duration-500 ease-[var(--ease-cinema)]"
        style={{ width: `${pct}%` }}
      />
      {head && (
        <div
          className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber transition-[left] duration-500 ease-[var(--ease-cinema)]"
          style={{ left: `${pct}%` }}
        />
      )}
    </div>
  );
}
