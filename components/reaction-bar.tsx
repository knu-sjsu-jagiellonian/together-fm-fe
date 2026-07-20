'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { FloatingReaction } from '@/lib/types'
import { REACTION_EMOJIS } from '@/lib/types'

interface ReactionBarProps {
  className?: string
}

export function ReactionBar({ className }: ReactionBarProps) {
  const [floating, setFloating] = useState<FloatingReaction[]>([])

  const triggerReaction = useCallback((emoji: string) => {
    const id = `r-${Date.now()}-${Math.random()}`
    const x = 10 + Math.random() * 80 // 10–90% from left
    setFloating((prev) => [...prev, { id, emoji, x }])
    setTimeout(() => {
      setFloating((prev) => prev.filter((r) => r.id !== id))
    }, 1900)
  }, [])

  return (
    <div className={cn('relative', className)}>
      {/* Floating reactions layer */}
      <div
        className="absolute inset-x-0 bottom-14 h-48 pointer-events-none overflow-visible"
        aria-hidden="true"
      >
        {floating.map((r) => (
          <span
            key={r.id}
            className="absolute bottom-0 text-2xl reaction-float select-none"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Buttons */}
      <div
        className="glass-card rounded-2xl px-4 py-3 flex items-center justify-around"
        role="group"
        aria-label="이모지 리액션"
      >
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => triggerReaction(emoji)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-xl',
              'bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25',
              'transition-all duration-150 hover:scale-125 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            )}
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
