'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { RoomWithDetails, Track } from '@/lib/types'
import { NowPlayingCard } from '@/components/now-playing-card'
import { QueueList } from '@/components/queue-list'
import { ReactionBar } from '@/components/reaction-bar'
import { TagPill } from '@/components/tag-pill'
import { Vinyl } from '@/components/vinyl'
import { Minimi } from '@/components/minimi'

interface RoomClientProps {
  room: RoomWithDetails
}

type SearchResult = Omit<Track, 'id' | 'room_id' | 'added_by' | 'position' | 'played_at'>

export function RoomClient({ room }: RoomClientProps) {
  const [queue, setQueue] = useState(room.queue)

  const handleAddTrack = (track: SearchResult) => {
    // TODO: Replace with Supabase insert
    const newTrack: Track = {
      id: `t-${Date.now()}`,
      room_id: room.id,
      title: track.title,
      artist: track.artist,
      added_by: '나',
      position: queue.length,
      played_at: null,
      duration_sec: track.duration_sec,
    }
    setQueue((prev) => [...prev, newTrack])
  }

  const handleRemoveTrack = (trackId: string) => {
    // TODO: Replace with Supabase delete
    setQueue((prev) => prev.filter((t) => t.id !== trackId))
  }

  // "Me" is the last participant for demo purposes.
  const meId = room.participants[room.participants.length - 1]?.id

  return (
    <div className="flex flex-1 flex-col gap-5 px-6 pb-8 pt-4">
      {/* tags + presence */}
      <div className="flex flex-wrap items-center gap-2">
        <TagPill label={room.mood_tag} />
        <TagPill label={room.situation_tag} />
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-transparent bg-white px-3 py-1 holo-ring">
          <span className="h-2 w-2 rounded-full" style={{ background: '#b8a0e8' }} />
          <span className="text-[10px] font-bold text-muted-foreground">
            {room.participants.length}명 함께 듣는 중
          </span>
        </span>
      </div>

      {/* central vinyl + minimi participants */}
      <section className="flex flex-col items-center gap-4 py-2">
        <Vinyl size={92} hub="#b8a0e8" holoRing spinning />
        <ul className="flex flex-wrap justify-center gap-2" role="list" aria-label="참여자">
          {room.participants.map((p) => (
            <li key={p.id}>
              <Minimi seed={p.id} clothes={p.avatar_color} isMe={p.id === meId} size={34} />
            </li>
          ))}
        </ul>
        <p className="text-[10px] font-semibold text-muted-foreground">(진한 테두리 = 나)</p>
      </section>

      {/* now playing */}
      <NowPlayingCard track={room.current_track} />

      {/* queue */}
      <QueueList queue={queue} onRemove={handleRemoveTrack} onAdd={handleAddTrack} />

      {/* reaction bar */}
      <ReactionBar />

      {/* leave / end */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          className="flex-1 rounded-full border-2 border-border py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          방 나가기
        </button>
        <Link
          href={`/rooms/${room.id}/summary`}
          className="flex-1 rounded-full border-2 border-destructive/40 py-2.5 text-center text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
        >
          방 종료
        </Link>
      </div>
    </div>
  )
}
