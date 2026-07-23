'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Search } from 'lucide-react'
import type { FilterTag } from '@/lib/types'
import { api, getToken } from '@/lib/api'
import { fromApiRoom, type RoomListItem } from '@/lib/rooms'
import { TagPill } from '@/components/tag-pill'
import { RoomCard } from '@/components/room-card'
import { useToast } from '@/components/toast'

interface RoomsClientProps {
  /** Mock rooms rendered on the server; replaced by live data when logged in. */
  initialRooms: RoomListItem[]
  filterTags: FilterTag[]
}

export function RoomsClient({ initialRooms, filterTags }: RoomsClientProps) {
  const router = useRouter()
  const toast = useToast()
  const [rooms, setRooms] = useState<RoomListItem[]>(initialRooms)
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTag>('전체')
  const [query, setQuery] = useState('')

  // Password gate for private rooms (mock only — the backend lists public rooms).
  const [locked, setLocked] = useState<RoomListItem | null>(null)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  // When logged in, show the mock test rooms plus the live backend rooms.
  useEffect(() => {
    if (!getToken()) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const list = await api.rooms()
        // Hide empty rooms (they are in the close-grace window and about to disappear).
        const live = list.map(fromApiRoom).filter((r) => r.memberCount > 0)
        if (!cancelled) setRooms([...initialRooms, ...live])
      } catch {
        /* keep the mock rooms */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [initialRooms])

  const q = query.trim().toLowerCase()
  const filtered = rooms.filter((r) => {
    const matchesFilter = activeFilter === '전체' || r.tags.includes(activeFilter)
    const matchesQuery =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q)) ||
      (r.nowPlaying?.title.toLowerCase().includes(q) ?? false)
    return matchesFilter && matchesQuery
  })

  const openGate = (room: RoomListItem) => {
    setLocked(room)
    setPw('')
    setPwError(false)
  }

  const submitGate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!locked) return
    if (pw === (locked.password ?? '')) {
      router.push(`/rooms/${locked.id}`)
    } else {
      setPwError(true)
      toast('비밀번호가 올바르지 않아요', 'error')
    }
  }

  return (
    <section className="pb-8">
      {/* Search */}
      <div className="mt-4 flex items-center gap-2.5 rounded-full border-2 border-border bg-white px-4 py-3">
        <Search className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="방 제목, 태그로 검색"
          className="flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="방 검색"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="text-xs text-muted-foreground hover:text-foreground" aria-label="검색어 지우기">
            ✕
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="-mx-6 mb-5 mt-4 flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide" role="group" aria-label="장르/무드/상황 태그 필터">
        {filterTags.map((tag) => (
          <TagPill key={tag} label={tag} active={activeFilter === tag} onClick={() => setActiveFilter(tag)} className="flex-shrink-0" />
        ))}
      </div>

      <h2 className="mb-3 text-[15px] font-bold text-foreground">지금 열려있는 방</h2>

      {loading && rooms.length === 0 ? (
        <ul className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-4 rounded-[18px] border-2 border-border bg-white p-4 pl-5">
              <span className="h-[86px] w-[86px] flex-shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-2 py-1">
                <span className="block h-3 w-16 animate-pulse rounded bg-secondary" />
                <span className="block h-4 w-2/3 animate-pulse rounded bg-secondary" />
                <span className="block h-3 w-24 animate-pulse rounded bg-secondary" />
                <span className="block h-3 w-1/2 animate-pulse rounded bg-secondary" />
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length > 0 ? (
        <ul className="flex flex-col gap-3" role="list">
          {filtered.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} onLockedClick={openGate} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border-2 border-border bg-white p-10 text-center">
          <span className="text-3xl" aria-hidden="true">🎵</span>
          <p className="text-sm text-muted-foreground">
            {query || activeFilter !== '전체' ? '조건에 맞는 방이 없어요.' : '아직 열린 방이 없어요.'}
            <br />
            <span className="font-medium text-primary">직접 방을 만들어보세요!</span>
          </p>
        </div>
      )}

      {/* Private-room password modal */}
      {locked && (
        <div
          className="fixed inset-0 z-50 mx-auto flex max-w-[440px] items-center justify-center bg-black/25 px-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="비공개 방 입장"
          onClick={() => setLocked(null)}
        >
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitGate} className="w-full rounded-[20px] border-2 border-border bg-white p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary">
                <Lock className="h-4 w-4 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-extrabold text-foreground">{locked.title}</p>
                <p className="text-[11px] font-medium text-muted-foreground">비공개 방 · 비밀번호를 입력하세요</p>
              </div>
            </div>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value.slice(0, 8))
                setPwError(false)
              }}
              placeholder="비밀번호 (최대 8자)"
              maxLength={8}
              className={cnInput(pwError)}
              aria-label="입장 비밀번호"
            />
            {pwError && <p className="mt-1.5 text-[12px] font-semibold text-destructive">비밀번호가 올바르지 않아요</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setLocked(null)} className="flex-1 rounded-full border-2 border-border py-2.5 text-[13px] font-bold text-muted-foreground hover:text-foreground">
                취소
              </button>
              <button type="submit" disabled={pw.length === 0} className="flex-1 rounded-full bg-holo py-2.5 text-[13px] font-extrabold text-[#2c2a35] disabled:cursor-not-allowed disabled:opacity-50">
                입장하기
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

function cnInput(error: boolean) {
  return [
    'w-full rounded-[14px] border-2 bg-white px-4 py-3 text-[15px] tracking-widest text-foreground outline-none transition-colors placeholder:tracking-normal placeholder:text-muted-foreground/60',
    error ? 'border-destructive' : 'border-border focus:border-primary',
  ].join(' ')
}
