'use client'

import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { SearchResult } from '@/lib/api-types'

/**
 * Debounced YouTube search via the backend proxy (GET /api/search).
 * Debounce is mandatory: search costs 100 quota units (~100 calls/day). See API.md §3.
 */
export function useTrackSearch(delay = 600) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const query = q.trim()
    if (!query) {
      // Clear via a microtask so we never setState synchronously in the effect body.
      timer.current = setTimeout(() => {
        setResults([])
        setError(null)
        setLoading(false)
      }, 0)
      return () => {
        if (timer.current) clearTimeout(timer.current)
      }
    }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        setResults(await api.search(query))
        setError(null)
      } catch (e) {
        // Surface the server's Korean message (e.g. 503 quota) directly.
        setError(e instanceof ApiError ? e.message : '검색 중 문제가 발생했어요')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q, delay])

  const reset = () => {
    setQ('')
    setResults([])
    setError(null)
  }

  return { q, setQ, results, loading, error, reset }
}
