import { useEffect, useRef } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { toScene } from "@/lib/scenes";
import { useScenario } from "@/hooks/useScenarios";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useConversation,
  useFeedback,
  useGenerateFeedback,
} from "@/hooks/useConversations";
import { AmberAction, Hairline, Kicker, TopBar } from "@/components/cinema";
import { SubScoreRow } from "@/components/debrief/SubScoreRow";
import { MatchOrb } from "@/components/create/MatchOrb";
import { WorkingLines } from "@/components/create/WorkingLines";

/**
 * Post-scene debrief — the real flight recorder.
 *
 * Arrives from the live screen as /scene/:slug/debrief?c=<conversation_id>.
 * The report is generated server-side (Claude reads the transcript against
 * the persona + goal); this screen kicks generation off if needed, shows a
 * "reviewing" state while it cooks (~10-20s), then renders the verdict:
 * goal outcome, overall score, per-metric breakdown, the coach's summary,
 * strengths, advice with quotes from the user's own lines, and suggested
 * better answers. Without a conversation id there is nothing to grade — we
 * bounce back to the scene page.
 */

/** Rotating status lines while the coach reads the transcript (~10-20s). */
const REVIEW_LINES = [
  "Rolling the tape back…",
  "Reading your lines…",
  "Marking the moments that mattered…",
  "Writing the coach's note…",
];

/** mm:ss between the first and last message of the conversation. */
function sceneDuration(
  messages: { created_at: string }[] | undefined,
): string | null {
  if (!messages || messages.length < 2) return null;
  const first = new Date(messages[0].created_at).getTime();
  const last = new Date(messages[messages.length - 1].created_at).getTime();
  const s = Math.max(0, Math.round((last - first) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Debrief() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const conversationId = params.get("c") ?? undefined;

  const { data: scenario, isLoading } = useScenario(slug);
  const scene = scenario ? toScene(scenario) : undefined;
  const { data: conversation } = useConversation(conversationId);
  const feedback = useFeedback(conversationId);
  const generate = useGenerateFeedback(conversationId);
  const reduce = useReducedMotion();

  usePageTitle(scene && `${scene.character} · Debrief`);

  // An empty transcript can't be reviewed — the backend 409s the POST — so
  // don't even ask; the page shows the "nothing on tape" state instead.
  const empty = !!conversation && conversation.messages.length === 0;

  // Kick generation off once when the report doesn't exist yet, after the
  // transcript confirms there is something to grade. (The backend also guards
  // against duplicate runs; the ref just keeps us polite.)
  const requested = useRef(false);
  const feedbackStatus = feedback.data?.status;
  useEffect(() => {
    if (!conversationId || requested.current || !conversation || empty) return;
    if (feedbackStatus === "none") {
      requested.current = true;
      generate.mutate();
    }
  }, [conversationId, feedbackStatus, generate, conversation, empty]);

  if (isLoading) return null;
  if (!scene) return <Navigate to="/" replace />;
  if (!conversationId) return <Navigate to={`/scene/${scene.slug}`} replace />;

  const report =
    feedback.data?.status === "ready" ? feedback.data.report : null;
  const reviewing =
    !feedback.data ||
    feedbackStatus === "generating" ||
    (feedbackStatus === "none" && !feedback.data?.error);
  // generate.isError covers a failed POST (it never flips feedbackStatus) —
  // without it the page would sit on the reviewing orb forever.
  const failed =
    feedbackStatus === "error" || !!feedback.error || generate.isError;

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: "easeOut" as const, delay },
        };

  const duration = sceneDuration(conversation?.messages);
  const strengths = report?.metrics.filter((m) => m.kind === "strength") ?? [];

  return (
    <div className="min-h-screen bg-night">
      <TopBar>
        <Kicker as="h2" className="text-paper">
          {scene.title}
          <span className="text-paper-faint"> / </span>
          Debrief
        </Kicker>
        <Link
          to="/"
          className="shrink-0 font-label text-[13px] font-medium uppercase tracking-[0.14em] text-paper-dim transition-colors duration-300 ease-[var(--ease-cinema)] hover:text-paper"
        >
          HOME
        </Link>
      </TopBar>

      {/* While the coach is still reading there's no verdict to stage — show
          the same quiet ritual as the create flow's working step: the orb and
          a few rotating lines, nothing else. */}
      {reviewing && !report && !failed && !empty ? (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 py-12 text-center">
          <MatchOrb />
          <WorkingLines lines={REVIEW_LINES} />
        </div>
      ) : (
      <div className="mx-auto w-full max-w-6xl px-6 pb-14 md:px-10">
        {/* HERO — the coach's headline + scene meta */}
        <motion.div className="mt-14" {...rise(0.05)}>
          <h1 className="font-display max-w-3xl text-4xl font-light leading-[1.05] text-paper sm:text-5xl">
            {report?.headline ?? "The scene is in the can."}
          </h1>
          <p className="mt-5 font-mono text-[13px] uppercase tracking-[0.1em] text-paper-faint">
            {[
              duration,
              conversation ? `${conversation.messages.length} lines` : null,
              scene.character,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </motion.div>

        <Hairline className="mt-14" />

        {/* EMPTY — the scene ended without a single line; nothing to grade.
            The bottom RETRY SCENE action is the way back in. */}
        {empty && !report && (
          <motion.div
            className="flex flex-col items-center gap-6 py-24 text-center"
            {...rise(0.1)}
          >
            <p className="max-w-md font-display text-2xl italic leading-snug text-paper-dim">
              Nothing on tape. Not a single line was spoken, so there is
              nothing to review.
            </p>
          </motion.div>
        )}

        {/* ERROR — analysis failed; offer a retry */}
        {failed && !report && !empty && (
          <motion.div
            className="flex flex-col items-center gap-6 py-24 text-center"
            {...rise(0.1)}
          >
            <p className="max-w-md font-display text-2xl italic leading-snug text-paper-dim">
              The coach lost their notes. Run the review again?
            </p>
            <AmberAction
              size="lg"
              onClick={() => {
                requested.current = true;
                generate.mutate();
              }}
            >
              Retry review
            </AmberAction>
          </motion.div>
        )}

        {/* REPORT */}
        {report && (
          <>
            <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
              {/* LEFT — the score + coach's summary */}
              <motion.div {...rise(0.15)}>
                <Kicker as="h2">The Verdict</Kicker>
                <div className="mt-6 flex items-end gap-3">
                  <span className="font-display text-7xl font-light leading-[0.85] tracking-tight text-paper sm:text-8xl lg:text-9xl">
                    {String(report.overall_score.toFixed(1)).split(".")[0]}
                    <span className="text-paper-dim">
                      .{report.overall_score.toFixed(1).split(".")[1]}
                    </span>
                  </span>
                  <span className="mb-3 font-mono text-base text-paper-faint">
                    /10
                  </span>
                </div>
                <div className="mt-8 max-w-md">
                  <p className="text-base leading-relaxed text-paper-dim">
                    {report.summary}
                  </p>
                </div>
              </motion.div>

              {/* RIGHT — metric breakdown */}
              <motion.div {...rise(0.25)}>
                <Kicker as="h2">Breakdown</Kicker>
                <div className="mt-6 flex flex-col gap-5">
                  {report.metrics.map((m) => (
                    <SubScoreRow key={m.name} label={m.name} value={m.score} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* WHAT LANDED / WHAT TO WORK ON — full-width section so each list
                gets a real column to breathe in (nested in the right half they
                rendered as unreadable skinny towers). */}
            <motion.div className="mt-16" {...rise(0.3)}>
              <Hairline />
              <div className="mt-12 grid gap-x-16 gap-y-10 sm:grid-cols-2">
                <div>
                  <Kicker as="p">What Landed</Kicker>
                  <ul className="mt-4">
                    {strengths.map((m, i) => (
                      <li key={m.name}>
                        {i > 0 && <Hairline className="my-5 bg-hairline-soft" />}
                        <span className="block text-base leading-relaxed text-paper">
                          {m.explanation}
                        </span>
                      </li>
                    ))}
                    {strengths.length === 0 && (
                      <li className="text-base italic leading-relaxed text-paper-dim">
                        Rough night. The next run is where it turns.
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <Kicker as="p">What To Work On</Kicker>
                  <ul className="mt-4">
                    {report.advice.map((a, i) => (
                      <li key={i}>
                        {i > 0 && <Hairline className="my-5 bg-hairline-soft" />}
                        <span className="block text-base leading-relaxed text-paper">
                          {a.text}
                        </span>
                        {a.quote && (
                          <span className="mt-2 block font-display text-base italic leading-normal text-paper-faint">
                            “{a.quote}”
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* SAY IT BETTER — the coach's suggested lines */}
            {!!report.example_answers?.length && (
              <motion.div className="mt-16" {...rise(0.3)}>
                <Hairline />
                <div className="mt-12">
                  <Kicker as="h2">Say It Better</Kicker>
                  <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-2">
                    {report.example_answers.map((ex, i) => (
                      <div key={i}>
                        <p className="font-display text-base italic leading-normal text-paper-faint">
                          {ex.question}
                        </p>
                        <p className="mt-2 text-base leading-relaxed text-amber/90">
                          “{ex.answer}”
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        <Hairline className="mt-16" />

        {/* BOTTOM — actions */}
        <motion.div
          className="mt-10 flex flex-wrap items-center gap-x-12 gap-y-6"
          {...rise(0.35)}
        >
          <AmberAction to={`/scene/${scene.slug}/live`} size="lg">
            Retry Scene
          </AmberAction>
          <AmberAction to="/" size="lg" tone="dim" arrow={false}>
            Home
          </AmberAction>
        </motion.div>
      </div>
      )}
    </div>
  );
}
