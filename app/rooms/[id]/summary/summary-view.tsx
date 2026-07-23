'use client'

import { useEffect, useState } from 'react'
import { TagPill } from '@/components/tag-pill'
import { Vinyl } from '@/components/vinyl'
import { Minimi } from '@/components/minimi'
import { SummaryActions } from '@/components/summary-actions'
import { getRoomSummary } from '@/lib/mock-data'
import { loadSummary, type SummarySnapshot } from '@/lib/summary'
import { getMe } from '@/lib/me'

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[19px] font-extrabold text-foreground">{value}</span>
      <span className="text-[10.5px] font-semibold text-muted-foreground">{label}</span>
    </div>
  )
}

export function SummaryView({ roomId }: { roomId: string }) {
  const [data, setData] = useState<SummarySnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const resolve = async () => {
      // Live rooms: use the snapshot captured when the host ended the room.
      const snap = loadSummary(roomId)
      if (snap) {
        if (!cancelled) {
          setData(snap)
          setLoading(false)
        }
        return
      }
      // Mock rooms: derive from the mock data layer.
      const m = await getRoomSummary(roomId)
      if (cancelled) return
      setData(
        m
          ? {
              title: m.room.title,
              tags: m.room.tags,
              tracks: m.tracks.map((t) => ({
                id: t.id,
                title: t.title,
                artist: t.artist,
                addedBy: t.added_by,
                videoId: t.video_id,
              })),
              participants: m.participants.map((p) => ({ id: p.id, name: p.name, color: p.avatar_color })),
              reactions: m.tracks.length * 13 + m.participants.length,
              durationMin: m.durationMin,
            }
          : null,
      )
      setLoading(false)
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [roomId])

  if (loading) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center px-6">
        <p className="text-[13px] text-muted-foreground">요약을 불러오는 중…</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-3xl" aria-hidden="true">🎵</span>
        <p className="text-[13px] text-muted-foreground">요약 정보를 찾을 수 없어요.</p>
      </main>
    )
  }

  const me = getMe()
  const hours = Math.floor(data.durationMin / 60)
  const mins = data.durationMin % 60
  const durationLabel = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`
  const visible = data.participants.slice(0, 7)
  const extra = data.participants.length - visible.length

  return (
    <main className="flex min-h-full flex-1 flex-col px-6 pb-8 pt-10">
      <div className="flex flex-col items-center text-center">
        <Vinyl size={52} hub="#b8a0e8" holoRing />
        <p className="mt-3 text-[12px] font-semibold text-muted-foreground">방이 종료되었어요</p>
        <h1 className="mt-1 text-[18px] font-extrabold text-foreground">{data.title}</h1>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {data.tags.map((t) => (
            <TagPill key={t} label={t} />
          ))}
        </div>
        <p className="mt-3 text-[11.5px] font-medium text-muted-foreground">{durationLabel} 동안 함께 들었어요</p>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-secondary rounded-[18px] border-2 border-border bg-white py-4">
        <Stat value={`${data.participants.length}명`} label="참여 인원" />
        <Stat value={`${data.tracks.length}곡`} label="재생된 곡" />
        <Stat value={`${data.reactions}`} label="이모지 반응" />
      </div>

      <h2 className="mb-2.5 mt-6 text-[14.5px] font-extrabold text-foreground">플레이리스트</h2>
      <ol className="flex flex-col rounded-[16px] border-2 border-border bg-white px-4 py-2" role="list">
        {data.tracks.slice(0, 5).map((track, idx) => (
          <li key={track.id} className="flex items-center gap-3 py-2">
            <span className="w-4 text-[12px] font-extrabold text-primary">{idx + 1}</span>
            <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-foreground">
              {track.title} — {track.artist}
            </p>
            <span className="flex-shrink-0 text-[11px] font-semibold text-muted-foreground">@{track.addedBy}</span>
          </li>
        ))}
        {data.tracks.length === 0 && (
          <li className="py-3 text-center text-[11px] text-muted-foreground">재생된 곡이 없어요</li>
        )}
        {data.tracks.length > 5 && (
          <li className="py-2 text-center text-[11px] font-bold text-muted-foreground">외 {data.tracks.length - 5}곡 더보기 ⌄</li>
        )}
      </ol>

      <h2 className="mb-2.5 mt-6 text-[14.5px] font-extrabold text-foreground">함께한 사람</h2>
      <div className="flex items-center gap-2">
        <ul className="flex flex-wrap gap-2" role="list">
          {visible.map((p) => (
            <li key={p.id}>
              <Minimi seed={p.id} clothes={p.color} isMe={p.name === me} size={38} name={p.name} />
            </li>
          ))}
        </ul>
        {extra > 0 && <span className="text-[10.5px] font-bold text-muted-foreground">+{extra}</span>}
      </div>

      <SummaryActions
        title={data.title}
        tracks={data.tracks.map((t) => ({ id: t.id, title: t.title, artist: t.artist, videoId: t.videoId }))}
      />
    </main>
  )
}
