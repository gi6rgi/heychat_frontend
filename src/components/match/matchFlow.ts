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
}

/** "Pick the vibes that feel closest" — swiped Like / Maybe / Skip. */
export const VIBE_CARDS: VibeCard[] = [
  {
    id: "warm-listener",
    title: "Warm Listener",
    description: "Calm, emotionally present, easy to open up to.",
    tags: ["warm", "supportive", "low-pressure"],
    accent: "from-rose-400/25 to-pink-500/10",
  },
  {
    id: "playful-spark",
    title: "Playful Spark",
    description: "Light teasing, fun energy, spontaneous conversations.",
    tags: ["playful", "fun", "flirty"],
    accent: "from-fuchsia-500/25 to-pink-600/10",
  },
  {
    id: "deep-mind",
    title: "Deep Mind",
    description:
      "Reflective questions, thoughtful conversations, emotional depth.",
    tags: ["deep", "thoughtful", "curious"],
    accent: "from-sky-400/20 to-indigo-500/10",
  },
  {
    id: "mysterious-muse",
    title: "Mysterious Muse",
    description: "Intriguing, cinematic, story-driven energy.",
    tags: ["mysterious", "fantasy", "intense"],
    accent: "from-violet-500/30 to-purple-700/10",
  },
  {
    id: "confident-coach",
    title: "Confident Coach",
    description: "Motivating, direct, helps you move forward.",
    tags: ["confident", "motivation", "bold"],
    accent: "from-purple-400/20 to-fuchsia-600/10",
  },
];
