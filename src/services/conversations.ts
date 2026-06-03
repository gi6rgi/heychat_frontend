import { apiFetch } from '@/lib/api-client'
import type { ConversationDetail, ConversationSummary, FeedbackResponse } from '@/types/api'

export function listConversations(): Promise<ConversationSummary[]> {
  return apiFetch<ConversationSummary[]>('/conversations')
}

export function getConversation(id: string): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>(`/conversations/${id}`)
}

export function getFeedback(id: string): Promise<FeedbackResponse> {
  return apiFetch<FeedbackResponse>(`/conversations/${id}/feedback`)
}

export function generateFeedback(id: string): Promise<FeedbackResponse> {
  return apiFetch<FeedbackResponse>(`/conversations/${id}/feedback`, { method: 'POST' })
}
