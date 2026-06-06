import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Kicker } from "@/components/cinema";

const STEPS = [
  "Pick a scene from the wall, or create your own.",
  "Press start, allow your mic, and just talk. Your partner answers out loud, in real time.",
  "End the scene for a debrief on what landed and what to work on.",
];

/**
 * Top-bar help affordance: a small "?" that opens a short, on-brand popup
 * explaining the loop (pick a scene, talk, get a debrief). The overlay is
 * portaled to <body> so its fixed positioning escapes the top bar's
 * backdrop-filter, which would otherwise clip it to the bar.
 */
export function HelpButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="How it works"
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 items-center justify-center border border-hairline font-mono text-[13px] text-paper-dim transition-colors duration-300 ease-[var(--ease-cinema)] hover:border-paper-dim hover:text-paper"
      >
        ?
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="How HeyChat works"
            className="animate-rise fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default bg-night-deep/85"
            />

            <div className="relative w-full max-w-md border border-hairline bg-night p-8">
              <div className="flex items-start justify-between gap-6">
                <Kicker>How it works</Kicker>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="-mr-1 -mt-1 text-paper-dim transition-colors duration-300 ease-[var(--ease-cinema)] hover:text-paper"
                >
                  <X aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <h2 className="font-display mt-5 text-3xl font-light leading-tight text-paper">
                Step into a scene and talk your way through it.
              </h2>

              <ol className="mt-7 flex flex-col gap-5">
                {STEPS.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="font-mono text-[13px] text-amber-dim">
                      0{i + 1}
                    </span>
                    <p className="font-display text-base italic leading-snug text-paper-dim">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
