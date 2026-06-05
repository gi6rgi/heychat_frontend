import { useMemo, useState } from "react";
import { GENRES, SCENES, type Genre } from "@/lib/scenes";
import { Container } from "@/components/cinema";
import { LibraryTopBar } from "@/components/library/LibraryTopBar";
import { PosterCard } from "@/components/library/PosterCard";
import { CreateCard } from "@/components/library/CreateCard";
import { cn } from "@/lib/utils";

type Filter = "ALL" | Genre;

/**
 * Scenario Library, "the poster wall" (brief 3.1).
 * A dark, restrained shell; the colorful poster art carries each scenario's
 * mood. Top bar with genre filters, a responsive grid of the available (not
 * locked) scenes, and a final "Create your own" cell. Posters reveal with a
 * staggered fade+rise.
 */
export default function Library() {
  const [filter, setFilter] = useState<Filter>("ALL");
  // The hovered scene's still slowly fills the page background behind the grid.
  const [hovered, setHovered] = useState<string | null>(null);

  // Only show unlocked scenes; the genre filters track what's actually here.
  const available = useMemo(() => SCENES.filter((s) => !s.locked), []);
  const genres = useMemo(
    () =>
      GENRES.filter(
        (g) => g === "ALL" || available.some((s) => s.genre === g),
      ),
    [available],
  );

  const scenes = useMemo(
    () =>
      filter === "ALL"
        ? available
        : available.filter((s) => s.genre === filter),
    [filter, available],
  );

  return (
    <div className="relative min-h-screen">
      {/* Ambient backdrop: the hovered scene's still fades up behind the posters,
          falling back to the dark shell when nothing is hovered. Stays fixed so
          it fills the whole page (and blurs under the glass top bar). */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {available.map((s) =>
          s.still ? (
            <img
              key={s.slug}
              src={s.still}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-[var(--ease-cinema)]",
                hovered === s.slug ? "opacity-[0.42]" : "opacity-0",
              )}
            />
          ) : null,
        )}
        <div className="absolute inset-0 bg-night/55" />
      </div>

      <div className="relative z-10">
        <LibraryTopBar active={filter} onSelect={setFilter} genres={genres} />

        <Container className="py-12">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {scenes.map((scene, i) => (
              <div
                key={scene.slug}
                className="animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
                onMouseEnter={() => setHovered(scene.slug)}
                onMouseLeave={() =>
                  setHovered((cur) => (cur === scene.slug ? null : cur))
                }
              >
                <PosterCard scene={scene} />
              </div>
            ))}
            <div
              className="animate-rise"
              style={{ animationDelay: `${scenes.length * 60}ms` }}
            >
              <CreateCard />
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
