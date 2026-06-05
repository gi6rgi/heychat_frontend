import { cn } from "@/lib/utils";

/**
 * The diegetic mic / ambience control — the ONE place a radius is allowed in the
 * design (size-12 circle, 1px hairline, hover → amber). `on` lights the border
 * + glyph amber to reflect active state. Optional small-caps label beneath.
 */
export function RoundButton({
  on = false,
  label,
  onClick,
  children,
  ariaLabel,
}: {
  on?: boolean;
  label?: string;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-pressed={on}
        onClick={onClick}
        className={cn(
          "flex size-12 items-center justify-center rounded-full border transition-colors duration-300 ease-[var(--ease-cinema)]",
          on
            ? "border-amber text-amber"
            : "border-hairline text-paper-dim hover:border-amber hover:text-amber",
        )}
      >
        {children}
      </button>
      {label ? (
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.16em] text-paper-faint">
          {label}
        </span>
      ) : null}
    </div>
  );
}
