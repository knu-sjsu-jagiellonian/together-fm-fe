import Link from 'next/link'
import { Plus } from 'lucide-react'

/**
 * Minimal bottom bar: just the holographic "+" (create room) FAB.
 * Profile lives in the home header's top-right.
 */
export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-40 border-t-2 border-border bg-white" aria-label="주요 메뉴">
      <div className="mx-auto flex h-[72px] max-w-[440px] items-center justify-center pb-[env(safe-area-inset-bottom)]">
        <Link
          href="/rooms/create"
          className="flex items-center gap-2 rounded-full bg-holo px-6 py-3 shadow-[0_6px_18px_rgba(160,116,214,0.4)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="방 만들기"
        >
          <Plus className="h-5 w-5 text-[#2c2a35]" strokeWidth={2.6} />
          <span className="text-[14px] font-extrabold text-[#2c2a35]">방 만들기</span>
        </Link>
      </div>
    </nav>
  )
}
