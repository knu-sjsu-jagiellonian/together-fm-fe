import { AppHeader } from '@/components/app-header'
import { ProfileClient } from './profile-client'

export default function ProfilePage() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader back={{ href: '/rooms', label: '홈' }} title="프로필" />
      <ProfileClient />
    </main>
  )
}
