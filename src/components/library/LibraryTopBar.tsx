import { AudioLines } from "lucide-react";
import { GENRES, type Genre } from "@/lib/scenes";
import { TopBar } from "@/components/cinema";
import { HelpButton } from "./HelpButton";
import { cn } from "@/lib/utils";

type Filter = "ALL" | Genre;

/**
 * Library top bar, built on the shared TopBar so it is the same height as every
 * other screen's bar.
 *  LEFT   waveform mark + small-caps wordmark.
 *  CENTER mono genre filter row, active = amber, separators paper-faint.
 *  RIGHT  a 1px square account badge (radius:0, no circle).
 */
export function LibraryTopBar({
  active,
  onSelect,
  genres = GENRES,
}: {
  active: Filter;
  onSelect: (filter: Filter) => void;
  genres?: readonly Filter[];
}) {
  return (
    <TopBar>
      <div className="flex items-center gap-3">
        <AudioLines
          aria-hidden
          className="h-[18px] w-[18px] text-paper"
          strokeWidth={1.5}
        />
        <span className="font-label text-[13px] font-medium uppercase tracking-[0.16em] text-paper">
          HEYCHAT
        </span>
      </div>

      <nav
        aria-label="Filter scenarios by genre"
        className="hidden items-center font-mono text-[13px] tracking-[0.08em] md:flex"
      >
        {genres.map((genre, i) => (
          <span key={genre} className="flex items-center">
            {i > 0 && <span className="px-2.5 text-paper-faint">/</span>}
            <button
              type="button"
              aria-pressed={active === genre}
              onClick={() => onSelect(genre)}
              className={cn(
                "uppercase transition-colors duration-300 ease-[var(--ease-cinema)]",
                active === genre
                  ? "text-amber"
                  : "text-paper-dim hover:text-paper",
              )}
            >
              {genre}
            </button>
          </span>
        ))}
      </nav>

      <HelpButton />
    </TopBar>
  );
}
