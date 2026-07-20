'use client'

import { useState, useEffect } from 'react'
import { Music2, SkipForward, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Track } from '@/lib/types'

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
  const remaining = Math.max(0, duration - elapsed)

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
      <div className={cn('glass-card rounded-2xl p-6 flex flex-col items-center gap-3', className)}>
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
          <Music2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">재생 중인 곡이 없습니다</p>
      </div>
    )
  }

  return (
    <div className={cn('glass-card chrome-frame rounded-2xl p-5 glow-pink', className)}>
      <div className="flex items-center gap-4">
        {/* Album art placeholder */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center relative overflow-hidden">
          <Music2 className="w-7 h-7 text-white/80" />
          {/* Spinning ring */}
          {isPlaying && (
            <div className="absolute inset-0 rounded-xl border-2 border-primary/40 animate-spin" style={{ animationDuration: '3s' }} />
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-foreground truncate leading-tight">{track.title}</p>
          <p className="text-sm text-muted-foreground truncate mt-0.5">{track.artist}</p>
          <p className="text-xs text-primary mt-1 font-medium">
            added by <span className="text-accent">{track.added_by}</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="w-9 h-9 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/40 flex items-center justify-center transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying
              ? <Pause className="w-4 h-4 text-primary" />
              : <Play className="w-4 h-4 text-primary" />
            }
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 flex items-center justify-center transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="다음 곡"
          >
            <SkipForward className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full progress-shimmer transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-muted-foreground font-mono">{formatTime(elapsed)}</span>
          <span className="text-xs text-muted-foreground font-mono">-{formatTime(remaining)}</span>
        </div>
      </div>
    </div>
  )
}
