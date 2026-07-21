import { getRoomById } from '@/lib/mock-data'
import { RoomClient } from './room-client'

interface RoomPageProps {
  params: Promise<{ id: string }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params
  // May be null for a real (backend) room — the socket snapshot fills it in.
  const room = await getRoomById(id)

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <RoomClient roomId={id} initialRoom={room} />
    </main>
  )
}
