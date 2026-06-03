import { useQuery } from '@tanstack/react-query'
import { getScenario, listScenarios } from '@/services/scenarios'
import { queryKeys } from '@/lib/query-keys'

export function useScenarios() {
  return useQuery({
    queryKey: queryKeys.scenarios(),
    queryFn: listScenarios,
    staleTime: 5 * 60 * 1000,
  })
}

export function useScenario(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.scenario(id),
    queryFn: () => getScenario(id!),
    enabled: !!id,
  })
}
