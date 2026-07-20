'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { RoomWithDetails, Track } from '@/lib/types'
import { AVATAR_COLORS } from '@/lib/types'
import { NowPlayingCard } from '@/components/now-playing-card'
import { QueueList } from '@/components/queue-list'
import { ReactionBar } from '@/components/reaction-bar'
import { TagPill } from '@/components/tag-pill'
import { TrackSearch } from '@/components/track-search'
import { Vinyl } from '@/components/vinyl'
import { Minimi } from '@/components/minimi'
import { getToken } from '@/lib/api'
import { getSocket, type TfmSocket } from '@/lib/socket'
import { useClockOffset } from '@/hooks/use-clock-offset'
import { useYouTubePlayer } from '@/hooks/use-youtube-player'
import type { ApiTrack, Member, NowPlaying, SearchResult } from '@/lib/api-types'

interface RoomClientProps {
  room: RoomWithDetails
}

interface MemberView {
  id: string
  color: string
}

function colorFor(seed: string) {
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

export function RoomClient({ room }: RoomClientProps) {
  const router = useRouter()

  // Display state — seeded from mock data, overridden by live socket events.
  const [queue, setQueue] = useState<Track[]>(room.queue)
  const [current, setCurrent] = useState<Track | null>(room.current_track)
  const [members, setMembers] = useState<MemberView[]>(
    room.participants.map((p) => ({ id: p.id, color: p.avatar_color })),
  )
  const [notice, setNotice] = useState<string | null>(null)

  // Live mode activates only once a dev token exists (login lands later).
  const [live, setLive] = useState(false)
  const [socket, setSocket] = useState<TfmSocket | null>(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const serverNowRef = useClockOffset(socket)
  const player = useYouTubePlayer(serverNowRef, live)
  const syncToRef = useRef(player.syncTo)
  useEffect(() => {
    syncToRef.current = player.syncTo
  }, [player.syncTo])

  useEffect(() => {
    // Deferred to a task so we never setState synchronously in the effect body
    // (and so it only ever runs client-side, avoiding a hydration mismatch).
    const t = setTimeout(() => {
      if (getToken()) {
        setLive(true)
        setSocket(getSocket())
      }
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // Join + subscribe (live only).
  useEffect(() => {
    if (!socket || !live) return
    const s = socket
    const toDisplay = (t: ApiTrack): Track => ({
      id: t.videoId,
      room_id: room.id,
      title: t.title,
      artist: t.artist,
      added_by: '',
      position: 0,
      played_at: null,
      duration_sec: t.durationSec,
      album_art: t.thumbnail,
    })

    const onTrack = (cur: NowPlaying | null) => {
      setCurrent(cur ? toDisplay(cur.track) : null)
      syncToRef.current(cur)
    }
    const onQueue = (q: ApiTrack[]) => setQueue(q.map(toDisplay))
    const onMembers = (ms: Member[]) =>
      setMembers(ms.map((m) => ({ id: m.nickname, color: colorFor(m.nickname) })))
    const onClosed = () => router.push(`/rooms/${room.id}/summary`)

    s.on('track:start', onTrack)
    s.on('queue:update', onQueue)
    s.on('members:update', onMembers)
    s.on('room:closed', onClosed)

    s.emit('room:join', { roomId: room.id }, (res) => {
      if (!res.ok) {
        setNotice(res.reason === 'full' ? '방이 가득 찼어요' : '이미 종료된 방이에요')
        return
      }
      const snap = res.snapshot
      if (!snap) return
      setQueue(snap.queue.map(toDisplay))
      setMembers(snap.members.map((m) => ({ id: m.nickname, color: colorFor(m.nickname) })))
      if (snap.current) {
        setCurrent(toDisplay(snap.current.track))
        syncToRef.current(snap.current)
      }
    })

    return () => {
      s.off('track:start', onTrack)
      s.off('queue:update', onQueue)
      s.off('members:update', onMembers)
      s.off('room:closed', onClosed)
      s.emit('room:leave')
    }
  }, [socket, live, room.id, router])

  const handleAdd = (track: SearchResult) => {
    if (live && socket) {
      socket.emit('queue:add', { videoId: track.videoId }, (res) => {
        if (!res.ok) setNotice(res.reason ?? '곡을 추가하지 못했어요')
      })
    } else {
      // Mock mode — append locally.
      setQueue((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          room_id: room.id,
          title: track.title,
          artist: track.artist,
          added_by: '나',
          position: prev.length,
          played_at: null,
          duration_sec: track.durationSec,
          album_art: track.thumbnail,
        },
      ])
    }
  }

  const handleEmoji = (emoji: string) => {
    if (live && socket) socket.emit('reaction:send', { emoji })
  }

  const meId = members[members.length - 1]?.id

  return (
    <div className="flex flex-1 flex-col gap-5 px-6 pb-8 pt-4">
      {/* Hidden 1px YouTube audio player (live only) */}
      {live && <div id={player.containerId} className="pointer-events-none fixed h-px w-px opacity-0" aria-hidden="true" />}

      {/* Audio-unlock overlay (autoplay policy — API.md §6 step 5) */}
      {live && current && !audioUnlocked && (
        <button
          type="button"
          onClick={() => {
            player.unlock()
            setAudioUnlocked(true)
          }}
          className="fixed inset-0 z-50 mx-auto flex max-w-[440px] flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm"
        >
          <Vinyl size={96} hub="#b8a0e8" holoRing />
          <span className="rounded-full bg-holo px-6 py-3 text-[15px] font-extrabold text-[#2c2a35]">
            탭해서 참여하기
          </span>
          <span className="text-[12px] font-medium text-muted-foreground">모두와 같은 지점부터 함께 들어요</span>
        </button>
      )}

      {notice && (
        <p className="rounded-xl border-2 border-destructive/40 bg-white px-3 py-2 text-[12.5px] font-semibold text-destructive">
          {notice}
        </p>
      )}

      {/* tags + presence */}
      <div className="flex flex-wrap items-center gap-2">
        <TagPill label={room.mood_tag} />
        <TagPill label={room.situation_tag} />
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-transparent bg-white px-3 py-1 holo-ring">
          <span className="h-2 w-2 rounded-full" style={{ background: '#b8a0e8' }} />
          <span className="text-[10px] font-bold text-muted-foreground">
            {members.length}명 함께 듣는 중
          </span>
        </span>
      </div>

      {/* central vinyl + minimi participants */}
      <section className="flex flex-col items-center gap-4 py-2">
        <Vinyl size={92} hub="#b8a0e8" holoRing spinning />
        <ul className="flex flex-wrap justify-center gap-2" role="list" aria-label="참여자">
          {members.map((m) => (
            <li key={m.id}>
              <Minimi seed={m.id} clothes={m.color} isMe={m.id === meId} size={34} />
            </li>
          ))}
        </ul>
        <p className="text-[10px] font-semibold text-muted-foreground">(진한 테두리 = 나)</p>
      </section>

      {/* now playing */}
      <NowPlayingCard track={current} />

      {/* queue */}
      <QueueList queue={queue} />

      {/* add song (real search) */}
      <div>
        <h2 className="mb-2 text-[11.5px] font-bold text-muted-foreground">곡 추가하기</h2>
        <TrackSearch onAdd={handleAdd} placeholder="유튜브에서 곡 검색" />
      </div>

      {/* reaction bar */}
      <ReactionBar onEmoji={handleEmoji} />

      {/* leave / end */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => socket?.emit('room:leave')}
          className="flex-1 rounded-full border-2 border-border py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          방 나가기
        </button>
        <Link
          href={`/rooms/${room.id}/summary`}
          className="flex-1 rounded-full border-2 border-destructive/40 py-2.5 text-center text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
        >
          방 종료
        </Link>
      </div>
    </div>
  )
}
