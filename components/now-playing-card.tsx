'use client'

import Image from 'next/image'
import { Music2, SkipForward, SkipBack, Play, Pause } from 'lucide-react'
import { cn, ytThumb } from '@/lib/utils'
import type { Track } from '@/lib/types'
import { Vinyl } from './vinyl'

interface NowPlayingCardProps {
  track: Track | null
  /** Controlled playback state (from the local player). */
  isPlaying?: boolean
  progressSec?: number
  durationSec?: number
  onToggle?: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
  className?: string
}

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

export function NowPlayingCard({
  track,
  isPlaying = false,
  progressSec = 0,
  durationSec,
  onToggle,
  onNext,
  onPrev,
  hasNext = true,
  hasPrev = true,
  className,
}: NowPlayingCardProps) {
  if (!track) {
    return (
      <div className={cn('flex flex-col items-center gap-3 rounded-[22px] border-2 border-border bg-white p-6', className)}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Music2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">재생 중인 곡이 없습니다</p>
      </div>
    )
  }

  const duration = durationSec || track.duration_sec || 0
  const pct = duration > 0 ? Math.min(100, (progressSec / duration) * 100) : 0
  const cover = track.album_art ?? ytThumb(track.video_id)

  return (
    <div className={cn('rounded-[22px] border-2 border-border bg-white p-5', className)}>
      <div className="flex items-center gap-4">
        {/* Album art with a record peeking behind it (falls back to vinyl) */}
        {!cover ? (
          <Vinyl size={58} hub="#b8a0e8" holoRing spinning={isPlaying} className="flex-shrink-0" />
        ) : (
          <span className="relative flex-shrink-0" style={{ width: 76, height: 60 }}>
            <Vinyl size={54} hub="#b8a0e8" spinning={isPlaying} className="absolute right-0 top-1/2 -translate-y-1/2" />
            <Image
              src={cover}
              alt=""
              width={60}
              height={60}
              unoptimized
              className="absolute left-0 top-1/2 z-10 h-[60px] w-[60px] -translate-y-1/2 rounded-xl border-2 border-white object-cover shadow-sm"
            />
          </span>
        )}

        {/* Track info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-extrabold leading-tight text-foreground">{track.title}</p>
          <p className="mt-0.5 truncate text-[12px] font-medium text-muted-foreground">{track.artist}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#eaf3fb] px-2 py-0.5">
            <span className={cn('h-1.5 w-1.5 rounded-full bg-[#5b9bc9]', isPlaying && 'animate-pulse')} />
            <span className="text-[8.5px] font-bold text-[#3f7fb0]">{isPlaying ? '재생 중' : '일시정지'}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="relative h-1 overflow-hidden rounded-full bg-secondary">
          <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">{formatTime(progressSec)}</span>
          <span className="text-[10px] font-semibold text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="text-foreground transition-transform hover:scale-110 disabled:opacity-30 focus-visible:outline-none"
          aria-label="이전 곡"
        >
          <SkipBack className="h-5 w-5" fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="text-foreground transition-transform hover:scale-110 disabled:opacity-30 focus-visible:outline-none"
          aria-label="다음 곡"
        >
          <SkipForward className="h-5 w-5" fill="currentColor" />
        </button>
      </div>
    </div>
  )
}
