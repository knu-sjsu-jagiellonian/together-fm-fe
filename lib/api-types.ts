// Contract types shared with the backend (mirror of the server's shared/types.ts,
// see mock-UI-together-fm/API.md). Kept separate from lib/types.ts (UI types).

export interface ApiUser {
  id: string
  username: string
  nickname: string
}

export interface TrackInput {
  videoId: string
}

export interface ApiTrack {
  videoId: string
  title: string
  artist: string
  durationSec: number
  thumbnail: string
}

/** A search hit from GET /api/search. */
export type SearchResult = ApiTrack

/** Currently-playing track plus the server timestamp it started at (0s). */
export interface NowPlaying {
  track: ApiTrack
  startedAtServerMs: number
}

export interface Member {
  nickname: string
}

export interface RoomCard {
  id: string
  title: string
  tags: string[]
  memberCount: number
  maxMembers: number
  nowPlaying: { title: string; artist: string; thumbnail: string } | null
}

export interface JoinSnapshot {
  room: RoomCard
  current: NowPlaying | null
  queue: ApiTrack[]
  members: Member[]
}

export interface JoinResult {
  ok: boolean
  reason?: 'not_found' | 'full'
  snapshot?: JoinSnapshot
}

export interface CreateRoomBody {
  title: string
  tags: string[]
  maxMembers: number
  isPublic: boolean
  password?: string // required when isPublic is false (max 8 chars)
  firstTrack: TrackInput
}

export interface ArchivedRoom {
  id: string
  title: string
  tags: string[]
  playedTracks: ApiTrack[]
  participants: string[]
  startedAt: number
  endedAt: number
}
