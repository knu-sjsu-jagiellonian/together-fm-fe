// Mock "current user" until login lands. `nickname` matches a participant/added_by
// so host/adder permission checks work in mock mode. Swap for the auth'd user later.

export const MOCK_ME = {
  nickname: 'Mia',
  joinedLabel: '2026.03 가입',
} as const

// ── Session counters (kept in localStorage so the profile shows real activity) ──

const REACTIONS_KEY = 'tfm.reactionsSent'
const LISTENED_KEY = 'tfm.songsListened'
// Seed values so a first-time profile isn't empty; real activity adds on top.
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

// A couple of saved playlists (mock — later these come from saved room recaps).
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
