/**
 * Static content for the create flow: the option cards for each step. The
 * actual character generation is LLM-powered on the backend
 * (/characters/generate) — this module only describes the choices we show.
 */
export interface VibeCard {
  id: string;
  title: string;
  description: string;
  /** Card art, /create/<id>.png. */
  image: string;
}

/** Companion vibes; step 1's option cards. */
export const VIBE_CARDS: VibeCard[] = [
  {
    id: "warm-listener",
    image: "/create/warm-listener.png",
    title: "Warm Listener",
    description: "Calm, present, easy to open up to.",
  },
  {
    id: "playful-spark",
    image: "/create/playful-spark.png",
    title: "Playful Spark",
    description: "Light teasing, fun, spontaneous energy.",
  },
  {
    id: "deep-mind",
    image: "/create/deep-mind.png",
    title: "Deep Mind",
    description: "Reflective questions, emotional depth.",
  },
  {
    id: "mysterious-muse",
    image: "/create/mysterious-muse.png",
    title: "Mysterious Muse",
    description: "Intriguing, cinematic, story-driven.",
  },
  {
    id: "confident-coach",
    image: "/create/confident-coach.png",
    title: "Confident Coach",
    description: "Motivating, direct, moves you forward.",
  },
];

/** Create flow, step 1: who the companion is. */
export const WHO_CARDS: VibeCard[] = VIBE_CARDS;

/** Create flow, step 2: where the scene takes place. */
export const SCENE_CARDS: VibeCard[] = [
  {
    id: "rooftop-bar",
    image: "/create/rooftop-bar.png",
    title: "Rooftop bar at sunset",
    description: "City lights, warm breeze, cold drinks.",
  },
  {
    id: "night-train",
    image: "/create/night-train.png",
    title: "Mountain sleeper train",
    description: "A rocking carriage, a stranger across.",
  },
  {
    id: "rainy-cafe",
    image: "/create/rainy-cafe.png",
    title: "Rainy day coffee shop",
    description: "Steamed-up windows, slow jazz, no rush.",
  },
  {
    id: "beach-bonfire",
    image: "/create/beach-bonfire.png",
    title: "Midnight beach bonfire",
    description: "Crackling fire, blankets, falling stars.",
  },
  {
    id: "starship-lounge",
    image: "/create/starship-lounge.png",
    title: "Spaceship lounge",
    description: "Humming engines, nebulas past the glass.",
  },
];

/** Create flow, step 3: the goal to chase. */
export const GOAL_CARDS: VibeCard[] = [
  {
    id: "get-number",
    image: "/create/get-number.png",
    title: "Get their phone number",
    description: "Charm your way to those ten digits.",
  },
  {
    id: "second-date",
    image: "/create/second-date.png",
    title: "Land a second date",
    description: "Make tonight earn a next time.",
  },
  {
    id: "better-price",
    image: "/create/better-price.png",
    title: "Negotiate a better price",
    description: "Hold your ground, walk out with a deal.",
  },
  {
    id: "firm-no",
    image: "/create/firm-no.png",
    title: "Say no without apologizing",
    description: "Set the boundary and keep it warm.",
  },
  {
    id: "three-laughs",
    image: "/create/three-laughs.png",
    title: "Make them laugh",
    description: "Three real laughs. Corny counts.",
  },
];
