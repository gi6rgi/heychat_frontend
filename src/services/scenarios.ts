import { apiFetch } from '@/lib/api-client'
import type { Scenario } from '@/types/api'

export function listScenarios(): Promise<Scenario[]> {
  return apiFetch<Scenario[]>('/scenarios')
}

export function getScenario(id: string): Promise<Scenario> {
  return apiFetch<Scenario>(`/scenarios/${id}`)
}

/** Delete the user's own scene (with its conversations and art). */
export function deleteScenario(id: string): Promise<void> {
  return apiFetch<void>(`/scenarios/${id}`, { method: 'DELETE' })
}
