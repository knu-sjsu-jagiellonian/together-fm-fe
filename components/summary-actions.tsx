'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ListMusic, ArrowLeft, Check } from 'lucide-react'
import { useToast } from '@/components/toast'
import { youtubePlaylistUrl } from '@/lib/utils'
import { savePlaylist, thumbnailFor, type SavedTrack } from '@/lib/playlists'

interface SummaryActionsProps {
  /** Playlist title (the room title). */
  title: string
  /** Played tracks, in order. */
  tracks: { id: string; title: string; artist: string; videoId?: string }[]
}

/**
 * Recap actions. "Save playlist" opens a YouTube temporary playlist built from the
 * room's video ids (no login/API key needed) AND saves the playlist to the profile.
 */
export function SummaryActions({ title, tracks }: SummaryActionsProps) {
  const toast = useToast()
  const [saved, setSaved] = useState(false)
  const videoIds = tracks.map((t) => t.videoId).filter((v): v is string => Boolean(v))
  const playlistUrl = youtubePlaylistUrl(videoIds)

  const handleSave = () => {
    const savedTracks: SavedTrack[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      videoId: t.videoId,
      thumbnail: thumbnailFor(t.videoId),
    }))
    savePlaylist({ title, tracks: savedTracks })
    setSaved(true)
    toast('내 프로필에 저장했어요', 'success')
    if (playlistUrl) window.open(playlistUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mt-auto flex flex-col gap-3 pt-8">
      <button
        type="button"
        disabled={tracks.length === 0}
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-holo py-4 text-[16px] font-extrabold text-[#2c2a35] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        {saved ? <Check className="h-5 w-5" /> : <ListMusic className="h-5 w-5" />}
        {saved ? '저장됨 · 다시 저장' : 'YouTube 플레이리스트로 저장'}
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
