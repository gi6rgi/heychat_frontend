import { Link, useParams, Navigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { getScene } from "@/lib/scenes";
import { AmberAction, Hairline, Kicker, TopBar } from "@/components/cinema";
import {
  RapportChart,
  type RapportMark,
  type RapportPoint,
} from "@/components/debrief/RapportChart";
import { SubScoreRow } from "@/components/debrief/SubScoreRow";

/* -------------------------------------------------------------------------- */
/*  Mock debrief data                                                          */
/*  No backend scoring yet — this is a realistic, hand-authored "flight        */
/*  recorder" per scene so the screen reads as a finished conversation.        */
/* -------------------------------------------------------------------------- */

interface Debrief {
  /** total scene length in seconds — x-axis of the rapport curve */
  duration: number;
  /** sampled rapport readings, t in seconds, v in 0..1 */
  rapport: RapportPoint[];
  /** the two pinned moments on the curve */
  marks: RapportMark[];
  /** overall 0–10 */
  score: number;
  /** one italic serif verdict line */
  verdict: string;
  /** four sub-scores, 0–10 */
  sub: { label: string; value: number }[];
  /** two short serif sentences */
  coachNote: [string, string];
  landed: string[];
  workOn: string[];
}

/**
 * Per-scene debrief. `_` is the honest-but-playful default so any scene (even
 * locked/unplayed ones reached by URL) renders a believable recorder.
 */
const DEBRIEFS: Record<string, Debrief> = {
  "dive-bar": {
    duration: 522, // 08:42
    rapport: [
      { t: 0, v: 0.34 },
      { t: 70, v: 0.46 },
      { t: 134, v: 0.78 }, // best line 02:14
      { t: 190, v: 0.7 },
      { t: 250, v: 0.6 },
      { t: 331, v: 0.28 }, // the fumble 05:31
      { t: 400, v: 0.42 },
      { t: 470, v: 0.58 },
      { t: 522, v: 0.64 },
    ],
    marks: [
      {
        t: 134,
        label: "BEST LINE 02:14",
        quote: "The truth, obviously. The better version is for people you've already lost.",
        tone: "paper",
      },
      {
        t: 331,
        label: "THE FUMBLE 05:31",
        quote: "So anyway, what do you do for work?",
        tone: "amber",
      },
    ],
    score: 7.2,
    verdict: "Great opener. You stopped listening around minute three.",
    sub: [
      { label: "Confidence", value: 8 },
      { label: "Listening", value: 5 },
      { label: "Wit", value: 7 },
      { label: "Timing", value: 6 },
    ],
    coachNote: [
      "You read the room beautifully for two minutes, then reached for the interview questions.",
      "Lena gave you an opening about regrets and you changed the subject. Next time, stay in it.",
    ],
    landed: [
      "Matched her dry tone instead of overselling.",
      "Let the first silence sit. It paid off.",
    ],
    workOn: [
      "The job question killed the momentum.",
      "Three follow-ups in a row read as a quiz, not a chat.",
    ],
  },
  "cafe-terrace": {
    duration: 388, // 06:28
    rapport: [
      { t: 0, v: 0.4 },
      { t: 60, v: 0.52 },
      { t: 128, v: 0.74 }, // best 02:08
      { t: 190, v: 0.66 },
      { t: 248, v: 0.5 },
      { t: 296, v: 0.3 }, // fumble 04:56
      { t: 340, v: 0.46 },
      { t: 388, v: 0.6 },
    ],
    marks: [
      {
        t: 128,
        label: "BEST LINE 02:08",
        quote: "Don't let me interrupt the good part. Just tell me when you surface.",
        tone: "paper",
      },
      {
        t: 296,
        label: "THE FUMBLE 04:56",
        quote: "Anyway, I have like a million things to do today.",
        tone: "amber",
      },
    ],
    score: 6.8,
    verdict: "Charming and patient, until you talked yourself out of the table.",
    sub: [
      { label: "Confidence", value: 6 },
      { label: "Listening", value: 8 },
      { label: "Wit", value: 7 },
      { label: "Timing", value: 5 },
    ],
    coachNote: [
      "You respected the book, which earned you the look up. That was the whole game.",
      "Then you pre-rejected yourself with the busy line. Sofia was already in. Let her stay.",
    ],
    landed: [
      "Opened around what she was doing, not how she looked.",
      "Genuinely curious questions, not pickup lines.",
    ],
    workOn: [
      "The 'million things to do' line handed her the exit.",
      "You apologized twice for things that weren't wrong.",
    ],
  },
  "job-interview": {
    duration: 612, // 10:12
    rapport: [
      { t: 0, v: 0.3 },
      { t: 90, v: 0.42 },
      { t: 176, v: 0.7 }, // best 02:56
      { t: 260, v: 0.64 },
      { t: 340, v: 0.52 },
      { t: 418, v: 0.26 }, // fumble 06:58
      { t: 500, v: 0.4 },
      { t: 560, v: 0.5 },
      { t: 612, v: 0.56 },
    ],
    marks: [
      {
        t: 176,
        label: "BEST LINE 02:56",
        quote: "I'm not here to be safe. I'm here to be the reason this desk earns its keep.",
        tone: "paper",
      },
      {
        t: 418,
        label: "THE FUMBLE 06:58",
        quote: "Honestly? My biggest weakness is probably that I work too hard.",
        tone: "amber",
      },
    ],
    score: 6.4,
    verdict: "Strong thesis. Then you reached for the answer you read online.",
    sub: [
      { label: "Confidence", value: 7 },
      { label: "Listening", value: 6 },
      { label: "Wit", value: 5 },
      { label: "Timing", value: 6 },
    ],
    coachNote: [
      "Hale leaned in when you stopped reciting and made a claim. That's where you won him.",
      "The rehearsed weakness line undid it. He'd heard it forty times. Give him something true.",
    ],
    landed: [
      "Held the silence instead of filling it nervously.",
      "Named a concrete win, not a vague 'team player' line.",
    ],
    workOn: [
      "The canned weakness answer cost you all your credibility.",
      "You qualified your wins with 'just' and 'kind of.'",
    ],
  },
  "waiting-room": {
    duration: 444, // 07:24
    rapport: [
      { t: 0, v: 0.22 },
      { t: 64, v: 0.34 },
      { t: 150, v: 0.62 }, // best 02:30
      { t: 220, v: 0.56 },
      { t: 280, v: 0.44 },
      { t: 332, v: 0.24 }, // fumble 05:32
      { t: 390, v: 0.36 },
      { t: 444, v: 0.46 },
    ],
    marks: [
      {
        t: 150,
        label: "BEST LINE 02:30",
        quote: "Broken clock, broken promises. At least the chairs are honest.",
        tone: "paper",
      },
      {
        t: 332,
        label: "THE FUMBLE 05:32",
        quote: "...yeah. Crazy weather we're having.",
        tone: "amber",
      },
    ],
    score: 5.6,
    verdict: "You cracked him open, then retreated to the weather. Stay brave.",
    sub: [
      { label: "Confidence", value: 5 },
      { label: "Listening", value: 6 },
      { label: "Wit", value: 6 },
      { label: "Timing", value: 4 },
    ],
    coachNote: [
      "Marcus is guarded by default, and your honest little joke got an actual smile out of him.",
      "Then you panicked and reached for small talk. The weather line is where rapport went to die.",
    ],
    landed: [
      "Named the awkwardness instead of pretending it away.",
      "Matched his low energy rather than forcing cheer.",
    ],
    workOn: [
      "Don't retreat to weather the second it gets quiet.",
      "You let two of his openings pass without picking them up.",
    ],
  },
};

const FALLBACK: Debrief = {
  duration: 480, // 08:00
  rapport: [
    { t: 0, v: 0.35 },
    { t: 80, v: 0.5 },
    { t: 150, v: 0.72 },
    { t: 220, v: 0.64 },
    { t: 300, v: 0.5 },
    { t: 348, v: 0.3 },
    { t: 420, v: 0.48 },
    { t: 480, v: 0.6 },
  ],
  marks: [
    {
      t: 150,
      label: "BEST LINE 02:30",
      quote: "Say the thing you'd say if you weren't trying to be liked.",
      tone: "paper",
    },
    {
      t: 348,
      label: "THE FUMBLE 05:48",
      quote: "Sorry, what were we talking about?",
      tone: "amber",
    },
  ],
  score: 6.5,
  verdict: "A good run. You lost the thread in the middle, then found your way back.",
  sub: [
    { label: "Confidence", value: 7 },
    { label: "Listening", value: 6 },
    { label: "Wit", value: 6 },
    { label: "Timing", value: 6 },
  ],
  coachNote: [
    "You opened well and recovered well, the middle is where the conversation drifted.",
    "Pick one thread and stay with it instead of starting three you don't finish.",
  ],
  landed: ["Strong, specific opener.", "Recovered after the dip instead of bailing."],
  workOn: ["Lost the thread mid-conversation.", "A couple of questions came too fast."],
};

/* -------------------------------------------------------------------------- */

export default function Debrief() {
  const { slug } = useParams<{ slug: string }>();
  const scene = getScene(slug);
  const reduce = useReducedMotion();

  if (!scene) return <Navigate to="/" replace />;

  const data = DEBRIEFS[scene.slug] ?? FALLBACK;
  const [whole, decimal] = data.score.toFixed(1).split(".");

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: "easeOut" as const, delay },
        };

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
          className="shrink-0 font-mono text-[13px] tracking-[0.08em] text-paper-dim transition-colors duration-300 ease-[var(--ease-cinema)] hover:text-paper"
        >
          HOME
        </Link>
      </TopBar>
      <div className="mx-auto w-full max-w-6xl px-6 pb-14 md:px-10">

        {/* HERO — the rapport curve */}
        <motion.div className="mt-14" {...rise(0.05)}>
          <RapportChart
            points={data.rapport}
            marks={data.marks}
            duration={data.duration}
          />
        </motion.div>

        <Hairline className="mt-16" />

        {/* TWO COLUMNS */}
        <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* LEFT — the score + verdict */}
          <motion.div {...rise(0.15)}>
            <Kicker as="h2">The Verdict</Kicker>
            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-7xl font-light leading-[0.85] tracking-tight text-paper sm:text-8xl lg:text-9xl">
                {whole}
                <span className="text-paper-dim">.{decimal}</span>
              </span>
              <span className="mb-3 font-mono text-base text-paper-faint">/10</span>
            </div>
            <p className="mt-8 max-w-md font-display text-2xl italic leading-snug text-paper">
              {data.verdict}
            </p>
          </motion.div>

          {/* RIGHT — sub-scores, coach's note, the two lists */}
          <motion.div {...rise(0.25)}>
            <Kicker as="h2">Breakdown</Kicker>
            <div className="mt-6 flex flex-col gap-5">
              {data.sub.map((s) => (
                <SubScoreRow key={s.label} label={s.label} value={s.value} />
              ))}
            </div>

            <div className="mt-12">
              <Kicker as="p">Coach's Note</Kicker>
              <div className="mt-4 space-y-3">
                {data.coachNote.map((line, i) => (
                  <p
                    key={i}
                    className="font-display text-[18px] italic leading-relaxed text-paper-dim"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              <div>
                <Kicker as="p">What Landed</Kicker>
                <ul className="mt-4">
                  {data.landed.map((line, i) => (
                    <li key={i}>
                      {i > 0 && <Hairline className="my-3 bg-hairline-soft" />}
                      <span className="font-display text-[16px] leading-snug text-paper">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Kicker as="p">What To Work On</Kicker>
                <ul className="mt-4">
                  {data.workOn.map((line, i) => (
                    <li key={i}>
                      {i > 0 && <Hairline className="my-3 bg-hairline-soft" />}
                      <span className="font-display text-[16px] leading-snug text-paper">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        <Hairline className="mt-16" />

        {/* BOTTOM — actions */}
        <motion.div
          className="mt-10 flex flex-wrap items-center gap-x-12 gap-y-6"
          {...rise(0.35)}
        >
          <AmberAction to={`/scene/${scene.slug}/live`} size="lg">
            Retry Scene
          </AmberAction>
        </motion.div>
      </div>
    </div>
  );
}
