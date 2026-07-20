import { cn } from '@/lib/utils'
import type { Participant } from '@/lib/types'

interface AvatarStackProps {
  participants: Participant[]
  maxMembers: number
  size?: 'sm' | 'md' | 'lg'
  showEmpty?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
}

export function AvatarStack({
  participants,
  maxMembers,
  size = 'md',
  showEmpty = false,
  className,
}: AvatarStackProps) {
  const emptySlots = maxMembers - participants.length

  return (
    <div
      className={cn('flex items-center', className)}
      role="list"
      aria-label={`참여자 ${participants.length}명 / 최대 ${maxMembers}명`}
    >
      {participants.map((p, i) => (
        <div
          key={p.id}
          role="listitem"
          title={p.name}
          className={cn(
            sizeClasses[size],
            'rounded-full border-2 border-background flex items-center justify-center font-bold text-white select-none flex-shrink-0',
            i > 0 && '-ml-2',
          )}
          style={{ backgroundColor: p.avatar_color }}
        >
          {p.name.slice(0, 1)}
        </div>
      ))}

      {showEmpty &&
        Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            role="listitem"
            aria-label="빈 슬롯"
            className={cn(
              sizeClasses[size],
              'rounded-full border-2 border-dashed border-white/20 bg-white/5 flex-shrink-0',
              '-ml-2',
            )}
          />
        ))}
    </div>
  )
}
