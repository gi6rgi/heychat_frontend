import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  generateFeedback,
  getConversation,
  getFeedback,
  listConversations,
} from '@/services/conversations'
import { queryKeys } from '@/lib/query-keys'
import type { FeedbackResponse } from '@/types/api'

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: listConversations,
  })
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: () => getConversation(id!),
    enabled: !!id,
  })
}

/** Feedback status + report. Polls every 2s while generation is in flight, so
 * the status survives leaving and re-opening the page. */
export function useFeedback(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.feedback(id),
    queryFn: () => getFeedback(id!),
    enabled: !!id,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? 2000 : false,
  })
}

export function useGenerateFeedback(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => generateFeedback(id!),
    onSuccess: (response: FeedbackResponse) => {
      // Seed the cache; if 'generating', useFeedback's poll takes over.
      queryClient.setQueryData(queryKeys.feedback(id), response)
    },
  })
}
