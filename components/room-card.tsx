import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RoomListItem } from '@/lib/rooms'
import { TagPill } from './tag-pill'
import { Vinyl } from './vinyl'

interface RoomCardProps {
  room: RoomListItem
  /** Called instead of navigating when a private room is clicked (password gate). */
  onLockedClick?: (room: RoomListItem) => void
  className?: string
}

// Per-card accent (left bar + vinyl hub), cycled deterministically by id.
const ACCENTS = ['#b8a0e8', '#a0c8e8', '#e8a8c0']
function accentFor(id: string) {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return ACCENTS[sum % ACCENTS.length]
}

export function RoomCard({ room, onLockedClick, className }: RoomCardProps) {
  const isFull = room.memberCount >= room.maxMembers
  const accent = accentFor(room.id)
  const locked = !room.isPublic

  const cardClass = cn(
    'group relative flex w-full gap-4 overflow-hidden rounded-[18px] border-2 border-border bg-white p-4 pl-5 text-left transition-all duration-300',
    'hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(120,100,160,0.14)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
    className,
  )

  const inner = (
    <>
      <span className="absolute left-0 top-0 h-full w-1 rounded-full" style={{ background: accent }} aria-hidden="true" />
      <Vinyl size={86} hub={accent} className="flex-shrink-0 self-center" />

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="rounded-lg bg-primary px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white">LIVE</span>
          {locked && (
            <span className="inline-flex items-center gap-0.5 rounded-lg bg-secondary px-1.5 py-0.5 text-[8.5px] font-bold text-muted-foreground">
              <Lock className="h-2.5 w-2.5" /> 비공개
            </span>
          )}
        </div>

        <h3 className="truncate text-[15px] font-bold leading-snug text-foreground">{room.title}</h3>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {room.tags.map((t) => (
            <TagPill key={t} label={t} />
          ))}
        </div>

        <p className="mt-1.5 text-[10.5px] font-medium text-muted-foreground">
          {room.memberCount}/{room.maxMembers}명
          {isFull && <span className="ml-1 text-destructive">· 마감</span>}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2">
          {room.nowPlaying ? (
            <p className="truncate text-[12.5px] font-bold text-foreground">
              {room.nowPlaying.title} — {room.nowPlaying.artist}
            </p>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">재생 중인 곡 없음</p>
          )}

          {room.nowPlaying && (
            <span className="ml-auto flex h-5 flex-shrink-0 items-end gap-[3px]" aria-hidden="true">
              {[8, 15, 11, 19, 12].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full motion-safe:animate-bounce"
                  style={{ height: h, background: accent, animationDelay: `${i * 0.1}s`, animationDuration: '0.9s' }}
                />
              ))}
            </span>
          )}
        </div>
      </div>
    </>
  )

  if (locked && onLockedClick) {
    return (
      <button type="button" onClick={() => onLockedClick(room)} className={cardClass}>
        {inner}
      </button>
    )
  }

  return (
    <Link href={`/rooms/${room.id}`} className={cardClass}>
      {inner}
    </Link>
  )
}
