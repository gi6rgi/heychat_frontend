import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Mic, MicOff, PhoneOff, Settings } from "lucide-react";
import { AmberAction, Container, Kicker, Waveform } from "@/components/cinema";
import { SceneTimer } from "@/components/live/SceneTimer";
import { Subtitles, type SubtitleLine } from "@/components/live/Subtitles";
import { cleanTranscript } from "@/lib/transcript";
import { RoundButton } from "@/components/live/RoundButton";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { useScenario } from "@/hooks/useScenarios";
import { useAmbience } from "@/hooks/useAmbience";
import { scenarioAmbience, type Ambience } from "@/audio/ambience";
import { getPreferredMic, getPreferredSpeaker } from "@/audio/devices";
import { toScene, type Scene } from "@/lib/scenes";
import { cn } from "@/lib/utils";

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
    setMicDevice,
    setSpeakerDevice,
  } = useVoiceSession(scenarioId);

  // Audio device picker: devices are enumerated when the panel opens (labels
  // are only populated once the mic permission is granted, which the
  // auto-started session already did).
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState<string | null>(() => getPreferredMic());
  const [speakerId, setSpeakerId] = useState<string | null>(() =>
    getPreferredSpeaker(),
  );
  const canPickSpeaker = "setSinkId" in AudioContext.prototype;

  async function toggleDevices() {
    if (devicesOpen) {
      setDevicesOpen(false);
      return;
    }
    const all = await navigator.mediaDevices.enumerateDevices();
    setInputs(all.filter((d) => d.kind === "audioinput" && d.deviceId));
    setOutputs(all.filter((d) => d.kind === "audiooutput" && d.deviceId));
    setDevicesOpen(true);
  }

  function pickMic(deviceId: string) {
    setMicId(deviceId);
    setMicDevice(deviceId);
  }

  function pickSpeaker(deviceId: string) {
    setSpeakerId(deviceId);
    setSpeakerDevice(deviceId);
  }

  // Ambience bed: always on, only sounds while the session is live.
  const ambKind: Ambience = scene
    ? scene.ambience
    : scenarioAmbience(scenarioId);
  useAmbience(ambKind, status === "live");

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
  // Lines carry stable per-turn ids (so streamed fragments grow in place) and
  // are cleaned down to the spoken words (stage directions stripped).
  const agentLines = transcripts.filter((t) => t.role === "agent");
  const lastUser = [...transcripts].reverse().find((t) => t.role === "user");

  let previous: SubtitleLine | undefined;
  let current: SubtitleLine;
  let hint: SubtitleLine | undefined;

  if (status === "live" && agentLines.length > 0) {
    const last = agentLines[agentLines.length - 1];
    current = { id: last.id, text: cleanTranscript(last.text) };
    const prev = agentLines[agentLines.length - 2];
    previous = prev
      ? { id: prev.id, text: cleanTranscript(prev.text) }
      : undefined;
    hint = lastUser
      ? { id: lastUser.id, text: cleanTranscript(lastUser.text) }
      : undefined;
  } else {
    // idle / connecting / ended / no-transcript-yet → seeded sample lines
    previous = scene.openingLines[0]
      ? { id: "seed-prev", text: scene.openingLines[0] }
      : undefined;
    current = {
      id: "seed-current",
      text: scene.openingLines[1] || scene.openingLines[0] || "",
    };
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
        {/* TOP ROW: goal plate (left), character + timer (right) */}
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-col">
            {/* the goal as a quest banner, bleeding to the screen's left edge.
                The plate is OPAQUE black inside an OPAQUE 1px amber shell,
                clipped to the arrow shape, and the finished composite is faded
                with `opacity` — that's the one way to get a translucent fill
                plus an edge that follows the clip without the edge color
                bleeding through the fill (the khaki bug). Text sits on top,
                outside the fade, at full strength. */}
            {scene.goal && (
              <div className="relative -ml-6 self-start md:-ml-10">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-amber p-px opacity-65 [clip-path:polygon(0_0,calc(100%_-_28px)_0,100%_50%,calc(100%_-_28px)_100%,0_100%)]"
                >
                  <div className="h-full w-full bg-black [clip-path:polygon(0_0,calc(100%_-_28px)_0,100%_50%,calc(100%_-_28px)_100%,0_100%)]" />
                </div>
                <div className="relative py-3 pl-6 pr-16">
                  <span className="font-label text-[11px] font-medium uppercase tracking-[0.2em] text-amber">
                    Goal
                  </span>
                  <p className="mt-1 font-display text-2xl font-light leading-tight text-amber">
                    {scene.goal}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 pt-3 text-right">
            <h1 className="font-display text-2xl uppercase leading-none tracking-[0.02em] text-paper">
              {characterName}
            </h1>
            <SceneTimer
              running={status === "live"}
              className="text-2xl text-paper-dim"
            />
          </div>
        </header>

        {/* BOTTOM STACK — waveform · subtitles · controls */}
        <div className="flex flex-col gap-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5">
            <Waveform active={waveActive} level={inputLevel} className="h-7 w-56" />

            {current.text ? (
              <Subtitles previous={previous} current={current} hint={hint} />
            ) : (
              <p className="font-display text-2xl italic text-paper-faint">
                The scene is set.
              </p>
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

          {/* controls row: audio devices + mic toggle, bottom right */}
          <div className="flex items-end justify-end gap-5">
            <div className="relative">
              <RoundButton
                ariaLabel="Audio device settings"
                on={devicesOpen}
                onClick={() => void toggleDevices()}
              >
                <Settings className="size-5" aria-hidden />
              </RoundButton>

              {devicesOpen && (
                <div className="absolute bottom-full right-0 z-20 mb-4 flex w-80 flex-col gap-5 border border-hairline bg-night-deep/95 p-5 text-left">
                  <div className="flex flex-col gap-2">
                    <span className="font-label text-[11px] font-medium uppercase tracking-[0.16em] text-paper-faint">
                      Microphone
                    </span>
                    {inputs.map((d, i) => (
                      <button
                        key={d.deviceId}
                        type="button"
                        onClick={() => pickMic(d.deviceId)}
                        className={cn(
                          "truncate text-left font-label text-[12px] font-medium uppercase tracking-[0.08em] transition-colors duration-300",
                          micId === d.deviceId ||
                            (!micId && d.deviceId === "default")
                            ? "text-amber"
                            : "text-paper-dim hover:text-paper",
                        )}
                      >
                        {d.label || `Microphone ${i + 1}`}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-label text-[11px] font-medium uppercase tracking-[0.16em] text-paper-faint">
                      Speaker
                    </span>
                    {canPickSpeaker && outputs.length > 0 ? (
                      outputs.map((d, i) => (
                        <button
                          key={d.deviceId}
                          type="button"
                          onClick={() => pickSpeaker(d.deviceId)}
                          className={cn(
                            "truncate text-left font-label text-[12px] font-medium uppercase tracking-[0.08em] transition-colors duration-300",
                            speakerId === d.deviceId ||
                              (!speakerId && d.deviceId === "default")
                              ? "text-amber"
                              : "text-paper-dim hover:text-paper",
                          )}
                        >
                          {d.label || `Speaker ${i + 1}`}
                        </button>
                      ))
                    ) : (
                      <span className="font-display text-sm italic text-paper-faint">
                        Speaker choice isn't supported in this browser.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

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
          </div>
        </div>
      </Container>

      {/* MISSION VERDICT — the persona ended the scene: darken the film and
          stamp the outcome, with the coach's one-liner and the debrief door. */}
      {goalResult && status === "ended" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-night-deep/85 px-6 text-center"
        >
          {scene.goal && (
            <Kicker
              className={
                goalResult.outcome === "success"
                  ? "text-amber"
                  : "text-paper-dim"
              }
            >
              Goal · {scene.goal}
            </Kicker>
          )}
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.15,
              ease: [0.22, 0.61, 0.36, 1],
            }}
            className={cn(
              "font-display text-5xl font-light uppercase leading-[0.95] tracking-[-0.02em] sm:text-6xl md:text-7xl",
              goalResult.outcome === "success" ? "text-amber" : "text-paper",
            )}
          >
            {goalResult.outcome === "success"
              ? "Mission accomplished"
              : "Mission failed"}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              ease: [0.22, 0.61, 0.36, 1],
            }}
            className="max-w-xl font-display text-2xl italic leading-snug text-paper/90 [font-variation-settings:'opsz'_40,'SOFT'_30,'WONK'_0]"
          >
            {goalResult.reason}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.45,
              ease: [0.22, 0.61, 0.36, 1],
            }}
            className="mt-4"
          >
            <AmberAction
              to={`/scene/${scene.slug}/debrief${conversationId ? `?c=${conversationId}` : ""}`}
              size="lg"
            >
              Debrief
            </AmberAction>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
