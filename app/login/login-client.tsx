'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, ChevronRight } from 'lucide-react'
import { Minimi } from '@/components/minimi'
import { api, setToken, ApiError } from '@/lib/api'
import { disconnectSocket } from '@/lib/socket'
import { MOCK_ACCOUNTS, setMe, setMyUserId } from '@/lib/me'
import type { User } from '@/lib/api-types'

/**
 * Login: pick a seeded backend account (no password — see API.md §2).
 * On select we POST /api/login, store the token (turns on live mode) and the nickname.
 * If the backend is unreachable we fall back to mock accounts (nickname only).
 */
export function LoginClient() {
  const router = useRouter()
  const [users, setUsers] = useState<User[] | null>(null)
  const [offline, setOffline] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .users()
      .then((u) => !cancelled && setUsers(u))
      .catch(() => !cancelled && setOffline(true))
    return () => {
      cancelled = true
    }
  }, [])

  const loginReal = async (u: User) => {
    setBusy(u.username)
    setError(null)
    try {
      const res = await api.login(u.username)
      setToken(res.token)
      setMe(res.user.nickname)
      setMyUserId(res.user.id)
      disconnectSocket() // drop any socket authed as a previous user
      router.push('/rooms')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '로그인에 실패했어요')
      setBusy(null)
    }
  }

  const loginMock = (nickname: string) => {
    setToken(null) // mock mode — no token
    setMe(nickname)
    setMyUserId(null)
    disconnectSocket()
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

      {error && <p className="mb-3 text-center text-[13px] font-medium text-destructive">{error}</p>}

      {/* Loading */}
      {users === null && !offline && (
        <p className="py-8 text-center text-[13px] text-muted-foreground">계정 불러오는 중…</p>
      )}

      {/* Real backend accounts */}
      {users && (
        <ul className="flex flex-col gap-2.5" role="list">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => loginReal(u)}
                className="flex w-full items-center gap-3 rounded-[16px] border-2 border-border bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_20px_rgba(120,100,160,0.12)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <Minimi seed={u.nickname} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold text-foreground">{u.nickname}</p>
                  <p className="truncate text-[11.5px] font-medium text-muted-foreground">@{u.username}</p>
                </div>
                {busy === u.username ? (
                  <span className="text-[11px] font-semibold text-muted-foreground">입장중…</span>
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Offline fallback → mock accounts */}
      {offline && (
        <>
          <p className="mb-3 rounded-xl border-2 border-border bg-white px-3 py-2 text-center text-[11.5px] font-medium text-muted-foreground">
            백엔드에 연결할 수 없어 mock 계정으로 진행해요 (닉네임만)
          </p>
          <ul className="flex flex-col gap-2.5" role="list">
            {MOCK_ACCOUNTS.map((acc) => (
              <li key={acc.nickname}>
                <button
                  type="button"
                  onClick={() => loginMock(acc.nickname)}
                  className="flex w-full items-center gap-3 rounded-[16px] border-2 border-border bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
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
        </>
      )}

      <p className="mt-6 text-center text-[10.5px] font-medium text-muted-foreground/70">
        비밀번호 없이 시드 계정을 선택합니다 (데모)
      </p>
    </div>
  )
}
