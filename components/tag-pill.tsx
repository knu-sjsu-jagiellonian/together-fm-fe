'use client'

import { cn } from '@/lib/utils'
import { TAG_COLORS } from '@/lib/types'

interface TagPillProps {
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}

export function TagPill({ label, active = false, onClick, className }: TagPillProps) {
  const colorClass = TAG_COLORS[label] ?? 'bg-white text-muted-foreground border-border'

  // Active filter chip: holographic fill + dark bold label (mock).
  const activeClass = 'bg-holo text-[#2c2a35] border-transparent font-extrabold'

  // Inactive filter chip is a plain white pill; display-only pills keep their tint.
  const inactiveInteractive = 'bg-white text-muted-foreground border-border'

  const baseClass = cn(
    'inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold tracking-wide transition-all duration-200',
    active ? activeClass : onClick ? inactiveInteractive : colorClass,
    className,
  )

  // Non-interactive (display-only) pills render as <span> so they can safely
  // sit inside anchor/link elements without nesting interactive controls.
  if (!onClick) {
    return <span className={baseClass}>{label}</span>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        baseClass,
        'hover:scale-105 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
