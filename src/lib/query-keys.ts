export const queryKeys = {
  // Scenario responses are localized server-side (?lang=) — the language is
  // part of the cache identity. Invalidate with the language-agnostic root.
  allScenarios: () => ['scenarios'] as const,
  scenarios: (lang: string) => ['scenarios', lang] as const,
  scenario: (id: string | undefined, lang: string) => ['scenario', id, lang] as const,
  conversations: () => ['conversations'] as const,
  conversation: (id: string | undefined) => ['conversation', id] as const,
  feedback: (id: string | undefined) => ['feedback', id] as const,
}
