'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenreTag, MoodTag, SituationTag } from '@/lib/types'
import { GENRE_TAGS, MOOD_TAGS, SITUATION_TAGS } from '@/lib/types'
import { Vinyl } from '@/components/vinyl'

/** Holographic multi-look select chip (single-select under the hood). */
function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        active
          ? 'bg-holo font-extrabold text-[#2c2a35]'
          : 'border-2 border-border bg-white text-muted-foreground hover:border-primary/40',
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

export function CreateRoomForm() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [genreTag, setGenreTag] = useState<GenreTag | null>(null)
  const [moodTag, setMoodTag] = useState<MoodTag | null>(null)
  const [situationTag, setSituationTag] = useState<SituationTag | null>(null)
  const [maxMembers, setMaxMembers] = useState(8)
  const [isPublic, setIsPublic] = useState(true)
  const [firstTrackTitle, setFirstTrackTitle] = useState('')
  const [firstTrackArtist, setFirstTrackArtist] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasTrack = firstTrackTitle.trim().length > 0
  const isValid =
    title.trim().length > 0 &&
    genreTag !== null &&
    moodTag !== null &&
    situationTag !== null &&
    hasTrack

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setIsSubmitting(true)
    // TODO: Replace with Supabase insert
    await new Promise((res) => setTimeout(res, 700))
    router.push('/rooms/room-1')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* Room title */}
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

      {/* Genre */}
      <div>
        <FieldLabel hint={genreTag ? '선택됨' : undefined}>장르</FieldLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="장르 선택">
          {GENRE_TAGS.map((tag) => (
            <Chip key={tag} label={tag} active={genreTag === tag} onClick={() => setGenreTag(genreTag === tag ? null : tag)} />
          ))}
        </div>
      </div>

      {/* Mood */}
      <div>
        <FieldLabel hint={moodTag ? '선택됨' : undefined}>분위기</FieldLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="분위기 선택">
          {MOOD_TAGS.map((tag) => (
            <Chip key={tag} label={tag} active={moodTag === tag} onClick={() => setMoodTag(moodTag === tag ? null : tag)} />
          ))}
        </div>
      </div>

      {/* Situation */}
      <div>
        <FieldLabel hint={situationTag ? '선택됨' : undefined}>상황</FieldLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="상황 선택">
          {SITUATION_TAGS.map((tag) => (
            <Chip key={tag} label={tag} active={situationTag === tag} onClick={() => setSituationTag(situationTag === tag ? null : tag)} />
          ))}
        </div>
        <p className="mt-2.5 text-[10.5px] font-medium text-muted-foreground/80">
          태그를 선택하면 더 잘 맞는 사람들과 만날 수 있어요
        </p>
      </div>

      {/* Max members slider */}
      <div>
        <FieldLabel hint={<span className="text-[14px]">{maxMembers}명</span>}>최대 인원</FieldLabel>
        <input
          type="range"
          min={2}
          max={8}
          value={maxMembers}
          onChange={(e) => setMaxMembers(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
          aria-label="최대 인원"
        />
      </div>

      {/* Visibility */}
      <div>
        <FieldLabel>방 공개 여부</FieldLabel>
        <div className="inline-flex rounded-full border-2 border-border bg-white p-1">
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            aria-pressed={isPublic}
            className={cn(
              'rounded-full px-5 py-1.5 text-[11.5px] font-extrabold transition-all',
              isPublic ? 'bg-primary text-white' : 'text-muted-foreground',
            )}
          >
            공개
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            aria-pressed={!isPublic}
            className={cn(
              'rounded-full px-5 py-1.5 text-[11.5px] font-extrabold transition-all',
              !isPublic ? 'bg-primary text-white' : 'text-muted-foreground',
            )}
          >
            비공개
          </button>
        </div>
      </div>

      {/* First track */}
      <div>
        <FieldLabel>첫 트랙 설정 (필수)</FieldLabel>
        <div className="flex items-center gap-2.5 rounded-[14px] border-2 border-border bg-white px-4 py-3">
          <Search className="h-[18px] w-[18px] text-muted-foreground/70" />
          <input
            type="text"
            value={firstTrackTitle}
            onChange={(e) => setFirstTrackTitle(e.target.value)}
            placeholder="노래 제목 또는 아티스트 검색"
            className="w-full bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60"
            aria-label="곡 제목"
          />
        </div>

        {hasTrack ? (
          <div className="mt-3 flex items-center gap-3 rounded-[16px] border-2 border-primary/50 bg-white p-3">
            <Vinyl size={42} hub="#b8a0e8" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={firstTrackTitle}
                onChange={(e) => setFirstTrackTitle(e.target.value)}
                className="w-full bg-transparent text-[14px] font-extrabold text-foreground outline-none"
                aria-label="곡 제목"
              />
              <input
                type="text"
                value={firstTrackArtist}
                onChange={(e) => setFirstTrackArtist(e.target.value)}
                placeholder="아티스트"
                className="w-full bg-transparent text-[12px] font-medium text-muted-foreground outline-none placeholder:text-muted-foreground/60"
                aria-label="아티스트"
              />
            </div>
            <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-primary text-[13px] font-extrabold text-white">
              ✓
            </span>
          </div>
        ) : (
          <p className="mt-3 text-[11.5px] font-medium text-muted-foreground/80">
            첫 곡을 설정해야 빈 방을 방지할 수 있어요
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={cn(
          'mt-1 w-full rounded-full py-4 text-[16.5px] font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          isValid && !isSubmitting
            ? 'bg-holo text-[#2c2a35] hover:scale-[1.01]'
            : 'cursor-not-allowed bg-muted text-muted-foreground',
        )}
      >
        {isSubmitting ? '방 만드는 중...' : '방 만들기'}
      </button>
    </form>
  )
}
