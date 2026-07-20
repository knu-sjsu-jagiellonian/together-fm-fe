'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchTracks } from '@/lib/mock-data'
import type { Track } from '@/lib/types'

type SearchResult = Omit<Track, 'id' | 'room_id' | 'added_by' | 'position' | 'played_at'>

interface TrackSearchProps {
  onAdd?: (track: SearchResult) => void
  className?: string
}

export function TrackSearch({ onAdd, className }: TrackSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim()) {
        const found = await searchTracks(query)
        setResults(found)
        setIsOpen(true)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 200)
    return () => clearTimeout(handler)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAdd = (track: SearchResult) => {
    const key = `${track.title}-${track.artist}`
    if (added.has(key)) return
    setAdded((prev) => new Set([...prev, key]))
    onAdd?.(track)
    setQuery('')
    setIsOpen(false)
    setTimeout(() => {
      setAdded((prev) => { const n = new Set(prev); n.delete(key); return n })
    }, 2000)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search input */}
      <div className="glass-card rounded-2xl flex items-center gap-3 px-4 py-3">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="곡 제목 또는 아티스트 검색..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          aria-label="곡 검색"
          aria-expanded={isOpen}
          aria-controls="track-search-listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false) }}
            className="text-muted-foreground hover:text-foreground transition-colors text-xs"
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          id="track-search-listbox"
          className="absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl overflow-hidden z-50"
          role="listbox"
          aria-label="검색 결과"
        >
          <ul className="divide-y divide-border max-h-56 overflow-y-auto">
            {results.map((track) => {
              const key = `${track.title}-${track.artist}`
              const isAdded = added.has(key)
              return (
                <li
                  key={key}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors"
                  role="option"
                  aria-selected={isAdded}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(track)}
                    disabled={isAdded}
                    className={cn(
                      'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                      isAdded
                        ? 'bg-accent/20 border border-accent/40 cursor-default'
                        : 'bg-primary/20 hover:bg-primary/40 border border-primary/40 hover:scale-110',
                    )}
                    aria-label={isAdded ? '추가됨' : `${track.title} 추가`}
                  >
                    {isAdded
                      ? <span className="text-accent text-xs">✓</span>
                      : <Plus className="w-3.5 h-3.5 text-primary" />
                    }
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl p-4 text-center z-50">
          <p className="text-sm text-muted-foreground">
            &quot;{query}&quot; 검색 결과가 없어요
          </p>
        </div>
      )}
    </div>
  )
}
