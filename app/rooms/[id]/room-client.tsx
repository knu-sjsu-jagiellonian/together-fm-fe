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
import { useToast } from '@/components/toast'
import { getToken } from '@/lib/api'
import { saveSummary } from '@/lib/summary'
import { useMe, useMyUserId, bumpReactionsSent, bumpSongsListened } from '@/lib/me'
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
  userId: string
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
    room?.participants.map((p) => ({ id: p.id, userId: p.id, name: p.name, color: p.avatar_color })) ?? [],
  )
  const [bursts, setBursts] = useState<Burst[]>([])
  const [confirmEnd, setConfirmEnd] = useState(false)
  const burstId = useRef(0)
  const reactionCountRef = useRef(0)
  const toast = useToast()

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
  const tags: string[] = liveMeta ? liveMeta.tags : room ? room.tags : []
  const hostNickname = liveMeta?.hostNickname ?? room?.host

  const me = useMe()
  const myUserId = useMyUserId()

  // Identify "me" among members by userId in live mode (robust across same nicknames),
  // by nickname in mock mode (mock participants have no backend userId).
  const foundMe = live
    ? members.findIndex((m) => m.userId === myUserId)
    : members.findIndex((m) => m.name === me)
  const meIndex = foundMe >= 0 ? foundMe : members.length - 1

  // Host: live → my member's nickname matches the room's hostNickname (resolved via my
  // userId); mock → the room's host nickname. added-by check stays by nickname.
  const isHost = live ? foundMe >= 0 && members[foundMe]?.name === hostNickname : room?.host === me
  const canRemove = (t: Track) => isHost || t.added_by === me

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
      // Mock rooms (present in mock-data → initialRoom set) stay in mock mode even
      // when logged in, so they work as always-on test fixtures. Real rooms
      // (not in mock-data) go live via the socket.
      if (getToken() && !initialRoom) {
        setLive(true)
        setSocket(getSocket())
      }
    }, 0)
    return () => clearTimeout(t)
  }, [initialRoom])

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
      setMembers(ms.map((m) => ({ id: m.id, userId: m.userId, name: m.nickname, color: colorFor(m.nickname) })))
    const onReaction = ({ emoji, nickname }: { emoji: string; nickname: string }) => {
      reactionCountRef.current += 1
      const idx = membersRef.current.findIndex((m) => m.name === nickname)
      spawnBurst(emoji, idx >= 0 ? idx : membersRef.current.length - 1)
    }
    const onClosed = () => {
      toast('방이 종료되었어요')
      setTimeout(() => router.push('/rooms'), 1200)
    }

    s.on('track:start', onTrack)
    s.on('queue:update', onQueue)
    s.on('members:update', onMembers)
    s.on('reaction:broadcast', onReaction)
    s.on('room:closed', onClosed)

    s.emit('room:join', { roomId }, (res) => {
      if (!res.ok) {
        toast(res.reason === 'full' ? '방이 가득 찼어요' : '이미 종료된 방이에요', 'error')
        setTimeout(() => router.push('/rooms'), 1400)
        return
      }
      const snap = res.snapshot
      if (!snap) return
      setLiveMeta(snap.room)
      setQueue(snap.queue.map(toDisplay))
      setMembers(snap.members.map((m) => ({ id: m.id, userId: m.userId, name: m.nickname, color: colorFor(m.nickname) })))
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
  }, [socket, live, roomId, router, toast])

  const handleAdd = (track: SearchResult) => {
    if (live && socket) {
      socket.emit('queue:add', { videoId: track.videoId }, (res) => {
        if (res.ok) toast('곡을 추가했어요', 'success')
        else toast(res.reason ?? '곡을 추가하지 못했어요', 'error')
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
      toast('곡을 추가했어요', 'success')
    }
  }

  const handleRemove = (trackId: string) => {
    if (live) setQueue((prev) => prev.filter((t) => t.id !== trackId))
    else setPlaylist((prev) => prev.filter((t) => t.id !== trackId))
  }

  const handleEmoji = (emoji: string) => {
    bumpReactionsSent()
    reactionCountRef.current += 1
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

  // End the room (host only). Capture a recap snapshot now — the backend archive is
  // only saved after the close grace period — then go to the summary.
  const handleEnd = () => {
    const tracks = displayTracks
    const durationSec = tracks.reduce((sum, t) => sum + (t.duration_sec ?? 0), 0)
    saveSummary(roomId, {
      title,
      tags,
      tracks: tracks.map((t) => ({ id: t.id, title: t.title, artist: t.artist, addedBy: t.added_by, videoId: t.video_id })),
      participants: members.map((m) => ({ id: m.id, name: m.name, color: m.color })),
      reactions: reactionCountRef.current,
      durationMin: Math.max(1, Math.round(durationSec / 60)),
    })
    if (live) socket?.emit('room:leave') // room closes once empty
    router.push(`/rooms/${roomId}/summary`)
  }

  return (
    <>
      <AppHeader back={{ href: '/rooms', label: '홈' }} title={title} />

      <div className="flex flex-1 flex-col gap-5 px-6 pb-8 pt-4">
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

        {/* End-room confirmation */}
        {confirmEnd && (
          <div
            className="fixed inset-0 z-50 mx-auto flex max-w-[440px] items-center justify-center bg-black/25 px-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="방 종료 확인"
            onClick={() => setConfirmEnd(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full rounded-[20px] border-2 border-border bg-white p-6 text-center">
              <p className="text-[15px] font-extrabold text-foreground">방을 종료할까요?</p>
              <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">종료하면 지금까지 재생한 곡 요약을 볼 수 있어요.</p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmEnd(false)}
                  className="flex-1 rounded-full border-2 border-border py-2.5 text-[13px] font-bold text-muted-foreground hover:text-foreground"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmEnd(false)
                    handleEnd()
                  }}
                  className="flex-1 rounded-full bg-destructive py-2.5 text-[13px] font-extrabold text-white"
                >
                  방 종료
                </button>
              </div>
            </div>
          </div>
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
          isPlaying={live ? player.isPlaying : localPlayer.isPlaying}
          progressSec={live ? player.progress : localPlayer.progress}
          durationSec={live ? player.duration || displayCurrent?.duration_sec : localPlayer.duration}
          onToggle={live ? player.toggle : localPlayer.toggle}
          // In live mode the server decides track order, so no manual next/prev.
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
              onClick={() => setConfirmEnd(true)}
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
