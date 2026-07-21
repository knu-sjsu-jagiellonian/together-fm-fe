// Normalized room-list item so the card renders the same whether data comes from
// the mock layer or the backend (which uses a different RoomCard shape).

import type { RoomWithDetails } from './types'
import type { RoomCard as ApiRoomCard, TagId } from './api-types'
import { GENRE_TAGS, MOOD_TAGS, SITUATION_TAGS } from './api-types'

export interface RoomListItem {
  id: string
  title: string
  tags: string[] // genre / mood / situation labels
  memberCount: number
  maxMembers: number
  isPublic: boolean
  password?: string
  nowPlaying: { title: string; artist: string } | null
}

export function fromMockRoom(r: RoomWithDetails): RoomListItem {
  return {
    id: r.id,
    title: r.title,
    tags: r.tags,
    memberCount: r.participants.length,
    maxMembers: r.max_members,
    isPublic: r.is_public,
    password: r.password,
    nowPlaying: r.current_track
      ? { title: r.current_track.title, artist: r.current_track.artist }
      : null,
  }
}

/** Order backend tags as genre → mood → situation for consistent display. */
function orderTags(tags: TagId[]): string[] {
  const inList = (list: readonly string[]) => tags.filter((t) => list.includes(t))
  return [...inList(GENRE_TAGS), ...inList(MOOD_TAGS), ...inList(SITUATION_TAGS)]
}

export function fromApiRoom(c: ApiRoomCard): RoomListItem {
  return {
    id: c.id,
    title: c.title,
    tags: orderTags(c.tags),
    memberCount: c.memberCount,
    maxMembers: c.maxMembers,
    isPublic: true, // GET /api/rooms only returns public rooms
    nowPlaying: c.nowPlaying ? { title: c.nowPlaying.title, artist: c.nowPlaying.artist } : null,
  }
}
