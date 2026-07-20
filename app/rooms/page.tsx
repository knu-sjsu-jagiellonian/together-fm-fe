import { Search } from 'lucide-react'
import { getRooms } from '@/lib/mock-data'
import { FILTER_TAGS } from '@/lib/types'
import { RoomsClient } from './rooms-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function RoomsPage() {
  const rooms = await getRooms()

  // Rough "listening now" tally for the presence pill.
  const listeners = rooms.reduce((sum, r) => sum + r.participants.length, 0)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex-1 px-6 pt-12">
        {/* Title + presence */}
        <h1 className="text-[23px] font-extrabold tracking-tight text-foreground">
          Together FM
        </h1>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-transparent bg-white px-3 py-1 holo-ring">
          <span className="h-2 w-2 rounded-full" style={{ background: '#b8a0e8' }} />
          <span className="text-[11px] font-semibold text-muted-foreground">
            지금 함께 듣는 사람 {listeners.toLocaleString()}명
          </span>
        </div>

        {/* Search */}
        <div className="mt-4 flex items-center gap-2.5 rounded-full border-2 border-border bg-white px-4 py-3">
          <Search className="h-[18px] w-[18px] text-muted-foreground/70" />
          <span className="text-[13.5px] font-medium text-muted-foreground/70">
            방 제목, 태그로 검색
          </span>
        </div>

        {/* Filters + room list */}
        <RoomsClient rooms={rooms} filterTags={FILTER_TAGS} />
      </main>

      <BottomNav />
    </div>
  )
}
