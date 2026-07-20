import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** YouTube thumbnail URL from a video id (mqdefault ≈ 320×180). */
export function ytThumb(videoId?: string): string | undefined {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined
}

/**
 * Build a YouTube "temporary playlist" URL that plays the given videos in order,
 * with no login/API key required. Used by the room recap "save playlist" action.
 */
export function youtubePlaylistUrl(videoIds: string[]): string | null {
  const ids = videoIds.filter(Boolean)
  if (ids.length === 0) return null
  return `https://www.youtube.com/watch_videos?video_ids=${ids.join(',')}`
}
