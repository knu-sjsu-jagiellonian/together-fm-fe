import Link from 'next/link'
import { Radio } from 'lucide-react'

interface AppHeaderProps {
  back?: { href: string; label: string }
  title?: string
}

export function AppHeader({ back, title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[440px] items-center gap-2 px-5">
        {back ? (
          <Link
            href={back.href}
            className="flex items-center gap-1 rounded-lg px-1 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label={back.label}
          >
            <span className="text-xl leading-none">←</span>
          </Link>
        ) : (
          <Link href="/rooms" className="group flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60" aria-label="Together FM 홈으로">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
              <Radio className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-foreground">
              Together FM
            </span>
          </Link>
        )}

        {title && (
          <h1 className="flex-1 truncate text-[16px] font-extrabold text-foreground">
            {title}
          </h1>
        )}
      </div>
    </header>
  )
}
