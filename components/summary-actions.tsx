'use client'

import Link from 'next/link'
import { ListMusic, ArrowLeft } from 'lucide-react'
import { youtubePlaylistUrl } from '@/lib/utils'

interface SummaryActionsProps {
  /** YouTube video ids of the played tracks, in order. */
  videoIds: string[]
}

/**
 * Recap actions. "Save playlist" opens a YouTube temporary playlist built from
 * the room's video ids — no login/API key needed (see lib/utils youtubePlaylistUrl).
 */
export function SummaryActions({ videoIds }: SummaryActionsProps) {
  const playlistUrl = youtubePlaylistUrl(videoIds)

  return (
    <div className="mt-auto flex flex-col gap-3 pt-8">
      <button
        type="button"
        disabled={!playlistUrl}
        onClick={() => playlistUrl && window.open(playlistUrl, '_blank', 'noopener,noreferrer')}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-holo py-4 text-[16px] font-extrabold text-[#2c2a35] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <ListMusic className="h-5 w-5" />
        YouTube 플레이리스트로 저장
      </button>
      <Link
        href="/rooms"
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border py-3.5 text-[14px] font-bold text-foreground transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <ArrowLeft className="h-4 w-4" />
        방 목록으로
      </Link>
    </div>
  )
}
