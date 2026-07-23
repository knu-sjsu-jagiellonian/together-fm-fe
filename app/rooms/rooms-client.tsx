'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListFilter, Lock, Search, X } from 'lucide-react'
import { GENRE_TAGS, MOOD_TAGS, SITUATION_TAGS, type Tag } from '@/lib/types'
import { api, getToken } from '@/lib/api'
import { fromApiRoom, type RoomListItem } from '@/lib/rooms'
import { TagPill } from '@/components/tag-pill'
import { RoomCard } from '@/components/room-card'
import { useToast } from '@/components/toast'

interface RoomsClientProps {
  /** Mock rooms rendered on the server; replaced by live data when logged in. */
  initialRooms: RoomListItem[]
}

// Filter groups. Selecting is optional; within a group tags are OR'd, across
// groups they are AND'd (e.g. genre=인디 AND mood=감성적인).
const FILTER_GROUPS: { label: string; tags: readonly Tag[] }[] = [
  { label: '장르', tags: GENRE_TAGS },
  { label: '분위기', tags: MOOD_TAGS },
  { label: '상황', tags: SITUATION_TAGS },
]

export function RoomsClient({ initialRooms }: RoomsClientProps) {
  const router = useRouter()
  const toast = useToast()
  const [rooms, setRooms] = useState<RoomListItem[]>(initialRooms)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Tag[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)

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

  const toggleTag = (t: Tag) =>
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const q = query.trim().toLowerCase()
  const filtered = rooms.filter((r) => {
    const matchesQuery = !q || r.title.toLowerCase().includes(q)
    const matchesTags = FILTER_GROUPS.every((g) => {
      const sel = selected.filter((t) => g.tags.includes(t))
      return sel.length === 0 || sel.some((t) => r.tags.includes(t))
    })
    return matchesQuery && matchesTags
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
      {/* Search (title only) */}
      <div className="mt-4 flex items-center gap-2.5 rounded-full border-2 border-border bg-white px-4 py-3">
        <Search className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="방 제목으로 검색"
          className="flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="방 제목 검색"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="text-xs text-muted-foreground hover:text-foreground" aria-label="검색어 지우기">
            ✕
          </button>
        )}
      </div>

      {/* Filter button + active tag chips */}
      <div className="mb-5 mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border-2 border-border bg-white px-3.5 py-2 text-[13px] font-bold text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="장르·분위기·상황 필터 열기"
        >
          <ListFilter className="h-4 w-4 text-primary" />
          필터
          {selected.length > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-holo px-1 text-[10px] font-extrabold text-[#2c2a35]">
              {selected.length}
            </span>
          )}
        </button>

        {selected.length > 0 && (
          <div className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide">
            {selected.map((t) => (
              <TagPill key={t} label={t} active onClick={() => toggleTag(t)} className="flex-shrink-0" />
            ))}
          </div>
        )}
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
            {query || selected.length > 0 ? '조건에 맞는 방이 없어요.' : '아직 열린 방이 없어요.'}
            <br />
            <span className="font-medium text-primary">직접 방을 만들어보세요!</span>
          </p>
        </div>
      )}

      {/* Filter bottom sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 mx-auto flex max-w-[440px] items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="필터"
          onClick={() => setSheetOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[82%] w-full flex-col rounded-[24px] border-2 border-border bg-white">
            <div className="flex items-center justify-between border-b border-border p-4">
              <p className="text-[15px] font-extrabold text-foreground">필터</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {FILTER_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="mb-2.5 text-[13px] font-extrabold text-foreground">{g.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.tags.map((t) => (
                      <TagPill key={t} label={t} active={selected.includes(t)} onClick={() => toggleTag(t)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-border p-4">
              <button
                type="button"
                onClick={() => setSelected([])}
                disabled={selected.length === 0}
                className="rounded-full border-2 border-border px-5 py-2.5 text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 rounded-full bg-holo py-2.5 text-[13px] font-extrabold text-[#2c2a35]"
              >
                {filtered.length}개 방 보기
              </button>
            </div>
          </div>
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
