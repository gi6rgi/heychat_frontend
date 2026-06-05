import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Mic, MicOff, Volume2, VolumeX, PhoneOff } from "lucide-react";
import { AmberAction, Container, Kicker, Meter, Waveform } from "@/components/cinema";
import { SceneTimer } from "@/components/live/SceneTimer";
import { Subtitles } from "@/components/live/Subtitles";
import { RoundButton } from "@/components/live/RoundButton";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { useScenario } from "@/hooks/useScenarios";
import { useAmbience } from "@/hooks/useAmbience";
import { scenarioAmbience, type Ambience } from "@/audio/ambience";
import { toScene, type Scene } from "@/lib/scenes";

/**
 * Live Scene (brief 3.3) — full-bleed scene still under a neutral dark
 * legibility wash, with diegetic subtitles + a projector timer floating over the
 * film. No panels, no cards. The audio pipeline (useVoiceSession) is wired as-is;
 * this screen only composes its presentation.
 */
export default function LiveScene() {
  const { slug } = useParams<{ slug: string }>();

  // Every scene — catalog or user-created — lives in the backend. The hook
  // keeps polling while a created scene's art is still being painted, so the
  // conversation still fades in as it lands.
  const { data: scenario } = useScenario(slug);
  const scene: Scene | undefined = useMemo(
    () => (scenario ? toScene(scenario) : undefined),
    [scenario],
  );

  const scenarioId = scene?.scenarioId ?? slug;
  const {
    status,
    error,
    limitNotice,
    goalResult,
    conversationId,
    transcripts,
    isAgentSpeaking,
    muted,
    inputLevel,
    start,
    stop,
    toggleMute,
  } = useVoiceSession(scenarioId);

  // Ambience bed: on by default, only sounds while the session is live.
  const ambKind: Ambience = scene
    ? scene.ambience
    : scenarioAmbience(scenarioId);
  const [ambienceOn, setAmbienceOn] = useState(true);
  useAmbience(ambienceOn ? ambKind : "none", status === "live");

  // Rapport placeholder: starts ~0.35, drifts up slowly while live.
  const [rapport, setRapport] = useState(0.35);
  useEffect(() => {
    if (status !== "live") return;
    const id = setInterval(() => {
      setRapport((r) => Math.min(0.92, r + 0.015));
    }, 4000);
    return () => clearInterval(id);
  }, [status]);

  // Auto-start on arrival: the Detail "Start Scene" action and the create-flow
  // reveal navigate straight here, so we begin the session immediately (the mic
  // permission prompt is the only gate) instead of showing a second button.
  // Deferred via a cancellable timeout so StrictMode's dev double-mount can't
  // race a half-started session against the simulated unmount's cleanup
  // (which used to close the player mid-start → live scene with no voice).
  useEffect(() => {
    if (!scenarioId || status !== "idle") return;
    const t = setTimeout(() => void start(), 50);
    return () => clearTimeout(t);
  }, [scenarioId, status, start]);

  if (!scene) return null;

  // Subtitle source: pre-connect uses the seed opening lines so the anatomy
  // reads like the reference even with no backend; live uses real transcripts.
  const agentLines = transcripts.filter((t) => t.role === "agent");
  const lastUser = [...transcripts].reverse().find((t) => t.role === "user");

  let previous: string | undefined;
  let current: string;
  let hint: string | undefined;

  if (status === "live" && agentLines.length > 0) {
    current = agentLines[agentLines.length - 1].text;
    previous = agentLines[agentLines.length - 2]?.text;
    hint = lastUser?.text;
  } else {
    // idle / connecting / ended / no-transcript-yet → seeded sample lines
    previous = scene.openingLines[0] || undefined;
    current = scene.openingLines[1] || scene.openingLines[0] || "";
  }

  const waveActive = isAgentSpeaking || inputLevel > 0.04;
  const characterName = scene.character.toUpperCase();
  // Prefer the POV conversation shot; fall back to the establishing still.
  const liveImage = scene.conversation ?? scene.still;

  return (
    <div className="fixed inset-0 overflow-hidden bg-night-deep text-paper">
      {/* full-bleed conversation shot (or establishing fallback, or dark).
          Keyed + faded so freshly generated art melts in instead of popping. */}
      {liveImage ? (
        <motion.img
          key={liveImage}
          src={liveImage}
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {/* neutral dark legibility wash — heavier toward the bottom third. Single
          hue (night-deep), NOT a colored/brand gradient. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(20,19,17,0.55) 0%, rgba(20,19,17,0.15) 28%, rgba(20,19,17,0.35) 62%, rgba(20,19,17,0.92) 100%)",
        }}
      />

      <Container className="relative z-10 flex h-full flex-col justify-between py-8 md:py-12">
        {/* TOP ROW: scene id + timer (left), character + emotion (right) */}
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-3">
            <Kicker className="text-paper-dim">
              {scene.title.toUpperCase()}
            </Kicker>
            <SceneTimer running={status === "live"} />
          </div>

          <div className="flex flex-col items-end gap-1.5 text-right">
            <h1 className="font-display text-2xl uppercase leading-none tracking-[0.02em] text-paper">
              {characterName}
            </h1>
            <span className="font-display text-base italic leading-none text-amber">
              {scene.emotion}
            </span>
          </div>
        </header>

        {/* BOTTOM STACK — waveform · subtitles · controls */}
        <div className="flex flex-col gap-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5">
            <Waveform active={waveActive} level={inputLevel} className="h-7 w-56" />

            {current ? (
              <Subtitles previous={previous} current={current} hint={hint} />
            ) : (
              <p className="font-display text-2xl italic text-paper-faint">
                The scene is set.
              </p>
            )}

            {/* goal verdict from the persona's end_conversation call */}
            {goalResult && status === "ended" && (
              <div className="flex flex-col items-center gap-2 text-center">
                <Kicker
                  className={
                    goalResult.outcome === "success"
                      ? "text-amber"
                      : "text-paper-dim"
                  }
                >
                  {goalResult.outcome === "success"
                    ? "SCENE COMPLETE"
                    : "SCENE OVER"}
                </Kicker>
                <p className="max-w-xl font-display text-lg italic leading-snug text-paper/90">
                  {goalResult.reason}
                </p>
              </div>
            )}

            {/* usage-limit notice (daily budget, session cap) — info, not error */}
            {limitNotice && (
              <p className="max-w-xl text-center font-display text-lg italic leading-snug text-amber/90">
                {limitNotice}
              </p>
            )}

            {/* connection error detail above the retry affordance */}
            {status === "error" && error && (
              <p className="max-w-xl text-center font-display text-lg italic leading-snug text-paper-dim">
                {error}
              </p>
            )}

            {/* primary affordance, state-dependent */}
            <div className="mt-1 flex items-center gap-8">
              {(status === "idle" || status === "connecting") && (
                <Kicker className="text-paper-dim">CONNECTING…</Kicker>
              )}
              {status === "error" && (
                <AmberAction onClick={start} size="lg">
                  RETRY
                </AmberAction>
              )}
              {status === "ended" && (
                <AmberAction
                  to={`/scene/${scene.slug}/debrief${conversationId ? `?c=${conversationId}` : ""}`}
                  size="lg"
                >
                  DEBRIEF
                </AmberAction>
              )}
              {status === "live" && (
                <AmberAction tone="dim" arrow={false} onClick={stop}>
                  <span className="inline-flex items-center gap-2">
                    <PhoneOff className="size-3.5" aria-hidden />
                    END
                  </span>
                </AmberAction>
              )}
            </div>
          </div>

          {/* controls row: rapport label (left) · circular controls (right) */}
          <div className="flex items-end justify-between gap-6">
            <Kicker className="text-paper-dim">RAPPORT</Kicker>
            <div className="flex items-start gap-5">
              <RoundButton
                ariaLabel={muted ? "Unmute microphone" : "Mute microphone"}
                on={!muted && status === "live"}
                onClick={toggleMute}
              >
                {muted ? (
                  <MicOff className="size-5" aria-hidden />
                ) : (
                  <Mic className="size-5" aria-hidden />
                )}
              </RoundButton>
              <RoundButton
                ariaLabel={ambienceOn ? "Mute ambience" : "Unmute ambience"}
                on={ambienceOn}
                label="AMBIENCE"
                onClick={() => setAmbienceOn((a) => !a)}
              >
                {ambienceOn ? (
                  <Volume2 className="size-5" aria-hidden />
                ) : (
                  <VolumeX className="size-5" aria-hidden />
                )}
              </RoundButton>
            </div>
          </div>
        </div>
      </Container>

      {/* rapport meter pinned to the very bottom edge, full width */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <Meter value={rapport} head />
      </div>
    </div>
  );
}
