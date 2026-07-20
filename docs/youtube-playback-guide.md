# YouTube 검색 · 동시 재생 연동 가이드 (프론트엔드)

백엔드 `API.md`를 우리 Next.js 프론트엔드에 붙이기 위한 실행 가이드입니다.
**곡 검색**과 **동시 재생** 두 기능을 중심으로, 어떤 파일을 새로 만들고 기존 어떤 컴포넌트에
배선하는지까지 정리했습니다.

---

## 0. 먼저 이해할 구조 (제일 중요)

두 가지 오해를 먼저 없애야 합니다.

1. **검색은 우리가 YouTube API를 직접 호출하지 않습니다.**
   프론트는 팀의 백엔드(`http://localhost:4000`)의 `GET /api/search?q=`만 부릅니다.
   YouTube Data API 키·할당량·필터링(임베드 불가/라이브 제거)은 전부 서버가 처리합니다.
   → 프론트에 API 키를 두지 않습니다. `.env`에 넣을 것은 **백엔드 주소뿐**입니다.

2. **재생은 우리가 YouTube IFrame Player를 직접 띄웁니다.**
   단, "몇 초 지점"인지는 서버가 안 줍니다. 서버는 `track` + `startedAtServerMs`("이 곡을
   서버시각 X에 0초부터 시작")만 주고, **위치는 각 클라이언트가 서버 시계 기준으로 계산**합니다.
   이 방식이라 신규 입장자 싱크가 저절로 맞습니다. (`API.md` 6장)

```
[검색]  프론트 ──HTTP──▶ 백엔드 /api/search ──▶ YouTube Data API
[실시간] 프론트 ◀─Socket.IO─▶ 백엔드  (track:start, queue:update, members ...)
[재생]  프론트 ──직접──▶ YouTube IFrame Player (숨긴 1px iframe, 오디오만)
```

---

## 1. 준비물

### 의존성
```bash
pnpm add socket.io-client
pnpm add -D @types/youtube   # YT.* 타입 (선택)
```
YouTube IFrame API는 npm 패키지가 아니라 `<script src="https://www.youtube.com/iframe_api">`로
로드합니다 (아래 5단계).

### 환경변수 — `.env.local`
```bash
NEXT_PUBLIC_API_BASE=http://localhost:4000
```
`NEXT_PUBLIC_` 접두사가 있어야 클라이언트 번들에서 읽힙니다. (`.gitignore`에 `.env*.local` 이미 포함)

### 계약 타입
`API.md`가 말하는 `shared/types.ts`(서버와 동일 파일)를 받아 `lib/api-types.ts`로 복사해 두세요.
우리 기존 `lib/types.ts`의 UI 타입과는 별개로 둡니다. 최소한 이 형태가 필요합니다:

```ts
// lib/api-types.ts (서버 shared/types.ts를 복사)
export interface TrackInput { videoId: string }
export interface Track { videoId: string; title: string; artist: string; durationSec: number; thumbnail: string }
export interface NowPlaying { track: Track; startedAtServerMs: number }
export interface Member { nickname: string }
export interface SearchResult { videoId: string; title: string; artist: string; durationSec: number; thumbnail: string }
export interface JoinResult {
  ok: boolean
  reason?: 'not_found' | 'full'
  snapshot?: { room: unknown; current: NowPlaying | null; queue: Track[]; members: Member[] }
}
```

---

## 2. REST 클라이언트 — `lib/api.ts`

토큰을 붙이고 에러 메시지(한국어)를 그대로 던지는 얇은 래퍼입니다.

```ts
const BASE = process.env.NEXT_PUBLIC_API_BASE!

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tfm.token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `요청 실패 (${res.status})`) // error는 사용자 노출용 한국어
  }
  return res.json()
}

export const api = {
  users: () => req<{ id: string; username: string; nickname: string }[]>('/api/users'),
  login: (username: string) => req<{ token: string; user: unknown }>('/api/login', {
    method: 'POST', body: JSON.stringify({ username }),
  }),
  me: () => req('/api/me'),
  rooms: (q = '', tags = '') => req(`/api/rooms?q=${encodeURIComponent(q)}&tags=${tags}`),
  room: (id: string) => req(`/api/rooms/${id}`),
  createRoom: (body: unknown) => req('/api/rooms', { method: 'POST', body: JSON.stringify(body) }),
  search: (q: string) => req<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`),
  archive: (id: string) => req(`/api/archives/${id}`),
}
```

> 이게 곧 프론트/백 **계약 경계**입니다. 지금 우리 UI가 쓰는 `lib/mock-data.ts`의 함수들을
> 하나씩 이 `api.*`로 갈아끼우면 됩니다.

---

## 3. 음악 검색 기능

### 핵심 제약 — 할당량
검색 1회 = 100유닛, 하루 약 100회가 한계. **반드시 디바운스(500ms↑) 또는 검색 버튼**으로 호출.
입력마다 부르면 개발 중에 금방 막힙니다(`503`).

### 디바운스 훅 — `hooks/use-track-search.ts`
```ts
'use client'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import type { SearchResult } from '@/lib/api-types'

export function useTrackSearch(delay = 600) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!q.trim()) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setLoading(true); setError(null)
      try { setResults(await api.search(q)) }
      catch (e) { setError((e as Error).message) }   // 503 할당량 메시지 그대로 노출
      finally { setLoading(false) }
    }, delay)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [q, delay])

  return { q, setQ, results, loading, error }
}
```

### 배선 위치
- **`components/track-search.tsx`** — 이 훅으로 교체. 결과 클릭 시 상위로 `videoId` 전달.
- **`app/rooms/create/create-room-form.tsx`** — "첫 트랙 설정"에서 이 검색을 써서
  `firstTrack: { videoId }`로 방 생성(`api.createRoom`). 지금 데모 카드 자리에 검색 결과를 렌더.
- **방 화면 "+ 곡 추가"**(`components/queue-list.tsx`) — 검색 → 선택 → 소켓 `queue:add`(4단계).

> 결과 아이템의 썸네일/제목/아티스트/`durationSec`를 그대로 보여주면 됩니다.
> 우리 `Vinyl` 대신 `thumbnail`을 쓰거나, 목업 감성 유지하려면 썸네일을 vinyl 뒤 배경으로 써도 됩니다.

---

## 4. Socket.IO 클라이언트 — `lib/socket.ts`

방 화면에서만 연결합니다. 토큰은 **연결 시 한 번만** 넣습니다(이후 닉네임은 서버가 채움).

```ts
'use client'
import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket
  const token = localStorage.getItem('tfm.token')
  socket = io(process.env.NEXT_PUBLIC_API_BASE!, { auth: { token }, autoConnect: true })
  return socket
}
export function disconnectSocket() { socket?.disconnect(); socket = null }
```

이벤트 요약(`API.md` 4장): 보내기 `room:join`/`queue:add`/`reaction:send`/`time:ping`,
받기 `track:start`/`queue:update`/`members:update`/`reaction:broadcast`/`room:closed`/`time:pong`.

---

## 5. 재생 기능 (동시 재생) — 여기가 제일 어렵습니다

`API.md` 6장이 원본입니다. 프론트에서 만들 것은 **훅 2개**입니다.

### 5-1. 서버 시계 오프셋 — `hooks/use-clock-offset.ts`
`Date.now()`는 기기마다 다릅니다. 입장 직후 1회 + 30초마다 측정.

```ts
async function measureOffset(socket: Socket): Promise<number> {
  const samples: { rtt: number; offset: number }[] = []
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now()
    const pong = await new Promise<{ t0: number; tServer: number }>((res) => {
      socket.once('time:pong', res); socket.emit('time:ping', { t0 })
    })
    const t1 = Date.now()
    samples.push({ rtt: t1 - pong.t0, offset: pong.tServer + (t1 - pong.t0) / 2 - t1 })
  }
  return samples.sort((a, b) => a.rtt - b.rtt)[0].offset  // 평균 X, 가장 빠른 샘플
}
// serverNow = () => Date.now() + offset
```

### 5-2. YouTube IFrame 플레이어 — `hooks/use-youtube-player.ts`
iframe은 1px로 숨기고 오디오만. 화면은 우리 `NowPlayingCard`로 그립니다.

구현 요점(순서대로):
1. `https://www.youtube.com/iframe_api` 스크립트를 1회 주입, `window.onYouTubeIframeAPIReady`에서 `new YT.Player('yt-player', { height:'1', width:'1', playerVars:{ autoplay:0, controls:0, disablekb:1, playsinline:1 } })`.
2. **동기화** `syncTo(current)`:
   ```ts
   const positionSec = (serverNow() - current.startedAtServerMs) / 1000
   player.loadVideoById({ videoId: current.track.videoId, startSeconds: positionSec })
   ```
   `track:start` 수신 시 + 입장 스냅샷의 `current`가 있을 때 호출 → 신규 입장자 자동 싱크.
3. **드리프트 보정** 2초마다: `expected = (serverNow()-startedAtServerMs)/1000`, `actual = getCurrentTime()`, `|차| > 1.0`이면 `seekTo(expected, true)`.
   (`setPlaybackRate`는 0.25 단위라 미세보정 불가 → 하드 seek이 정답)
4. **백그라운드 탭**: `visibilitychange`에서 `!hidden`이면 즉시 1회 보정.
5. **`ENDED` 무시.** 곡 전환은 항상 서버 `track:start`가 판정.

### 5-3. 자동재생 제스처 ⚠️ (UX에 반드시 포함)
브라우저는 사용자 클릭 없는 소리 재생을 차단합니다. 우회 불가.
→ 방 입장 시 **"탭해서 참여하기" 전체화면 버튼**을 띄우고, 그 **클릭 핸들러 안에서 첫 `playVideo()`**
를 호출하세요. 그 뒤부터 프로그래밍 제어 허용.

> 우리 방 화면(`room-client.tsx`)에 이 오버레이를 추가하는 게 재생 기능의 첫 진입점입니다.

---

## 6. 방 화면 배선 순서 (`app/rooms/[id]/room-client.tsx`)

지금은 목업 상태(`useState(room.queue)`)입니다. 아래로 교체합니다.

```
입장 시:
  socket = getSocket()
  offset ← measureOffset(socket)                 // 5-1, 이후 30초마다
  socket.emit('room:join', { roomId }, (result) => {
    if (!result.ok) → 'full'|'not_found' 처리
    const { current, queue, members } = result.snapshot
    setQueue(queue); setMembers(members)
    if (current) player.syncTo(current)           // 이미 재생 중인 방이면 그 위치부터
  })

구독:
  track:start        → current 갱신 + player.syncTo | null이면 stopVideo + "다음 곡 추가" 표시
  queue:update       → setQueue  (QueueList가 그림)
  members:update     → setMembers (Minimi 참여자 렌더)
  reaction:broadcast → ReactionBar 플로팅 트리거 (본인 것도 브로드캐스트로만! 낙관 렌더 금지)
  room:closed        → /rooms/[id]/summary 로 이동

액션:
  "+ 곡 추가" 선택   → socket.emit('queue:add', { videoId }, ack) / !ack.ok면 reason 토스트
  이모지 버튼        → socket.emit('reaction:send', { emoji })  (250ms 제한)
  방 나가기          → socket.emit('room:leave') 또는 disconnect
```

- `NowPlayingCard`는 이제 로컬 타이머 대신 `serverNow()-startedAtServerMs`로 진행바를 그립니다.
- `ReactionBar`의 플로팅은 **서버 `reaction:broadcast`를 받았을 때만** 띄웁니다(중복 방지).
- 곡 종료 진행바는 `durationSec`으로 100% 판정하되, 곡 전환은 서버 이벤트로만.

---

## 7. 나머지 화면 연결

| 화면 | 교체 |
| --- | --- |
| 로그인(신규) | `api.users()` 드롭다운 → `api.login()` → `localStorage['tfm.token']` 저장 |
| 홈 | `getRooms()` → `api.rooms(q, tags)` |
| 방 만들기 | 검색(3장) → `api.createRoom({ title, tags, maxMembers, isPublic, firstTrack:{ videoId } })` |
| 방 | 6장 전체 |
| 요약 | `getRoomSummary()` → `api.archive(id)` |

> 로그인 화면이 아직 없습니다. `API.md`의 시드 계정(yewon/minjun/...) 드롭다운으로 간단히 만들면 됩니다.

---

## 8. 검증 체크리스트 (`API.md` 6장 "검증 방법")

창 2개로 같은 방 입장 후, 화면 구석에 `offset / expected / actual / diff`를 찍어 **숫자로** 확인:

- [ ] 두 창의 `actual`이 항상 1초 이내
- [ ] 재생 중 3번째 창 입장 → 0초가 아니라 **현재 위치부터**
- [ ] 곡 종료 시 두 창이 동시에 다음 곡으로 전환
- [ ] 한 창 백그라운드 → 복귀 시 즉시 재보정
- [ ] 검색은 디바운스로만 호출(할당량 503 안 나게)
- [ ] 입장 오버레이 클릭 전에는 소리 재생 시도 안 함(자동재생 차단 회피)

---

## 9. 흔한 함정

- 프론트에 YouTube 키를 넣지 말 것 — 검색은 백엔드가 함.
- `ENDED`/`onStateChange`로 다음 곡 넘기지 말 것 — 서버가 판정.
- 서버 재시작하면 진행 중인 방이 사라짐(메모리) — 개발 중 정상.
- 지역 차단 영상 대비 플레이어 `onError`도 처리.
- 리액션은 브로드캐스트만 보고 그릴 것(낙관 렌더 시 2번 보임).
```
