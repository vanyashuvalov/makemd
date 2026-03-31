'use client'

/**
 * File: src/shared/ui/separator.tsx
 * Purpose: Visual divider used across the sidebar and export bar.
 * Why it exists: the mockups use thin separators to keep dense layouts readable without adding extra chrome.
 * What it does: renders a simple horizontal or vertical rule.
 * Connected to: sidebar footer, export controls, and future card layouts.
 */
import * as React from 'react'
import { cn } from '@/shared/lib/cn'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) {
  // Render a tiny neutral rule that works both as a section break and as a toolbar divider.
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === 'horizontal' ? 'h-px w-full bg-border' : 'h-full w-px bg-border',
        className
      )}
      {...props}
    />
  )
}
