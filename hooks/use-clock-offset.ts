'use client'

import { useEffect, useRef } from 'react'
import type { TfmSocket } from '@/lib/socket'

/**
 * Keeps a running estimate of (serverClock - localClock) in ms so every client
 * computes the same playback position. See API.md §6, step 1.
 *
 * Returns a ref holding a `serverNow()` function; read it as `serverNowRef.current()`.
 */
export function useClockOffset(socket: TfmSocket | null) {
  const offsetRef = useRef(0)
  const serverNowRef = useRef<() => number>(() => Date.now())

  useEffect(() => {
    if (!socket) return
    let cancelled = false

    async function measureOffset(): Promise<number> {
      const samples: { rtt: number; offset: number }[] = []
      for (let i = 0; i < 5; i++) {
        const t0 = Date.now()
        const pong = await new Promise<{ t0: number; tServer: number }>((resolve) => {
          socket!.once('time:pong', resolve)
          socket!.emit('time:ping', { t0 })
        })
        const t1 = Date.now()
        samples.push({
          rtt: t1 - pong.t0,
          // midpoint estimate: server time at t1, minus local t1
          offset: pong.tServer + (t1 - pong.t0) / 2 - t1,
        })
      }
      // Use the lowest-latency sample, not the average — jittery samples skew it.
      return samples.sort((a, b) => a.rtt - b.rtt)[0].offset
    }

    async function sync() {
      try {
        const offset = await measureOffset()
        if (!cancelled) offsetRef.current = offset
      } catch {
        /* transient — next tick retries */
      }
    }

    serverNowRef.current = () => Date.now() + offsetRef.current

    sync()
    const timer = setInterval(sync, 30_000) // clocks drift slowly
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [socket])

  return serverNowRef
}
