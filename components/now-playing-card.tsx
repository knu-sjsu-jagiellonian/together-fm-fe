'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Music2, SkipForward, SkipBack, Play, Pause } from 'lucide-react'
import { cn, ytThumb } from '@/lib/utils'
import type { Track } from '@/lib/types'
import { Vinyl } from './vinyl'

interface NowPlayingCardProps {
  track: Track | null
  className?: string
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function NowPlayingCard({ track, className }: NowPlayingCardProps) {
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [prevTrackId, setPrevTrackId] = useState(track?.id)

  const duration = track?.duration_sec ?? 200
  const elapsed = Math.round((progress / 100) * duration)

  // Reset progress whenever the current track changes (e.g. skip / next).
  // Adjusting state during render is React's recommended pattern here — no effect needed.
  if (track?.id !== prevTrackId) {
    setPrevTrackId(track?.id)
    setProgress(0)
  }

  // Advance progress in real time, scaled to the track's actual duration so a
  // 3-minute song fills the bar in 3 minutes rather than a fixed interval.
  useEffect(() => {
    if (!isPlaying || !track) return
    const stepPerTick = 100 / (duration * 10) // tick every 100ms → 10 ticks/sec
    const timer = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : Math.min(100, p + stepPerTick)))
    }, 100)
    return () => clearInterval(timer)
  }, [isPlaying, track, duration])

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

  return (
    <div className={cn('rounded-[22px] border-2 border-border bg-white p-5', className)}>
      <div className="flex items-center gap-4">
        {/* Album art with a record peeking behind it (falls back to vinyl) */}
        {(() => {
          const cover = track.album_art ?? ytThumb(track.video_id)
          if (!cover) return <Vinyl size={58} hub="#b8a0e8" holoRing spinning={isPlaying} className="flex-shrink-0" />
          return (
            <span className="relative flex-shrink-0" style={{ width: 76, height: 60 }}>
              <Vinyl
                size={54}
                hub="#b8a0e8"
                spinning={isPlaying}
                className="absolute right-0 top-1/2 -translate-y-1/2"
              />
              <Image
                src={cover}
                alt=""
                width={60}
                height={60}
                unoptimized
                className="absolute left-0 top-1/2 z-10 h-[60px] w-[60px] -translate-y-1/2 rounded-xl border-2 border-white object-cover shadow-sm"
              />
            </span>
          )
        })()}

        {/* Track info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-extrabold leading-tight text-foreground">{track.title}</p>
          <p className="mt-0.5 truncate text-[12px] font-medium text-muted-foreground">{track.artist}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#eaf3fb] px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5b9bc9]" />
            <span className="text-[8.5px] font-bold text-[#3f7fb0]">실시간 동기화 중</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="relative h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">{formatTime(elapsed)}</span>
          <span className="text-[10px] font-semibold text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-center gap-6">
        <button type="button" className="text-foreground transition-transform hover:scale-110 focus-visible:outline-none" aria-label="이전 곡">
          <SkipBack className="h-5 w-5" fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
        </button>
        <button type="button" className="text-foreground transition-transform hover:scale-110 focus-visible:outline-none" aria-label="다음 곡">
          <SkipForward className="h-5 w-5" fill="currentColor" />
        </button>
      </div>
    </div>
  )
}
