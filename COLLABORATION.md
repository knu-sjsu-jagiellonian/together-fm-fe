# 협업 가이드 (2인 개발)

Together FM을 두 명이 나눠서 개발하기 위한 역할 분담과 Git 워크플로우입니다.

## 1. 역할 분담

**레이어(프론트엔드 / 백엔드·실시간)** 로 나눕니다. 지금 추가할 가장 큰 덩어리가 백엔드+실시간이라 화면별 분리보다 이쪽이 자연스럽습니다.

핵심은 이미 존재하는 **이음새**입니다: `lib/mock-data.ts`의 네 async 함수. A는 계속 이 함수(목업)를 호출하며 UI를 만들고, B는 **같은 시그니처 뒤의 구현만** Supabase로 교체합니다. 서로 안 막힙니다.

### 👤 Dev A — 프론트엔드

화면과 상호작용 전부. 데이터는 목업 함수(→ 나중에 B의 실제 구현)를 호출만 합니다.

| 종류 | 파일 |
| --- | --- |
| 방 목록 · 필터 | `app/rooms/page.tsx`, `app/rooms/rooms-client.tsx`, `components/room-card.tsx`, `components/tag-pill.tsx` |
| 방 만들기 | `app/rooms/create/*`, `components/track-search.tsx` |
| 방 내부 UI | `app/rooms/[id]/page.tsx`, `app/rooms/[id]/room-client.tsx`, `components/now-playing-card.tsx`, `components/queue-list.tsx`, `components/avatar-stack.tsx` |
| YouTube 재생 UI | **(신규)** `components/youtube-player.tsx` — IFrame Player API 연동 |
| 이모지 리액션 애니메이션 | `components/reaction-bar.tsx` |
| 방 종료 요약 | `app/rooms/[id]/summary/page.tsx` |
| 공용 UI | `components/app-header.tsx`, `components/ui/*`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx` |

### 👤 Dev B — 백엔드 · 실시간

데이터·상태·동기화 전부. UI는 건드리지 않고 **함수 시그니처 계약**만 지킵니다.

| 종류 | 파일 |
| --- | --- |
| Supabase 스키마·마이그레이션 | **(신규)** `supabase/migrations/*` — Room / Track / Participant / Reaction 테이블 |
| DB 클라이언트·쿼리 | **(신규)** `lib/supabase/*` |
| 실시간 동기화 | **(신규)** `lib/realtime.ts` — Supabase Realtime(권장) 또는 Socket.io |
| 재생 위치 서버 상태 | **(신규)** `app/api/rooms/[id]/playback/route.ts` 등 |
| API 라우트 | **(신규)** `app/api/**` — 방 생성/입장/종료, 곡 추가, 참여자 관리 |
| 데이터 계층 구현 | `lib/mock-data.ts` → 실제 구현으로 교체 (시그니처 유지) |

### 🤝 공용 파일 (변경 시 먼저 상의 · 양쪽 리뷰 필수)

아래는 **계약(contract)** 이라 한쪽이 마음대로 바꾸면 상대가 깨집니다.

| 파일 | 성격 |
| --- | --- |
| `lib/types.ts` | 모든 타입·태그의 단일 소스. **여기에 실시간 이벤트 페이로드 타입도 정의** |
| `lib/mock-data.ts`의 함수 시그니처 | 데이터 접근 계약. A가 호출 / B가 구현 |
| `lib/utils.ts` | 공용 유틸 |

### 두 개의 계약을 먼저 못 박기

프론트/백 분리에서 유일하게 서로 막히는 지점은 인터페이스입니다. **작업 시작 전 둘이 같이** 아래를 `lib/types.ts`에 정의하세요.

1. **데이터 접근 함수 시그니처** — `getRooms()`, `getRoomById()`, `getRoomSummary()`, `searchTracks()` + 앞으로 필요한 변이(mutation): 방 생성/입장/종료, 곡 추가/삭제 등. A는 이 시그니처만 보고 UI를 짜고, B는 이 시그니처를 구현.
2. **실시간 이벤트 페이로드** — 리액션 broadcast, 재생 위치 sync, 큐 변경 이벤트의 모양. 리액션 애니메이션(A)과 broadcast(B)가 여기서 만납니다. 예:
   ```ts
   // lib/types.ts (예시 — 둘이 합의해서 확정)
   export interface PlaybackState { track_id: string; position_sec: number; is_playing: boolean; updated_at: string }
   export interface ReactionEvent { participant_id: string; emoji: string; at: string }
   export type RealtimeEvent =
     | { type: 'playback'; payload: PlaybackState }
     | { type: 'reaction'; payload: ReactionEvent }
     | { type: 'queue'; payload: Track[] }
   ```

> B가 API/스키마를 완성하기 전이라도 A는 목업으로 UI를 끝까지 만들 수 있습니다. 계약만 고정돼 있으면 나중에 배선(wiring)만 바꾸면 됩니다.

---

## 2. Git 워크플로우

가볍게 **feature branch + Pull Request** 방식을 씁니다.

### 브랜치 규칙

- `main` — 항상 배포 가능한 상태. **직접 커밋 금지**, PR로만 병합.
- 작업은 항상 새 브랜치에서:

```
feat/<영역>-<간단설명>     예) feat/rooms-filter, feat/live-reactions
fix/<영역>-<간단설명>      예) fix/queue-duplicate
```

영역 접두사로 누구 작업인지 구분: `fe-` (프론트, Dev A) / `be-` (백엔드·실시간, Dev B)
예) `feat/fe-youtube-player`, `feat/be-supabase-schema`, `feat/be-realtime-reactions`

### 하루 흐름

```bash
# 1. 최신 main 받기
git switch main
git pull

# 2. 작업 브랜치 만들기
git switch -c feat/rooms-filter

# 3. 작업 → 작은 단위로 자주 커밋
git add -p
git commit -m "feat(rooms): 무드 태그 다중 필터 추가"

# 4. 올리고 PR 만들기
git push -u origin feat/rooms-filter
# GitHub에서 PR 생성 → 상대에게 리뷰 요청

# 5. 리뷰 승인 후 Squash merge → 브랜치 삭제
```

### 규칙 (충돌·사고 방지)

1. **PR은 작게.** 한 PR = 한 기능/수정. 리뷰가 빨라지고 충돌이 준다.
2. **매일 아침 `main`을 pull.** 오래된 브랜치는 충돌의 원인.
3. **공용 파일(위 표)을 건드리면 PR 설명에 명시**하고 상대 리뷰 필수.
4. **자기 영역 밖 파일은 건드리지 않기.** 필요하면 상대에게 요청하거나 페어링.
5. **main 병합 전 로컬에서 `pnpm build && pnpm lint` 통과 확인.**
6. 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 권장: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`.

### 충돌이 났을 때

대부분 `lib/mock-data.ts`(공용)에서만 발생합니다. 각자 자기 함수 블록만 수정했다면 충돌 구간이 분리돼 있어 수동 병합이 쉽습니다.

```bash
git switch feat/my-branch
git fetch origin
git rebase origin/main      # 또는 git merge origin/main
# 충돌 해결 후
git add <해결한 파일>
git rebase --continue
```

---

## 3. 시작하기

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # 병합 전 확인
pnpm lint
```
