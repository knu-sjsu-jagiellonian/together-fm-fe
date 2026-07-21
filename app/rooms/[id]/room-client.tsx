'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RoomWithDetails, Track } from '@/lib/types'
import { AVATAR_COLORS } from '@/lib/types'
import { AppHeader } from '@/components/app-header'
import { NowPlayingCard } from '@/components/now-playing-card'
import { QueueList } from '@/components/queue-list'
import { ReactionBar } from '@/components/reaction-bar'
import { TagPill } from '@/components/tag-pill'
import { Vinyl } from '@/components/vinyl'
import { Minimi } from '@/components/minimi'
import { getToken } from '@/lib/api'
import { useMe, bumpReactionsSent, bumpSongsListened } from '@/lib/me'
import { getSocket, type TfmSocket } from '@/lib/socket'
import { useClockOffset } from '@/hooks/use-clock-offset'
import { useYouTubePlayer } from '@/hooks/use-youtube-player'
import { useLocalPlayer } from '@/hooks/use-local-player'
import type { Track as ApiTrack, Member, NowPlaying, RoomMeta, SearchResult } from '@/lib/api-types'

interface RoomClientProps {
  roomId: string
  initialRoom: RoomWithDetails | null
}

interface MemberView {
  id: string
  name: string
  color: string
}

interface Burst {
  id: number
  emoji: string
  idx: number
}

function colorFor(seed: string) {
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

function circlePositions(n: number, radius = 42) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180)
    return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) }
  })
}

function toDisplayTrack(t: ApiTrack, roomId: string): Track {
  return {
    id: t.id,
    room_id: roomId,
    title: t.title,
    artist: t.artist,
    added_by: t.addedBy,
    position: 0,
    played_at: null,
    duration_sec: t.durationSec,
    album_art: t.thumbnail,
    video_id: t.videoId,
  }
}

export function RoomClient({ roomId, initialRoom }: RoomClientProps) {
  const router = useRouter()
  const room = initialRoom

  // Live (socket) state.
  const [liveMeta, setLiveMeta] = useState<RoomMeta | null>(null)
  const [queue, setQueue] = useState<Track[]>(room?.queue ?? [])
  const [current, setCurrent] = useState<Track | null>(room?.current_track ?? null)
  // Mock local playlist (current first, then upcoming) — driven by the local player.
  const [playlist, setPlaylist] = useState<Track[]>(
    room ? (room.current_track ? [room.current_track, ...room.queue] : [...room.queue]) : [],
  )
  const [members, setMembers] = useState<MemberView[]>(
    room?.participants.map((p) => ({ id: p.id, name: p.name, color: p.avatar_color })) ?? [],
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [bursts, setBursts] = useState<Burst[]>([])
  const burstId = useRef(0)

  const [live, setLive] = useState(false)
  const [socket, setSocket] = useState<TfmSocket | null>(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const serverNowRef = useClockOffset(socket)
  const player = useYouTubePlayer(serverNowRef, live)
  const syncToRef = useRef(player.syncTo)
  useEffect(() => {
    syncToRef.current = player.syncTo
  }, [player.syncTo])

  const localPlayer = useLocalPlayer(playlist, !live)

  const displayCurrent = live ? current : localPlayer.current
  const displayTracks = live ? (current ? [current, ...queue] : queue) : playlist

  const membersRef = useRef(members)
  useEffect(() => {
    membersRef.current = members
  }, [members])

  // Display meta: live snapshot wins, else mock room, else placeholder.
  const title = liveMeta?.title ?? room?.title ?? '방'
  const tags: string[] = liveMeta
    ? liveMeta.tags
    : room
      ? [room.genre_tag, room.mood_tag, room.situation_tag]
      : []
  const hostNickname = liveMeta?.hostNickname ?? room?.host

  const me = useMe()
  const isHost = hostNickname === me
  const canRemove = (t: Track) => isHost || t.added_by === me

  const foundMe = members.findIndex((m) => m.name === me)
  const meIndex = foundMe >= 0 ? foundMe : members.length - 1
  const positions = circlePositions(Math.max(members.length, 1))

  // Count each song listened (mock activity for the profile).
  const listenedRef = useRef<string | null>(null)
  useEffect(() => {
    const id = displayCurrent?.id
    if (!live && localPlayer.isPlaying && id && listenedRef.current !== id) {
      listenedRef.current = id
      bumpSongsListened()
    }
  }, [displayCurrent?.id, localPlayer.isPlaying, live])

  function spawnBurst(emoji: string, idx: number) {
    if (idx < 0) return
    const id = ++burstId.current
    setBursts((b) => [...b, { id, emoji, idx }])
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1800)
  }

  useEffect(() => {
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
    const toDisplay = (t: ApiTrack) => toDisplayTrack(t, roomId)

    const onTrack = (cur: NowPlaying | null) => {
      setCurrent(cur ? toDisplay(cur.track) : null)
      syncToRef.current(cur)
    }
    const onQueue = (q: ApiTrack[]) => setQueue(q.map(toDisplay))
    const onMembers = (ms: Member[]) =>
      setMembers(ms.map((m) => ({ id: m.id, name: m.nickname, color: colorFor(m.nickname) })))
    const onReaction = ({ emoji, nickname }: { emoji: string; nickname: string }) => {
      const idx = membersRef.current.findIndex((m) => m.name === nickname)
      spawnBurst(emoji, idx >= 0 ? idx : membersRef.current.length - 1)
    }
    const onClosed = () => {
      setNotice('방이 종료되었어요')
      setTimeout(() => router.push('/rooms'), 1200)
    }

    s.on('track:start', onTrack)
    s.on('queue:update', onQueue)
    s.on('members:update', onMembers)
    s.on('reaction:broadcast', onReaction)
    s.on('room:closed', onClosed)

    s.emit('room:join', { roomId }, (res) => {
      if (!res.ok) {
        setNotice(res.reason === 'full' ? '방이 가득 찼어요' : '이미 종료된 방이에요')
        setTimeout(() => router.push('/rooms'), 1400)
        return
      }
      const snap = res.snapshot
      if (!snap) return
      setLiveMeta(snap.room)
      setQueue(snap.queue.map(toDisplay))
      setMembers(snap.members.map((m) => ({ id: m.id, name: m.nickname, color: colorFor(m.nickname) })))
      if (snap.current) {
        setCurrent(toDisplay(snap.current.track))
        syncToRef.current(snap.current)
      }
    })

    return () => {
      s.off('track:start', onTrack)
      s.off('queue:update', onQueue)
      s.off('members:update', onMembers)
      s.off('reaction:broadcast', onReaction)
      s.off('room:closed', onClosed)
      s.emit('room:leave')
    }
  }, [socket, live, roomId, router])

  const handleAdd = (track: SearchResult) => {
    if (live && socket) {
      socket.emit('queue:add', { videoId: track.videoId }, (res) => {
        if (!res.ok) setNotice(res.reason ?? '곡을 추가하지 못했어요')
      })
    } else {
      setPlaylist((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          room_id: roomId,
          title: track.title,
          artist: track.artist,
          added_by: me,
          position: prev.length,
          played_at: null,
          duration_sec: track.durationSec,
          album_art: track.thumbnail,
          video_id: track.videoId,
        },
      ])
    }
  }

  const handleRemove = (trackId: string) => {
    if (live) setQueue((prev) => prev.filter((t) => t.id !== trackId))
    else setPlaylist((prev) => prev.filter((t) => t.id !== trackId))
  }

  const handleEmoji = (emoji: string) => {
    bumpReactionsSent()
    if (live && socket) {
      socket.emit('reaction:send', { emoji }) // rendered via broadcast
    } else {
      spawnBurst(emoji, meIndex)
    }
  }

  const handleLeave = () => {
    socket?.emit('room:leave')
    router.push('/rooms')
  }

  const handleEnd = () => {
    if (live) {
      socket?.emit('room:leave') // room closes once empty
      router.push('/rooms')
    } else {
      router.push(`/rooms/${roomId}/summary`)
    }
  }

  return (
    <>
      <AppHeader back={{ href: '/rooms', label: '홈' }} title={title} />

      <div className="flex flex-1 flex-col gap-5 px-6 pb-8 pt-4">
        {live && <div id={player.containerId} className="pointer-events-none fixed h-px w-px opacity-0" aria-hidden="true" />}
        {!live && <div id={localPlayer.containerId} className="pointer-events-none fixed h-px w-px opacity-0" aria-hidden="true" />}

        {/* Audio-unlock overlay (autoplay policy) */}
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
            <span className="rounded-full bg-holo px-6 py-3 text-[15px] font-extrabold text-[#2c2a35]">탭해서 참여하기</span>
            <span className="text-[12px] font-medium text-muted-foreground">모두와 같은 지점부터 함께 들어요</span>
          </button>
        )}

        {notice && (
          <p className="rounded-xl border-2 border-destructive/40 bg-white px-3 py-2 text-[12.5px] font-semibold text-destructive">{notice}</p>
        )}

        {/* tags + presence */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <TagPill key={t} label={t} />
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-transparent bg-white px-3 py-1 holo-ring">
            <span className="h-2 w-2 rounded-full" style={{ background: '#b8a0e8' }} />
            <span className="text-[10px] font-bold text-muted-foreground">{members.length}명 함께 듣는 중</span>
          </span>
        </div>

        {/* central vinyl with participants around it */}
        <section className="relative mx-auto aspect-square w-full max-w-[300px]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Vinyl size={96} hub="#b8a0e8" holoRing spinning={live || localPlayer.isPlaying} />
          </div>

          {members.map((m, i) => {
            const pos = positions[i]
            return (
              <div key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <Minimi seed={m.id} clothes={m.color} isMe={i === meIndex} size={30} name={m.name} />
                {bursts
                  .filter((b) => b.idx === i)
                  .map((b) => (
                    <span key={b.id} className="reaction-float pointer-events-none absolute -right-3 -top-2 select-none text-xl" aria-hidden="true">
                      {b.emoji}
                    </span>
                  ))}
              </div>
            )
          })}
        </section>

        {/* now playing */}
        <NowPlayingCard
          track={displayCurrent}
          isPlaying={live ? false : localPlayer.isPlaying}
          progressSec={live ? 0 : localPlayer.progress}
          durationSec={live ? displayCurrent?.duration_sec : localPlayer.duration}
          onToggle={live ? undefined : localPlayer.toggle}
          onNext={live ? undefined : localPlayer.next}
          onPrev={live ? undefined : localPlayer.prev}
          hasNext={live ? false : localPlayer.hasNext}
          hasPrev={live ? false : localPlayer.hasPrev}
        />

        <ReactionBar onEmoji={handleEmoji} />

        <QueueList
          tracks={displayTracks}
          currentId={displayCurrent?.id}
          onRemove={handleRemove}
          canRemove={canRemove}
          onAdd={handleAdd}
          onSelect={live ? undefined : localPlayer.playAt}
        />

        {/* leave / end (end is host-only) */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleLeave}
            className="flex-1 rounded-full border-2 border-border py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            방 나가기
          </button>
          {isHost && (
            <button
              type="button"
              onClick={handleEnd}
              className="flex-1 rounded-full border-2 border-destructive/40 py-2.5 text-center text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
            >
              방 종료
            </button>
          )}
        </div>
        {!isHost && hostNickname && (
          <p className="text-center text-[10.5px] font-medium text-muted-foreground/70">방 종료는 방장만 할 수 있어요</p>
        )}
      </div>
    </>
  )
}
