'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ListMusic, LogOut, Repeat, Trash2, X } from 'lucide-react'
import { Minimi } from '@/components/minimi'
import { useToast } from '@/components/toast'
import { setToken } from '@/lib/api'
import { disconnectSocket } from '@/lib/socket'
import { youtubePlaylistUrl } from '@/lib/utils'
import {
  getSavedPlaylists,
  removePlaylist,
  thumbnailFor,
  type SavedPlaylist,
} from '@/lib/playlists'
import { ME_JOINED_LABEL, clearMe, getReactionsSent, getSongsListened, useMe } from '@/lib/me'

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[19px] font-extrabold text-foreground">{value}</span>
      <span className="text-[10.5px] font-semibold text-muted-foreground">{label}</span>
    </div>
  )
}

export function ProfileClient() {
  const router = useRouter()
  const toast = useToast()
  const me = useMe()
  // Read localStorage-backed data on the client only (avoids hydration mismatch).
  const [reactions, setReactions] = useState<number | null>(null)
  const [listened, setListened] = useState<number | null>(null)
  const [playlists, setPlaylists] = useState<SavedPlaylist[] | null>(null)
  const [openPl, setOpenPl] = useState<SavedPlaylist | null>(null)

  useEffect(() => {
    // Deferred so we don't setState synchronously in the effect body (client-only read).
    const t = setTimeout(() => {
      setReactions(getReactionsSent())
      setListened(getSongsListened())
      setPlaylists(getSavedPlaylists())
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const list = playlists ?? []

  const handleDelete = (id: string) => {
    removePlaylist(id)
    setPlaylists(getSavedPlaylists())
    setOpenPl(null)
    toast('플레이리스트를 삭제했어요')
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 pb-10 pt-6">
      {/* Profile header */}
      <section className="flex items-center gap-4">
        <Minimi seed={me} size={56} name={me} />
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-extrabold text-foreground">{me}</p>
          <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">{ME_JOINED_LABEL}</p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 rounded-full border-2 border-border bg-white px-3 py-1.5 text-[11.5px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Repeat className="h-3.5 w-3.5" /> 계정 전환
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 divide-x divide-secondary rounded-[18px] border-2 border-border bg-white py-4">
        <Stat value={reactions ?? '—'} label="보낸 리액션" />
        <Stat value={listened ?? '—'} label="들은 곡" />
        <Stat value={playlists === null ? '—' : list.length} label="저장한 플리" />
      </section>

      {/* Saved playlists */}
      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-[15px] font-extrabold text-foreground">
          <ListMusic className="h-4 w-4 text-primary" /> 저장한 플레이리스트
        </h2>

        {list.length > 0 ? (
          <ul className="flex flex-col gap-2.5" role="list">
            {list.map((pl) => (
              <li key={pl.id}>
                <button
                  type="button"
                  onClick={() => setOpenPl(pl)}
                  className="flex w-full items-center gap-3 rounded-[16px] border-2 border-border bg-white p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  {pl.cover ? (
                    <Image src={pl.cover} alt="" width={48} height={48} unoptimized className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="h-12 w-12 flex-shrink-0 rounded-lg bg-secondary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-foreground">{pl.title}</p>
                    <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
                      {pl.tracks.length}곡 · {pl.savedAt} 저장
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-[11px] font-bold text-muted-foreground/70">보기 ›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : playlists === null ? (
          <div className="rounded-[16px] border-2 border-border bg-white p-8 text-center text-[13px] text-muted-foreground">
            불러오는 중…
          </div>
        ) : (
          <div className="rounded-[16px] border-2 border-border bg-white p-8 text-center text-[13px] text-muted-foreground">
            아직 저장한 플레이리스트가 없어요
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => {
          clearMe()
          setToken(null) // also drop the auth token so live mode turns off
          disconnectSocket() // drop the authenticated socket
          router.push('/login')
        }}
        className="mt-2 inline-flex items-center justify-center gap-1.5 self-start rounded-full border-2 border-border py-2.5 px-5 text-[13px] font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
      >
        <LogOut className="h-4 w-4" /> 로그아웃
      </button>

      {/* Playlist detail (songs) */}
      {openPl && (
        <div
          className="frame-fixed z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${openPl.title} 상세`}
          onClick={() => setOpenPl(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[82%] w-full flex-col rounded-[24px] border-2 border-border bg-white"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-border p-4">
              {openPl.cover ? (
                <Image src={openPl.cover} alt="" width={52} height={52} unoptimized className="h-[52px] w-[52px] flex-shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="h-[52px] w-[52px] flex-shrink-0 rounded-xl bg-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-extrabold text-foreground">{openPl.title}</p>
                <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
                  {openPl.tracks.length}곡 · {openPl.savedAt} 저장
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenPl(null)}
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* tracks */}
            <ol className="flex-1 overflow-y-auto px-2 py-2" role="list">
              {openPl.tracks.map((t, idx) => {
                const url = t.videoId ? `https://www.youtube.com/watch?v=${t.videoId}` : null
                const thumb = t.thumbnail ?? thumbnailFor(t.videoId)
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      disabled={!url}
                      onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary/50 disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      <span className="w-5 flex-shrink-0 text-center text-[12px] font-extrabold text-primary">{idx + 1}</span>
                      {thumb ? (
                        <Image src={thumb} alt="" width={36} height={36} unoptimized className="h-9 w-9 flex-shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="h-9 w-9 flex-shrink-0 rounded-md bg-secondary" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-foreground">{t.title}</span>
                        <span className="block truncate text-[11px] font-medium text-muted-foreground">{t.artist}</span>
                      </span>
                      {url && <span className="flex-shrink-0 text-[10px] font-bold text-muted-foreground/70">▶ YouTube</span>}
                    </button>
                  </li>
                )
              })}
            </ol>

            {/* actions */}
            <div className="flex gap-2 border-t border-border p-4">
              <button
                type="button"
                onClick={() => handleDelete(openPl.id)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-border px-4 py-2.5 text-[13px] font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> 삭제
              </button>
              {(() => {
                const url = youtubePlaylistUrl(openPl.tracks.map((t) => t.videoId).filter((v): v is string => Boolean(v)))
                return (
                  <button
                    type="button"
                    disabled={!url}
                    onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-holo py-2.5 text-[13px] font-extrabold text-[#2c2a35] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ListMusic className="h-4 w-4" /> YouTube로 열기
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
