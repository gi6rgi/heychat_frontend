import { useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { toScene } from "@/lib/scenes";
import { useScenario } from "@/hooks/useScenarios";
import { AmberAction, Container } from "@/components/cinema";
import { SceneStill } from "@/components/scene-detail/SceneStill";

/**
 * Scene Detail, Option A "title card" (brief 3.2).
 *
 * The scene still fills the entire viewport; a neutral night wash darkens the
 * lower-left so the text reads. The content sits in the shared Container so its
 * gutters line up with every other screen. Intentionally minimal: a kicker, the
 * huge serif title (rendered in code, the still is clean), a short italic
 * logline, and the single START SCENE affordance. No metadata, timers, or meters.
 */
export default function SceneDetail() {
  const { slug } = useParams<{ slug: string }>();
  const reduce = useReducedMotion();

  // Every scene — catalog or user-created — lives in the backend now. The
  // hook keeps polling while a created scene's art is still being painted,
  // so the establishing still fades in when it lands.
  const { data: scenario } = useScenario(slug);
  const scene = scenario ? toScene(scenario) : undefined;

  // Title falls back to a humanised slug while loading / if missing.
  const title =
    scene?.title ??
    (slug
      ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Untitled");

  const still = scene?.still ?? null;
  const logline = scene?.logline;
  const liveTo = scene ? `/scene/${scene.slug}/live` : null;

  const ease = reduce ? undefined : ([0.22, 0.61, 0.36, 1] as const);
  const rise = (delay: number) =>
    reduce
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease },
        };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-night-deep text-paper">
      <SceneStill src={still} alt={title} />

      <Container className="relative z-10 flex min-h-screen flex-col">
        {/* top-left back link */}
        <motion.div {...rise(0)} className="flex h-16 items-center">
          <Link
            to="/"
            viewTransition
            className="group inline-flex items-center gap-2 font-label text-[13px] font-medium uppercase tracking-[0.16em] text-paper transition-colors duration-300 ease-[var(--ease-cinema)] [text-shadow:0_1px_12px_rgba(20,19,17,0.9)] hover:text-amber"
          >
            <ArrowLeft aria-hidden className="h-[14px] w-[14px]" strokeWidth={1.5} />
            Scenarios
          </Link>
        </motion.div>

        {/* lower-left content stack — mounts only once the scenario has
            arrived, so the title/logline/action play their stagger together.
            Rendering it immediately made the title rise with a slug-derived
            fallback while the logline and button popped in (with their own
            delayed animations) whenever the GET finished. */}
        {scene && (
          <div className="mt-auto max-w-2xl pb-14 md:pb-20">
            <motion.h1
              {...rise(0.05)}
              className="font-display mt-4 text-5xl font-light uppercase leading-[0.95] tracking-[-0.02em] text-paper sm:text-6xl md:text-7xl lg:text-8xl"
            >
              {title}
            </motion.h1>

            {/* the mission briefing: goal chip + plain-language objective */}
            {scene.goal && (
              <motion.div
                {...rise(0.25)}
                className="mt-7 max-w-lg border-l border-amber/70 pl-4"
              >
                <p className="font-label text-[12px] font-medium uppercase tracking-[0.16em] text-amber">
                  Your goal · {scene.goal}
                </p>
                {scene.objective && (
                  <p className="mt-2 font-display text-[16px] leading-relaxed text-paper/80">
                    {scene.objective}
                  </p>
                )}
              </motion.div>
            )}

            {liveTo && (
              <motion.div {...rise(0.3)} className="mt-9">
                <AmberAction to={liveTo} viewTransition size="lg">
                  Start Scene
                </AmberAction>
              </motion.div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
