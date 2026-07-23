'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastKind = 'info' | 'success' | 'error'
interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

type ToastFn = (message: string, kind?: ToastKind) => void
const ToastCtx = createContext<ToastFn | null>(null)

/** Push a transient toast. Safe no-op if used outside the provider. */
export function useToast(): ToastFn {
  return useContext(ToastCtx) ?? (() => {})
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const toast = useCallback<ToastFn>((message, kind = 'info') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] mx-auto flex max-w-[440px] flex-col items-center gap-2 px-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'motion-safe:animate-[float-up_0.25s_ease-out] pointer-events-auto rounded-full border-2 px-4 py-2 text-[13px] font-bold shadow-[0_8px_22px_rgba(80,60,120,0.18)]',
              t.kind === 'success' && 'border-primary/30 bg-white text-primary',
              t.kind === 'error' && 'border-destructive/40 bg-white text-destructive',
              t.kind === 'info' && 'border-border bg-white text-foreground',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
