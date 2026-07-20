'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { NowPlaying } from '@/lib/api-types'

// Minimal YT IFrame API typings (avoids the @types/youtube dependency).
interface YTPlayer {
  loadVideoById(opts: { videoId: string; startSeconds?: number }): void
  playVideo(): void
  stopVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getPlayerState(): number
}
interface YTNamespace {
  Player: new (el: string | HTMLElement, cfg: unknown) => YTPlayer
  PlayerState: { PLAYING: number }
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const IFRAME_API_SRC = 'https://www.youtube.com/iframe_api'
const CONTAINER_ID = 'tfm-yt-player'

/** Load the IFrame API script exactly once and resolve when `window.YT` is ready. */
function loadIframeApi(): Promise<YTNamespace> {
  return new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT)
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(window.YT!)
    }
    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const s = document.createElement('script')
      s.src = IFRAME_API_SRC
      document.head.appendChild(s)
    }
  })
}

/**
 * Hidden 1px YouTube player that stays in sync with the server clock.
 * See API.md §6 (steps 3–6). The consuming component must render a mount node:
 *   <div id={CONTAINER_ID} /> — exported as `containerId`.
 */
export function useYouTubePlayer(
  serverNowRef: MutableRefObject<() => number>,
  enabled = true,
) {
  const playerRef = useRef<YTPlayer | null>(null)
  const currentRef = useRef<NowPlaying | null>(null)
  const [ready, setReady] = useState(false)

  const positionSec = useCallback(
    (current: NowPlaying) => (serverNowRef.current() - current.startedAtServerMs) / 1000,
    [serverNowRef],
  )

  // Boot the player (only when live — avoids loading the IFrame API in mock mode).
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    loadIframeApi().then((YT) => {
      if (cancelled) return
      playerRef.current = new YT.Player(CONTAINER_ID, {
        height: '1',
        width: '1',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
        events: {
          onReady: () => setReady(true),
          // Ignore onStateChange ENDED — track transitions are decided by the server.
        },
      })
    })
    return () => {
      cancelled = true
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

  return { containerId: CONTAINER_ID, ready, syncTo, stop, unlock }
}
