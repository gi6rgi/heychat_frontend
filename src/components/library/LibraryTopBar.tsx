import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { GENRES, type Genre } from "@/lib/scenes";
import { TopBar } from "@/components/cinema";
import { HelpButton } from "./HelpButton";
import { cn } from "@/lib/utils";

export type LibraryFilter = "ALL" | "YOURS" | Genre;
const DEFAULT_FILTERS: LibraryFilter[] = ["ALL", "YOURS", ...GENRES.filter((g) => g !== "ALL")];

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
  genres = DEFAULT_FILTERS,
}: {
  active: LibraryFilter;
  onSelect: (filter: LibraryFilter) => void;
  genres?: readonly LibraryFilter[];
}) {
  // The genre row doesn't fit below md; a square toggle next to the help
  // button drops the same filters in a row under the bar instead.
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <TopBar>
      <div className="flex items-center gap-3">
        <img
          src="/android-chrome-192x192.png"
          alt=""
          className="h-[28px] w-[28px] rounded-full"
        />
        <span className="font-display text-[17px] text-paper [font-variation-settings:'opsz'_40,'SOFT'_30,'WONK'_0]">
          HeyScenes
        </span>
      </div>

      <nav
        aria-label="Filter scenarios by genre"
        className="hidden items-center font-label text-[13px] font-medium tracking-[0.14em] md:flex"
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Filter scenes"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((o) => !o)}
          className={cn(
            "flex h-7 w-7 items-center justify-center border transition-colors duration-300 ease-[var(--ease-cinema)] md:hidden",
            filtersOpen || active !== "ALL"
              ? "border-amber text-amber"
              : "border-hairline text-paper-dim hover:border-paper-dim hover:text-paper",
          )}
        >
          <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <HelpButton />
      </div>

      {/* mobile filter row: hangs right under the (sticky) bar, same chips
          as the desktop center nav, closes once a filter is picked */}
      {filtersOpen && (
        <nav
          aria-label="Filter scenarios by genre"
          className="absolute inset-x-0 top-full flex flex-wrap gap-x-5 gap-y-3 border-b border-hairline bg-night px-6 py-4 font-label text-[13px] font-medium tracking-[0.14em] md:hidden"
        >
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              aria-pressed={active === genre}
              onClick={() => {
                onSelect(genre);
                setFiltersOpen(false);
              }}
              className={cn(
                "uppercase transition-colors duration-300 ease-[var(--ease-cinema)]",
                active === genre
                  ? "text-amber"
                  : "text-paper-dim hover:text-paper",
              )}
            >
              {genre}
            </button>
          ))}
        </nav>
      )}
    </TopBar>
  );
}
