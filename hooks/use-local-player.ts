'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '@/lib/types'
import { loadIframeApi, type YTPlayer } from '@/lib/youtube-iframe'

const CONTAINER_ID = 'tfm-local-player'

/**
 * A plain local playlist player (no server sync) so songs actually play and
 * next/prev move through the list. First playback needs a user gesture
 * (the play button) per the browser autoplay policy.
 */
export function useLocalPlayer(tracks: Track[], enabled = true) {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)

  const playerRef = useRef<YTPlayer | null>(null)
  const startedRef = useRef(false)
  const tracksRef = useRef(tracks)
  const indexRef = useRef(index)
  const nextRef = useRef<() => void>(() => {})

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])
  useEffect(() => {
    indexRef.current = index
  }, [index])

  // Boot the player.
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    loadIframeApi().then((YT) => {
      if (cancelled) return
      playerRef.current = new YT.Player(CONTAINER_ID, {
        height: '0',
        width: '0',
        playerVars: { controls: 0, playsinline: 1, disablekb: 1 },
        events: {
          onReady: () => {
            setReady(true)
            const t = tracksRef.current[indexRef.current]
            if (t?.video_id) playerRef.current?.cueVideoById({ videoId: t.video_id })
          },
          onStateChange: (e: { data: number }) => {
            const S = window.YT?.PlayerState
            if (!S) return
            if (e.data === S.ENDED) nextRef.current()
            if (e.data === S.PLAYING) setIsPlaying(true)
            if (e.data === S.PAUSED || e.data === S.ENDED) setIsPlaying(false)
          },
        },
      })
    })
    return () => {
      cancelled = true
    }
  }, [enabled])

  // Load the track when index changes (after the first user gesture → autoplays).
  useEffect(() => {
    if (!ready || !startedRef.current) return
    const t = tracksRef.current[index]
    if (t?.video_id) playerRef.current?.loadVideoById({ videoId: t.video_id })
  }, [index, ready])

  // Progress ticker.
  useEffect(() => {
    if (!ready) return
    const timer = setInterval(() => {
      const p = playerRef.current
      if (!p) return
      const d = p.getDuration() || 0
      if (d) setDuration(d)
      setProgress(p.getCurrentTime() || 0)
    }, 500)
    return () => clearInterval(timer)
  }, [ready])

  const play = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    const t = tracksRef.current[indexRef.current]
    if (!startedRef.current) {
      startedRef.current = true
      if (t?.video_id) p.loadVideoById({ videoId: t.video_id }) // starts within the gesture
    } else {
      p.playVideo()
    }
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo()
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, play, pause])

  const playAt = useCallback((i: number) => {
    startedRef.current = true
    setIsPlaying(true)
    setIndex((cur) => {
      if (cur === i) {
        playerRef.current?.playVideo() // clicking the current row resumes it
        return cur
      }
      return i // effect loads + autoplays the new index
    })
  }, [])

  const next = useCallback(() => {
    setIndex((i) => Math.min(tracksRef.current.length - 1, i + 1))
  }, [])
  useEffect(() => {
    nextRef.current = next
  }, [next])

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const safeIndex = Math.min(index, Math.max(0, tracks.length - 1))

  return {
    containerId: CONTAINER_ID,
    index: safeIndex,
    setIndex,
    current: tracks[safeIndex] ?? null,
    isPlaying,
    progress,
    duration,
    ready,
    play,
    pause,
    toggle,
    next,
    prev,
    playAt,
    hasNext: safeIndex < tracks.length - 1,
    hasPrev: safeIndex > 0,
  }
}
