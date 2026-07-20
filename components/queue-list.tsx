'use client'

import { Music2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Track } from '@/lib/types'

interface QueueListProps {
  queue: Track[]
  onRemove?: (trackId: string) => void
  className?: string
}

export function QueueList({ queue, onRemove, className }: QueueListProps) {
  if (queue.length === 0) {
    return (
      <div className={cn('glass-card rounded-2xl p-6 flex flex-col items-center gap-2', className)}>
        <Music2 className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          대기 중인 곡이 없어요.<br />
          <span className="text-primary font-medium">첫 곡을 추가해보세요!</span>
        </p>
      </div>
    )
  }

  return (
    <div className={cn('glass-card rounded-2xl overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-bold text-sm text-foreground">
          다음 곡{' '}
          <span className="text-muted-foreground font-normal">({queue.length})</span>
        </h2>
      </div>
      <ul className="divide-y divide-border" role="list">
        {queue.map((track, idx) => (
          <li
            key={track.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
          >
            {/* Position number */}
            <span className="w-5 text-center text-xs font-mono text-muted-foreground flex-shrink-0">
              {idx + 1}
            </span>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {track.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {track.artist}{' '}
                <span className="text-primary/70">· {track.added_by}</span>
              </p>
            </div>

            {/* Remove button */}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(track.id)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 flex items-center justify-center transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 flex-shrink-0"
                aria-label={`${track.title} 제거`}
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
