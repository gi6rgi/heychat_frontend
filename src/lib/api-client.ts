import { getAccessToken } from '@/lib/supabase'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? ''
const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL as string | undefined)?.trim() ?? ''

export function getApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function getWsBaseUrl(): string {
  if (WS_BASE_URL) return WS_BASE_URL
  // Derive ws(s):// from the current origin as a dev-safe fallback.
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/^http/, 'ws')
  }
  return ''
}

export function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const base = getApiBaseUrl()
  return base ? `${base}${normalizedPath}` : normalizedPath
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body}`)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('Authorization')) {
    const token = await getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(buildApiUrl(path), { ...init, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
