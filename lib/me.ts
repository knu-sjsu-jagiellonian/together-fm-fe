'use client'

import { useEffect, useState } from 'react'

// Mock "current user". Login only stores the chosen nickname (no backend token),
// so mock rooms keep working; the nickname drives host/adder permissions + profile.
// Real login (backend seed accounts via POST /api/login) is a later step.

const ME_KEY = 'tfm.me'
const ME_USER_ID_KEY = 'tfm.userId'
export const DEFAULT_ME = '예원'
export const ME_JOINED_LABEL = '2026.03 joined'

export interface MockAccount {
  nickname: string
  note?: string
}

// Offline fallback accounts — the same nicknames the backend seeds (db.ts SEED_USERS),
// so a demo still works in the same order when the backend is unreachable.
export const MOCK_ACCOUNTS: MockAccount[] = [
  { nickname: '예원' },
  { nickname: '현지' },
  { nickname: '은샘' },
  { nickname: '주은' },
  { nickname: '윤정' },
  { nickname: '상민' },
  { nickname: '창목' },
  { nickname: '준형' },
  { nickname: '재윤' },
  { nickname: '은하' },
  { nickname: '하연' },
  { nickname: '수빈' },
  { nickname: '건호' },
  { nickname: '승규' },
  { nickname: '교수님' },
]

export function getMe(): string {
  if (typeof window === 'undefined') return DEFAULT_ME
  return localStorage.getItem(ME_KEY) ?? DEFAULT_ME
}

export function setMe(nickname: string) {
  if (typeof window !== 'undefined') localStorage.setItem(ME_KEY, nickname)
}

export function clearMe() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ME_KEY)
    localStorage.removeItem(ME_USER_ID_KEY)
  }
}

export function hasMe(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(ME_KEY) !== null
}

// Stable user id from the authenticated account (used to identify "me" among room
// members and to decide host — more robust than comparing nicknames).
export function getMyUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ME_USER_ID_KEY)
}

export function setMyUserId(id: string | null) {
  if (typeof window === 'undefined') return
  if (id) localStorage.setItem(ME_USER_ID_KEY, id)
  else localStorage.removeItem(ME_USER_ID_KEY)
}

/**
 * Stable per-account key so localStorage data (saved playlists, activity counters)
 * is isolated between accounts on the same browser. Uses the backend userId when
 * logged in, else the nickname (mock), else a shared default.
 */
export function accountScope(): string {
  if (typeof window === 'undefined') return 'default'
  return localStorage.getItem(ME_USER_ID_KEY) ?? localStorage.getItem(ME_KEY) ?? 'default'
}

/** Namespace a base localStorage key to the current account. */
export function scopedKey(base: string): string {
  return `${base}.${accountScope()}`
}

/** Client hook that resolves the stored nickname after mount (SSR-safe). */
export function useMe(): string {
  const [me, setState] = useState(DEFAULT_ME)
  useEffect(() => {
    const t = setTimeout(() => setState(getMe()), 0)
    return () => clearTimeout(t)
  }, [])
  return me
}

/** Client hook for the authenticated user id (null in mock mode). */
export function useMyUserId(): string | null {
  const [id, setState] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setState(getMyUserId()), 0)
    return () => clearTimeout(t)
  }, [])
  return id
}

// ── Session counters (localStorage so the profile shows real activity) ──

const REACTIONS_KEY = 'tfm.reactionsSent'
const LISTENED_KEY = 'tfm.songsListened'
const REACTIONS_SEED = 128
const LISTENED_SEED = 342

// Counters are namespaced per account (scopedKey) so switching accounts shows that
// account's own activity, not a browser-wide shared total.
function readCount(base: string, seed: number): number {
  if (typeof window === 'undefined') return seed
  const key = scopedKey(base)
  const raw = localStorage.getItem(key)
  if (raw === null) {
    localStorage.setItem(key, String(seed))
    return seed
  }
  const n = Number(raw)
  return Number.isFinite(n) ? n : seed
}

function bump(base: string, seed: number, by = 1) {
  if (typeof window === 'undefined') return
  localStorage.setItem(scopedKey(base), String(readCount(base, seed) + by))
}

export const bumpReactionsSent = () => bump(REACTIONS_KEY, REACTIONS_SEED)
export const bumpSongsListened = () => bump(LISTENED_KEY, LISTENED_SEED)
export const getReactionsSent = () => readCount(REACTIONS_KEY, REACTIONS_SEED)
export const getSongsListened = () => readCount(LISTENED_KEY, LISTENED_SEED)
