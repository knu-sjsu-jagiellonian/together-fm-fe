'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'
import { cn, ytThumb } from '@/lib/utils'
import type { Track } from '@/lib/types'
import { TrackSearch } from './track-search'
import type { SearchResult } from '@/lib/api-types'

interface QueueListProps {
  queue: Track[]
  onRemove?: (trackId: string) => void
  onAdd?: (track: SearchResult) => void
  className?: string
}

export function QueueList({ queue, onRemove, onAdd, className }: QueueListProps) {
  const [adding, setAdding] = useState(false)

  return (
    <section className={cn('', className)}>
      <h2 className="mb-2 text-[12.5px] font-bold text-muted-foreground">다음 곡</h2>

      <ul className="flex flex-col overflow-hidden rounded-[16px] border-2 border-border bg-white" role="list">
        {queue.map((track, idx) => {
          const cover = track.album_art ?? ytThumb(track.video_id)
          return (
            <li key={track.id} className="group flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
              <span className="w-4 flex-shrink-0 text-center text-[11px] font-extrabold text-primary">{idx + 1}</span>
              {cover ? (
                <Image src={cover} alt="" width={40} height={40} unoptimized className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="h-10 w-10 flex-shrink-0 rounded-lg bg-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-foreground">{track.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {track.artist}
                  {track.added_by ? <span className="text-primary/70"> · {track.added_by}</span> : null}
                </p>
              </div>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(track.id)}
                  className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
                  aria-label={`${track.title} 제거`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          )
        })}

        {queue.length === 0 && !adding && (
          <li className="px-3 py-4 text-center text-[12px] text-muted-foreground">대기 중인 곡이 없어요</li>
        )}

        {/* add row */}
        {onAdd &&
          (adding ? (
            <li className="p-2.5">
              <TrackSearch
                placeholder="유튜브에서 곡 검색"
                onAdd={(t) => {
                  onAdd(t)
                  setAdding(false)
                }}
              />
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="mt-2 w-full text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                닫기
              </button>
            </li>
          ) : (
            <li>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-border py-3 text-[12.5px] font-bold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <Plus className="h-4 w-4" /> 곡 추가
              </button>
            </li>
          ))}
      </ul>
    </section>
  )
}
