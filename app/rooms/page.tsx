import Link from 'next/link'
import { User } from 'lucide-react'
import { getRooms } from '@/lib/mock-data'
import { fromMockRoom } from '@/lib/rooms'
import { RoomsClient } from './rooms-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function RoomsPage() {
  const rooms = await getRooms()
  const initialRooms = rooms.map(fromMockRoom)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex-1 px-6 pb-24 pt-12">
        {/* Title + profile access (top-right) */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[23px] font-extrabold tracking-tight text-foreground">Together FM</h1>
            <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">함께 만드는 실시간 라디오</p>
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
