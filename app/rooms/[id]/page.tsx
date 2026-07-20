import { notFound } from 'next/navigation'
import { getRoomById } from '@/lib/mock-data'
import { AppHeader } from '@/components/app-header'
import { RoomClient } from './room-client'

interface RoomPageProps {
  params: Promise<{ id: string }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params
  const room = await getRoomById(id)

  if (!room) notFound()

  return (
    <main className="min-h-screen sparkle-bg">
      <AppHeader
        back={{ href: '/rooms', label: '방 목록' }}
        title={room.title}
      />
      <RoomClient room={room} />
    </main>
  )
}
