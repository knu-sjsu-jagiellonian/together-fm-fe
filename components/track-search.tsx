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

/**
 * Backend-proxied YouTube search box. Searches on Enter (or the search button),
 * not per keystroke, then lets you pick a result to add.
 */
export function TrackSearch({ onAdd, placeholder = '노래 제목·아티스트 입력 후 Enter', className }: TrackSearchProps) {
  const { results, loading, error, searched, search, reset } = useTrackSearch()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const runSearch = () => {
    if (!q.trim()) return
    setOpen(true)
    search(q)
  }

  const handleAdd = (track: SearchResult) => {
    onAdd?.(track)
    setQ('')
    reset()
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* input */}
      <div className="flex items-center gap-2.5 rounded-[14px] border-2 border-border bg-white px-4 py-3 focus-within:border-primary">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              runSearch()
            }
          }}
          onFocus={() => searched && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="곡 검색"
          aria-expanded={open}
          aria-controls="track-search-listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={!q.trim() || loading}
          className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="검색"
        >
          <Search className="h-[15px] w-[15px]" />
        </button>
      </div>

      {/* dropdown */}
      {open && (loading || error || results.length > 0 || searched) && (
        <div
          id="track-search-listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[14px] border-2 border-border bg-white shadow-[0_10px_28px_rgba(120,100,160,0.16)]"
          role="listbox"
          aria-label="검색 결과"
        >
          {loading ? (
            <p className="px-4 py-4 text-center text-[13px] text-muted-foreground">검색 중…</p>
          ) : error ? (
            <p className="px-4 py-4 text-center text-[13px] text-destructive">{error}</p>
          ) : results.length > 0 ? (
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
          ) : (
            <p className="px-4 py-4 text-center text-[13px] text-muted-foreground">검색 결과가 없어요</p>
          )}
        </div>
      )}
    </div>
  )
}
