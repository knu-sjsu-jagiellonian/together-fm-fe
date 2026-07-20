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
    <section className="pb-8">
      {/* Filter chips */}
      <div
        className="-mx-6 mb-5 mt-5 flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide"
        role="group"
        aria-label="장르/무드/상황 태그 필터"
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

      {/* Section heading */}
      <h2 className="mb-3 text-[15px] font-bold text-foreground">지금 열려있는 방</h2>

      {/* Room cards */}
      {filtered.length > 0 ? (
        <ul className="flex flex-col gap-3" role="list">
          {filtered.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border-2 border-border bg-white p-10 text-center">
          <span className="text-3xl" aria-hidden="true">🎵</span>
          <p className="text-sm text-muted-foreground">
            해당 태그의 방이 없어요.
            <br />
            <span className="font-medium text-primary">직접 방을 만들어보세요!</span>
          </p>
        </div>
      )}
    </section>
  )
}
