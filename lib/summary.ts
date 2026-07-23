// Client-side recap snapshot. A live room's archive is only saved on the backend
// after the close grace period, so on "방 종료" we capture the current room state
// and show it immediately. Kept in sessionStorage keyed by room id.

export interface SummaryTrack {
  id: string
  title: string
  artist: string
  addedBy: string
  videoId?: string
}

export interface SummarySnapshot {
  title: string
  tags: string[]
  tracks: SummaryTrack[]
  participants: { id: string; name: string; color: string }[]
  reactions: number
  durationMin: number
}

const KEY = (roomId: string) => `tfm.summary.${roomId}`

export function saveSummary(roomId: string, snap: SummarySnapshot) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(KEY(roomId), JSON.stringify(snap))
  } catch {
    /* storage unavailable */
  }
}

export function loadSummary(roomId: string): SummarySnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY(roomId))
    return raw ? (JSON.parse(raw) as SummarySnapshot) : null
  } catch {
    return null
  }
}
