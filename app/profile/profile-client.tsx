'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ListMusic, LogOut, Repeat } from 'lucide-react'
import { Minimi } from '@/components/minimi'
import { setToken } from '@/lib/api'
import { disconnectSocket } from '@/lib/socket'
import {
  ME_JOINED_LABEL,
  MOCK_SAVED_PLAYLISTS,
  clearMe,
  getReactionsSent,
  getSongsListened,
  useMe,
} from '@/lib/me'

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
  const me = useMe()
  // Read localStorage-backed stats on the client only (avoids hydration mismatch).
  const [reactions, setReactions] = useState<number | null>(null)
  const [listened, setListened] = useState<number | null>(null)

  useEffect(() => {
    // Deferred so we don't setState synchronously in the effect body (client-only read).
    const t = setTimeout(() => {
      setReactions(getReactionsSent())
      setListened(getSongsListened())
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const playlists = MOCK_SAVED_PLAYLISTS

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
        <Stat value={playlists.length} label="저장한 플리" />
      </section>

      {/* Saved playlists */}
      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-[15px] font-extrabold text-foreground">
          <ListMusic className="h-4 w-4 text-primary" /> 저장한 플레이리스트
        </h2>

        {playlists.length > 0 ? (
          <ul className="flex flex-col gap-2.5" role="list">
            {playlists.map((pl) => (
              <li
                key={pl.id}
                className="flex items-center gap-3 rounded-[16px] border-2 border-border bg-white p-3"
              >
                {pl.cover ? (
                  <Image src={pl.cover} alt="" width={48} height={48} unoptimized className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="h-12 w-12 flex-shrink-0 rounded-lg bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-foreground">{pl.title}</p>
                  <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
                    {pl.trackCount}곡 · {pl.savedAt} 저장
                  </p>
                </div>
              </li>
            ))}
          </ul>
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
    </div>
  )
}
