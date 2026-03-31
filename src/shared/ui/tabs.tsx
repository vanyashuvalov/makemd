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
  // Render a single row of tabs that can either drive real state or simply mirror a selected visual state.
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('grid gap-1 rounded-full bg-sidebar-muted p-1', className)}
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
              'inline-flex min-w-0 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-sidebar-foreground',
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
