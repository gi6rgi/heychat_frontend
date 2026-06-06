import { useState } from "react";
import { Plus } from "lucide-react";
import { AmberAction } from "@/components/cinema";
import { cn } from "@/lib/utils";
import type { VibeCard } from "@/components/match/matchFlow";

/**
 * One create-flow question: a short prompt and a grid of option tiles that fills
 * the width. Each tile leads with the card's art; click a tile to choose and
 * advance, "Write your own" to type a free answer, or (on optional steps) skip.
 * Same layout on every viewport — the grid collapses to one column on phones.
 */
export function DeckStep({
  title,
  cards,
  required,
  manualPlaceholder,
  onDone,
}: {
  title: string;
  cards: VibeCard[];
  /** When false, a "Skip" affordance is shown and empty answers are allowed. */
  required?: boolean;
  manualPlaceholder: string;
  onDone: (value: string) => void;
}) {
  const [manual, setManual] = useState(false);
  const [draft, setDraft] = useState("");
  // Card art that has finished loading; the rest stays faded out so images
  // ease in instead of popping (same pattern as CustomPosterCard).
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  if (manual) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="font-display text-3xl font-light leading-tight text-paper sm:text-4xl">
          {title}
        </h2>
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={manualPlaceholder}
          className="mt-8 w-full resize-none border-0 border-b border-hairline bg-transparent px-0 py-2 font-display text-xl leading-relaxed text-paper outline-none transition-colors duration-300 placeholder:not-italic placeholder:text-paper-faint focus:border-amber"
        />
        <div className="mt-8 flex items-center gap-8">
          <AmberAction
            size="lg"
            disabled={required && !draft.trim()}
            onClick={() => onDone(draft.trim())}
            className={cn(required && !draft.trim() && "pointer-events-none opacity-40")}
          >
            Continue
          </AmberAction>
          <button
            type="button"
            onClick={() => setManual(false)}
            className="font-label text-[13px] font-medium uppercase tracking-[0.16em] text-paper-faint transition-colors duration-300 ease-[var(--ease-cinema)] hover:text-paper-dim"
          >
            Back to options
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-end justify-between gap-6">
        <h2 className="font-display text-3xl font-light leading-tight text-paper sm:text-4xl">
          {title}
        </h2>
        {!required && (
          <button
            type="button"
            onClick={() => onDone("")}
            className="shrink-0 font-label text-[13px] font-medium uppercase tracking-[0.16em] text-paper-faint transition-colors duration-300 ease-[var(--ease-cinema)] hover:text-paper-dim"
          >
            Skip
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onDone(`${card.title}: ${card.description}`)}
            className="group relative aspect-[4/5] overflow-hidden border border-hairline text-left transition-[scale,border-color] duration-[450ms] ease-[var(--ease-cinema)] hover:scale-[1.025] hover:border-amber"
          >
            <img
              src={card.image}
              alt=""
              loading="lazy"
              onLoad={() => setLoaded((prev) => new Set(prev).add(card.id))}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-[450ms] ease-[var(--ease-cinema)]",
                loaded.has(card.id) ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-night-deep via-night-deep/55 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
              <span className="font-display text-3xl leading-tight text-paper">
                {card.title}
              </span>
              <span className="text-sm leading-snug text-paper-dim">
                {card.description}
              </span>
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setManual(true)}
          className="group relative aspect-[4/5] overflow-hidden border border-hairline text-left transition-[scale,border-color] duration-[450ms] ease-[var(--ease-cinema)] hover:scale-[1.025] hover:border-amber"
        >
          <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
            <Plus aria-hidden className="h-10 w-10 text-amber" strokeWidth={1} />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
            <span className="font-display text-3xl leading-tight text-paper">
              Write your own
            </span>
            <span className="text-sm leading-snug text-paper-dim">
              Put it in your own words instead.
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
