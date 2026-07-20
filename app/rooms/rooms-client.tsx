'use client'

import { useState } from 'react'
import type { FilterTag, RoomWithDetails } from '@/lib/types'
import { TagPill } from '@/components/tag-pill'
import { RoomCard } from '@/components/room-card'

interface RoomsClientProps {
  rooms: RoomWithDetails[]
  filterTags: FilterTag[]
}

export function RoomsClient({ rooms, filterTags }: RoomsClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTag>('전체')

  const filtered = activeFilter === '전체'
    ? rooms
    : rooms.filter(
        (r) =>
          r.genre_tag === activeFilter ||
          r.mood_tag === activeFilter ||
          r.situation_tag === activeFilter,
      )

  return (
    <section className="max-w-2xl mx-auto px-4 pb-10">
      {/* Filter chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide"
        role="group"
        aria-label="무드/상황 태그 필터"
      >
        {filterTags.map((tag) => (
          <TagPill
            key={tag}
            label={tag}
            active={activeFilter === tag}
            onClick={() => setActiveFilter(tag)}
            className="flex-shrink-0"
          />
        ))}
      </div>

      {/* Room count */}
      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length}개의 방
      </p>

      {/* Room cards grid */}
      {filtered.length > 0 ? (
        <ul className="flex flex-col gap-3" role="list">
          {filtered.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl" aria-hidden="true">🎵</span>
          <p className="text-sm text-muted-foreground">
            해당 태그의 방이 없어요.
            <br />
            <span className="text-primary font-medium">직접 방을 만들어보세요!</span>
          </p>
        </div>
      )}
    </section>
  )
}
