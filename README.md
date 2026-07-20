# Together FM 🎧

**A social radio web app where everyone in the room fills the playlist together.**

Create or join a "radio room", queue up tracks as a group, watch what's playing in
real time, and drop emoji reactions. When the session ends, you get a shareable recap
of everything you listened to together.

> Built for a global, multi-genre audience — pop, indie, hip-hop, R&B, lo-fi, and more.

## Features

- **Browse & filter rooms** by genre, mood, and situation tags
- **Create a room** with a genre / mood / situation and a first track
- **Shared queue** — add or remove upcoming tracks
- **Now Playing** card with a duration-accurate progress bar
- **Emoji reactions** that float up over the player
- **Session recap** — total minutes, track count, participants, and full playlist

## Tag system

Rooms are described across three dimensions (see `lib/types.ts`):

| Dimension | Options |
|-----------|---------|
| **Genre** | 팝 · 인디 · 힙합 · R&B · 록 · 일렉트로닉 · 재즈 · K-팝 · 로파이 · 라틴 |
| **Mood** | 잔잔한 · 신나는 · 집중 · 파티 · 감성적인 · 몽환적인 · 청량한 · 나른한 |
| **Situation** | 공부 · 운동 · 여행 · 일상 · 드라이브 · 카페 · 취침 · 출근 |

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + React 19
- TypeScript
- Tailwind CSS v4 with an oklch-based neon design system
- [lucide-react](https://lucide.dev/) icons

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Other scripts:

```bash
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # eslint (next/core-web-vitals + next/typescript)
```

## Project structure

```
app/                 App Router pages
  rooms/             Room list, detail, create, and recap
components/          UI components (room card, queue, reactions, ...)
lib/
  types.ts           Core types + tag definitions (single source of truth)
  mock-data.ts       Mock data layer — swap for a real backend
```

## Data layer / next steps

All data currently comes from `lib/mock-data.ts`. Each fetch function
(`getRooms`, `getRoomById`, `getRoomSummary`, `searchTracks`) is isolated so it can
be replaced one at a time with a real backend (e.g. Supabase) plus realtime sync for
truly shared queues and reactions.
