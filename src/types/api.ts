/** Mirror of the backend scenario schema (app/scenarios/schemas.py). */
export interface Scenario {
  id: string;
  /** Null = built-in catalog character; set = personal character owned by a user. */
  user_id: string | null;
  title: string;
  description: string;
  system_instruction: string;
  voice_name: string | null;
  greet_first: boolean;
}

/** Conversational Match flow (app/characters/schemas.py). */
export type VibeReactionKind = "like" | "maybe" | "skip";

export interface VibeReaction {
  id: string;
  title: string;
  tags: string[];
  reaction: VibeReactionKind;
}

export interface CharacterIntake {
  moods: string[];
  description: string;
  vibes: VibeReaction[];
}

export interface MatchResult {
  scenario_id: string | null;
  reason: string;
}

/** Server -> client WebSocket text messages (app/sessions/protocol.py). */
export type ServerMessage =
  | { type: "ready"; conversation_id: string; output_sample_rate: number }
  | { type: "transcript"; role: "user" | "agent"; text: string }
  | { type: "interrupted" }
  | { type: "turn_complete" }
  // `code` marks usage-limit rejections ("daily_limit", "capacity",
  // "concurrent_session") so the UI can show a friendly notice, not an error.
  | { type: "error"; message: string; code?: string | null }
  // Sent right before the server ends a session that hit its time cap.
  | { type: "session_limit"; reason: string };

export interface Turn {
  id: string;
  role: "user" | "agent";
  text: string;
}

/** Conversation history (app/sessions/schemas.py). */
export interface ConversationSummary {
  id: string;
  scenario_id: string;
  scenario_title: string | null;
  status: "active" | "ended";
  created_at: string;
  message_count: number;
  replay_of?: string | null;
}

export interface ConversationMessage {
  role: "user" | "agent";
  text: string;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  scenario_id: string;
  scenario_title: string | null;
  status: "active" | "ended";
  created_at: string;
  has_audio: boolean;
  replay_of?: string | null;
  messages: ConversationMessage[];
}

/** Feedback analysis (app/feedback/base.py). */
export type MetricKind = "strength" | "improvement";

export interface MetricScore {
  name: string;
  score: number; // 0-10
  kind: MetricKind;
  explanation: string;
}

export interface AdviceItem {
  text: string;
  quote?: string | null;
}

export interface ExampleAnswer {
  question: string;
  answer: string;
}

export interface FeedbackReport {
  overall_score: number; // 0-10
  headline: string;
  summary: string;
  metrics: MetricScore[];
  advice: AdviceItem[];
  example_answers?: ExampleAnswer[];
}

/** Coaching chat (app/coaching). */
export interface CoachingMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export type FeedbackStatus = "none" | "generating" | "ready" | "error";

export interface FeedbackResponse {
  status: FeedbackStatus;
  report: FeedbackReport | null;
  error: string | null;
}
