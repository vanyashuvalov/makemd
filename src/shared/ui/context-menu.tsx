'use client'

/**
 * File: src/shared/ui/context-menu.tsx
 * Purpose: Reusable anchored context menu primitive for workspace row actions.
 * Why it exists: document rows need a compact overflow menu for download, delete, copy, and sharing actions.
 * What it does: positions a lightweight overlay near an anchor element, closes on outside interaction, and renders a list of action items.
 * Connected to: document row overflow controls today and future row-level or toolbar-level contextual actions.
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import type { TablerIcon } from '@tabler/icons-react'
import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui/icon'

export type ContextMenuItem = {
  key: string
  label: string
  icon: TablerIcon
  onSelect: () => void
  destructive?: boolean
}

export interface ContextMenuProps {
  open: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  items: ContextMenuItem[]
  onOpenChange: (open: boolean) => void
  className?: string
}

export function ContextMenu({ open, anchorRef, items, onOpenChange, className }: ContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  // Keep the menu anchored to the trigger button so it behaves like a real overflow popover rather than a floating guess.
  React.useLayoutEffect(() => {
    if (!open || typeof window === 'undefined') {
      return
    }

    const anchor = anchorRef.current
    if (!anchor) {
      return
    }

    const rect = anchor.getBoundingClientRect()
    const menuWidth = 224
    const menuHeight = Math.max(96, items.length * 44 + 8)
    const viewportPadding = 12
    const topOffset = 8

    const nextTop =
      rect.bottom + topOffset + menuHeight > window.innerHeight - viewportPadding
        ? Math.max(viewportPadding, rect.top - topOffset - menuHeight)
        : rect.bottom + topOffset

    const nextLeft = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding
    )

    setPosition({ top: nextTop, left: nextLeft })
  }, [anchorRef, items.length, open])

  // Close the menu when the user clicks away or presses Escape so the popup does not linger over the history stack.
  React.useEffect(() => {
    if (!open || typeof window === 'undefined') {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (menuRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return
      }

      onOpenChange(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorRef, onOpenChange, open])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        'fixed z-50 w-56 overflow-hidden rounded-[1rem] border border-border bg-popover p-1 text-popover-foreground shadow-none',
        className
      )}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          className={cn(
            'flex w-full items-center gap-3 rounded-[0.7rem] px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-muted',
            item.destructive ? 'text-destructive hover:text-destructive' : 'text-popover-foreground'
          )}
          onClick={() => {
            item.onSelect()
            onOpenChange(false)
          }}
        >
          <Icon icon={item.icon} size="sm" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  )
}
