import { apiFetch } from '@/lib/api-client'
import type { Scenario } from '@/types/api'

export function listScenarios(): Promise<Scenario[]> {
  return apiFetch<Scenario[]>('/scenarios')
}

export function getScenario(id: string): Promise<Scenario> {
  return apiFetch<Scenario>(`/scenarios/${id}`)
}
