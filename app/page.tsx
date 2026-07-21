'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasMe } from '@/lib/me'

export default function Home() {
  const router = useRouter()

  // Route to the room list if a mock account is chosen, otherwise to login.
  useEffect(() => {
    router.replace(hasMe() ? '/rooms' : '/login')
  }, [router])

  return null
}
