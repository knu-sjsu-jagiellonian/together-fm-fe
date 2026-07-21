'use client'

// Shared minimal typings + loader for the YouTube IFrame Player API.
// Declared in one place so multiple hooks don't clash on the `window.YT` global.

export interface YTPlayer {
  loadVideoById(o: { videoId: string; startSeconds?: number }): void
  cueVideoById(o: { videoId: string }): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
}

export interface YTNamespace {
  Player: new (el: string | HTMLElement, cfg: unknown) => YTPlayer
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const IFRAME_API_SRC = 'https://www.youtube.com/iframe_api'

/**
 * Create an off-screen host node appended to <body> with an inner `target` for
 * YT.Player to replace. Because React never renders these nodes, the IFrame swap
 * (which replaces `target`) can't cause React's "removeChild ... not a child" error.
 * Remove `host` on cleanup.
 */
export function createHiddenPlayerHost(): { host: HTMLElement; target: HTMLElement } {
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
  const target = document.createElement('div')
  host.appendChild(target)
  document.body.appendChild(host)
  return { host, target }
}

/** Load the IFrame API script exactly once and resolve when `window.YT` is ready. */
export function loadIframeApi(): Promise<YTNamespace> {
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
