import { Link } from "react-router-dom";
import { Sparkles, Target } from "lucide-react";
import type { Scenario } from "@/types/api";
import { cn } from "@/lib/utils";

/** Poster-wall treatment for generated scenarios, which have no baked artwork. */
export function PersonalSceneCard({ scenario }: { scenario: Scenario }) {
  const initial = scenario.title.trim().charAt(0).toUpperCase() || "?";

  return (
    <Link to={`/scene/${scenario.id}`} viewTransition className="group block">
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden border border-amber-faint",
          "bg-[radial-gradient(circle_at_50%_28%,rgba(232,163,61,0.22),transparent_34%),linear-gradient(180deg,rgba(242,237,228,0.08),rgba(20,19,17,0.92))]",
          "transition-colors duration-300 ease-[var(--ease-cinema)] group-hover:border-amber",
        )}
      >
        <div
          aria-hidden
          className="absolute inset-x-8 top-8 h-px bg-amber-faint transition-colors duration-300 group-hover:bg-amber-dim"
        />
        <span className="absolute left-0 top-0 inline-flex items-center gap-1.5 bg-amber px-2 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-night">
          <Sparkles aria-hidden className="h-3 w-3" strokeWidth={1.75} />
          Yours
        </span>

        <div className="flex h-full flex-col justify-between p-5 pt-12">
          <div className="flex justify-center pt-5">
            <span className="font-display text-[6rem] font-light leading-none text-paper/90 transition-transform duration-[450ms] ease-[var(--ease-cinema)] group-hover:scale-[1.04]">
              {initial}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-display text-2xl font-light uppercase leading-[0.95] tracking-[-0.02em] text-paper">
              {scenario.title}
            </h3>
            {scenario.description && (
              <p className="line-clamp-3 font-display text-[15px] italic leading-snug text-paper-dim">
                {scenario.description}
              </p>
            )}
            {scenario.goal && (
              <span className="inline-flex items-center gap-1.5 font-label text-[11px] font-medium uppercase tracking-[0.14em] text-amber">
                <Target aria-hidden className="h-3 w-3" strokeWidth={1.75} />
                Goal
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="pt-3">
        <span className="font-label text-[12px] font-medium uppercase tracking-[0.12em] text-paper-dim transition-colors duration-300 ease-[var(--ease-cinema)] group-hover:text-paper">
          CUSTOM · MADE FOR YOU
        </span>
      </div>
    </Link>
  );
}
