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
  /** establishing scene art (Detail screen + Library hover); null → dark placeholder */
  still: string | null;
  /** POV "they're looking at you" shot for the Live screen; falls back to `still` */
  conversation?: string | null;
  ambience: Ambience;
  locked: boolean;
  isNew: boolean;
  /** 0–5, rendered as ★/☆ in the metadata line; null when locked/unplayed */
  stars: number | null;
  /** best score 0–100 in the metadata line; null when locked/unplayed */
  best: number | null;
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
    poster: sceneImageUrl(s.poster_path) ?? "",
    still: sceneImageUrl(s.establishing_path),
    conversation: sceneImageUrl(s.conversation_path),
    ambience: (s.ambience as Ambience) ?? "room",
    locked: s.locked,
    isNew: s.is_new,
    stars: null,
    best: null,
    openingLines:
      s.opening_lines && s.opening_lines.length >= 2
        ? [s.opening_lines[0], s.opening_lines[1]]
        : ["", ""],
  };
}
