'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Trophy, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/rooms', label: '홈', icon: Home, match: (p: string) => p === '/rooms' },
  { href: '/rooms?focus=search', label: '검색', icon: Search, match: (p: string) => false },
] as const

const rightItems = [
  { href: '/ranking', label: '랭킹', icon: Trophy },
  { href: '/profile', label: '프로필', icon: User },
] as const

/**
 * Fixed bottom tab bar with a raised holographic "+" (create room) FAB,
 * matching the home mock. Sits inside the centered phone shell.
 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="sticky bottom-0 z-40 border-t-2 border-border bg-white"
      aria-label="주요 메뉴"
    >
      <div className="relative mx-auto flex h-20 max-w-[440px] items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <NavLink key={label} href={href} label={label} active={active}>
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
            </NavLink>
          )
        })}

        {/* Center FAB — create room */}
        <Link
          href="/rooms/create"
          className="relative -mt-8 grid h-[54px] w-[54px] place-items-center rounded-full bg-holo shadow-[0_6px_18px_rgba(160,116,214,0.4)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="방 만들기"
        >
          <Plus className="h-6 w-6 text-[#2c2a35]" strokeWidth={2.6} />
        </Link>

        {rightItems.map(({ href, label, icon: Icon }) => (
          <NavLink key={label} href={href} label={label} active={false}>
            <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function NavLink({
  href,
  label,
  active,
  children,
}: {
  href: string
  label: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex w-14 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}
      <span>{label}</span>
    </Link>
  )
}
