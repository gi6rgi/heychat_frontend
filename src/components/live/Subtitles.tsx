import { AnimatePresence, motion } from "motion/react";

export interface SubtitleLine {
  /** stable per-turn id — text inside a turn streams in place, no re-fade */
  id: string;
  text: string;
}

/**
 * Cinema subtitle stack rendered over the film — no box, no chrome.
 *   · `previous`   small + faded, sits above (the line before the current one)
 *   · `direction`  theatre-style stage remark for the current line — what the
 *                  character does, never what they say (faint italic, parens)
 *   · `current`    largest serif, paper — the line being spoken now
 *   · `hint`       faint italic serif below — the user's own last line
 *
 * Lines are keyed by turn id, not by text: streamed fragments grow in place
 * and the crossfade only plays when a NEW turn starts (no per-chunk flicker).
 * Each slot reserves its height so a wrapping line doesn't shove the controls.
 */
export function Subtitles({
  previous,
  current,
  direction,
  hint,
}: {
  previous?: SubtitleLine;
  current: SubtitleLine;
  direction?: string | null;
  hint?: SubtitleLine;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <div className="h-6 w-full">
        <AnimatePresence mode="wait">
          {previous && previous.text ? (
            <motion.p
              key={previous.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="mx-auto max-w-xl truncate font-display text-base leading-snug text-paper-faint"
            >
              {previous.text}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="h-5">
        <AnimatePresence mode="wait">
          {direction ? (
            <motion.p
              key={direction}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="font-display text-[15px] italic leading-none text-amber/70"
            >
              ( {direction} )
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex min-h-[4.2rem] w-full items-center justify-center md:min-h-[5.2rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            className="font-display text-2xl leading-snug text-paper md:text-3xl"
          >
            {current.text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="min-h-[1.5rem] w-full">
        <AnimatePresence mode="wait">
          {hint && hint.text ? (
            <motion.p
              key={hint.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="mx-auto max-w-xl truncate font-display text-base italic leading-snug text-paper-faint"
            >
              {hint.text}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
