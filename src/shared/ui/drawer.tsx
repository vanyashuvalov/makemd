'use client'

/**
 * File: src/shared/ui/drawer.tsx
 * Purpose: Shared slide-over drawer primitive for mobile workspace navigation.
 * Why it exists: the mobile shell needs an off-canvas surface that behaves like a sidebar while keeping the main document canvas visible behind it.
 * What it does: portals a side-anchored panel with a backdrop, escape-to-close behavior, and body scroll locking.
 * Connected to: the mobile workspace shell, the sidebar widget, and future drawer-style overlays.
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ariaLabel: string
  side?: 'left' | 'right'
  className?: string
  children: React.ReactNode
}

// Render a side-anchored overlay panel so mobile navigation can reuse the existing sidebar without forcing a modal-style layout.
export function Drawer({
  open,
  onOpenChange,
  ariaLabel,
  side = 'left',
  className,
  children,
}: DrawerProps) {
  // Keep the drawer mounted only while it is visible so body scrolling is locked during off-canvas navigation.
  React.useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onOpenChange, open])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/75"
      role="presentation"
      onMouseDown={() => onOpenChange(false)}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          'absolute top-0 h-full w-[min(88vw,24rem)] p-3',
          side === 'left' ? 'left-0' : 'right-0',
          className
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </aside>
    </div>,
    document.body
  )
}

