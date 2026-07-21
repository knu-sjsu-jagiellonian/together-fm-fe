'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'
import { cn, ytThumb } from '@/lib/utils'
import type { Track } from '@/lib/types'
import { TrackSearch } from './track-search'
import type { SearchResult } from '@/lib/api-types'

interface QueueListProps {
  /** Full playlist in order (numbered 1..n, fixed). */
  tracks: Track[]
  /** Id of the currently-playing track (highlighted). */
  currentId?: string | null
  onRemove?: (trackId: string) => void
  /** Whether the current user may remove a given track (host or the adder). */
  canRemove?: (track: Track) => boolean
  onAdd?: (track: SearchResult) => void
  /** Jump to a track by its index. */
  onSelect?: (index: number) => void
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

export function QueueList({ tracks, currentId, onRemove, canRemove, onAdd, onSelect, className }: QueueListProps) {
  const [adding, setAdding] = useState(false)
  const addRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (adding) addRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [adding])

  return (
    <section className={cn('', className)}>
      <h2 className="mb-2 text-[12.5px] font-bold text-muted-foreground">
        전체 곡 <span className="text-muted-foreground/60">({tracks.length})</span>
      </h2>

      <div className="overflow-hidden rounded-[16px] border-2 border-border bg-white">
        {/* Fixed, ordered list — numbers never change; the playing row is highlighted. Scrolls when long. */}
        <ul className="max-h-[300px] overflow-y-auto" role="list">
          {tracks.map((track, idx) => {
            const isCurrent = track.id === currentId
            return (
              <li
                key={track.id}
                className={cn(
                  'group flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0',
                  isCurrent && 'bg-secondary/30',
                  onSelect && 'cursor-pointer',
                )}
                onClick={onSelect ? () => onSelect(idx) : undefined}
              >
                <span className={cn('w-6 flex-shrink-0 text-center text-[11px] font-extrabold', isCurrent ? 'text-primary' : 'text-muted-foreground')}>
                  {idx + 1}
                </span>
                <Cover track={track} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-foreground">{track.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {track.artist}
                    {track.added_by ? <span className="text-primary/70"> · {track.added_by}</span> : null}
                  </p>
                </div>

                {isCurrent ? (
                  <span className="flex h-4 flex-shrink-0 items-end gap-[2px] pr-1" aria-hidden="true">
                    {[6, 12, 8, 14].map((h, i) => (
                      <span
                        key={i}
                        className="w-[2.5px] rounded-full bg-primary motion-safe:animate-bounce"
                        style={{ height: h, animationDelay: `${i * 0.12}s`, animationDuration: '0.9s' }}
                      />
                    ))}
                  </span>
                ) : (
                  onRemove && (!canRemove || canRemove(track)) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(track.id)
                      }}
                      className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
                      aria-label={`${track.title} 제거`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </li>
            )
          })}

          {tracks.length === 0 && (
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
