'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { GenreTag, MoodTag, SituationTag } from '@/lib/types'
import { GENRE_TAGS, MOOD_TAGS, SITUATION_TAGS } from '@/lib/types'
import { TrackSearch } from '@/components/track-search'
import { api, getToken, ApiError } from '@/lib/api'
import type { SearchResult, TagId } from '@/lib/api-types'

/** Holographic multi-select chip. */
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // Same border width + font weight in both states so the chip keeps its size when toggled.
        'rounded-full border-2 px-4 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        active
          ? 'border-transparent bg-holo text-[#2c2a35]'
          : 'border-border bg-white text-muted-foreground hover:border-primary/40',
      )}
    >
      {label}
    </button>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-end justify-between">
      <span className="text-[13px] font-bold text-muted-foreground">{children}</span>
      {hint && <span className="text-[11px] font-bold text-primary">{hint}</span>}
    </div>
  )
}

/** Toggle a value in an array (multi-select). */
function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

export function CreateRoomForm() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [genres, setGenres] = useState<GenreTag[]>([])
  const [moods, setMoods] = useState<MoodTag[]>([])
  const [situations, setSituations] = useState<SituationTag[]>([])
  const [maxMembers, setMaxMembers] = useState(10)
  const [isPublic, setIsPublic] = useState(true)
  const [password, setPassword] = useState('')
  const [track, setTrack] = useState<SearchResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordOk = isPublic || (password.length >= 1 && password.length <= 8)
  // At least one tag from any of the three groups is enough (not one from each).
  const hasAnyTag = genres.length + moods.length + situations.length > 0
  const isValid =
    title.trim().length > 0 &&
    hasAnyTag &&
    track !== null &&
    passwordOk

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !track) return
    setIsSubmitting(true)
    setError(null)

    // Backend tags now match our FE labels exactly — send them directly.
    const tags = [...genres, ...moods, ...situations] as TagId[]

    try {
      if (getToken()) {
        // NOTE: the backend CreateRoomInput has no `password` field — private rooms
        // are gated by `isPublic` only. The FE password is not sent yet (flagged).
        const { id } = await api.createRoom({
          title: title.trim(),
          tags,
          maxMembers,
          isPublic,
          firstTrack: { videoId: track.videoId },
        })
        router.push(`/rooms/${id}`)
      } else {
        // Not logged in → no backend to create a real room. Send them back to the
        // list (there are no mock rooms to land on anymore).
        await new Promise((res) => setTimeout(res, 500))
        router.push('/rooms')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '방 생성에 실패했어요')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* title */}
      <div>
        <FieldLabel>방 제목</FieldLabel>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 새벽 감성 플레이리스트"
          maxLength={40}
          className="w-full rounded-[14px] border-2 border-border bg-white px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
          required
        />
      </div>

      {/* genre (multi) */}
      <div>
        <FieldLabel hint={genres.length ? `${genres.length}개 선택됨` : undefined}>장르</FieldLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="장르 선택">
          {GENRE_TAGS.map((tag) => (
            <Chip key={tag} label={tag} active={genres.includes(tag)} onClick={() => setGenres((g) => toggle(g, tag))} />
          ))}
        </div>
      </div>

      {/* mood (multi) */}
      <div>
        <FieldLabel hint={moods.length ? `${moods.length}개 선택됨` : undefined}>분위기</FieldLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="분위기 선택">
          {MOOD_TAGS.map((tag) => (
            <Chip key={tag} label={tag} active={moods.includes(tag)} onClick={() => setMoods((m) => toggle(m, tag))} />
          ))}
        </div>
      </div>

      {/* situation (multi) */}
      <div>
        <FieldLabel hint={situations.length ? `${situations.length}개 선택됨` : undefined}>상황</FieldLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="상황 선택">
          {SITUATION_TAGS.map((tag) => (
            <Chip key={tag} label={tag} active={situations.includes(tag)} onClick={() => setSituations((s) => toggle(s, tag))} />
          ))}
        </div>
        <p className="mt-2.5 text-[10.5px] font-medium text-muted-foreground/80">
          태그를 여러 개 선택하면 더 잘 맞는 사람들과 만날 수 있어요
        </p>
      </div>

      {/* max members */}
      <div>
        <FieldLabel hint={<span className="text-[14px]">{maxMembers}명</span>}>최대 인원</FieldLabel>
        <input
          type="range"
          min={2}
          max={30}
          value={maxMembers}
          onChange={(e) => setMaxMembers(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
          aria-label="최대 인원"
        />
        <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground/70">
          <span>2명</span>
          <span>30명</span>
        </div>
      </div>

      {/* visibility + password */}
      <div>
        <FieldLabel>방 공개 여부</FieldLabel>
        <div className="inline-flex rounded-full border-2 border-border bg-white p-1">
          <button type="button" onClick={() => setIsPublic(true)} aria-pressed={isPublic}
            className={cn('rounded-full px-5 py-1.5 text-[11.5px] font-extrabold transition-all', isPublic ? 'bg-primary text-white' : 'text-muted-foreground')}>
            공개
          </button>
          <button type="button" onClick={() => setIsPublic(false)} aria-pressed={!isPublic}
            className={cn('rounded-full px-5 py-1.5 text-[11.5px] font-extrabold transition-all', !isPublic ? 'bg-primary text-white' : 'text-muted-foreground')}>
            비공개
          </button>
        </div>

        {!isPublic && (
          <div className="mt-3">
            <input
              type="text"
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, 8))}
              placeholder="입장 비밀번호 (최대 8자)"
              maxLength={8}
              className="w-full rounded-[14px] border-2 border-border bg-white px-4 py-3 text-[14px] tracking-widest text-foreground outline-none transition-colors placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary"
              aria-label="입장 비밀번호"
            />
            <p className="mt-1.5 text-[10.5px] font-medium text-muted-foreground/80">
              비공개 방은 입장 시 이 비밀번호가 필요해요
            </p>
          </div>
        )}
      </div>

      {/* first track — real search */}
      <div>
        <FieldLabel>첫 트랙 설정</FieldLabel>
        {track ? (
          <div className="flex items-center gap-3 rounded-[16px] border-2 border-primary/50 bg-white p-3">
            <Image src={track.thumbnail} alt="" width={48} height={48} unoptimized className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-extrabold text-foreground">{track.title}</p>
              <p className="truncate text-[12px] font-medium text-muted-foreground">{track.artist}</p>
            </div>
            <button type="button" onClick={() => setTrack(null)} className="text-[12px] font-bold text-muted-foreground hover:text-destructive" aria-label="선택 해제">
              변경
            </button>
          </div>
        ) : (
          <TrackSearch onAdd={setTrack} />
        )}
      </div>

      {error && <p className="text-[13px] font-medium text-destructive">{error}</p>}

      {/* submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={cn(
          'mt-1 w-full rounded-full py-4 text-[16.5px] font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          isValid && !isSubmitting ? 'bg-holo text-[#2c2a35] hover:scale-[1.01]' : 'cursor-not-allowed bg-muted text-muted-foreground',
        )}
      >
        {isSubmitting ? '방 만드는 중...' : '방 만들기'}
      </button>
    </form>
  )
}
