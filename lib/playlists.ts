// Saved playlists shown on the profile. Backed by localStorage so a saved recap
// survives reloads. Namespaced per account (scopedKey) so each account has its own
// list — switching accounts does not show another account's saved playlists.
// Real saves (leaving a room / a room recap) prepend to the list.

import { scopedKey } from './me'

const BASE_KEY = 'tfm.savedPlaylists'

export interface SavedTrack {
  id: string
  title: string
  artist: string
  videoId?: string
  thumbnail?: string
}

export interface SavedPlaylist {
  id: string
  title: string
  savedAt: string // 'YYYY.MM.DD'
  cover?: string
  tracks: SavedTrack[]
}

/** YouTube thumbnail for a video id (no API key needed). */
export function thumbnailFor(videoId?: string): string | undefined {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined
}

function today(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

function read(): SavedPlaylist[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(scopedKey(BASE_KEY))
    return raw ? (JSON.parse(raw) as SavedPlaylist[]) : []
  } catch {
    return []
  }
}

function write(list: SavedPlaylist[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(list))
  } catch {
    /* storage unavailable */
  }
}

export function getSavedPlaylists(): SavedPlaylist[] {
  return read()
}

export function getSavedPlaylist(id: string): SavedPlaylist | null {
  return read().find((p) => p.id === id) ?? null
}

export interface SavePlaylistInput {
  title: string
  tracks: SavedTrack[]
  cover?: string
}

/**
 * Save a playlist to the profile (prepended). Returns the created playlist, or the
 * existing one when it duplicates the most recent save (prevents double-saving from
 * a double click / re-open of the same recap).
 */
export function savePlaylist(input: SavePlaylistInput): SavedPlaylist {
  const list = read()
  const sig = (title: string, tracks: { id: string }[]) => `${title}::${tracks.map((t) => t.id).join(',')}`
  if (list[0] && sig(list[0].title, list[0].tracks) === sig(input.title, input.tracks)) {
    return list[0]
  }
  const cover =
    input.cover ??
    input.tracks.find((t) => t.thumbnail)?.thumbnail ??
    thumbnailFor(input.tracks.find((t) => t.videoId)?.videoId)
  const pl: SavedPlaylist = {
    id: `pl-${Date.now()}`,
    title: input.title,
    savedAt: today(),
    cover,
    tracks: input.tracks,
  }
  write([pl, ...list])
  return pl
}

export function removePlaylist(id: string) {
  write(read().filter((p) => p.id !== id))
}
