import { cn } from "@/lib/utils";

/** ★★★☆☆ in mono, for the poster metadata line. null → five dim ☆. */
export function Stars({ value, className }: { value: number | null; className?: string }) {
  const filled = value ?? 0;
  return (
    <span
      aria-label={value == null ? "unrated" : `${value} of 5`}
      className={cn("font-mono text-[12px] tracking-[0.1em]", className)}
    >
      <span className="text-amber">{"★".repeat(filled)}</span>
      <span className="text-paper-faint">{"☆".repeat(5 - filled)}</span>
    </span>
  );
}
