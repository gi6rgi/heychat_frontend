import { useQuery } from '@tanstack/react-query'
import { getScenario, listScenarios } from '@/services/scenarios'
import { queryKeys } from '@/lib/query-keys'

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
  return useQuery({
    queryKey: queryKeys.scenario(id),
    queryFn: () => getScenario(id!),
    enabled: !!id,
    // Scene art is generated in the background after creation; poll until the
    // storage paths fill in so the images fade in as they land.
    refetchInterval: (query) =>
      query.state.data?.image_status === 'generating' ? 2500 : false,
  })
}
