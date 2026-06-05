import { AnimatePresence, motion } from "motion/react";

/**
 * Cinema subtitle stack rendered over the film — no box, no chrome.
 *   · `previous`  small + faded, sits above (the line before the current one)
 *   · `current`   largest serif, paper — the line being spoken now
 *   · `hint`      faint italic serif below — an optional suggested reply
 *
 * The current line crossfades on change (~300ms, slow ease, no movement when a
 * user prefers reduced motion — opacity-only is already gentle).
 */
export function Subtitles({
  previous,
  current,
  hint,
}: {
  previous?: string;
  current: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="h-6">
        <AnimatePresence mode="wait">
          {previous ? (
            <motion.p
              key={previous}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="font-display text-base leading-snug text-paper-faint"
            >
              {previous}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
          className="font-display text-2xl leading-snug text-paper md:text-3xl"
        >
          {current}
        </motion.p>
      </AnimatePresence>

      <div className="min-h-[1.5rem]">
        <AnimatePresence mode="wait">
          {hint ? (
            <motion.p
              key={hint}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="font-display text-base italic leading-snug text-paper-faint"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
