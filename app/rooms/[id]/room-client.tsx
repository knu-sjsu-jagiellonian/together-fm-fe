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
  const [confirmLeave, setConfirmLeave] = useState(false)
  // Shown to a non-host when the room closes (host ended it, or the playlist ran out):
  // a short farewell notice, then they're taken to the same recap the host sees.
  const [closedNotice, setClosedNotice] = useState(false)
  // Live only: tracks that already finished playing, kept so they stay in the list
  // as history (the server drops them from the queue once played).
  const [played, setPlayed] = useState<Track[]>([])
  // Live only: shown when the playlist runs out and the room auto-closes.
  const [autoEnded, setAutoEnded] = useState(false)
  const burstId = useRef(0)
  const reactionCountRef = useRef(0)
  const currentRef = useRef<Track | null>(current)
  const hasPlayedRef = useRef(false)
  // Set when *this* client (the host) ends the room, so its own room:closed
  // broadcast doesn't bounce it off the recap screen to the room list.
  const endingRef = useRef(false)
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
  // Live list = history (played) + now playing + upcoming; mock uses the static playlist.
  const displayTracks = live ? [...played, ...(current ? [current] : []), ...queue] : playlist

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
  const canRemove = (t: Track) => {
    if (!(isHost || t.added_by === me)) return false
    // Live: only upcoming (queued) tracks are removable — not the playing or past ones.
    if (live) return queue.some((q) => q.id === t.id)
    return true
  }

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

  // Snapshot the current room state for the recap screen. The backend archive is
  // only saved after the close grace period, so we capture what we see right now.
  // Used by the host (on end) and by everyone else (when the room:closed arrives).
  const captureSummary = () => {
    const tracks = displayTracks
    const durationSec = tracks.reduce((sum, t) => sum + (t.duration_sec ?? 0), 0)
    saveSummary(roomId, {
      title,
      tags,
      host: hostNickname,
      tracks: tracks.map((t) => ({ id: t.id, title: t.title, artist: t.artist, addedBy: t.added_by, videoId: t.video_id })),
      participants: members.map((m) => ({ id: m.id, name: m.name, color: m.color })),
      reactions: reactionCountRef.current,
      durationMin: Math.max(1, Math.round(durationSec / 60)),
    })
  }
  // onClosed lives in a one-time effect closure, so route the latest capture through a ref.
  const captureSummaryRef = useRef(captureSummary)
  useEffect(() => {
    captureSummaryRef.current = captureSummary
  })

  // Join + subscribe (live only).
  useEffect(() => {
    if (!socket || !live) return
    const s = socket
    const toDisplay = (t: ApiTrack) => toDisplayTrack(t, roomId)

    const onTrack = (cur: NowPlaying | null) => {
      const next = cur ? toDisplay(cur.track) : null
      const prev = currentRef.current
      // When the song changes, keep the finished one as history (server drops it).
      if (prev && prev.id !== next?.id) {
        setPlayed((p) => (p.some((t) => t.id === prev.id) ? p : [...p, prev]))
      }
      if (next) hasPlayedRef.current = true
      currentRef.current = next
      setCurrent(next)
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
      // The host who just ended is already navigating to the recap — don't double-handle.
      if (endingRef.current) return
      // Everyone else: capture the recap from what they see now, show a brief notice,
      // then a small effect redirects them to the summary screen (like the host's).
      captureSummaryRef.current()
      setClosedNotice(true)
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
        const cur = toDisplay(snap.current.track)
        currentRef.current = cur
        hasPlayedRef.current = true
        setCurrent(cur)
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
    if (live) {
      // Server removes it and broadcasts queue:update; we just surface failures.
      socket?.emit('queue:remove', { trackId }, (res) => {
        if (!res.ok) toast(res.reason ?? '곡을 삭제하지 못했어요', 'error')
      })
    } else {
      setPlaylist((prev) => prev.filter((t) => t.id !== trackId))
    }
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

  // Leaving takes you to your own recap of the session (the same summary screen
  // the host gets on end). Saving the playlist is available there.
  const handleLeave = () => {
    captureSummary()
    socket?.emit('room:leave')
    router.push(`/rooms/${roomId}/summary`)
  }

  // End the room (host only). Capture the recap, then go to the summary.
  const handleEnd = () => {
    captureSummary()
    // Host leaving closes the room server-side and broadcasts room:closed to the
    // others; endingRef keeps our own broadcast from redirecting us off the recap.
    endingRef.current = true
    if (live) socket?.emit('room:leave')
    router.push(`/rooms/${roomId}/summary`)
  }

  // Auto-close a live room when the playlist runs out (host only). Once a song has
  // played and both current and queue are empty, the radio has nothing left.
  const handleEndRef = useRef(handleEnd)
  useEffect(() => {
    handleEndRef.current = handleEnd
  })
  useEffect(() => {
    if (!live || !isHost || autoEnded) return
    if (!hasPlayedRef.current || current !== null || queue.length > 0) return
    setAutoEnded(true)
  }, [live, isHost, autoEnded, current, queue.length])
  useEffect(() => {
    if (!autoEnded) return
    const t = setTimeout(() => handleEndRef.current(), 1800)
    return () => clearTimeout(t)
  }, [autoEnded])

  // Non-host: after the room-closed notice shows, move on to the recap screen.
  useEffect(() => {
    if (!closedNotice) return
    const t = setTimeout(() => router.push(`/rooms/${roomId}/summary`), 1800)
    return () => clearTimeout(t)
  }, [closedNotice, roomId, router])

  return (
    <>
      <AppHeader title={title} />

      <div className="flex flex-1 flex-col gap-5 px-6 pb-8 pt-4">
        {/* Audio-unlock overlay (autoplay policy) — tapping starts the radio. */}
        {displayCurrent && !audioUnlocked && (
          <button
            type="button"
            onClick={() => {
              if (live) player.unlock()
              else localPlayer.play()
              setAudioUnlocked(true)
            }}
            className="frame-fixed z-50 flex flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm"
          >
            <Vinyl size={96} hub="#b8a0e8" holoRing />
            <span className="rounded-full bg-holo px-6 py-3 text-[15px] font-extrabold text-[#2c2a35]">탭해서 참여하기</span>
            <span className="text-[12px] font-medium text-muted-foreground">{live ? '모두와 같은 지점부터 함께 들어요' : '탭하면 라디오가 시작돼요'}</span>
          </button>
        )}

        {/* Auto-close: the live playlist ran out */}
        {autoEnded && (
          <div
            className="frame-fixed z-50 flex flex-col items-center justify-center gap-3 bg-white/90 px-6 text-center backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="방 종료"
          >
            <Vinyl size={72} hub="#b8a0e8" holoRing />
            <p className="text-[15px] font-extrabold text-foreground">플레이리스트가 끝났어요</p>
            <p className="text-[12px] font-medium text-muted-foreground">마지막 곡이 끝나 방이 종료돼요.<br />잠시 후 요약 화면으로 이동해요.</p>
          </div>
        )}

        {/* End-room confirmation */}
        {confirmEnd && (
          <div
            className="frame-fixed z-50 flex items-center justify-center bg-black/25 px-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="방 종료 확인"
            onClick={() => setConfirmEnd(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full rounded-[20px] border-2 border-border bg-white p-6 text-center">
              <p className="text-[15px] font-extrabold text-foreground">방을 종료할까요?</p>
              <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
                방장이 방을 종료하면 함께 듣던 사람들도 모두 방에서 나가게 돼요.
                <br />
                종료 후에는 지금까지 재생한 곡 요약을 볼 수 있어요.
              </p>
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

        {/* Leave-room confirmation */}
        {confirmLeave && (
          <div
            className="frame-fixed z-50 flex items-center justify-center bg-black/25 px-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="방 나가기 확인"
            onClick={() => setConfirmLeave(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full rounded-[20px] border-2 border-border bg-white p-6 text-center">
              <p className="text-[15px] font-extrabold text-foreground">방을 나갈까요?</p>
              <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
                나가면 지금까지 함께 들은 곡 요약을 볼 수 있어요.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLeave(false)}
                  className="flex-1 rounded-full border-2 border-border py-2.5 text-[13px] font-bold text-muted-foreground hover:text-foreground"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmLeave(false)
                    handleLeave()
                  }}
                  className="flex-1 rounded-full bg-holo py-2.5 text-[13px] font-extrabold text-[#2c2a35]"
                >
                  나가기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Room closed (host ended it): brief notice, then off to the recap screen. */}
        {closedNotice && (
          <div
            className="frame-fixed z-50 flex flex-col items-center justify-center gap-3 bg-white/90 px-6 text-center backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="방 종료"
          >
            <Vinyl size={72} hub="#b8a0e8" holoRing />
            <p className="text-[15px] font-extrabold text-foreground">방이 종료되었어요</p>
            <p className="text-[12px] font-medium text-muted-foreground">방장이 방을 종료했어요.<br />잠시 후 요약 화면으로 이동해요.</p>
          </div>
        )}

        {/* tags + presence + host */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <TagPill key={t} label={t} />
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-transparent bg-white px-3 py-1 holo-ring">
              <span className="h-2 w-2 rounded-full" style={{ background: '#b8a0e8' }} />
              <span className="text-[10px] font-bold text-muted-foreground">{members.length}명 함께 듣는 중</span>
            </span>
          </div>
          {hostNickname && (
            <p className="text-[11px] font-semibold text-muted-foreground">
              <span aria-hidden="true">👑</span> 방장 <span className="font-bold text-foreground">{hostNickname}</span>
            </p>
          )}
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
                {m.name === hostNickname && (
                  <span className="pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 select-none text-[13px]" aria-label="방장" title="방장">
                    👑
                  </span>
                )}
                <Minimi seed={m.name} isMe={i === meIndex} size={30} name={m.name} />
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

        {/* now playing — radio style, no manual controls (playback is automatic) */}
        <NowPlayingCard
          track={displayCurrent}
          isPlaying={live ? player.isPlaying : localPlayer.isPlaying}
          progressSec={live ? player.progress : localPlayer.progress}
          durationSec={live ? player.duration || displayCurrent?.duration_sec : localPlayer.duration}
        />

        {/* Last-song notice (live): the room closes when this song ends. */}
        {live && current && queue.length === 0 && (
          <p className="-mt-3 text-center text-[11px] font-semibold text-muted-foreground">
            🔔 마지막 곡이에요 · 끝나면 방이 종료돼요
          </p>
        )}

        <ReactionBar onEmoji={handleEmoji} />

        <QueueList
          tracks={displayTracks}
          currentId={displayCurrent?.id}
          onRemove={handleRemove}
          canRemove={canRemove}
          onAdd={handleAdd}
          // Radio-style: the current track auto-advances; tapping a track never jumps.
          // Played tracks stay in the list as history only.
          onSelect={undefined}
        />

        {/* Leave / end. The host leaving closes the room for everyone, so the host
            gets a single '방 종료' action instead of a separate '방 나가기'. */}
        <div className="pt-1">
          {isHost ? (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              className="w-full rounded-full border-2 border-destructive/40 py-2.5 text-center text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
            >
              방 종료
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className="w-full rounded-full border-2 border-border py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              방 나가기
            </button>
          )}
        </div>
      </div>
    </>
  )
}
