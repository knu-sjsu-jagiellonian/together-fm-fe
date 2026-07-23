import Link from 'next/link'
import { User } from 'lucide-react'
import { getRooms } from '@/lib/mock-data'
import { fromMockRoom } from '@/lib/rooms'
import { RoomsClient } from './rooms-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function RoomsPage() {
  const rooms = await getRooms()
  const initialRooms = rooms.map(fromMockRoom)

  // Rough "listening now" tally for the presence pill.
  const listeners = rooms.reduce((sum, r) => sum + r.participants.length, 0)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex-1 px-6 pb-24 pt-12">
        {/* Title + profile access (top-right) */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[23px] font-extrabold tracking-tight text-foreground">Together FM</h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-transparent bg-white px-3 py-1 holo-ring">
              <span className="h-2 w-2 rounded-full" style={{ background: '#b8a0e8' }} />
              <span className="text-[11px] font-semibold text-muted-foreground">
                지금 함께 듣는 사람 {listeners.toLocaleString()}명
              </span>
            </div>
          </div>

          <Link
            href="/profile"
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border-2 border-border bg-white text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label="내 프로필"
          >
            <User className="h-[18px] w-[18px]" />
          </Link>
        </div>

        {/* Search + filters + room list */}
        <RoomsClient initialRooms={initialRooms} />
      </main>

      <BottomNav />
    </div>
  )
}
