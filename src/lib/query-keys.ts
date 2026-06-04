export const queryKeys = {
  scenarios: () => ['scenarios'] as const,
  scenario: (id: string | undefined) => ['scenario', id] as const,
  conversations: () => ['conversations'] as const,
  conversation: (id: string | undefined) => ['conversation', id] as const,
  feedback: (id: string | undefined) => ['feedback', id] as const,
}
