'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Plus } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useTrackSearch } from '@/hooks/use-track-search'
import type { SearchResult } from '@/lib/api-types'

interface TrackSearchProps {
  onAdd?: (track: SearchResult) => void
  placeholder?: string
  className?: string
}

/** Backend-proxied YouTube search box (GET /api/search) with a results dropdown. */
export function TrackSearch({ onAdd, placeholder = '노래 제목 또는 아티스트 검색', className }: TrackSearchProps) {
  const { q, setQ, results, loading, error, reset } = useTrackSearch()
  const [dismissed, setDismissed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Derived — no effect needed. Open while typing and not manually dismissed.
  const isOpen = q.trim().length > 0 && !dismissed

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDismissed(true)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (value: string) => {
    setQ(value)
    setDismissed(false)
  }

  const handleAdd = (track: SearchResult) => {
    onAdd?.(track)
    reset()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* input */}
      <div className="flex items-center gap-2.5 rounded-[14px] border-2 border-border bg-white px-4 py-3">
        <Search className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70" />
        <input
          type="text"
          value={q}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setDismissed(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="곡 검색"
          aria-expanded={isOpen}
          aria-controls="track-search-listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        {loading && <span className="text-[11px] font-medium text-muted-foreground">검색중…</span>}
        {q && !loading && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {/* dropdown */}
      {isOpen && (results.length > 0 || error) && (
        <div
          id="track-search-listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[14px] border-2 border-border bg-white shadow-[0_10px_28px_rgba(120,100,160,0.16)]"
          role="listbox"
          aria-label="검색 결과"
        >
          {error ? (
            <p className="px-4 py-4 text-center text-[13px] text-destructive">{error}</p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto">
              {results.map((track) => (
                <li
                  key={track.videoId}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/40"
                  role="option"
                  aria-selected={false}
                >
                  <Image
                    src={track.thumbnail}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 flex-shrink-0 rounded-lg object-cover"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-foreground">{track.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{track.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(track)}
                    className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-primary/15 text-primary transition-all hover:scale-110 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    aria-label={`${track.title} 추가`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isOpen && !loading && !error && q.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-[14px] border-2 border-border bg-white p-4 text-center">
          <p className="text-[13px] text-muted-foreground">&quot;{q}&quot; 검색 결과가 없어요</p>
        </div>
      )}
    </div>
  )
}
