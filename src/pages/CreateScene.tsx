import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { GOAL_CARDS, SCENE_CARDS, WHO_CARDS } from "@/components/match/matchFlow";
import { generateCharacter } from "@/services/characters";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { AmberAction, Container, Kicker, TopBar } from "@/components/cinema";
import { MatchOrb } from "@/components/create/MatchOrb";
import { PosterReveal } from "@/components/create/PosterReveal";
import { WorkingLines } from "@/components/create/WorkingLines";
import { DeckStep } from "@/components/create/DeckStep";
import { useScenario } from "@/hooks/useScenarios";
import type { CharacterIntake, Scenario } from "@/types/api";

// Three deck steps, then the generate + reveal. No entry screen, no match path:
// /create drops you straight into building a companion.
type Step = "who" | "where" | "goal" | "working" | "reveal" | "error";

const DECK_INDEX: Partial<Record<Step, number>> = { who: 0, where: 1, goal: 2 };

const stepMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.36, ease: [0.22, 0.61, 0.36, 1] },
} as const;

const WORKING_LINES = [
  "Reading your brief…",
  "Imagining someone for you…",
  "Painting the scene…",
  "Writing their story…",
];

export default function CreateScene() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("who");
  // Deck answers: who the companion is, where the scene happens.
  const [who, setWho] = useState("");
  const [scene, setScene] = useState("");
  const [result, setResult] = useState<Scenario | null>(null);
  // Friendly daily-limit notice (HTTP 429): retrying won't help today.
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  // Last submitted intake, kept for retries.
  const [intake, setIntake] = useState<CharacterIntake | null>(null);
  // Scene art is painted in the background after creation; this poll (it stops
  // by itself once image_status leaves "generating") feeds the poster reveal.
  const { data: liveResult } = useScenario(
    step === "reveal" ? result?.id : undefined,
  );
  const revealed = liveResult ?? result;

  async function submit(payload: CharacterIntake) {
    setIntake(payload);
    setLimitMessage(null);
    setStep("working");
    try {
      const created = await generateCharacter(payload);
      await queryClient.invalidateQueries({ queryKey: queryKeys.scenarios() });
      setResult(created);
      setStep("reveal");
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        try {
          const detail = (JSON.parse(e.body) as { detail?: string }).detail;
          setLimitMessage(detail || "Daily limit reached. Come back tomorrow.");
        } catch {
          setLimitMessage("Daily limit reached. Come back tomorrow.");
        }
      }
      setStep("error");
    }
  }

  function back() {
    if (step === "where") setStep("who");
    else if (step === "goal") setStep("where");
  }

  const deckBack = step === "where" || step === "goal";
  const showProgress = step in DECK_INDEX;

  const backLink =
    "group inline-flex items-center gap-2 font-label text-[13px] font-medium uppercase tracking-[0.16em] text-paper-dim transition-colors duration-300 ease-[var(--ease-cinema)] hover:text-paper";

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar>
        {deckBack ? (
          <button type="button" onClick={back} className={backLink}>
            <span aria-hidden>←</span> Back
          </button>
        ) : (
          <Link to="/" className={backLink}>
            <span aria-hidden>←</span> Scenarios
          </Link>
        )}
        {showProgress ? (
          <span className="font-mono text-[13px] tracking-[0.1em] text-paper-faint">
            0{(DECK_INDEX[step] ?? 0) + 1} / 03
          </span>
        ) : (
          <span />
        )}
      </TopBar>

      <Container className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center py-12 md:py-16">
          <AnimatePresence mode="wait">
            {step === "who" && (
              <motion.div key="who" {...stepMotion}>
                <DeckStep
                  title="Who are they?"
                  cards={WHO_CARDS}
                  required
                  manualPlaceholder="Calm, smart, a little playful. Someone I can talk to after work."
                  onDone={(v) => {
                    setWho(v);
                    setStep("where");
                  }}
                />
              </motion.div>
            )}

            {step === "where" && (
              <motion.div key="where" {...stepMotion}>
                <DeckStep
                  title="Where are you?"
                  cards={SCENE_CARDS}
                  manualPlaceholder="A rainy bus stop at 2am. A starship bridge. Anywhere."
                  onDone={(v) => {
                    setScene(v);
                    setStep("goal");
                  }}
                />
              </motion.div>
            )}

            {step === "goal" && (
              <motion.div key="goal" {...stepMotion}>
                <DeckStep
                  title="What's the win?"
                  cards={GOAL_CARDS}
                  manualPlaceholder="Get the afterparty invite. Win the argument kindly."
                  onDone={(v) =>
                    void submit({
                      moods: [],
                      description: who,
                      scene,
                      goal: v,
                      vibes: [],
                    })
                  }
                />
              </motion.div>
            )}

            {step === "working" && (
              <motion.div
                key="working"
                {...stepMotion}
                className="flex flex-col items-center gap-8 py-12 text-center"
              >
                <MatchOrb />
                <WorkingLines lines={WORKING_LINES} />
              </motion.div>
            )}

            {step === "reveal" && revealed && (
              <motion.div
                key={`reveal-${revealed.id}`}
                {...stepMotion}
                className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 md:flex-row md:gap-16"
              >
                <PosterReveal scenario={revealed} />
                {/* text column: centered stack on phones, left-aligned beside
                    the poster from md up — same type tiers as the detail page. */}
                <div className="flex max-w-xl flex-col items-center gap-5 text-center md:items-start md:text-left">
                  <h2 className="font-display text-4xl font-light leading-[1.05] text-paper sm:text-5xl">
                    {revealed.title}
                  </h2>
                  <p className="font-display text-2xl italic leading-snug text-paper/90 [font-variation-settings:'opsz'_40,'SOFT'_30,'WONK'_0]">
                    {revealed.description}
                  </p>
                  {/* same goal plate as the scene detail page: GOAL label in a
                      gap of the box's top border, the goal big in amber. */}
                  {revealed.goal && (
                    <fieldset className="mt-2 border border-amber/70 px-7 pb-5 pt-1 text-left">
                      <legend className="px-2 font-label text-[12px] font-medium uppercase tracking-[0.2em] text-amber">
                        Goal
                      </legend>
                      <p className="font-display text-3xl font-light leading-tight text-amber sm:text-4xl">
                        {revealed.goal}
                      </p>
                    </fieldset>
                  )}
                  <div className="mt-3">
                    <AmberAction
                      size="lg"
                      onClick={() => navigate(`/scene/${revealed.id}/live`)}
                    >
                      Start scene
                    </AmberAction>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div
                key="error"
                {...stepMotion}
                className="mx-auto flex max-w-xl flex-col items-center gap-8 text-center"
              >
                {limitMessage ? (
                  <>
                    <div className="flex max-w-lg flex-col gap-3">
                      <Kicker className="text-amber">Daily limit</Kicker>
                      <p className="font-display text-2xl italic leading-relaxed text-paper">
                        {limitMessage}
                      </p>
                    </div>
                    <AmberAction tone="dim" arrow={false} to="/">
                      Browse scenes
                    </AmberAction>
                  </>
                ) : (
                  <>
                    <p className="max-w-lg font-display text-2xl italic leading-relaxed text-paper-dim">
                      Something went wrong while creating your companion.
                    </p>
                    <AmberAction onClick={() => intake && void submit(intake)}>
                      Try again
                    </AmberAction>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </div>
  );
}
