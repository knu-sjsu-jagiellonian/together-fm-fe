import Link from 'next/link'
import { Plus, Radio } from 'lucide-react'
import { getRooms } from '@/lib/mock-data'
import { FILTER_TAGS } from '@/lib/types'
import { RoomsClient } from './rooms-client'

export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <main className="min-h-screen sparkle-bg">
      {/* Hero header */}
      <header className="relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-10 pb-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-pink">
              <Radio className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Together FM
              </h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                함께 만드는 라디오
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-5">
            <p className="text-3xl font-extrabold leading-tight text-balance text-foreground bubble-text">
              지금 열려있는{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                라디오 방
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              마음에 드는 방에 입장하거나 직접 만들어보세요
            </p>
          </div>

          {/* Create button */}
          <Link
            href="/rooms/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all hover:scale-105 glow-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <Plus className="w-4 h-4" />
            새 방 만들기
          </Link>
        </div>
      </header>

      {/* Rooms list with client-side filter */}
      <RoomsClient rooms={rooms} filterTags={FILTER_TAGS} />
    </main>
  )
}
