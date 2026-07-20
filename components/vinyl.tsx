import { cn } from '@/lib/utils'

interface VinylProps {
  /** Diameter in px. */
  size?: number
  /** Center hub color (per-card accent). */
  hub?: string
  /** Holographic gradient ring instead of a solid stroke. */
  holoRing?: boolean
  /** Slowly spin (for the now-playing state). */
  spinning?: boolean
  className?: string
}

/**
 * The vinyl-record motif that anchors the whole design system
 * (room cards, now-playing, room profile, recap header).
 */
export function Vinyl({
  size = 86,
  hub = '#b8a0e8',
  holoRing = false,
  spinning = false,
  className,
}: VinylProps) {
  const groove = size * 0.7
  const hubR = size * 0.23
  const pin = size * 0.07

  return (
    <span
      className={cn(
        'relative inline-grid place-items-center rounded-full',
        holoRing ? 'bg-holo p-[3px]' : 'p-0',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className={cn(
          'relative grid place-items-center rounded-full',
          spinning && 'motion-safe:animate-[spin_6s_linear_infinite]',
        )}
        style={{
          width: holoRing ? size - 6 : size,
          height: holoRing ? size - 6 : size,
          background: 'var(--vinyl, #2c2a35)',
          boxShadow: holoRing ? 'none' : `0 0 0 2px ${hub}`,
        }}
      >
        {/* groove ring */}
        <span
          className="absolute rounded-full"
          style={{
            width: groove,
            height: groove,
            border: '1px solid var(--vinyl-groove, #4a4756)',
          }}
        />
        {/* colored hub */}
        <span
          className="grid place-items-center rounded-full"
          style={{ width: hubR * 2, height: hubR * 2, background: hub }}
        >
          <span
            className="rounded-full"
            style={{ width: pin, height: pin, background: 'var(--vinyl, #2c2a35)' }}
          />
        </span>
      </span>
    </span>
  )
}
