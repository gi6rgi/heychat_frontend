import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { deleteScenario } from "@/services/scenarios";
import { queryKeys } from "@/lib/query-keys";
import { sceneImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/types/api";

/**
 * A user-created scene on the poster wall. Generated posters have their title
 * baked in (same art direction as the catalog); while the art is still being
 * painted the card holds the scene's initial under a slow shimmer sweep, and
 * scenes without art (generation disabled/failed) keep the quiet titled frame.
 *
 * Hover reveals a ✕ in the corner; deletion confirms inline in the meta line
 * (DELETE? YES · NO) — no dialogs on the poster wall.
 */
export function CustomPosterCard({ scenario }: { scenario: Scenario }) {
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const poster = sceneImageUrl(scenario.poster_path);
  const painting = !loaded && scenario.image_status === "generating";

  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteScenario(scenario.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarios() }),
    onError: () => setConfirming(false),
  });

  // The whole card is a Link — keep delete-affordance clicks off the router.
  const guard = (fn: () => void) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <Link to={`/scene/${scenario.id}`} viewTransition className="group block">
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden border border-hairline",
          !remove.isPending &&
            "transition-transform duration-[450ms] ease-[var(--ease-cinema)] group-hover:scale-[1.025]",
        )}
      >
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
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-[450ms] ease-[var(--ease-cinema)]",
              loaded ? "opacity-100" : "opacity-0",
              remove.isPending && "opacity-40",
            )}
          />
        )}

        {/* delete affordance: appears on hover, top-right */}
        {!remove.isPending && (
          <button
            type="button"
            aria-label={`Delete ${scenario.title}`}
            onClick={guard(() => setConfirming(true))}
            className={cn(
              "absolute right-0 top-0 p-2 text-paper-dim opacity-0 transition-opacity duration-300 ease-[var(--ease-cinema)]",
              "hover:text-amber focus-visible:opacity-100 group-hover:opacity-100",
              "bg-gradient-to-bl from-night/70 to-transparent",
            )}
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="pt-3">
        {remove.isPending ? (
          <span className="font-label text-[12px] font-medium uppercase tracking-[0.12em] text-paper-faint">
            REMOVING…
          </span>
        ) : confirming ? (
          <span className="font-label text-[12px] font-medium uppercase tracking-[0.12em] text-paper-dim">
            DELETE?
            <button
              type="button"
              onClick={guard(() => remove.mutate())}
              className="px-1.5 text-amber transition-colors duration-300 hover:text-paper"
            >
              YES
            </button>
            <span className="text-paper-faint">·</span>
            <button
              type="button"
              onClick={guard(() => setConfirming(false))}
              className="px-1.5 text-paper-dim transition-colors duration-300 hover:text-paper"
            >
              NO
            </button>
          </span>
        ) : (
          <span
            className={cn(
              "font-label text-[12px] font-medium uppercase tracking-[0.12em] text-paper-dim",
              "transition-colors duration-300 ease-[var(--ease-cinema)] group-hover:text-paper",
            )}
          >
            {(painting
              ? ["YOURS", "PAINTING…"]
              : scenario.tags?.length
                ? scenario.tags
                : ["YOURS", "CUSTOM"]
            ).map((tag, i) => (
              <span key={tag}>
                {i > 0 && <span className="px-1.5 text-paper-faint">·</span>}
                {tag}
              </span>
            ))}
          </span>
        )}
      </div>
    </Link>
  );
}
