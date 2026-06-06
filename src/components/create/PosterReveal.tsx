import { useState } from "react";
import { motion } from "motion/react";
import { sceneImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/types/api";

/**
 * The created scene's poster, revealed progressively. While the backend paints
 * (image_status === "generating") the 2:3 frame holds the scene's initial under
 * a slow shimmer sweep; the poster cross-fades in the moment its storage path
 * lands (the reveal screen polls the scenario). No art planned or failed → the
 * quiet initial frame simply stays.
 */
export function PosterReveal({ scenario }: { scenario: Scenario }) {
  const [loaded, setLoaded] = useState(false);
  const url = sceneImageUrl(scenario.poster_path);
  const painting = !loaded && scenario.image_status === "generating";

  return (
    <div className="relative aspect-[2/3] w-60 overflow-hidden border border-hairline sm:w-72 md:w-80">
      {/* dark placeholder: the scene's initial, like a one-sheet proof */}
      <div className="absolute inset-0 flex items-center justify-center bg-night">
        <span className="font-display text-6xl font-light text-paper-faint">
          {scenario.title.charAt(0)}
        </span>
      </div>

      {/* shimmer sweep while the poster is being painted */}
      {painting && (
        <motion.div
          aria-hidden
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-paper/[0.05] to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "300%" }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      )}

      {url && (
        <img
          src={url}
          alt={`${scenario.title} poster`}
          onLoad={() => setLoaded(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-[var(--ease-cinema)]",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {painting && (
        <span className="absolute inset-x-0 bottom-3 text-center font-label text-[11px] font-medium uppercase tracking-[0.16em] text-paper-faint">
          Painting the poster…
        </span>
      )}
    </div>
  );
}
