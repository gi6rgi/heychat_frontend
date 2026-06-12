import { Meter } from "@/components/cinema";
import { useLocale } from "@/i18n";

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
  // German rubric labels are long single-word compounds (e.g.
  // KOMMUNIKATIONSBEREITSCHAFT) with no space to wrap at, so they'd overrun the
  // fixed label column into the meter. lang lets the browser hyphenate them with
  // the right rules even though the page's <html lang> isn't the active locale.
  const locale = useLocale();
  return (
    <div className="flex items-center gap-5">
      <span
        lang={locale}
        className="w-[10rem] shrink-0 hyphens-auto break-words font-mono text-[12px] uppercase tracking-[0.14em] text-paper-dim"
      >
        {label}
      </span>
      <Meter value={value / 10} className="flex-1" />
      <span className="w-7 shrink-0 text-right font-mono text-[14px] tabular-nums text-paper">
        {value.toFixed(0)}
      </span>
    </div>
  );
}
