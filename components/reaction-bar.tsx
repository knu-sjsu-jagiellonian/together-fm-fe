'use client'

import { cn } from '@/lib/utils'
// Use the backend's reaction set (contract) — the server ignores any other emoji.
import { REACTION_EMOJIS } from '@/lib/api-types'

interface ReactionBarProps {
  /** Called on tap — spawns the emoji next to "me" and (live) emits reaction:send. */
  onEmoji?: (emoji: string) => void
  className?: string
}

/** Emoji reaction button row. Floating bursts are rendered near participants by the room. */
export function ReactionBar({ onEmoji, className }: ReactionBarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-around rounded-full border-2 border-border bg-white px-3 py-2',
        className,
      )}
      role="group"
      aria-label="이모지 리액션"
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onEmoji?.(emoji)}
          className={cn(
            'grid h-9 w-9 place-items-center rounded-full bg-secondary/50 text-lg',
            'transition-all duration-150 hover:scale-125 hover:bg-secondary active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          )}
          aria-label={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
