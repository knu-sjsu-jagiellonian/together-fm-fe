import { AppHeader } from '@/components/app-header'
import { CreateRoomForm } from './create-room-form'

export default function CreateRoomPage() {
  return (
    <main className="min-h-screen sparkle-bg">
      <AppHeader back={{ href: '/rooms', label: '방 목록' }} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground text-balance">
            새 방 만들기
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            나만의 라디오 방을 열어 친구들과 음악을 함께 들어보세요
          </p>
        </div>
        <CreateRoomForm />
      </div>
    </main>
  )
}
