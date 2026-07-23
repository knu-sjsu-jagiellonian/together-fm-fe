import Link from 'next/link'
import { Plus } from 'lucide-react'

/**
 * Floating circular "+" (create room) button — no bar, so the room list shows
 * behind it. Anchored to the bottom-center of the phone frame (via .frame-fixed)
 * so it never spills past the frame's rounded bottom on wider screens.
 */
export function BottomNav() {
  return (
    <div className="frame-fixed z-40 pointer-events-none">
      <Link
        href="/rooms/create"
        className="pointer-events-auto absolute bottom-6 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full bg-holo shadow-[0_8px_22px_rgba(160,116,214,0.45)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-label="방 만들기"
      >
        <Plus className="h-7 w-7 text-[#2c2a35]" strokeWidth={2.6} />
      </Link>
    </div>
  )
}
