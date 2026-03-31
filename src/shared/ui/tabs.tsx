'use client'

/**
 * File: src/shared/ui/tabs.tsx
 * Purpose: Shared tab selector for both the sidebar and the mobile editor/preview toggle.
 * Why it exists: the Figma mockups repeat icon tabs and segmented controls in multiple places.
 * What it does: renders a controlled or visually-static set of pill tabs with icon and label support.
 * Connected to: sidebar navigation, the mobile editor viewport switch, and future mode toggles.
 */
import * as React from 'react'
import { cn } from '@/shared/lib/cn'

export type TabItem = {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface TabsProps {
  ariaLabel: string
  items: TabItem[]
  value: string
  onValueChange?: (value: string) => void
  compact?: boolean
  className?: string
}

export function Tabs({
  ariaLabel,
  items,
  value,
  onValueChange,
  compact = false,
  className,
}: TabsProps) {
  // Render a single-row segmented control so the sidebar and mobile toggle stay visually aligned with the mockup.
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('grid grid-flow-col auto-cols-fr gap-1 rounded-[1rem] bg-sidebar-muted p-1', className)}
    >
      {items.map((item) => {
        const active = item.value === value

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              'inline-flex min-w-0 items-center justify-center gap-2 rounded-[0.9rem] px-4 py-3 text-sm font-medium transition-[transform,background-color,color] duration-150 hover:-translate-y-px active:translate-y-px active:scale-[0.99]',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-sidebar-foreground active:bg-white/[0.1]',
              compact && 'px-0'
            )}
            onClick={() => onValueChange?.(item.value)}
          >
            {item.icon}
            <span className={cn(compact && 'sr-only')}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
