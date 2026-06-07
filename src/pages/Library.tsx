import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { GENRES, toScene, type Genre } from "@/lib/scenes";
import { sceneImageUrl } from "@/lib/storage";
import { useScenarios } from "@/hooks/useScenarios";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Container } from "@/components/cinema";
import {
  LibraryTopBar,
  type LibraryFilter,
} from "@/components/library/LibraryTopBar";
import { PosterCard } from "@/components/library/PosterCard";
import { CustomPosterCard } from "@/components/library/CustomPosterCard";
import { CreateCard } from "@/components/library/CreateCard";
import { cn } from "@/lib/utils";

/**
 * Scenario Library, "the poster wall" (brief 3.1).
 * A dark, restrained shell; the colorful poster art carries each scenario's
 * mood. Top bar with genre filters, a responsive grid of the available (not
 * locked) scenes, and a final "Create your own" cell. Posters reveal with a
 * staggered fade+rise.
 */
export default function Library() {
  usePageTitle(); // the poster wall keeps the default brand title
  const [filter, setFilter] = useState<LibraryFilter>("ALL");
  // The hovered scene's still slowly fills the page background behind the grid.
  const [hovered, setHovered] = useState<string | null>(null);

  // The whole wall comes from the backend: catalog rows (user_id null) and
  // the user's own created scenes, which show under ALL and have their own
  // YOURS filter. Locked catalog scenes show as dimmed UNLOCK teasers
  // (PosterCard renders them un-clickable); the genre filters track what's
  // actually here.
  const {
    data: scenarios = [],
    isError: scenesLoadFailed,
    isLoading: scenesLoading,
  } = useScenarios();
  const available = useMemo(
    () =>
      scenarios
        .filter((s) => s.user_id === null)
        .map(toScene)
        .sort((a, b) => a.number.localeCompare(b.number)),
    [scenarios],
  );
  const custom = useMemo(
    () => scenarios.filter((s) => s.user_id !== null),
    [scenarios],
  );
  const genres = useMemo<LibraryFilter[]>(
    () => [
      "ALL",
      "YOURS",
      ...GENRES.filter(
        (g): g is Genre => g !== "ALL" && available.some((s) => s.genre === g),
      ),
    ],
    [available],
  );

  const scenes = useMemo(() => {
    if (filter === "YOURS") return [];
    if (filter === "ALL") return available;
    return available.filter((s) => s.genre === filter);
  }, [filter, available]);

  const showCustom = filter === "ALL" || filter === "YOURS";
  const isYoursEmpty =
    filter === "YOURS" &&
    !scenesLoading &&
    !scenesLoadFailed &&
    custom.length === 0;

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
        {custom.map((s) => {
          const still = sceneImageUrl(s.establishing_path);
          return still ? (
            <img
              key={s.id}
              src={still}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-[var(--ease-cinema)]",
                hovered === s.id ? "opacity-[0.42]" : "opacity-0",
              )}
            />
          ) : null;
        })}
        <div className="absolute inset-0 bg-night/55" />
      </div>

      <div className="relative z-10">
        <LibraryTopBar active={filter} onSelect={setFilter} genres={genres} />

        <Container className="py-12">
          {isYoursEmpty && (
            <p className="mb-10 font-display text-xl italic text-paper-dim">
              Nothing of yours on the wall yet. Create your first scene below.
            </p>
          )}
          {scenesLoading ? (
            // The wall hasn't arrived yet; a lone spinner instead of a lone
            // CreateCard, so the posters don't pop in around it.
            <div className="flex animate-rise justify-center py-24">
              <Loader2
                aria-label="Loading scenes"
                className="h-6 w-6 animate-spin text-amber"
                strokeWidth={1.5}
              />
            </div>
          ) : (
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
              {showCustom &&
                custom.map((s, i) => (
                  <div
                    key={s.id}
                    className="animate-rise"
                    style={{ animationDelay: `${(scenes.length + i) * 60}ms` }}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() =>
                      setHovered((cur) => (cur === s.id ? null : cur))
                    }
                  >
                    <CustomPosterCard scenario={s} />
                  </div>
                ))}
              <div
                className="animate-rise"
                style={{
                  animationDelay: `${(scenes.length + (showCustom ? custom.length : 0)) * 60}ms`,
                }}
              >
                <CreateCard />
              </div>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}
