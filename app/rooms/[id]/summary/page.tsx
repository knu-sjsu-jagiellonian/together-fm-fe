import { notFound } from 'next/navigation'
import { getRoomSummary } from '@/lib/mock-data'
import { TagPill } from '@/components/tag-pill'
import { Vinyl } from '@/components/vinyl'
import { Minimi } from '@/components/minimi'
import { SummaryActions } from '@/components/summary-actions'

interface SummaryPageProps {
  params: Promise<{ id: string }>
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id } = await params
  const data = await getRoomSummary(id)
  if (!data) notFound()

  const { room, participants, tracks, durationMin } = data

  // No reaction tally in the mock data layer yet — derive a stable stand-in.
  const reactionCount = tracks.length * 13 + participants.length
  const hours = Math.floor(durationMin / 60)
  const mins = durationMin % 60
  const durationLabel = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`

  const visibleParticipants = participants.slice(0, 7)
  const extra = participants.length - visibleParticipants.length
  const meId = participants[participants.length - 1]?.id

  return (
    <main className="flex min-h-full flex-1 flex-col px-6 pb-8 pt-10">
      {/* header */}
      <div className="flex flex-col items-center text-center">
        <Vinyl size={52} hub="#b8a0e8" holoRing />
        <p className="mt-3 text-[12px] font-semibold text-muted-foreground">방이 종료되었어요</p>
        <h1 className="mt-1 text-[18px] font-extrabold text-foreground">{room.title}</h1>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          <TagPill label={room.mood_tag} />
          <TagPill label={room.situation_tag} />
        </div>
        <p className="mt-3 text-[11.5px] font-medium text-muted-foreground">
          {durationLabel} 동안 함께 들었어요
        </p>
      </div>

      {/* stats */}
      <div className="mt-6 grid grid-cols-3 divide-x divide-secondary rounded-[18px] border-2 border-border bg-white py-4">
        <Stat value={`${participants.length}명`} label="참여 인원" />
        <Stat value={`${tracks.length}곡`} label="재생된 곡" />
        <Stat value={`${reactionCount}`} label="이모지 반응" />
      </div>

      {/* playlist recap */}
      <h2 className="mb-2.5 mt-6 text-[14.5px] font-extrabold text-foreground">플레이리스트</h2>
      <ol className="flex flex-col rounded-[16px] border-2 border-border bg-white px-4 py-2" role="list">
        {tracks.slice(0, 5).map((track, idx) => (
          <li key={track.id} className="flex items-center gap-3 py-2">
            <span className="w-4 text-[12px] font-extrabold text-primary">{idx + 1}</span>
            <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-foreground">
              {track.title} — {track.artist}
            </p>
            <span className="flex-shrink-0 text-[11px] font-semibold text-muted-foreground">
              @{track.added_by}
            </span>
          </li>
        ))}
        {tracks.length > 5 && (
          <li className="py-2 text-center text-[11px] font-bold text-muted-foreground">
            외 {tracks.length - 5}곡 더보기 ⌄
          </li>
        )}
      </ol>

      {/* participants */}
      <h2 className="mb-2.5 mt-6 text-[14.5px] font-extrabold text-foreground">함께한 사람</h2>
      <div className="flex items-center gap-2">
        <ul className="flex flex-wrap gap-2" role="list">
          {visibleParticipants.map((p) => (
            <li key={p.id}>
              <Minimi seed={p.id} clothes={p.avatar_color} isMe={p.id === meId} size={38} name={p.name} />
            </li>
          ))}
        </ul>
        {extra > 0 && (
          <span className="text-[10.5px] font-bold text-muted-foreground">+{extra}</span>
        )}
      </div>

      {/* actions */}
      <SummaryActions videoIds={tracks.map((t) => t.video_id).filter((v): v is string => Boolean(v))} />
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[19px] font-extrabold text-foreground">{value}</span>
      <span className="text-[10.5px] font-semibold text-muted-foreground">{label}</span>
    </div>
  )
}
