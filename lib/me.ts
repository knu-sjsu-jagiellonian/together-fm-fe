'use client'

import { useEffect, useState } from 'react'

// Mock "current user". Login only stores the chosen nickname (no backend token),
// so mock rooms keep working; the nickname drives host/adder permissions + profile.
// Real login (backend seed accounts via POST /api/login) is a later step.

const ME_KEY = 'tfm.me'
export const DEFAULT_ME = 'Mia'
export const ME_JOINED_LABEL = '2026.03 joined'

export interface MockAccount {
  nickname: string
  note?: string
}

// Accounts aligned with the mock data (so host/adder demos work when you switch).
export const MOCK_ACCOUNTS: MockAccount[] = [
  { nickname: 'Mia', note: '늦은 밤 인디 감성 방장' },
  { nickname: 'Noah', note: '늦은 밤 인디 감성 참여자' },
  { nickname: 'Sofia', note: '늦은 밤 인디 감성 참여자' },
  { nickname: 'Liam', note: 'Deep Focus 방장' },
  { nickname: 'Aria', note: 'Gym Energy 방장' },
]

export function getMe(): string {
  if (typeof window === 'undefined') return DEFAULT_ME
  return localStorage.getItem(ME_KEY) ?? DEFAULT_ME
}

export function setMe(nickname: string) {
  if (typeof window !== 'undefined') localStorage.setItem(ME_KEY, nickname)
}

export function clearMe() {
  if (typeof window !== 'undefined') localStorage.removeItem(ME_KEY)
}

export function hasMe(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(ME_KEY) !== null
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

// ── Session counters (localStorage so the profile shows real activity) ──

const REACTIONS_KEY = 'tfm.reactionsSent'
const LISTENED_KEY = 'tfm.songsListened'
const REACTIONS_SEED = 128
const LISTENED_SEED = 342

function readCount(key: string, seed: number): number {
  if (typeof window === 'undefined') return seed
  const raw = localStorage.getItem(key)
  if (raw === null) {
    localStorage.setItem(key, String(seed))
    return seed
  }
  const n = Number(raw)
  return Number.isFinite(n) ? n : seed
}

function bump(key: string, seed: number, by = 1) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, String(readCount(key, seed) + by))
}

export const bumpReactionsSent = () => bump(REACTIONS_KEY, REACTIONS_SEED)
export const bumpSongsListened = () => bump(LISTENED_KEY, LISTENED_SEED)
export const getReactionsSent = () => readCount(REACTIONS_KEY, REACTIONS_SEED)
export const getSongsListened = () => readCount(LISTENED_KEY, LISTENED_SEED)

// A couple of saved playlists (mock — later from saved room recaps).
export interface SavedPlaylist {
  id: string
  title: string
  trackCount: number
  savedAt: string
  cover?: string
}

export const MOCK_SAVED_PLAYLISTS: SavedPlaylist[] = [
  { id: 'pl1', title: '늦은 밤 인디 감성 🌙', trackCount: 10, savedAt: '2026.07.20', cover: 'https://i.ytimg.com/vi/djV11Xbc914/mqdefault.jpg' },
  { id: 'pl2', title: 'Deep Focus — lofi beats', trackCount: 6, savedAt: '2026.07.18', cover: 'https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg' },
  { id: 'pl3', title: 'Gym Energy 💪 hip-hop', trackCount: 8, savedAt: '2026.07.15', cover: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg' },
]
