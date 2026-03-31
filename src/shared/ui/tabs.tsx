'use client'

/**
 * File: src/shared/ui/tabs.tsx
 * Purpose: Shared tab selector for both the sidebar and the mobile editor/preview toggle.
 * Why it exists: the Figma mockups repeat icon tabs and segmented controls in multiple places.
 * What it does: renders a controlled or visually-static set of pill tabs with icon and label support.
 * Connected to: sidebar navigation, the mobile editor viewport switch, and future mode toggles.
 */
import * as React from 'react'
import type { TablerIcon } from '@tabler/icons-react'
import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui/icon'

export type TabItem = {
  value: string
  label: string
  icon?: TablerIcon
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
  // Render either the sidebar-style icon pill tabs or the wider mobile tabs, depending on the compact flag.
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        compact
          ? 'flex h-[68px] w-full items-start rounded-[999px] bg-[color:var(--color-sidebar-icon)] p-[6px]'
          : 'grid grid-flow-col auto-cols-fr gap-1 rounded-[1rem] bg-sidebar-muted p-1',
        className
      )}
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
              compact
                ? 'inline-flex h-14 flex-1 items-center justify-center rounded-[99px] bg-transparent px-[6px] py-4 text-base font-medium text-white transition-[background-color,opacity,color] duration-150'
                : 'inline-flex min-w-0 items-center justify-center gap-2 rounded-[0.9rem] px-4 py-3 text-sm font-medium transition-[background-color,color] duration-150',
              'cursor-pointer',
              compact &&
                (active
                  ? 'bg-[color:var(--color-sidebar-tab-active)] opacity-100'
                  : 'opacity-60 hover:bg-[color:var(--color-sidebar-icon-hover)] hover:opacity-100 active:bg-[color:var(--color-sidebar-icon-active)]'),
              !compact &&
                (active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-sidebar-foreground active:bg-white/[0.1]')
            )}
            onClick={() => onValueChange?.(item.value)}
          >
            {item.icon ? (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center justify-center',
                  compact ? 'h-6 w-6' : 'h-5 w-5'
                )}
              >
                <Icon
                  icon={item.icon}
                  size={compact ? 'md' : 'sm'}
                  tone={compact ? (active ? 'white' : 'sidebarMuted') : 'current'}
                />
              </span>
            ) : null}
            <span className={cn(compact && 'sr-only')}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
