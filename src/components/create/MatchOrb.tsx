import { motion, useReducedMotion } from "motion/react";

/**
 * The creation-flow identity motif — a quiet concentric ring pulse echoing the
 * live MicOrb, rebuilt for cinema: 1px amber/paper rings easing outward, no
 * gradient fill, no glow shadow. `initial` sets a serif glyph at the center
 * (the result's first letter on reveal).
 */
export function MatchOrb({
  size = 88,
  initial,
}: {
  size?: number;
  initial?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      {!reduce &&
        [0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-full border border-amber-dim"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [0.7, 1.25], opacity: [0.5, 0] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: i * 1.6,
              ease: "easeOut",
            }}
          />
        ))}
      <span
        aria-hidden
        className="absolute inset-[18%] rounded-full border border-hairline"
      />
      <motion.span
        aria-hidden
        className="absolute inset-[34%] rounded-full border border-amber"
        animate={reduce ? undefined : { opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {initial && (
        <span className="font-display relative text-xl italic text-paper">
          {initial}
        </span>
      )}
    </div>
  );
}
