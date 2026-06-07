import { apiFetch } from '@/lib/api-client'
import { DEFAULT_LOCALE, type Locale } from '@/i18n'
import type { Scenario } from '@/types/api'

// ?lang= resolves the translation overlay server-side — the responses carry
// plain, already-localized fields (with English fallback).

export function listScenarios(lang: Locale = DEFAULT_LOCALE): Promise<Scenario[]> {
  return apiFetch<Scenario[]>(`/scenarios?lang=${lang}`)
}

export function getScenario(id: string, lang: Locale = DEFAULT_LOCALE): Promise<Scenario> {
  return apiFetch<Scenario>(`/scenarios/${id}?lang=${lang}`)
}

/** Delete the user's own scene (with its conversations and art). */
export function deleteScenario(id: string): Promise<void> {
  return apiFetch<void>(`/scenarios/${id}`, { method: 'DELETE' })
}
