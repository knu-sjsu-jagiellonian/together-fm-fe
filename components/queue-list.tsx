'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'
import { cn, ytThumb } from '@/lib/utils'
import type { Track } from '@/lib/types'
import { TrackSearch } from './track-search'
import type { SearchResult } from '@/lib/api-types'

interface QueueListProps {
  queue: Track[]
  /** Currently-playing track, shown at the top of the full list. */
  current?: Track | null
  onRemove?: (trackId: string) => void
  onAdd?: (track: SearchResult) => void
  className?: string
}

function Cover({ track }: { track: Track }) {
  const cover = track.album_art ?? ytThumb(track.video_id)
  return cover ? (
    <Image src={cover} alt="" width={40} height={40} unoptimized className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
  ) : (
    <span className="h-10 w-10 flex-shrink-0 rounded-lg bg-secondary" />
  )
}

export function QueueList({ queue, current, onRemove, onAdd, className }: QueueListProps) {
  const [adding, setAdding] = useState(false)
  const addRef = useRef<HTMLDivElement>(null)
  const total = (current ? 1 : 0) + queue.length

  // Bring the search into view so its dropdown has room (it sits near the page bottom).
  useEffect(() => {
    if (adding) addRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [adding])

  return (
    <section className={cn('', className)}>
      <h2 className="mb-2 text-[12.5px] font-bold text-muted-foreground">
        전체 곡 <span className="text-muted-foreground/60">({total})</span>
      </h2>

      <div className="overflow-hidden rounded-[16px] border-2 border-border bg-white">
        {/* Scrollable list — caps height and scrolls when the playlist grows */}
        <ul className="max-h-[300px] overflow-y-auto" role="list">
          {current && (
            <li className="flex items-center gap-3 border-b border-border bg-secondary/30 px-3 py-2.5">
              <span className="w-8 flex-shrink-0 text-center text-[11px] font-extrabold text-primary">1</span>
              <Cover track={current} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-foreground">{current.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{current.artist}</p>
              </div>
              <span className="flex h-4 flex-shrink-0 items-end gap-[2px] pr-1" aria-hidden="true">
                {[6, 12, 8, 14].map((h, i) => (
                  <span
                    key={i}
                    className="w-[2.5px] rounded-full bg-primary motion-safe:animate-bounce"
                    style={{ height: h, animationDelay: `${i * 0.12}s`, animationDuration: '0.9s' }}
                  />
                ))}
              </span>
            </li>
          )}

          {queue.map((track, idx) => (
            <li key={track.id} className="group flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
              <span className="w-8 flex-shrink-0 text-center text-[11px] font-extrabold text-muted-foreground">
                {(current ? 2 : 1) + idx}
              </span>
              <Cover track={track} />
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
          ))}

          {total === 0 && (
            <li className="px-3 py-6 text-center text-[12px] text-muted-foreground">아직 곡이 없어요</li>
          )}
        </ul>
      </div>

      {/* add area — OUTSIDE the overflow-hidden card so the search dropdown isn't clipped */}
      {onAdd && (
        <div ref={addRef} className="mt-2">
          {adding ? (
            <div>
              <TrackSearch
                inline
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
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed border-border bg-white py-3 text-[12.5px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <Plus className="h-4 w-4" /> 곡 추가
            </button>
          )}
        </div>
      )}
    </section>
  )
}
