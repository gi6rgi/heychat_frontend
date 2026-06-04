# HeyRizz — Frontend

Web client for the voice trainer. The user picks a scenario and talks to an AI
partner with their voice, right in the browser.

Stack (same as the `heyspark_frontend_v3` reference, but with an **orange**
accent): React 19 · Vite · TypeScript · Tailwind v4 (theme via `@theme inline`
+ oklch) · shadcn/Base UI · TanStack Query · React Router · Motion · Lucide.

## Run

```bash
npm install
cp .env.example .env        # adjust the backend URLs if needed
npm run dev                 # http://localhost:3000 (proxies /scenarios and /ws to :8000)
```

The backend must be running (see `../backend`). In dev, Vite proxies REST and
the WebSocket to `localhost:8000`.

## Commands
- `npm run dev` — dev server
- `npm run build` — `tsc` + production build
- `npm run lint` — ESLint
- `npx shadcn@latest add <component>` — add a shadcn component

## Structure
```
src/
├── pages/        Scenarios (list) and Session (voice conversation)
├── components/   ui/ (shadcn Button), layout/, voice/ (MicOrb, TranscriptFeed), ScenarioCard
├── hooks/        useScenarios, useVoiceSession (WS + audio orchestrator)
├── audio/        recorder.ts (mic → PCM16 16k), player.ts (PCM16 24k player)
├── services/     scenarios.ts (REST)
├── lib/          api-client, utils (cn), query-keys
├── types/        api.ts (Scenario + WS protocol)
└── index.css     theme (orange accent)
public/worklets/pcm-capture.js   microphone capture AudioWorklet
```

## Voice protocol (matches the backend)
- The microphone is captured in an `AudioContext({sampleRate:16000})`; the
  worklet quantises to **PCM16 mono 16 kHz** and sends it as **binary** WS frames.
- The agent's audio arrives as **binary** frames (PCM16 mono 24 kHz) and is
  played through the `VoicePlayer` queue (gapless buffer scheduling).
- Text JSON messages: `ready` / `transcript` / `interrupted` / `turn_complete`
  / `error` (see `src/types/api.ts`).
- On `interrupted` (barge-in) the playback queue is flushed.

> Note: audio capture requires a user gesture (the "Start conversation" button)
> and HTTPS or `localhost` for microphone access.
