/**
 * Mock data layer — replace these functions with real Supabase calls later.
 * Each function is isolated so you can swap them one by one.
 */

import type { Room, Participant, Track, RoomWithDetails } from './types'

// ─── Participants ─────────────────────────────────────────────────────────────

// Test mock rooms have been removed — the room list now comes entirely from the
// live backend. Keep these collections empty (the fetch helpers still reference them).
export const MOCK_PARTICIPANTS: Record<string, Participant[]> = {}

// ─── Tracks ───────────────────────────────────────────────────────────────────

export const MOCK_TRACKS: Record<string, Track[]> = {}

// ─── Rooms ────────────────────────────────────────────────────────────────────

// No mock rooms — the room list is populated from the live backend (api.rooms()).
export const MOCK_ROOMS: Room[] = []

// ─── Data fetch functions (swap these for Supabase queries later) ────────────

function buildRoomDetails(room: Room): RoomWithDetails {
  const participants = MOCK_PARTICIPANTS[room.id] ?? []
  const tracks = MOCK_TRACKS[room.id] ?? []
  const current_track = tracks.find((t) => t.played_at !== null) ?? null
  const queue = tracks.filter((t) => t.played_at === null)
  return { ...room, participants, current_track, queue }
}

export async function getRooms(): Promise<RoomWithDetails[]> {
  return MOCK_ROOMS.map(buildRoomDetails)
}

export async function getRoomById(id: string): Promise<RoomWithDetails | null> {
  const room = MOCK_ROOMS.find((r) => r.id === id)
  if (!room) return null
  return buildRoomDetails(room)
}

export async function getRoomSummary(id: string) {
  const room = MOCK_ROOMS.find((r) => r.id === id)
  if (!room) return null
  const participants = MOCK_PARTICIPANTS[id] ?? []
  const tracks = MOCK_TRACKS[id] ?? []
  const totalSec = tracks.reduce((sum, t) => sum + (t.duration_sec ?? 0), 0)
  const durationMin = Math.max(1, Math.round(totalSec / 60))
  return { room, participants, tracks, durationMin }
}

export const MOCK_SEARCH_RESULTS: Omit<Track, 'id' | 'room_id' | 'added_by' | 'position' | 'played_at'>[] = [
  { title: 'The Less I Know The Better', artist: 'Tame Impala', duration_sec: 216 },
  { title: 'Chamber of Reflection', artist: 'Mac DeMarco', duration_sec: 234 },
  { title: 'Loving Is Easy', artist: 'Rex Orange County', duration_sec: 205 },
  { title: '3 Nights', artist: 'Dominic Fike', duration_sec: 177 },
  { title: 'Goodie Bag', artist: 'Still Woozy', duration_sec: 165 },
  { title: 'Everytime', artist: 'boy pablo', duration_sec: 210 },
  { title: 'Coffee', artist: 'beabadoobee', duration_sec: 174 },
  { title: 'As It Was', artist: 'Harry Styles', duration_sec: 167 },
  { title: 'Bad Habit', artist: 'Steve Lacy', duration_sec: 232 },
  { title: 'Flowers', artist: 'Miley Cyrus', duration_sec: 200 },
]

export async function searchTracks(query: string) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return MOCK_SEARCH_RESULTS.filter(
    (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  )
}
