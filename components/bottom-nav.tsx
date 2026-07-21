import Link from 'next/link'
import { Plus } from 'lucide-react'

/**
 * Floating circular "+" (create room) button — no bar, so the room list shows
 * behind it. Fixed to the bottom-center of the centered phone shell.
 */
export function BottomNav() {
  return (
    <Link
      href="/rooms/create"
      className="fixed bottom-6 left-1/2 z-40 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full bg-holo shadow-[0_8px_22px_rgba(160,116,214,0.45)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      aria-label="방 만들기"
    >
      <Plus className="h-7 w-7 text-[#2c2a35]" strokeWidth={2.6} />
    </Link>
  )
}
