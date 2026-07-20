import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Download, RotateCcw, Music2 } from 'lucide-react'
import { getRoomSummary } from '@/lib/mock-data'
import { AppHeader } from '@/components/app-header'
import { TagPill } from '@/components/tag-pill'

interface SummaryPageProps {
  params: Promise<{ id: string }>
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id } = await params
  const data = await getRoomSummary(id)
  if (!data) notFound()

  const { room, participants, tracks, durationMin } = data

  return (
    <main className="min-h-screen sparkle-bg">
      <AppHeader back={{ href: '/rooms', label: '방 목록으로' }} />

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Hero summary card */}
        <section className="glass-card chrome-frame rounded-2xl p-6 glow-pink text-center">
          {/* Confetti-like sparkle decoration */}
          <div className="flex justify-center gap-1.5 mb-4" aria-hidden="true">
            {['✦', '✦', '✦'].map((s, i) => (
              <span key={i} className="text-primary text-sm opacity-70" style={{ animationDelay: `${i * 0.2}s` }}>
                {s}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1 text-balance">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {durationMin}분
            </span>{' '}
            동안
          </h1>
          <p className="text-lg font-bold text-foreground mb-4 text-balance">
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {tracks.length}곡
            </span>
            을 함께 들었어요
          </p>

          <p className="text-sm text-muted-foreground mb-4 text-balance">
            {room.title}
          </p>

          <div className="flex justify-center gap-2 flex-wrap">
            <TagPill label={room.genre_tag} />
            <TagPill label={room.mood_tag} />
            <TagPill label={room.situation_tag} />
          </div>
        </section>

        {/* Participants */}
        <section className="glass-card rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            함께한 사람 ({participants.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: `${p.avatar_color}18`,
                  borderColor: `${p.avatar_color}44`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: p.avatar_color }}
                >
                  {p.name.slice(0, 1)}
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: p.avatar_color }}
                >
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Full playlist */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground">
              전체 플레이리스트
            </h2>
            <span className="text-xs text-muted-foreground">{tracks.length}곡</span>
          </div>
          <ul className="divide-y divide-border" role="list">
            {tracks.map((track, idx) => (
              <li
                key={track.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-5 text-center text-xs font-mono text-muted-foreground flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artist}
                  </p>
                </div>
                <span className="text-xs text-primary/70 flex-shrink-0 font-medium">
                  by {track.added_by}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all glow-pink hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <Download className="w-4 h-4" />
            플레이리스트 저장
          </button>
          <Link
            href="/rooms"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <RotateCcw className="w-4 h-4" />
            다른 방 찾기
          </Link>
        </div>
      </div>
    </main>
  )
}
