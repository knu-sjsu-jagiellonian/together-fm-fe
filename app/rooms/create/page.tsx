import { AppHeader } from '@/components/app-header'
import { CreateRoomForm } from './create-room-form'

export default function CreateRoomPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader back={{ href: '/rooms', label: '방 목록' }} title="방 만들기" />
      <div className="flex-1 px-6 py-5">
        <CreateRoomForm />
      </div>
    </main>
  )
}
