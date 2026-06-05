import { cn } from "@/lib/utils";

/**
 * Full-bleed scene still behind the title card. Fixed, object-cover, sat below
 * the text stack. When `src` is null we fall back to near-black night-deep with
 * a subtle dark vignette (no placeholder art or text), per the brief.
 *
 * A neutral night legibility wash sits on top — heavier toward the bottom-left
 * where the title/logline live. This is the allowed photographic darkening
 * (single-hue, no colored/brand gradient).
 */
export function SceneStill({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div aria-hidden className="fixed inset-0 z-0 bg-night-deep">
      {src && (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      {/* legibility wash — neutral night, weighted to the lower-left */}
      <div
        className={cn("absolute inset-0")}
        style={{
          background:
            "linear-gradient(to top, rgba(20,19,17,0.96) 0%, rgba(20,19,17,0.66) 28%, rgba(20,19,17,0.22) 55%, rgba(20,19,17,0) 72%)",
        }}
      />
      <div
        className={cn("absolute inset-0")}
        style={{
          background:
            "linear-gradient(to right, rgba(20,19,17,0.85) 0%, rgba(20,19,17,0.42) 32%, rgba(20,19,17,0) 60%)",
        }}
      />
      <div
        className={cn("absolute inset-x-0 top-0 h-28")}
        style={{
          background:
            "linear-gradient(to bottom, rgba(20,19,17,0.62) 0%, rgba(20,19,17,0.34) 48%, rgba(20,19,17,0) 100%)",
        }}
      />
      <span className="sr-only">{alt}</span>
    </div>
  );
}
