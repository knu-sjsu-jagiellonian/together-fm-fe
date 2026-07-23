// Saved playlists shown on the profile. Backed by localStorage so a saved recap
// survives reloads. Seeded once with browsable content so the profile isn't empty
// on first visit; real saves (leaving a room / a room recap) prepend to the list.

const KEY = 'tfm.savedPlaylists'

export interface SavedTrack {
  id: string
  title: string
  artist: string
  videoId?: string
  thumbnail?: string
}

export interface SavedPlaylist {
  id: string
  title: string
  savedAt: string // 'YYYY.MM.DD'
  cover?: string
  tracks: SavedTrack[]
}

/** YouTube thumbnail for a video id (no API key needed). */
export function thumbnailFor(videoId?: string): string | undefined {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined
}

function today(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

function seedTrack(id: string, title: string, artist: string, videoId: string): SavedTrack {
  return { id, title, artist, videoId, thumbnail: thumbnailFor(videoId) }
}

// First-visit content so the profile's saved playlists are real and browsable.
const SEED: SavedPlaylist[] = [
  {
    id: 'seed-indie',
    title: '늦은 밤 인디 감성 🌙',
    savedAt: '2026.07.18',
    cover: thumbnailFor('djV11Xbc914'),
    tracks: [
      seedTrack('si1', 'Take On Me', 'a-ha', 'djV11Xbc914'),
      seedTrack('si2', 'Blinding Lights', 'The Weeknd', '4NRXx6U8ABQ'),
      seedTrack('si3', 'As It Was', 'Harry Styles', 'H5v3kku4y6Q'),
      seedTrack('si4', 'Uptown Funk', 'Mark Ronson ft. Bruno Mars', 'OPf0YbXqDm0'),
      seedTrack('si5', 'Shape of You', 'Ed Sheeran', 'JGwWNGJdvx8'),
      seedTrack('si6', 'Hello', 'Adele', 'YQHsXMglC9A'),
    ],
  },
  {
    id: 'seed-pop',
    title: 'Friday Night Pop Party 🎉',
    savedAt: '2026.07.15',
    cover: thumbnailFor('9bZkp7q19f0'),
    tracks: [
      seedTrack('sp1', 'Gangnam Style', 'PSY', '9bZkp7q19f0'),
      seedTrack('sp2', 'Happy', 'Pharrell Williams', 'ZbZSe6N_BXs'),
      seedTrack('sp3', 'Counting Stars', 'OneRepublic', 'hT_nvWreIhg'),
      seedTrack('sp4', 'Rolling in the Deep', 'Adele', 'rYEDA3JcQqw'),
      seedTrack('sp5', 'Sugar', 'Maroon 5', '09R8_2nJtjg'),
    ],
  },
]

function read(): SavedPlaylist[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) {
      localStorage.setItem(KEY, JSON.stringify(SEED))
      return SEED
    }
    return JSON.parse(raw) as SavedPlaylist[]
  } catch {
    return SEED
  }
}

function write(list: SavedPlaylist[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage unavailable */
  }
}

export function getSavedPlaylists(): SavedPlaylist[] {
  return read()
}

export function getSavedPlaylist(id: string): SavedPlaylist | null {
  return read().find((p) => p.id === id) ?? null
}

export interface SavePlaylistInput {
  title: string
  tracks: SavedTrack[]
  cover?: string
}

/**
 * Save a playlist to the profile (prepended). Returns the created playlist, or the
 * existing one when it duplicates the most recent save (prevents double-saving from
 * a double click / re-open of the same recap).
 */
export function savePlaylist(input: SavePlaylistInput): SavedPlaylist {
  const list = read()
  const sig = (title: string, tracks: { id: string }[]) => `${title}::${tracks.map((t) => t.id).join(',')}`
  if (list[0] && sig(list[0].title, list[0].tracks) === sig(input.title, input.tracks)) {
    return list[0]
  }
  const cover =
    input.cover ??
    input.tracks.find((t) => t.thumbnail)?.thumbnail ??
    thumbnailFor(input.tracks.find((t) => t.videoId)?.videoId)
  const pl: SavedPlaylist = {
    id: `pl-${Date.now()}`,
    title: input.title,
    savedAt: today(),
    cover,
    tracks: input.tracks,
  }
  write([pl, ...list])
  return pl
}

export function removePlaylist(id: string) {
  write(read().filter((p) => p.id !== id))
}
