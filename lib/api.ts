// Thin REST client for the Sync Radio backend (see mock-UI-together-fm/API.md).
// Attaches the dev token and surfaces the server's Korean `error` message as-is.

import type {
  User,
  Archive,
  CreateRoomInput,
  RoomCard,
  SearchResult,
} from './api-types'

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000'

export const TOKEN_KEY = 'tfm.token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Thrown on non-2xx; `message` is the server's user-facing Korean text. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? `요청에 실패했어요 (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const api = {
  // auth (used once login lands)
  users: () => req<User[]>('/api/users'),
  login: (username: string) =>
    req<{ token: string; user: User }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  me: () => req<User>('/api/me'),

  // rooms
  rooms: (q = '', tags = '') =>
    req<RoomCard[]>(`/api/rooms?q=${encodeURIComponent(q)}&tags=${encodeURIComponent(tags)}`),
  room: (id: string) => req<RoomCard>(`/api/rooms/${id}`),
  createRoom: (body: CreateRoomInput) =>
    req<{ id: string }>('/api/rooms', { method: 'POST', body: JSON.stringify(body) }),

  // search — call on-demand (Enter), not per keystroke (100 units/call, ~100/day). See API.md §3.
  search: (q: string) => req<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`),

  // archives
  archive: (id: string) => req<Archive>(`/api/archives/${id}`),
}
