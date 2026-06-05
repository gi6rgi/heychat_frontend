/**
 * Static content for the Conversational Match flow: intent chips for the
 * conversational intake and the Tinder-style vibe cards. The actual matching
 * and character generation are LLM-powered on the backend
 * (/characters/match, /characters/generate) — this module only describes the
 * choices we show.
 */
import {
  Brain,
  Flame,
  HeartHandshake,
  PartyPopper,
  Sparkles,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export interface MoodChip {
  label: string;
  icon: LucideIcon;
}

/** Quick intent chips for "What kind of companion would feel right today?" */
export const MOOD_CHIPS: MoodChip[] = [
  { label: "Calm and supportive", icon: HeartHandshake },
  { label: "Playful and fun", icon: PartyPopper },
  { label: "Deep conversation", icon: Brain },
  { label: "Fantasy story", icon: Wand2 },
  { label: "Motivation", icon: Flame },
  { label: "Surprise me", icon: Sparkles },
];

export interface VibeCard {
  id: string;
  title: string;
  description: string;
  tags: string[];
  /** Tailwind gradient classes for the card's accent. */
  accent: string;
  /** Big decorative emoji for the swipe-deck rendering. */
  emoji?: string;
}

/** "Pick the vibes that feel closest" — swiped Like / Maybe / Skip. */
export const VIBE_CARDS: VibeCard[] = [
  {
    id: "warm-listener",
    title: "Warm Listener",
    description: "Calm, emotionally present, easy to open up to.",
    tags: ["warm", "supportive", "low-pressure"],
    accent: "from-rose-400/25 to-pink-500/10",
    emoji: "🤗",
  },
  {
    id: "playful-spark",
    title: "Playful Spark",
    description: "Light teasing, fun energy, spontaneous conversations.",
    tags: ["playful", "fun", "flirty"],
    accent: "from-fuchsia-500/25 to-pink-600/10",
    emoji: "✨",
  },
  {
    id: "deep-mind",
    title: "Deep Mind",
    description:
      "Reflective questions, thoughtful conversations, emotional depth.",
    tags: ["deep", "thoughtful", "curious"],
    accent: "from-sky-400/20 to-indigo-500/10",
    emoji: "🧠",
  },
  {
    id: "mysterious-muse",
    title: "Mysterious Muse",
    description: "Intriguing, cinematic, story-driven energy.",
    tags: ["mysterious", "fantasy", "intense"],
    accent: "from-violet-500/30 to-purple-700/10",
    emoji: "🌙",
  },
  {
    id: "confident-coach",
    title: "Confident Coach",
    description: "Motivating, direct, helps you move forward.",
    tags: ["confident", "motivation", "bold"],
    accent: "from-purple-400/20 to-fuchsia-600/10",
    emoji: "🔥",
  },
];

/** Create flow, step 1: who the companion is. Swipe right to choose. */
export const WHO_CARDS: VibeCard[] = VIBE_CARDS;

/** Create flow, step 2: where the scene takes place. Swipe right to choose. */
export const SCENE_CARDS: VibeCard[] = [
  {
    id: "rooftop-bar",
    title: "Rooftop bar at sunset",
    description: "City lights flickering on, a warm breeze, two cold drinks.",
    tags: ["golden hour", "city", "cocktails"],
    accent: "from-rose-400/25 to-pink-500/10",
    emoji: "🌇",
  },
  {
    id: "night-train",
    title: "Sleeper train through the mountains",
    description: "A rocking carriage, frosted windows, a stranger across.",
    tags: ["journey", "night", "cozy"],
    accent: "from-violet-500/30 to-purple-700/10",
    emoji: "🚞",
  },
  {
    id: "rainy-cafe",
    title: "Coffee shop on a rainy day",
    description: "Steamed-up windows, slow jazz, nowhere to rush to.",
    tags: ["rain", "warm drinks", "calm"],
    accent: "from-sky-400/20 to-indigo-500/10",
    emoji: "☕",
  },
  {
    id: "beach-bonfire",
    title: "Beach bonfire after midnight",
    description: "Crackling fire, ocean hush, blankets and falling stars.",
    tags: ["stars", "waves", "sparks"],
    accent: "from-fuchsia-500/25 to-pink-600/10",
    emoji: "🔥",
  },
  {
    id: "starship-lounge",
    title: "Spaceship lounge among the stars",
    description: "Humming engines, nebulas drifting past the glass.",
    tags: ["sci-fi", "dreamy", "vast"],
    accent: "from-purple-400/20 to-fuchsia-600/10",
    emoji: "🚀",
  },
];

/** Create flow, step 3: the goal to chase. Swipe right to choose. */
export const GOAL_CARDS: VibeCard[] = [
  {
    id: "get-number",
    title: "Get their phone number",
    description: "Charm your way to those ten digits.",
    tags: ["flirt", "confidence"],
    accent: "from-rose-400/25 to-pink-500/10",
    emoji: "📱",
  },
  {
    id: "second-date",
    title: "Land a second date",
    description: "Make tonight good enough for a next time.",
    tags: ["chemistry", "charm"],
    accent: "from-fuchsia-500/25 to-pink-600/10",
    emoji: "💘",
  },
  {
    id: "better-price",
    title: "Negotiate a better price",
    description: "Hold your ground and walk away with a deal.",
    tags: ["nerve", "leverage"],
    accent: "from-sky-400/20 to-indigo-500/10",
    emoji: "💰",
  },
  {
    id: "firm-no",
    title: "Say no without apologizing",
    description: "Set the boundary and keep it warm.",
    tags: ["boundaries", "calm"],
    accent: "from-violet-500/30 to-purple-700/10",
    emoji: "🙅",
  },
  {
    id: "three-laughs",
    title: "Make them laugh three times",
    description: "Three real laughs. Corny counts if it lands.",
    tags: ["humor", "play"],
    accent: "from-purple-400/20 to-fuchsia-600/10",
    emoji: "😂",
  },
];
