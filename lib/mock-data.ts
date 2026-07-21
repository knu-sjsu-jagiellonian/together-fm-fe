/**
 * Mock data layer — replace these functions with real Supabase calls later.
 * Each function is isolated so you can swap them one by one.
 */

import type { Room, Participant, Track, RoomWithDetails } from './types'

// ─── Participants ─────────────────────────────────────────────────────────────

export const MOCK_PARTICIPANTS: Record<string, Participant[]> = {
  'room-1': [
    { id: 'p1', room_id: 'room-1', name: 'Mia', avatar_color: '#FF2D87', joined_at: '2024-01-15T14:00:00Z' },
    { id: 'p2', room_id: 'room-1', name: 'Noah', avatar_color: '#00D4FF', joined_at: '2024-01-15T14:02:00Z' },
    { id: 'p3', room_id: 'room-1', name: 'Sofia', avatar_color: '#7C3AFF', joined_at: '2024-01-15T14:05:00Z' },
  ],
  'room-2': [
    { id: 'p4', room_id: 'room-2', name: 'Liam', avatar_color: '#FF6B2B', joined_at: '2024-01-15T13:00:00Z' },
    { id: 'p5', room_id: 'room-2', name: 'Emma', avatar_color: '#00FF88', joined_at: '2024-01-15T13:10:00Z' },
  ],
  'room-3': [
    { id: 'p6', room_id: 'room-3', name: 'Aria', avatar_color: '#FFD600', joined_at: '2024-01-15T12:00:00Z' },
    { id: 'p7', room_id: 'room-3', name: 'Kai', avatar_color: '#FF4A6B', joined_at: '2024-01-15T12:05:00Z' },
    { id: 'p8', room_id: 'room-3', name: 'Luca', avatar_color: '#00B4D8', joined_at: '2024-01-15T12:10:00Z' },
    { id: 'p9', room_id: 'room-3', name: 'Yuki', avatar_color: '#7C3AFF', joined_at: '2024-01-15T12:15:00Z' },
  ],
}

// ─── Tracks ───────────────────────────────────────────────────────────────────

export const MOCK_TRACKS: Record<string, Track[]> = {
  // Real, well-known YouTube ids so album covers render and the "save playlist"
  // export actually opens a working YouTube playlist.
  // ~10 real, well-known songs (real YouTube ids so they play + show covers).
  'room-1': [
    { id: 't1', room_id: 'room-1', title: 'Take On Me', artist: 'a-ha', added_by: 'Mia', position: 0, played_at: '2024-01-15T14:10:00Z', duration_sec: 225, video_id: 'djV11Xbc914' },
    { id: 't2', room_id: 'room-1', title: 'Blinding Lights', artist: 'The Weeknd', added_by: 'Noah', position: 1, played_at: null, duration_sec: 200, video_id: '4NRXx6U8ABQ' },
    { id: 't3', room_id: 'room-1', title: 'As It Was', artist: 'Harry Styles', added_by: 'Sofia', position: 2, played_at: null, duration_sec: 167, video_id: 'H5v3kku4y6Q' },
    { id: 't4', room_id: 'room-1', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', added_by: 'Mia', position: 3, played_at: null, duration_sec: 270, video_id: 'OPf0YbXqDm0' },
    { id: 't5', room_id: 'room-1', title: 'Shape of You', artist: 'Ed Sheeran', added_by: 'Noah', position: 4, played_at: null, duration_sec: 234, video_id: 'JGwWNGJdvx8' },
    { id: 't6', room_id: 'room-1', title: 'Hello', artist: 'Adele', added_by: 'Sofia', position: 5, played_at: null, duration_sec: 295, video_id: 'YQHsXMglC9A' },
    { id: 't7', room_id: 'room-1', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', added_by: 'Mia', position: 6, played_at: null, duration_sec: 230, video_id: 'RgKAFK5djSk' },
    { id: 't8', room_id: 'room-1', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', added_by: 'Noah', position: 7, played_at: null, duration_sec: 281, video_id: 'kJQP7kiw5Fk' },
    { id: 't9', room_id: 'room-1', title: 'Roar', artist: 'Katy Perry', added_by: 'Sofia', position: 8, played_at: null, duration_sec: 224, video_id: 'CevxZvSJLk8' },
    { id: 't10', room_id: 'room-1', title: 'Bohemian Rhapsody', artist: 'Queen', added_by: 'Mia', position: 9, played_at: null, duration_sec: 355, video_id: 'fJ9rUzIMcZQ' },
  ],
  'room-2': [
    { id: 't5', room_id: 'room-2', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', added_by: 'Liam', position: 0, played_at: '2024-01-15T13:05:00Z', duration_sec: 270, video_id: 'OPf0YbXqDm0' },
    { id: 't6', room_id: 'room-2', title: 'Shape of You', artist: 'Ed Sheeran', added_by: 'Emma', position: 1, played_at: null, duration_sec: 234, video_id: 'JGwWNGJdvx8' },
  ],
  'room-3': [
    { id: 't7', room_id: 'room-3', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', added_by: 'Aria', position: 0, played_at: '2024-01-15T12:20:00Z', duration_sec: 230, video_id: 'RgKAFK5djSk' },
    { id: 't8', room_id: 'room-3', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', added_by: 'Kai', position: 1, played_at: null, duration_sec: 281, video_id: 'kJQP7kiw5Fk' },
    { id: 't9', room_id: 'room-3', title: 'Bohemian Rhapsody', artist: 'Queen', added_by: 'Luca', position: 2, played_at: null, duration_sec: 355, video_id: 'fJ9rUzIMcZQ' },
  ],
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const MOCK_ROOMS: Room[] = [
  {
    id: 'room-1',
    title: '늦은 밤 인디 감성 🌙',
    genre_tag: '인디',
    mood_tag: '감성적인',
    situation_tag: '취침',
    max_members: 6,
    is_public: true,
    host: 'Mia',
    created_at: '2024-01-15T14:00:00Z',
    ended_at: null,
  },
  {
    id: 'room-2',
    title: 'Deep Focus — lofi beats',
    genre_tag: '로파이',
    mood_tag: '집중',
    situation_tag: '공부',
    max_members: 4,
    is_public: true,
    host: 'Liam',
    created_at: '2024-01-15T13:00:00Z',
    ended_at: null,
  },
  {
    id: 'room-3',
    title: 'Gym Energy 💪 hip-hop',
    genre_tag: '힙합',
    mood_tag: '신나는',
    situation_tag: '운동',
    max_members: 8,
    is_public: true,
    host: 'Aria',
    created_at: '2024-01-15T12:00:00Z',
    ended_at: null,
  },
  {
    id: 'room-4',
    title: 'Friday Night Pop Party',
    genre_tag: '팝',
    mood_tag: '파티',
    situation_tag: '일상',
    max_members: 30,
    is_public: false,
    password: '1234',
    host: 'Ken',
    created_at: '2024-01-15T20:00:00Z',
    ended_at: null,
  },
]

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
