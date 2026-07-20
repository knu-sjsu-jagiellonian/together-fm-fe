# 협업 가이드 (2인 개발)

Together FM을 두 명이 나눠서 개발하기 위한 역할 분담과 Git 워크플로우입니다.

## 1. 역할 분담

기능이 라우트/컴포넌트 단위로 잘 나뉘어 있어, **세로 단위(vertical slice)** 로 나눕니다.
각자 자기 영역의 페이지·컴포넌트를 온전히 담당하므로 파일 충돌이 거의 없습니다.

### 👤 Dev A — 탐색 & 생성 (Discovery / Create)

사용자가 방을 **찾고 만드는** 흐름을 담당합니다.

| 종류 | 파일 |
| --- | --- |
| 랜딩 | `app/page.tsx` |
| 방 목록 · 필터 | `app/rooms/page.tsx`, `app/rooms/rooms-client.tsx` |
| 방 생성 | `app/rooms/create/page.tsx`, `app/rooms/create/create-room-form.tsx` |
| 컴포넌트 | `components/room-card.tsx`, `components/tag-pill.tsx`, `components/track-search.tsx` |
| 데이터 함수 | `getRooms()`, `searchTracks()` (in `lib/mock-data.ts`) |

### 👤 Dev B — 라이브 룸 & 리캡 (Live Room / Recap)

방에 들어가서 **함께 듣고 끝난 뒤 되돌아보는** 흐름을 담당합니다.

| 종류 | 파일 |
| --- | --- |
| 실시간 방 | `app/rooms/[id]/page.tsx`, `app/rooms/[id]/room-client.tsx` |
| 세션 리캡 | `app/rooms/[id]/summary/page.tsx` |
| 컴포넌트 | `components/now-playing-card.tsx`, `components/queue-list.tsx`, `components/reaction-bar.tsx`, `components/avatar-stack.tsx` |
| 데이터 함수 | `getRoomById()`, `getRoomSummary()` (in `lib/mock-data.ts`) |

### 🤝 공용 파일 (변경 시 먼저 상의)

아래는 **계약(contract)** 이라 한쪽이 마음대로 바꾸면 상대가 깨집니다. 변경 전 서로 합의하고, PR에서 반드시 상대 리뷰를 받으세요.

| 파일 | 성격 |
| --- | --- |
| `lib/types.ts` | 모든 타입·태그의 단일 소스. 인터페이스 변경은 양쪽에 영향 |
| `lib/mock-data.ts` | 데이터 계층. **함수 시그니처는 계약** — 각자 자기 함수만 수정 |
| `components/app-header.tsx`, `components/ui/button.tsx` | 공용 UI |
| `app/layout.tsx`, `app/globals.css`, `lib/utils.ts` | 전역 레이아웃·스타일·유틸 |

> 파일 소유권은 `.github/CODEOWNERS`에도 정리되어 있습니다. (사용자명만 채우면 GitHub이 리뷰어를 자동 지정)

### 데이터 계층이 곧 인터페이스

`lib/mock-data.ts`의 네 함수는 이미 `async`로 격리돼 있습니다. 각 함수의 **시그니처와 반환 타입을 고정**해두면, 나중에 한 명이 이 함수들을 Supabase 같은 실제 백엔드로 하나씩 교체해도 UI 코드는 그대로 동작합니다. 백엔드 작업을 별도로 나누고 싶어지면 이 경계가 그대로 분업선이 됩니다.

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

영역 접두사로 누구 작업인지 구분: `rooms-`, `create-`, `search-` → Dev A / `live-`, `recap-`, `queue-` → Dev B

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
