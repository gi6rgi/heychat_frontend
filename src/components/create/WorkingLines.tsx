import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/** Rotates through status lines while the LLM works. */
export function WorkingLines({ lines }: { lines: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => Math.min(i + 1, lines.length - 1)),
      2200,
    );
    return () => clearInterval(t);
  }, [lines]);
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="font-display text-lg italic text-paper-dim"
      >
        {lines[idx]}
      </motion.p>
    </AnimatePresence>
  );
}
