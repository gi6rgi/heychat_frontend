/**
 * Scene presentation model for the cinema UI.
 *
 * The catalog now lives in the backend `scenarios` table (seeded from
 * scenarios.json) — every scene, catalog or user-created, arrives as a backend
 * `Scenario` and is adapted into the richer `Scene` shape here. Art paths are
 * bucket-relative; lib/storage.ts builds the public CDN URLs.
 *
 * Posters have their titles baked in (poster-wall art direction); the
 * establishing and conversation stills are clean (no baked type), so screens
 * render the title in code.
 */

import { sceneImageUrl } from "@/lib/storage";
import type { Scenario } from "@/types/api";

export type Genre = "DATING" | "EVERYDAY" | "WORK" | "CHAOS";
export type Ambience = "bar" | "cafe" | "office" | "room" | "none";

export interface Scene {
  /** scenario id, also the route param */
  slug: string;
  /** backend scenario id opened by the voice session */
  scenarioId: string;
  /** "01".."09" — shown in the mono metadata line + kickers */
  number: string;
  title: string;
  genre: Genre;
  /** exactly three, shown beneath the poster: DATING · NIGHT · BOLD */
  tags: [string, string, string];
  /** the other character: shown top-right in the live view */
  character: string;
  /** the character's opening emotional state */
  emotion: string;
  /** film-copy description, second person — Detail screen */
  logline: string;
  /** short imperative goal chip ("Get her phone number"); null = plain chat */
  goal: string | null;
  /** plain-language briefing: what to do + what counts as winning */
  objective: string | null;
  poster: string;
  /** establishing scene art, near-full quality for the full-screen Detail hero; null → dark placeholder */
  still: string | null;
  /** tiny, heavily compressed variant of `still` for the dimmed Library hover wash */
  backdrop: string | null;
  /** POV "they're looking at you" shot for the Live screen; falls back to `still` */
  conversation?: string | null;
  ambience: Ambience;
  locked: boolean;
  isNew: boolean;
  /** two seed subtitle lines so the live view shows its anatomy pre-connect */
  openingLines: [string, string];
}

export const GENRES: ("ALL" | Genre)[] = [
  "ALL",
  "DATING",
  "EVERYDAY",
  "WORK",
  "CHAOS",
];

/** Adapt a backend scenario (catalog or user-created) into the cinema shape. */
export function toScene(s: Scenario): Scene {
  return {
    slug: s.id,
    scenarioId: s.id,
    number: s.display_number ?? "00",
    title: s.title,
    genre: (s.genre as Genre) ?? "EVERYDAY",
    tags:
      s.tags && s.tags.length === 3
        ? (s.tags as [string, string, string])
        : ["CUSTOM", "ROLEPLAY", "OPEN"],
    // Custom characters have no display name — first word of the title
    // ("Luna — calm evening company" → "Luna").
    character: s.character_name ?? s.title.split(/[\s—–-]/)[0] ?? "Partner",
    emotion: s.emotion ?? "present",
    logline: s.logline ?? s.description,
    goal: s.goal,
    objective: s.objective,
    // The raw PNGs are ~0.6-4 MB each and tanked LCP. Route everything through
    // the transform CDN (WebP, CDN-cached). Pass an explicit aspect box
    // (posters 2:3, stills 16:9) with resize=cover: with width only, Supabase
    // keeps the source height and distorts the image.
    //
    // Two still variants by use: `still`/`conversation` are full-screen heroes
    // (Detail + Live) at the source's native 1376w, near-lossless quality —
    // WebP keeps q95 at ~170 KB (vs the 600 KB raw PNG), visually the original.
    // `backdrop` is the dimmed (42%) Library hover wash, where 7 load eagerly,
    // so it's tiny and crunchy.
    poster:
      sceneImageUrl(s.poster_path, {
        width: 600,
        height: 900,
        resize: "cover",
        quality: 72,
      }) ?? "",
    still: sceneImageUrl(s.establishing_path, {
      width: 1376,
      height: 768,
      resize: "cover",
      quality: 95,
    }),
    backdrop: sceneImageUrl(s.establishing_path, {
      width: 768,
      height: 432,
      resize: "cover",
      quality: 50,
    }),
    conversation: sceneImageUrl(s.conversation_path, {
      width: 1376,
      height: 768,
      resize: "cover",
      quality: 95,
    }),
    ambience: (s.ambience as Ambience) ?? "room",
    locked: s.locked,
    isNew: s.is_new,
    openingLines:
      s.opening_lines && s.opening_lines.length >= 2
        ? [s.opening_lines[0], s.opening_lines[1]]
        : ["", ""],
  };
}
