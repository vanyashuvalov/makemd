'use client'

/**
 * File: src/shared/ui/modal.tsx
 * Purpose: Shared overlay modal primitive for fullscreen blocking interactions.
 * Why it exists: the workspace needs a reusable dialog surface for auth, confirmations, and future settings flows.
 * What it does: portals a centered panel with a backdrop, escape-to-close behavior, and optional title/description text.
 * Connected to: auth modal flows, future destructive actions, and any workspace-level overlay interactions.
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import { cn } from '@/shared/lib/cn'
import { IconButton } from '@/shared/ui/icon-button'
import { Icon } from '@/shared/ui/icon'

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, title, description, onOpenChange, children, className }: ModalProps) {
  // Keep the modal mounted only when needed so the overlay stays accessible and the page behind it remains inert while auth is open.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-[32rem] rounded-[24px] border border-sidebar-border bg-[color:var(--color-sidebar-surface)] p-6 text-sidebar-foreground shadow-none',
          className
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-[24px] font-medium leading-[28px]">{title}</h2>
            {description ? <p className="text-sm leading-6 text-sidebar-muted-foreground">{description}</p> : null}
          </div>

          <IconButton
            aria-label="Close modal"
            size="icon"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            <Icon icon={IconX} size="md" />
          </IconButton>
        </div>

        {children}
      </div>
    </div>,
    document.body
  )
}
