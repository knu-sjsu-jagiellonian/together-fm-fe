'use client'

import { useCallback, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { SearchResult } from '@/lib/api-types'

/**
 * On-demand YouTube search via the backend proxy (GET /api/search).
 * Search runs only when `search()` is called (e.g. on Enter), never per keystroke —
 * each call costs 100 quota units (~100/day). See API.md §3.
 */
export function useTrackSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (query: string) => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearched(false)
      setError(null)
      return
    }
    setLoading(true)
    setSearched(true)
    setError(null)
    try {
      setResults(await api.search(q))
    } catch (e) {
      // Surface the server's Korean message (e.g. 503 quota) directly.
      setError(e instanceof ApiError ? e.message : '검색 중 문제가 발생했어요')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setError(null)
    setSearched(false)
    setLoading(false)
  }, [])

  return { results, loading, error, searched, search, reset }
}
