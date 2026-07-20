'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, DoorOpen } from 'lucide-react'
import type { RoomWithDetails, Track } from '@/lib/types'
import { NowPlayingCard } from '@/components/now-playing-card'
import { AvatarStack } from '@/components/avatar-stack'
import { QueueList } from '@/components/queue-list'
import { ReactionBar } from '@/components/reaction-bar'
import { TrackSearch } from '@/components/track-search'
import { TagPill } from '@/components/tag-pill'

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-10 flex flex-col gap-4">

      {/* Room info bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <TagPill label={room.genre_tag} />
        <TagPill label={room.mood_tag} />
        <TagPill label={room.situation_tag} />
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold text-foreground">{room.participants.length}</span>
          <span>/ {room.max_members}명 참여중</span>
        </div>
      </div>

      {/* Now playing */}
      <NowPlayingCard track={room.current_track} />

      {/* Participants */}
      <section className="glass-card rounded-2xl p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          참여중인 사람
        </h2>
        <div className="flex items-center gap-3">
          <AvatarStack
            participants={room.participants}
            maxMembers={room.max_members}
            size="md"
            showEmpty
          />
          <div className="ml-auto text-xs text-muted-foreground">
            {room.max_members - room.participants.length > 0 ? (
              <span className="text-accent font-medium">
                {room.max_members - room.participants.length}자리 남음
              </span>
            ) : (
              <span className="text-red-400 font-medium">자리 없음</span>
            )}
          </div>
        </div>

        {/* Participant name list */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {room.participants.map((p) => (
            <span
              key={p.id}
              className="px-2 py-0.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${p.avatar_color}22`,
                borderColor: `${p.avatar_color}55`,
                color: p.avatar_color,
              }}
            >
              {p.name}
            </span>
          ))}
        </div>
      </section>

      {/* Queue */}
      <QueueList queue={queue} onRemove={handleRemoveTrack} />

      {/* Reaction bar */}
      <ReactionBar />

      {/* Track search */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          곡 추가하기
        </h2>
        <TrackSearch onAdd={handleAddTrack} />
      </section>

      {/* Leave / End room */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <DoorOpen className="w-4 h-4" />
          방 나가기
        </button>
        <Link
          href={`/rooms/${room.id}/summary`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border border-destructive/40 text-sm text-red-400 hover:bg-red-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
        >
          방 종료
        </Link>
      </div>
    </div>
  )
}
