'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Track } from '@/lib/types'

type SearchResult = Omit<Track, 'id' | 'room_id' | 'added_by' | 'position' | 'played_at'>

interface QueueListProps {
  queue: Track[]
  onRemove?: (trackId: string) => void
  onAdd?: (track: SearchResult) => void
  className?: string
}

// Demo tracks the "+ 곡 추가" chip cycles through (mockup-level stand-in for search).
const DEMO_TRACKS: SearchResult[] = [
  { title: 'Ditto', artist: 'NewJeans', duration_sec: 185 },
  { title: '사건의 지평선', artist: '윤하', duration_sec: 260 },
  { title: 'Attention', artist: 'NewJeans', duration_sec: 180 },
]

export function QueueList({ queue, onRemove, onAdd, className }: QueueListProps) {
  return (
    <section className={cn('', className)}>
      <h2 className="mb-2 text-[11.5px] font-bold text-muted-foreground">다음 곡 (FIFO)</h2>
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide">
        {queue.map((track) => (
          <div
            key={track.id}
            className="group relative flex h-[46px] w-[76px] flex-shrink-0 flex-col items-center justify-center rounded-[12px] border-2 border-border bg-white px-1.5"
          >
            <span className="w-full truncate text-center text-[10px] font-bold text-foreground">
              {track.title}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(track.id)}
                className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full border border-border bg-white text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
                aria-label={`${track.title} 제거`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}

        {onAdd && (
          <button
            type="button"
            onClick={() => onAdd(DEMO_TRACKS[queue.length % DEMO_TRACKS.length])}
            className="flex h-[46px] w-[76px] flex-shrink-0 items-center justify-center rounded-[12px] border-2 border-dashed border-border bg-secondary/40 text-[9.5px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            + 곡 추가
          </button>
        )}
      </div>
    </section>
  )
}
