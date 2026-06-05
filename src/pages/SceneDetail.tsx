import { useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { getScene } from "@/lib/scenes";
import { sceneImageUrl } from "@/lib/storage";
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
  const scene = getScene(slug);
  const reduce = useReducedMotion();

  // No catalog match → a user-created scene: pull it from the backend (the
  // hook keeps polling while its art is still being painted) and compose the
  // same title card from the generated establishing still + description.
  const { data: scenario } = useScenario(scene ? undefined : slug);

  // Title falls back to a humanised slug if the scene is missing.
  const title =
    scene?.title ??
    scenario?.title ??
    (slug
      ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Untitled");

  const still = scene?.still ?? sceneImageUrl(scenario?.establishing_path);
  const logline = scene?.logline ?? scenario?.description;
  const liveTo = scene
    ? `/scene/${scene.slug}/live`
    : scenario
      ? `/scene/${scenario.id}/live`
      : null;

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
      <SceneStill src={still ?? null} alt={title} />

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

        {/* lower-left content stack */}
        <div className="mt-auto max-w-2xl pb-14 md:pb-20">
          <motion.h1
            {...rise(0.05)}
            className="font-display mt-4 text-5xl font-light uppercase leading-[0.95] tracking-[-0.02em] text-paper sm:text-6xl md:text-7xl lg:text-8xl"
          >
            {title}
          </motion.h1>

          {logline && (
            <motion.p
              {...rise(0.2)}
              className="font-display mt-6 max-w-lg text-xl italic leading-snug text-paper/90"
            >
              {logline}
            </motion.p>
          )}

          {liveTo && (
            <motion.div {...rise(0.3)} className="mt-9">
              <AmberAction to={liveTo} viewTransition size="lg">
                Start Scene
              </AmberAction>
            </motion.div>
          )}
        </div>
      </Container>
    </div>
  );
}
