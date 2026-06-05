/**
 * Client-side scene catalog — the source of truth for the redesigned UI.
 *
 * The backend `Scenario` type only carries id/title/description/system_instruction,
 * so all the cinematic metadata the new design needs (poster art, genre, logline,
 * character, live emotion, score) lives here. `scenarioId` maps a catalog scene to
 * the backend scenario the voice session actually opens; `still` is the clean
 * full-bleed art for Detail/Live (null → screens render a dark placeholder).
 *
 * Image assets live in the public Supabase Storage `scenes` bucket as
 * catalog/<slug>/{poster,establishing,conversation}.png (see lib/storage.ts).
 * Posters have their titles baked in (poster-wall art direction); the establishing
 * and conversation stills are clean (no baked type), so screens render the title in code.
 */

import { catalogImage } from "@/lib/storage";

export type Genre = "DATING" | "EVERYDAY" | "WORK" | "CHAOS";
export type Ambience = "bar" | "cafe" | "office" | "room" | "none";

export interface Scene {
  /** url-safe id, also the route param */
  slug: string;
  /** backend scenario id opened by the voice session (placeholder mapping) */
  scenarioId: string;
  /** "01".."08" — shown in the mono metadata line + kickers */
  number: string;
  title: string;
  genre: Genre;
  /** exactly three, shown beneath the poster: DATING · NIGHT · BOLD */
  tags: [string, string, string];
  /** the other character: shown top-right in the live view */
  character: string;
  /** the character's opening emotional state (placeholder live signal) */
  emotion: string;
  /** film-copy description, second person, witty — Detail screen */
  logline: string;
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

export const SCENES: Scene[] = [
  {
    slug: "cafe-terrace",
    scenarioId: "small-talk",
    number: "02",
    title: "Café Terrace",
    genre: "DATING",
    tags: ["DATING", "DAYTIME", "EASY"],
    character: "Sofia",
    emotion: "absorbed",
    logline:
      "Sofia is reading alone at the next table. The chair across from her is free. Say something worth looking up for.",
    poster: catalogImage("cafe-terrace", "poster"),
    still: catalogImage("cafe-terrace", "establishing"),
    conversation: catalogImage("cafe-terrace", "conversation"),
    ambience: "cafe",
    locked: false,
    isNew: false,
    stars: 3,
    best: 68,
    openingLines: [
      "Sorry, is anyone sitting here?",
      "Oh. No, go ahead. It's a good spot for the sun.",
    ],
  },
  {
    slug: "dive-bar",
    scenarioId: "flirt-bar",
    number: "01",
    title: "Dive Bar",
    genre: "DATING",
    tags: ["DATING", "NIGHT", "BOLD"],
    character: "Lena",
    emotion: "intrigued",
    logline:
      "Lena's been nursing the same drink for an hour, under a neon sign that reads Liquor, Beer & Regrets. She looks like she's got all three.",
    poster: catalogImage("dive-bar", "poster"),
    still: catalogImage("dive-bar", "establishing"),
    ambience: "bar",
    locked: false,
    isNew: false,
    stars: 4,
    best: 74,
    openingLines: [
      "You look like you've got a story.",
      "That depends... you wanna hear the truth, or the version that sounds better?",
    ],
  },
  {
    slug: "waiting-room",
    scenarioId: "small-talk",
    number: "03",
    title: "Waiting Room",
    genre: "EVERYDAY",
    tags: ["EVERYDAY", "SMALL TALK", "EASY"],
    character: "Marcus",
    emotion: "guarded",
    logline:
      "Two plastic chairs, one broken clock, and a stranger who clearly doesn't want to be here either. Forty minutes to kill. Go.",
    poster: catalogImage("waiting-room", "poster"),
    still: null,
    ambience: "room",
    locked: false,
    isNew: false,
    stars: 2,
    best: 51,
    openingLines: [
      "They said twenty minutes. That was an hour ago.",
      "...You too, huh. Guess we're roommates now.",
    ],
  },
  {
    slug: "first-date",
    scenarioId: "flirt-bar",
    number: "04",
    title: "First Date",
    genre: "DATING",
    tags: ["DATING", "ROMANCE", "BOLD"],
    character: "Maya",
    emotion: "hopeful",
    logline:
      "First date, golden hour, two milkshakes between you. She's giving you exactly one chance to not be boring.",
    poster: catalogImage("first-date", "poster"),
    still: null,
    ambience: "cafe",
    locked: false,
    isNew: true,
    stars: null,
    best: null,
    openingLines: [
      "Okay, be honest, did you pick this place, or did the app?",
      "Because if it was you, that's actually kind of a green flag.",
    ],
  },
  {
    slug: "job-interview",
    scenarioId: "job-interview",
    number: "05",
    title: "Job Interview",
    genre: "WORK",
    tags: ["WORK", "PRESSURE", "HARD"],
    character: "Mr. Hale",
    emotion: "skeptical",
    logline:
      "He's read your résumé twice and said nothing. Convince him you're the one worth the desk, the title, and the silence he keeps letting hang.",
    poster: catalogImage("job-interview", "poster"),
    still: null,
    ambience: "office",
    locked: false,
    isNew: false,
    stars: 3,
    best: 62,
    openingLines: [
      "So. Walk me through why you're sitting in that chair.",
      "And try not to tell me what you think I want to hear.",
    ],
  },
  {
    slug: "red-eye",
    scenarioId: "flirt-bar",
    number: "06",
    title: "Red Eye",
    genre: "CHAOS",
    tags: ["CHAOS", "NIGHT", "WILD"],
    character: "Nadia",
    emotion: "distant",
    logline:
      "2 a.m., last train, nowhere to be. The girl by the window hasn't blinked since the last stop.",
    poster: catalogImage("red-eye", "poster"),
    still: null,
    ambience: "room",
    locked: true,
    isNew: false,
    stars: null,
    best: null,
    openingLines: ["", ""],
  },
  {
    slug: "laundromat",
    scenarioId: "small-talk",
    number: "07",
    title: "Laundromat",
    genre: "EVERYDAY",
    tags: ["EVERYDAY", "QUIET", "WARM"],
    character: "Iris",
    emotion: "shy",
    logline:
      "Spin cycle, fluorescent hum, and someone who's been reading the same paragraph since you walked in.",
    poster: catalogImage("laundromat", "poster"),
    still: null,
    ambience: "room",
    locked: true,
    isNew: false,
    stars: null,
    best: null,
    openingLines: ["", ""],
  },
  {
    slug: "wedding-table",
    scenarioId: "flirt-bar",
    number: "08",
    title: "Wedding Table",
    genre: "CHAOS",
    tags: ["CHAOS", "STRANGERS", "BOLD"],
    character: "Dani",
    emotion: "playful",
    logline:
      "Table 14, the singles table. Strangers in formalwear, an open bar, and three hours until the speeches.",
    poster: catalogImage("wedding-table", "poster"),
    still: null,
    ambience: "room",
    locked: true,
    isNew: false,
    stars: null,
    best: null,
    openingLines: ["", ""],
  },
];

export function getScene(slug: string | undefined): Scene | undefined {
  return SCENES.find((s) => s.slug === slug);
}
