import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { sceneImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/types/api";

/**
 * A user-created scene on the poster wall. Generated posters have their title
 * baked in (same art direction as the catalog); while the art is still being
 * painted the card holds the scene's initial under a slow shimmer sweep, and
 * scenes without art (generation disabled/failed) keep the quiet titled frame.
 */
export function CustomPosterCard({ scenario }: { scenario: Scenario }) {
  const [loaded, setLoaded] = useState(false);
  const poster = sceneImageUrl(scenario.poster_path);
  const painting = !loaded && scenario.image_status === "generating";

  return (
    <Link to={`/scene/${scenario.id}`} viewTransition className="group block">
      <div className="relative aspect-[2/3] overflow-hidden border border-hairline">
        {/* dark placeholder: initial + title, like a one-sheet proof */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-night px-4 text-center">
          <span className="font-display text-5xl font-light text-paper-faint">
            {scenario.title.charAt(0)}
          </span>
          <span className="font-display text-base italic leading-snug text-paper-dim">
            {scenario.title}
          </span>
        </div>

        {painting && (
          <motion.div
            aria-hidden
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-paper/[0.05] to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "300%" }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          />
        )}

        {poster && (
          <img
            src={poster}
            alt={`${scenario.title} poster`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[450ms] ease-[var(--ease-cinema)]",
              loaded ? "opacity-100" : "opacity-0",
              "group-hover:scale-[1.025]",
            )}
          />
        )}
      </div>

      <div className="pt-3">
        <span
          className={cn(
            "font-label text-[12px] font-medium uppercase tracking-[0.12em] text-paper-dim",
            "transition-colors duration-300 ease-[var(--ease-cinema)] group-hover:text-paper",
          )}
        >
          YOURS
          <span className="px-1.5 text-paper-faint">·</span>
          {painting ? "PAINTING…" : "CUSTOM"}
        </span>
      </div>
    </Link>
  );
}
