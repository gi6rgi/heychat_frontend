import { Meter } from "@/components/cinema";

/**
 * One sub-score line in the debrief right column: a small-caps/mono label, a thin
 * amber <Meter>, and the mono value out of ten — CONFIDENCE / LISTENING / WIT /
 * TIMING. Numbers are mono; the label rides the same baseline grid.
 */
export function SubScoreRow({
  label,
  value,
}: {
  label: string;
  /** 0–10 */
  value: number;
}) {
  return (
    <div className="flex items-center gap-5">
      <span className="w-[5.5rem] shrink-0 font-mono text-[12px] uppercase tracking-[0.14em] text-paper-dim">
        {label}
      </span>
      <Meter value={value / 10} className="flex-1" />
      <span className="w-7 shrink-0 text-right font-mono text-[14px] tabular-nums text-paper">
        {value.toFixed(0)}
      </span>
    </div>
  );
}
