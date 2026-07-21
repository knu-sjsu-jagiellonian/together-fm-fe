'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { NowPlaying } from '@/lib/api-types'
import { loadIframeApi, createHiddenPlayerHost, type YTPlayer } from '@/lib/youtube-iframe'

/**
 * Hidden 1px YouTube player that stays in sync with the server clock.
 * See API.md §6 (steps 3–6). The player mounts into its own body-appended node
 * (not a React-rendered one) so the IFrame swap can't break React's DOM removal.
 */
export function useYouTubePlayer(
  serverNowRef: MutableRefObject<() => number>,
  enabled = true,
) {
  const playerRef = useRef<YTPlayer | null>(null)
  const currentRef = useRef<NowPlaying | null>(null)
  const [ready, setReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const positionSec = useCallback(
    (current: NowPlaying) => (serverNowRef.current() - current.startedAtServerMs) / 1000,
    [serverNowRef],
  )

  // Boot the player (only when live — avoids loading the IFrame API in mock mode).
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const { host, target } = createHiddenPlayerHost()
    loadIframeApi().then((YT) => {
      if (cancelled) {
        host.remove()
        return
      }
      playerRef.current = new YT.Player(target, {
        height: '1',
        width: '1',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
        events: {
          onReady: () => setReady(true),
          // Reflect real playback state on the now-playing card.
          // (Track transitions are still decided by the server, not by ENDED.)
          onStateChange: (e: { data: number }) => {
            const S = window.YT?.PlayerState
            if (!S) return
            if (e.data === S.PLAYING) setIsPlaying(true)
            if (e.data === S.PAUSED || e.data === S.ENDED) setIsPlaying(false)
          },
        },
      })
    })
    return () => {
      cancelled = true
      playerRef.current = null
      host.remove()
    }
  }, [enabled])

  /** Jump to the current track at its correct server position. */
  const syncTo = useCallback(
    (current: NowPlaying | null) => {
      currentRef.current = current
      const player = playerRef.current
      if (!player) return
      if (!current) {
        player.stopVideo()
        return
      }
      player.loadVideoById({
        videoId: current.track.videoId,
        startSeconds: Math.max(0, positionSec(current)),
      })
    },
    [positionSec],
  )

  const stop = useCallback(() => {
    currentRef.current = null
    playerRef.current?.stopVideo()
  }, [])

  /**
   * Must be called inside a user-gesture handler (the "탭해서 참여하기" overlay) to
   * satisfy the browser autoplay policy. See API.md §6, step 5.
   */
  const unlock = useCallback(() => {
    if (currentRef.current) syncTo(currentRef.current)
    playerRef.current?.playVideo()
  }, [syncTo])

  /** Pause/resume own audio (the drift loop re-syncs on resume; others unaffected). */
  const toggle = useCallback(() => {
    const player = playerRef.current
    const YT = window.YT
    if (!player || !YT) return
    if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo()
    else player.playVideo()
  }, [])

  // Drift correction every 2s + on tab refocus.
  useEffect(() => {
    if (!ready) return
    const YT = window.YT
    function correct() {
      const player = playerRef.current
      const current = currentRef.current
      if (!player || !current || !YT) return
      if (player.getPlayerState() !== YT.PlayerState.PLAYING) return
      const expected = positionSec(current)
      const actual = player.getCurrentTime()
      if (Math.abs(expected - actual) > 1.0) player.seekTo(expected, true)
    }
    const timer = setInterval(correct, 2000)
    const onVisible = () => {
      if (!document.hidden) correct()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [ready, positionSec])

  // Progress ticker for the now-playing UI.
  useEffect(() => {
    if (!ready) return
    const timer = setInterval(() => {
      const player = playerRef.current
      if (!player) return
      const d = player.getDuration() || 0
      if (d) setDuration(d)
      setProgress(player.getCurrentTime() || 0)
    }, 500)
    return () => clearInterval(timer)
  }, [ready])

  return { ready, isPlaying, progress, duration, syncTo, stop, unlock, toggle }
}
