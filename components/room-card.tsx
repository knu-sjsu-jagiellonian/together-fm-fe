import Link from 'next/link'
import { Users, Music2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RoomWithDetails } from '@/lib/types'
import { TagPill } from './tag-pill'
import { AvatarStack } from './avatar-stack'

interface RoomCardProps {
  room: RoomWithDetails
  className?: string
}

export function RoomCard({ room, className }: RoomCardProps) {
  const memberCount = room.participants.length
  const isFull = memberCount >= room.max_members

  return (
    <Link
      href={`/rooms/${room.id}`}
      className={cn(
        'group block glass-card rounded-2xl p-4 transition-all duration-300',
        'hover:scale-[1.02] hover:border-white/25 hover:bg-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {!room.is_public && (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-1 text-balance">
              {room.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1">
            <TagPill label={room.genre_tag} />
            <TagPill label={room.mood_tag} />
            <TagPill label={room.situation_tag} />
          </div>
        </div>

        {/* Member count badge */}
        <div
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0',
            isFull
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-primary/20 text-primary border border-primary/30',
          )}
        >
          <Users className="w-3 h-3" />
          <span>{memberCount}/{room.max_members}</span>
        </div>
      </div>

      {/* Now playing */}
      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 mb-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Music2 className="w-3.5 h-3.5 text-primary" />
        </div>
        {room.current_track ? (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-none">
              {room.current_track.title}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {room.current_track.artist}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">재생 중인 곡 없음</p>
        )}

        {/* Equalizer animation dots */}
        {room.current_track && (
          <div className="ml-auto flex items-end gap-0.5 h-4" aria-hidden="true">
            {[3, 5, 4, 6, 3].map((h, i) => (
              <div
                key={i}
                className="w-0.5 bg-primary rounded-full animate-bounce"
                style={{
                  height: `${h * 2}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <AvatarStack participants={room.participants} maxMembers={room.max_members} size="sm" />
        <span
          className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            isFull
              ? 'bg-red-500/20 text-red-400'
              : 'bg-accent/20 text-accent group-hover:bg-accent/30 transition-colors',
          )}
        >
          {isFull ? '인원 마감' : '입장하기 →'}
        </span>
      </div>
    </Link>
  )
}
