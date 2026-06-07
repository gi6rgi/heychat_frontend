import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { type Scene } from "@/lib/scenes";
import { useLocalePath, useT } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * One poster-wall card. The title/tagline are baked into the poster art, so the
 * card only renders the 2:3 image + ONE quiet italic line beneath it: the
 * scene's goal ("Get her phone number"), or the logline for goalless scenes.
 * Tags live on in the data for the filter bar only.
 *  - isNew  → amber small-caps NEW corner tag (top-left).
 *  - locked → dimmed poster, 1px amber outline, UNLOCK label; not a link.
 *  - unlocked → wraps in a <Link> to the scene; hover lifts + brightens meta.
 */
export function PosterCard({ scene }: { scene: Scene }) {
  const t = useT();
  const lp = useLocalePath();
  // Fade the poster in once it has loaded so it doesn't pop (same pattern
  // as CustomPosterCard).
  const [loaded, setLoaded] = useState(false);
  const poster = (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden",
        !scene.locked &&
          "transition-transform duration-[450ms] ease-[var(--ease-cinema)] group-hover:scale-[1.025]",
      )}
    >
      <img
        src={scene.poster}
        alt={t.library.posterAlt(scene.title)}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-[450ms] ease-[var(--ease-cinema)]",
          !loaded ? "opacity-0" : scene.locked ? "opacity-[0.45]" : "opacity-100",
        )}
      />
      {scene.locked && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 border border-amber"
        />
      )}
      {scene.isNew && !scene.locked && (
        <span className="absolute left-0 top-0 bg-amber px-2 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-night">
          {t.library.newTag}
        </span>
      )}
    </div>
  );

  const meta = scene.locked ? (
    <span className="flex items-center gap-1.5 font-label text-[12px] font-medium uppercase tracking-[0.16em] text-amber">
      <Lock aria-hidden className="h-3 w-3" strokeWidth={1.75} />
      {t.library.unlock}
    </span>
  ) : (
    <span
      className={cn(
        // Phones get two lines (cards are full-width, goals read fully);
        // md+ clamps to one so the wall's rows stay even.
        "line-clamp-2 font-display text-xl leading-snug text-paper/90 md:line-clamp-1",
        "transition-colors duration-300 ease-[var(--ease-cinema)] group-hover:text-paper",
      )}
    >
      {scene.goal ?? scene.logline}
    </span>
  );

  if (scene.locked) {
    return (
      <div className="group block">
        {poster}
        <div className="pt-3">{meta}</div>
      </div>
    );
  }

  return (
    <Link to={lp(`/scene/${scene.slug}`)} viewTransition className="group block">
      {poster}
      <div className="pt-3">{meta}</div>
    </Link>
  );
}
