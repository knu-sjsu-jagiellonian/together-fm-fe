import { cn } from '@/lib/utils'

// Pixel-doll template (6 cols × 12 rows), mirroring the mock's minimi shape.
// H=hair  S=skin  E=eye  B=blush  C=clothes  L=legs  F=shoes  .=empty
const GRID = [
  '.HHHH.',
  'HHHHHH',
  'HSSSSH',
  'HSEESH',
  '.BSSB.',
  '..SS..',
  '..SS..',
  '.CCCC.',
  '.CCCC.',
  '.CCCC.',
  '.LLLL.',
  '.FFFF.',
]

const SKIN = '#ffdcb8'
const EYE = '#4a3728'
const BLUSH = '#ffb3a0'
const LEGS = '#4a3728'
const SHOES = '#2f2418'

// Deterministic hair/clothes variants (mock uses coral/brown hair + pastel clothes).
const HAIR = ['#ff7a63', '#5c4433']
const CLOTHES = ['#e0c2ff', '#a0c8e8', '#e8a8c0']

function pick<T>(arr: T[], seed: string, salt: number) {
  let sum = salt
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
  return arr[sum % arr.length]
}

interface MinimiProps {
  /** Seed for deterministic hair/clothes (e.g. participant id or name). */
  seed?: string
  /** Explicit clothes color override (e.g. participant.avatar_color). */
  clothes?: string
  /** Card size in px. */
  size?: number
  /** Highlight as "me" with a thick purple border. */
  isMe?: boolean
  /** Nickname — shown as a tooltip on hover. */
  name?: string
  className?: string
}

/** Pixel-art minimi avatar in a white rounded card (mock design). */
export function Minimi({ seed = 'x', clothes, size = 38, isMe = false, name, className }: MinimiProps) {
  const hair = pick(HAIR, seed, 1)
  const cloth = clothes ?? pick(CLOTHES, seed, 7)
  const colorFor: Record<string, string> = {
    H: hair, S: SKIN, E: EYE, B: BLUSH, C: cloth, L: LEGS, F: SHOES,
  }

  return (
    <span className={cn('group relative inline-block', className)}>
      <span
        className={cn(
          'inline-grid place-items-center rounded-[10px] border-2 bg-white',
          isMe ? 'border-primary' : 'border-border',
        )}
        style={{ width: size, height: size * 1.6, borderWidth: isMe ? 3 : 2 }}
        title={name}
        aria-label={name}
        role={name ? 'img' : undefined}
      >
        <svg viewBox="0 0 36 72" width={size * 0.82} height={size * 1.32}>
          {GRID.flatMap((row, r) =>
            row.split('').map((ch, c) =>
              ch === '.' ? null : (
                <rect key={`${r}-${c}`} x={c * 6} y={r * 6} width={6} height={6} fill={colorFor[ch]} />
              ),
            ),
          )}
        </svg>
      </span>

      {/* hover nickname tooltip */}
      {name && (
        <span className="pointer-events-none absolute -top-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
          {name}
        </span>
      )}
    </span>
  )
}
