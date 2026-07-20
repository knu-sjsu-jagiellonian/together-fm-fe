'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Music2, Lock, Globe, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenreTag, MoodTag, SituationTag } from '@/lib/types'
import { GENRE_TAGS, MOOD_TAGS, SITUATION_TAGS } from '@/lib/types'
import { TagPill } from '@/components/tag-pill'

export function CreateRoomForm() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [genreTag, setGenreTag] = useState<GenreTag | null>(null)
  const [moodTag, setMoodTag] = useState<MoodTag | null>(null)
  const [situationTag, setSituationTag] = useState<SituationTag | null>(null)
  const [maxMembers, setMaxMembers] = useState(4)
  const [isPublic, setIsPublic] = useState(true)
  const [firstTrackTitle, setFirstTrackTitle] = useState('')
  const [firstTrackArtist, setFirstTrackArtist] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isValid =
    title.trim().length > 0 &&
    genreTag !== null &&
    moodTag !== null &&
    situationTag !== null &&
    firstTrackTitle.trim().length > 0 &&
    firstTrackArtist.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setIsSubmitting(true)
    // TODO: Replace with Supabase insert
    await new Promise((res) => setTimeout(res, 700))
    router.push('/rooms/room-1')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Room title */}
      <section className="glass-card rounded-2xl p-4">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2" htmlFor="room-title">
          방 제목
        </label>
        <input
          id="room-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 새벽 감성 팝송 타임"
          maxLength={40}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-b border-border pb-1.5 focus:border-primary transition-colors"
          required
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-muted-foreground">{title.length}/40</span>
        </div>
      </section>

      {/* Genre tag */}
      <section className="glass-card rounded-2xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          장르 태그 <span className="text-primary">*</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="장르 태그 선택">
          {GENRE_TAGS.map((tag) => (
            <TagPill
              key={tag}
              label={tag}
              active={genreTag === tag}
              onClick={() => setGenreTag(genreTag === tag ? null : tag)}
            />
          ))}
        </div>
      </section>

      {/* Mood tag */}
      <section className="glass-card rounded-2xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          분위기 태그 <span className="text-primary">*</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="분위기 태그 선택">
          {MOOD_TAGS.map((tag) => (
            <TagPill
              key={tag}
              label={tag}
              active={moodTag === tag}
              onClick={() => setMoodTag(moodTag === tag ? null : tag)}
            />
          ))}
        </div>
      </section>

      {/* Situation tag */}
      <section className="glass-card rounded-2xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          상황 태그 <span className="text-primary">*</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="상황 태그 선택">
          {SITUATION_TAGS.map((tag) => (
            <TagPill
              key={tag}
              label={tag}
              active={situationTag === tag}
              onClick={() => setSituationTag(situationTag === tag ? null : tag)}
            />
          ))}
        </div>
      </section>

      {/* Max members + Visibility */}
      <div className="flex gap-3">
        {/* Max members stepper */}
        <section className="glass-card rounded-2xl p-4 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            최대 인원
          </p>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMaxMembers((m) => Math.max(2, m - 1))}
              disabled={maxMembers <= 2}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-border flex items-center justify-center disabled:opacity-30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="인원 감소"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-lg text-foreground w-6 text-center">
              {maxMembers}
            </span>
            <button
              type="button"
              onClick={() => setMaxMembers((m) => Math.min(8, m + 1))}
              disabled={maxMembers >= 8}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-border flex items-center justify-center disabled:opacity-30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="인원 증가"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">최소 2명 · 최대 8명</p>
        </section>

        {/* Public toggle */}
        <section className="glass-card rounded-2xl p-4 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            공개 여부
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                isPublic
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-white/5 border-border text-muted-foreground hover:bg-white/10',
              )}
              aria-pressed={isPublic}
            >
              <Globe className="w-4 h-4" />
              전체 공개
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                !isPublic
                  ? 'bg-accent/20 border-accent/50 text-accent'
                  : 'bg-white/5 border-border text-muted-foreground hover:bg-white/10',
              )}
              aria-pressed={!isPublic}
            >
              <Lock className="w-4 h-4" />
              비공개
            </button>
          </div>
        </section>
      </div>

      {/* First track */}
      <section className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
            <Music2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            첫 번째 트랙 <span className="text-primary">*</span>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="sr-only" htmlFor="track-title">곡 제목</label>
            <input
              id="track-title"
              type="text"
              value={firstTrackTitle}
              onChange={(e) => setFirstTrackTitle(e.target.value)}
              placeholder="곡 제목"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-b border-border pb-1.5 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="track-artist">아티스트</label>
            <input
              id="track-artist"
              type="text"
              value={firstTrackArtist}
              onChange={(e) => setFirstTrackArtist(e.target.value)}
              placeholder="아티스트"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-b border-border pb-1.5 focus:border-primary transition-colors"
            />
          </div>
        </div>
        {!firstTrackTitle.trim() && !firstTrackArtist.trim() && (
          <p className="text-xs text-muted-foreground mt-2">첫 곡을 입력해야 방을 만들 수 있어요</p>
        )}
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={cn(
          'w-full py-3.5 rounded-full font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          isValid && !isSubmitting
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground glow-pink hover:scale-[1.02]'
            : 'bg-white/10 text-muted-foreground cursor-not-allowed',
        )}
      >
        {isSubmitting ? '방 만드는 중...' : '방 만들기'}
      </button>
    </form>
  )
}
