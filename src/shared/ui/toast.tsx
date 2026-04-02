'use client'

/**
 * File: src/shared/ui/toast.tsx
 * Purpose: Shared transient notification surface for workspace actions and validation feedback.
 * Why it exists: the product needs a light-weight way to explain blocked actions or success states without interrupting the flow with modals.
 * What it does: renders a stack of dismissible toast cards in a fixed viewport and keeps the visual style aligned with the dark workspace theme.
 * Connected to: the workspace controller today and future validation, save, and export feedback flows.
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconX } from '@tabler/icons-react'
import type { TablerIcon } from '@tabler/icons-react'
import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui/icon'
import { IconButton } from '@/shared/ui/icon-button'

export type ToastTone = 'info' | 'success' | 'warning'

export type ToastItem = {
  id: string
  title: string
  description?: string
  tone?: ToastTone
}

export interface ToastStackProps {
  items: ToastItem[]
  onDismiss: (id: string) => void
  className?: string
}

function getToastToneIcon(tone: ToastTone): TablerIcon {
  if (tone === 'success') {
    return IconCircleCheck
  }

  if (tone === 'warning') {
    return IconAlertTriangle
  }

  return IconInfoCircle
}

// Render the transient notification stack in a fixed viewport so workspace feedback stays visible without blocking the editor or sidebar.
export function ToastStack({ items, onDismiss, className }: ToastStackProps) {
  if (typeof document === 'undefined' || items.length === 0) {
    return null
  }

  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions removals"
      className={cn('pointer-events-none fixed right-4 top-4 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-3', className)}
    >
      {items.map((item) => {
        const tone = item.tone ?? 'info'
        const ToneIcon = getToastToneIcon(tone)

        return (
          <article
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-[1.1rem] border px-4 py-3 shadow-none',
              tone === 'warning'
                ? 'border-[#5d4a24] bg-[#3a2f19] text-[#f7e2b7]'
                : tone === 'success'
                  ? 'border-[#2f5f43] bg-[#1e3127] text-[#d8f3df]'
                  : 'border-sidebar-border bg-[color:var(--color-sidebar-surface)] text-sidebar-foreground'
            )}
          >
            <div className="mt-0.5 shrink-0">
              <Icon icon={ToneIcon} size="sm" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-sm font-medium leading-tight">{item.title}</h3>
              {item.description ? (
                <p className="text-sm leading-snug text-current/75">{item.description}</p>
              ) : null}
            </div>

            <IconButton aria-label="Dismiss toast" size="icon" variant="ghost" onClick={() => onDismiss(item.id)}>
              <Icon icon={IconX} size="sm" />
            </IconButton>
          </article>
        )
      })}
    </div>,
    document.body
  )
}

