import Link from 'next/link'
import { Radio } from 'lucide-react'

interface AppHeaderProps {
  back?: { href: string; label: string }
  title?: string
}

export function AppHeader({ back, title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-card border-b border-glass-border backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        {back ? (
          <Link
            href={back.href}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg px-1"
            aria-label={back.label}
          >
            <span className="text-lg leading-none">←</span>
            <span>{back.label}</span>
          </Link>
        ) : (
          <Link href="/rooms" className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg" aria-label="Together FM 홈으로">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center glow-pink flex-shrink-0">
              <Radio className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Together FM
            </span>
          </Link>
        )}

        {title && (
          <h1 className="flex-1 text-center font-bold text-sm text-foreground truncate pr-8 text-balance">
            {title}
          </h1>
        )}
      </div>
    </header>
  )
}
