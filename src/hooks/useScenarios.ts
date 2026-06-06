import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getScenario, listScenarios } from '@/services/scenarios'
import { queryKeys } from '@/lib/query-keys'
import type { Scenario } from '@/types/api'

export function useScenarios() {
  return useQuery({
    queryKey: queryKeys.scenarios(),
    queryFn: listScenarios,
    staleTime: 5 * 60 * 1000,
    // A freshly created scene may still be painting its art — keep the poster
    // wall polling until every scene has settled.
    refetchInterval: (query) =>
      query.state.data?.some((s) => s.image_status === 'generating')
        ? 3000
        : false,
  })
}

export function useScenario(id: string | undefined) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: queryKeys.scenario(id),
    queryFn: () => getScenario(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    // The list response carries the same full objects — seed from it (aged to
    // the list's fetch time) so detail → live → debrief doesn't refetch the
    // same scenario on every page.
    initialData: () =>
      queryClient
        .getQueryData<Scenario[]>(queryKeys.scenarios())
        ?.find((s) => s.id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKeys.scenarios())?.dataUpdatedAt,
    // Scene art is generated in the background after creation; poll until the
    // storage paths fill in so the images fade in as they land.
    refetchInterval: (query) =>
      query.state.data?.image_status === 'generating' ? 2500 : false,
  })
}
