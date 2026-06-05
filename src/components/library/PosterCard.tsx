import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { type Scene } from "@/lib/scenes";
import { cn } from "@/lib/utils";

/** Faint dot separator for the metadata line. */
function Dot() {
  return <span className="px-1.5 text-paper-faint">·</span>;
}

/**
 * One poster-wall card. The title/tagline are baked into the poster art, so the
 * card only renders the 2:3 image + ONE small-caps tag line beneath it
 * (`DATING · DAYTIME · EASY`), matching the validated poster-wall reference.
 *  - isNew  → amber small-caps NEW corner tag (top-left).
 *  - locked → dimmed poster, 1px amber outline, UNLOCK label; not a link.
 *  - unlocked → wraps in a <Link> to the scene; hover lifts + brightens meta.
 */
export function PosterCard({ scene }: { scene: Scene }) {
  // Fade the poster in once it has loaded so it doesn't pop (same pattern
  // as CustomPosterCard).
  const [loaded, setLoaded] = useState(false);
  const poster = (
    <div className="relative aspect-[2/3] overflow-hidden">
      <img
        src={scene.poster}
        alt={`${scene.title} poster`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-[opacity,transform] duration-[450ms] ease-[var(--ease-cinema)]",
          !loaded ? "opacity-0" : scene.locked ? "opacity-[0.45]" : "opacity-100",
          !scene.locked && "group-hover:scale-[1.025]",
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
          NEW
        </span>
      )}
    </div>
  );

  const meta = scene.locked ? (
    <span className="flex items-center gap-1.5 font-label text-[12px] font-medium uppercase tracking-[0.16em] text-amber">
      <Lock aria-hidden className="h-3 w-3" strokeWidth={1.75} />
      UNLOCK
    </span>
  ) : (
    <span
      className={cn(
        "font-label text-[12px] font-medium uppercase tracking-[0.12em] text-paper-dim",
        "transition-colors duration-300 ease-[var(--ease-cinema)] group-hover:text-paper",
      )}
    >
      {scene.tags.map((tag, i) => (
        <span key={tag}>
          {i > 0 && <Dot />}
          {tag}
        </span>
      ))}
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
    <Link to={`/scene/${scene.slug}`} viewTransition className="group block">
      {poster}
      <div className="pt-3">{meta}</div>
    </Link>
  );
}
