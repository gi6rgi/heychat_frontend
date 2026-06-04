import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Hourglass,
  Minus,
  Target,
  Wand2,
  X,
} from "lucide-react";
import {
  GOAL_IDEAS,
  MOOD_CHIPS,
  SCENE_IDEAS,
  VIBE_CARDS,
} from "@/components/match/matchFlow";
import { generateCharacter, matchCharacter } from "@/services/characters";
import { getScenario } from "@/services/scenarios";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CharacterIntake,
  Scenario,
  VibeReaction,
  VibeReactionKind,
} from "@/types/api";

type Mode = "match" | "create";
type Step =
  | "entry"
  | "intake"
  | "vibes"
  | "working"
  | "reveal"
  | "nomatch"
  | "error";

const PROGRESS: Step[] = ["intake", "vibes", "reveal"];

/** Map every step onto the 3-dot progress (working/nomatch live at the end). */
function progressIndex(step: Step): number {
  if (step === "intake") return 0;
  if (step === "vibes") return 1;
  return 2;
}

const stepMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.22, ease: "easeOut" },
} as const;

const WORKING_LINES: Record<Mode, string[]> = {
  match: [
    "Reading your vibe…",
    "Meeting the candidates…",
    "Checking the chemistry…",
  ],
  create: [
    "Reading your vibe…",
    "Imagining someone just for you…",
    "Painting the scene…",
    "Writing their story…",
  ],
};

/** Tap-to-fill suggestion chips for a free-text field (tap again to clear). */
function IdeaChips({
  ideas,
  value,
  onPick,
}: {
  ideas: string[];
  value: string;
  onPick: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ideas.map((idea) => {
        const active = value === idea;
        return (
          <button
            key={idea}
            type="button"
            onClick={() => onPick(active ? "" : idea)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              active
                ? "border-brand/60 bg-brand/15 text-brand-light"
                : "border-white/[0.1] bg-card/60 text-muted-foreground hover:border-brand/40 hover:text-foreground",
            )}
          >
            {idea}
          </button>
        );
      })}
    </div>
  );
}

/** Pulsing voice-orb motif — echoes the in-session MicOrb identity. */
function MatchOrb({ size = 88, initial }: { size?: number; initial?: string }) {
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border border-brand/30"
          animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 1.2,
            ease: "easeOut",
          }}
        />
      ))}
      <motion.span
        className="absolute inset-[12%] rounded-full bg-gradient-to-br from-brand-light via-brand to-brand-dark opacity-90 shadow-[0_0_60px_-10px] shadow-brand/60"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {initial && (
        <span className="relative text-2xl font-bold text-white drop-shadow-sm">
          {initial}
        </span>
      )}
    </div>
  );
}

/** Rotates through status lines while the LLM works. */
function WorkingLines({ lines }: { lines: string[] }) {
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
        transition={{ duration: 0.3 }}
        className="text-sm text-muted-foreground"
      >
        {lines[idx]}
      </motion.p>
    </AnimatePresence>
  );
}

export function MatchFlowModal({
  open,
  scenarios,
  onClose,
}: {
  open: boolean;
  scenarios: Scenario[];
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Flow state lives in FlowCard, which mounts fresh on every open. */}
          <FlowCard scenarios={scenarios} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FlowCard({
  scenarios,
  onClose,
}: {
  scenarios: Scenario[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("match");
  const [step, setStep] = useState<Step>("entry");
  // Intake answers.
  const [moods, setMoods] = useState<string[]>([]);
  const [wish, setWish] = useState("");
  // Where the user imagines the scene happening (create mode only).
  const [scene, setScene] = useState("");
  // What the user wants to train/achieve; turns the scene into a goal-driven
  // one with a live verdict (create mode only).
  const [goal, setGoal] = useState("");
  // Vibe card swipes.
  const [reactions, setReactions] = useState<VibeReaction[]>([]);
  const [swipeDir, setSwipeDir] = useState(1);
  // Outcome.
  const [result, setResult] = useState<{
    scenario: Scenario;
    reason: string;
    created: boolean;
  } | null>(null);
  const [noMatchReason, setNoMatchReason] = useState("");
  // Friendly daily-limit notice (HTTP 429) — retrying won't help today, so
  // the error step renders it as information instead of a failure.
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  // Last submitted intake, kept for retries and the "create instead" actions.
  const [intake, setIntake] = useState<CharacterIntake | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function begin(m: Mode) {
    setMode(m);
    setStep("intake");
  }

  /** "Create my own" after a match attempt: restart the flow from a clean
   * slate in create mode, so the user also gets the scene and goal fields
   * (the match intake never collected those). */
  function restartAsCreate() {
    setMoods([]);
    setWish("");
    setScene("");
    setGoal("");
    setReactions([]);
    setSwipeDir(1);
    setResult(null);
    setNoMatchReason("");
    setLimitMessage(null);
    setIntake(null);
    begin("create");
  }

  async function submit(payload: CharacterIntake, m: Mode) {
    setIntake(payload);
    setLimitMessage(null);
    setStep("working");
    try {
      if (m === "create") {
        const created = await generateCharacter(payload);
        // The new personal character belongs in the catalog behind the modal.
        await queryClient.invalidateQueries({
          queryKey: queryKeys.scenarios(),
        });
        setResult({ scenario: created, reason: "", created: true });
        setStep("reveal");
      } else {
        const res = await matchCharacter(payload);
        if (res.scenario_id) {
          const scenario =
            scenarios.find((s) => s.id === res.scenario_id) ??
            (await getScenario(res.scenario_id));
          setResult({ scenario, reason: res.reason, created: false });
          setStep("reveal");
        } else {
          setNoMatchReason(res.reason);
          setStep("nomatch");
        }
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        try {
          const detail = (JSON.parse(e.body) as { detail?: string }).detail;
          setLimitMessage(detail || "Daily limit reached — come back tomorrow!");
        } catch {
          setLimitMessage("Daily limit reached — come back tomorrow!");
        }
      }
      setStep("error");
    }
  }

  function swipe(reaction: VibeReactionKind) {
    const card = VIBE_CARDS[reactions.length];
    if (!card) return;
    setSwipeDir(reaction === "like" ? 1 : reaction === "skip" ? -1 : 0);
    const next = [
      ...reactions,
      { id: card.id, title: card.title, tags: card.tags, reaction },
    ];
    setReactions(next);
    if (next.length === VIBE_CARDS.length) {
      void submit(
        {
          moods,
          description: wish.trim(),
          scene: scene.trim(),
          goal: goal.trim(),
          vibes: next,
        },
        mode,
      );
    }
  }

  function back() {
    if (step === "intake") setStep("entry");
    else if (step === "vibes") {
      setReactions([]);
      setStep("intake");
    }
  }

  const card = VIBE_CARDS[reactions.length];
  const nextCard = VIBE_CARDS[reactions.length + 1];
  // Any signal is enough to continue — a mood, a wish, a scene or a goal.
  const canContinue =
    moods.length > 0 ||
    wish.trim().length > 0 ||
    scene.trim().length > 0 ||
    goal.trim().length > 0;
  const showBack = step === "intake" || step === "vibes";
  const showProgress = step !== "entry";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Create your companion"
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      onClick={(e) => e.stopPropagation()}
      // overflow-clip (not -hidden): a clipped box can't be focus-scrolled, so
      // clicking buttons mid step-transition can't permanently shift content.
      className="relative w-full max-w-lg overflow-clip rounded-3xl border border-white/10 bg-card shadow-2xl shadow-black/50"
    >
      {/* Aurora atmosphere behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-64 w-64 rounded-full bg-brand-dark/15 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 p-7">
        {/* Top bar: back / progress / close */}
        <div className="flex h-7 items-center justify-between">
          {showBack ? (
            <button
              type="button"
              onClick={back}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={15} /> Back
            </button>
          ) : (
            <span />
          )}
          {showProgress && (
            <div className="flex items-center gap-1.5" aria-hidden>
              {PROGRESS.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === progressIndex(step)
                      ? "w-5 bg-brand"
                      : i < progressIndex(step)
                        ? "w-1.5 bg-brand/50"
                        : "w-1.5 bg-white/15",
                  )}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === "entry" && (
            <motion.div
              key="entry"
              {...stepMotion}
              className="flex flex-col items-center gap-5 pb-1 text-center"
            >
              <MatchOrb />
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Your companion, your{" "}
                  <span className="bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">
                    scene
                  </span>
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Imagine who you’d love to talk to — and where it happens. A
                  rooftop bar, a night train, anywhere. We’ll bring the scene to
                  life for a real voice conversation.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2.5 pt-1">
                <Button
                  size="xl"
                  className="w-full"
                  onClick={() => begin("create")}
                >
                  Create my companion
                  <ArrowRight size={17} />
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button size="lg" variant="outline" onClick={onClose}>
                    Browse characters
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => begin("match")}
                  >
                    Find my match
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70">
                About 30 seconds. A few taps — typing optional.
              </p>
            </motion.div>
          )}

          {step === "intake" && (
            <motion.div
              key="intake"
              {...stepMotion}
              className="flex flex-col gap-4"
            >
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  What kind of companion would feel right today?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "create"
                    ? "We’ll create someone new — and a scene to meet them in."
                    : "We’ll use this to find who fits your mood."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {MOOD_CHIPS.map(({ label, icon: Icon }) => {
                  const active = moods.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setMoods((m) =>
                          active ? m.filter((x) => x !== label) : [...m, label],
                        )
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "border-brand/60 bg-brand/15 text-brand-light"
                          : "border-white/[0.1] bg-card/60 text-foreground hover:border-brand/40",
                      )}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="match-wish"
                  className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Or describe what you’re looking for…
                </label>
                <textarea
                  id="match-wish"
                  value={wish}
                  onChange={(e) => setWish(e.target.value)}
                  rows={3}
                  placeholder="I want someone calm, smart, and a little playful. Someone I can talk to after work."
                  className="resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              {mode === "create" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="match-scene"
                      className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    >
                      Set the scene — where does it happen?
                    </label>
                    <IdeaChips
                      ideas={SCENE_IDEAS}
                      value={scene}
                      onPick={setScene}
                    />
                    <textarea
                      id="match-scene"
                      value={scene}
                      onChange={(e) => setScene(e.target.value)}
                      rows={2}
                      placeholder="…or describe your own. Optional — we’ll invent one if you skip it."
                      className="resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="match-goal"
                      className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    >
                      Your goal — what do you want to pull off?
                    </label>
                    <IdeaChips
                      ideas={GOAL_IDEAS}
                      value={goal}
                      onPick={setGoal}
                    />
                    <textarea
                      id="match-goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      rows={2}
                      placeholder="…or write your own. Optional — leave empty for a free-flowing chat."
                      className="resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                </>
              )}
              <Button
                size="xl"
                className="w-full"
                disabled={!canContinue}
                onClick={() => setStep("vibes")}
              >
                Continue
                <ArrowRight size={17} />
              </Button>
            </motion.div>
          )}

          {step === "vibes" && card && (
            <motion.div
              key="vibes"
              {...stepMotion}
              className="flex flex-col gap-4"
            >
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Pick the vibes that feel closest
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    React to a few quick cards — gut feeling is enough.
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {reactions.length + 1} / {VIBE_CARDS.length}
                </span>
              </div>

              <div className="relative h-48">
                {/* The next card peeks out behind the current one (deck feel). */}
                {nextCard && (
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 top-2 bottom-0 rounded-2xl border border-white/[0.06] bg-gradient-to-br opacity-50",
                      nextCard.accent,
                    )}
                  />
                )}
                <AnimatePresence mode="popLayout" custom={swipeDir}>
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.94, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      x: swipeDir * 200,
                      rotate: swipeDir * 8,
                      transition: { duration: 0.28, ease: "easeIn" },
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className={cn(
                      "absolute inset-0 bottom-2 flex flex-col justify-between rounded-2xl border border-white/15 bg-gradient-to-br p-5 shadow-xl shadow-black/30 backdrop-blur-sm",
                      card.accent,
                    )}
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{card.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                        {card.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {card.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-black/25 px-2 py-0.5 text-xs text-foreground/80"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => swipe("skip")}
                >
                  <X size={16} className="text-muted-foreground" />
                  Skip
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => swipe("maybe")}
                >
                  <Minus size={16} className="text-muted-foreground" />
                  Maybe
                </Button>
                <Button size="lg" onClick={() => swipe("like")}>
                  <Heart size={16} />
                  Like
                </Button>
              </div>
            </motion.div>
          )}

          {step === "working" && (
            <motion.div
              key="working"
              {...stepMotion}
              className="flex flex-col items-center gap-5 py-8 text-center"
            >
              <MatchOrb />
              <WorkingLines lines={WORKING_LINES[mode]} />
            </motion.div>
          )}

          {step === "reveal" && result && (
            <motion.div
              key={`reveal-${result.scenario.id}`}
              {...stepMotion}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <MatchOrb size={72} initial={result.scenario.title[0]} />
                <div>
                  <p className="text-xs font-medium tracking-wide text-brand-light uppercase">
                    {result.created ? "Made just for you" : "Your match"}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    {result.scenario.title}
                  </h2>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {result.scenario.description}
                </p>
                {result.scenario.goal && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-light">
                    <Target size={12} />
                    Goal: {result.scenario.goal}
                  </span>
                )}
              </div>

              {result.reason && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col gap-2 rounded-xl border border-brand/15 bg-gradient-to-br from-brand/[0.07] to-transparent p-4"
                >
                  <h3 className="text-xs font-medium tracking-wide text-brand-light/80 uppercase">
                    Why you two fit
                  </h3>
                  <p className="flex gap-2 text-sm leading-relaxed">
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0 text-brand-light"
                    />
                    {result.reason}
                  </p>
                </motion.div>
              )}

              <div className="flex flex-col gap-2.5">
                <Button
                  size="xl"
                  className="w-full"
                  onClick={() => navigate(`/session/${result.scenario.id}`)}
                >
                  Start talking now
                  <ArrowRight size={17} />
                </Button>
                <div className="flex items-center justify-center gap-4">
                  {!result.created && (
                    <button
                      type="button"
                      onClick={restartAsCreate}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Wand2 size={14} /> Create my own instead
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Browse everyone
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "nomatch" && (
            <motion.div
              key="nomatch"
              {...stepMotion}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="grid size-16 place-items-center rounded-full border border-brand/30 bg-brand/10">
                  <Wand2 size={24} className="text-brand-light" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  No one quite fits — yet
                </h2>
                {noMatchReason && (
                  <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {noMatchReason}
                  </p>
                )}
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Let’s build them from scratch — this time you can set the
                  scene and a goal too.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                <Button size="xl" className="w-full" onClick={restartAsCreate}>
                  <Wand2 size={17} />
                  Create my companion
                </Button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Browse everyone instead
                </button>
              </div>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              key="error"
              {...stepMotion}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              {limitMessage ? (
                <>
                  <p className="flex max-w-sm items-start gap-2 rounded-xl border border-brand/30 bg-brand/10 px-3.5 py-2.5 text-left text-sm text-brand-light">
                    <Hourglass size={15} className="mt-0.5 shrink-0" />
                    {limitMessage}
                  </p>
                  <Button size="lg" variant="outline" onClick={onClose}>
                    Browse characters
                  </Button>
                </>
              ) : (
                <>
                  <p className="max-w-sm text-sm text-destructive">
                    Something went wrong while{" "}
                    {mode === "create"
                      ? "creating your companion"
                      : "finding your match"}
                    .
                  </p>
                  <Button
                    size="lg"
                    onClick={() => intake && void submit(intake, mode)}
                  >
                    Try again
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
