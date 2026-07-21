'use client'

import { useRouter } from 'next/navigation'
import { Radio, ChevronRight } from 'lucide-react'
import { Minimi } from '@/components/minimi'
import { MOCK_ACCOUNTS, setMe } from '@/lib/me'

/**
 * Mock login: pick an account to become "me". Stores only the nickname (no backend
 * token), so mock rooms keep working. Real login (POST /api/login) is a later step.
 */
export function LoginClient() {
  const router = useRouter()

  const choose = (nickname: string) => {
    setMe(nickname)
    router.push('/rooms')
  }

  return (
    <div className="mx-auto w-full max-w-[360px]">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary shadow-[0_6px_18px_rgba(160,116,214,0.4)]">
          <Radio className="h-7 w-7 text-white" />
        </span>
        <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">Together FM</h1>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">계정을 선택해 시작하세요</p>
      </div>

      {/* Account list */}
      <ul className="flex flex-col gap-2.5" role="list">
        {MOCK_ACCOUNTS.map((acc) => (
          <li key={acc.nickname}>
            <button
              type="button"
              onClick={() => choose(acc.nickname)}
              className="flex w-full items-center gap-3 rounded-[16px] border-2 border-border bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_20px_rgba(120,100,160,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <Minimi seed={acc.nickname} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-extrabold text-foreground">{acc.nickname}</p>
                {acc.note && <p className="truncate text-[11.5px] font-medium text-muted-foreground">{acc.note}</p>}
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-[10.5px] font-medium text-muted-foreground/70">
        데모용 mock 로그인이에요 · 비밀번호 없이 계정만 선택합니다
      </p>
    </div>
  )
}
