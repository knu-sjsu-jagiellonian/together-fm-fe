// ─── Core Types ──────────────────────────────────────────────────────────────

export type MoodTag =
  | '잔잔한' | '신나는' | '집중' | '파티'
  | '감성적인' | '몽환적인' | '청량한' | '나른한'

export type SituationTag =
  | '공부' | '운동' | '여행' | '일상'
  | '드라이브' | '카페' | '취침' | '출근'

export type GenreTag =
  | '팝' | '인디' | '힙합' | 'R&B' | '록'
  | '일렉트로닉' | '재즈' | 'K-팝' | '로파이' | '라틴'

export type FilterTag = '전체' | GenreTag | MoodTag | SituationTag

export interface Room {
  id: string
  title: string
  genre_tag: GenreTag
  mood_tag: MoodTag
  situation_tag: SituationTag
  max_members: number
  is_public: boolean
  password?: string   // set for private rooms (mock; max 8 chars)
  host?: string       // host nickname (only the host can end the room)
  created_at: string
  ended_at: string | null
}

export interface Participant {
  id: string
  room_id: string
  name: string
  avatar_color: string
  joined_at: string
}

export interface Track {
  id: string
  room_id: string
  title: string
  artist: string
  added_by: string   // participant name
  position: number
  played_at: string | null
  album_art?: string
  duration_sec?: number
  video_id?: string   // YouTube video id (for album art + playlist export)
}

export interface Reaction {
  id: string
  room_id: string
  participant_id: string
  emoji: string
  created_at: string
}

// ─── UI helper types ──────────────────────────────────────────────────────────

export interface RoomWithDetails extends Room {
  participants: Participant[]
  current_track: Track | null
  queue: Track[]
}

export interface FloatingReaction {
  id: string
  emoji: string
  x: number // 0–100 percent from left
}

// ─── Tag definitions ──────────────────────────────────────────────────────────

export const GENRE_TAGS: GenreTag[] = [
  '팝', '인디', '힙합', 'R&B', '록',
  '일렉트로닉', '재즈', 'K-팝', '로파이', '라틴',
]
export const MOOD_TAGS: MoodTag[] = [
  '잔잔한', '신나는', '집중', '파티',
  '감성적인', '몽환적인', '청량한', '나른한',
]
export const SITUATION_TAGS: SituationTag[] = [
  '공부', '운동', '여행', '일상',
  '드라이브', '카페', '취침', '출근',
]
export const FILTER_TAGS: FilterTag[] = ['전체', ...GENRE_TAGS, ...MOOD_TAGS, ...SITUATION_TAGS]

/**
 * Per-tag color classes (single source of truth for TagPill).
 * Full literal Tailwind class strings so the JIT scanner picks them up.
 */
export const TAG_COLORS: Record<string, string> = {
  // Genres
  '팝': 'bg-fuchsia-400/25 text-fuchsia-700 border-fuchsia-500/40',
  '인디': 'bg-teal-400/25 text-teal-700 border-teal-500/40',
  '힙합': 'bg-amber-400/30 text-amber-700 border-amber-500/40',
  'R&B': 'bg-purple-400/25 text-purple-700 border-purple-500/40',
  '록': 'bg-red-400/25 text-red-700 border-red-500/40',
  '일렉트로닉': 'bg-cyan-400/25 text-cyan-700 border-cyan-500/40',
  '재즈': 'bg-indigo-400/25 text-indigo-700 border-indigo-500/40',
  'K-팝': 'bg-pink-400/25 text-pink-700 border-pink-500/40',
  '로파이': 'bg-slate-400/25 text-slate-700 border-slate-500/40',
  '라틴': 'bg-orange-400/30 text-orange-700 border-orange-500/40',

  // Moods
  '잔잔한': 'bg-sky-400/25 text-sky-700 border-sky-500/40',
  '신나는': 'bg-pink-400/25 text-pink-700 border-pink-500/40',
  '집중': 'bg-violet-400/25 text-violet-700 border-violet-500/40',
  '파티': 'bg-yellow-400/30 text-yellow-700 border-yellow-500/40',
  '감성적인': 'bg-rose-400/25 text-rose-700 border-rose-500/40',
  '몽환적인': 'bg-purple-400/25 text-purple-700 border-purple-500/40',
  '청량한': 'bg-cyan-400/25 text-cyan-700 border-cyan-500/40',
  '나른한': 'bg-amber-400/30 text-amber-700 border-amber-500/40',

  // Situations
  '공부': 'bg-blue-400/25 text-blue-700 border-blue-500/40',
  '운동': 'bg-orange-400/30 text-orange-700 border-orange-500/40',
  '여행': 'bg-emerald-400/25 text-emerald-700 border-emerald-500/40',
  '일상': 'bg-rose-400/25 text-rose-700 border-rose-500/40',
  '드라이브': 'bg-indigo-400/25 text-indigo-700 border-indigo-500/40',
  '카페': 'bg-amber-400/30 text-amber-700 border-amber-500/40',
  '취침': 'bg-violet-400/25 text-violet-700 border-violet-500/40',
  '출근': 'bg-slate-400/25 text-slate-700 border-slate-500/40',
}

export const REACTION_EMOJIS = ['🔥', '🥰', '🥹', '🧐', '😳'] as const
export const AVATAR_COLORS = [
  '#FF2D87', '#00D4FF', '#7C3AFF', '#FF6B2B',
  '#00FF88', '#FFD600', '#FF4A6B', '#00B4D8',
]

export const MAX_MEMBER_OPTIONS = [2, 3, 4, 5, 6, 7, 8]
