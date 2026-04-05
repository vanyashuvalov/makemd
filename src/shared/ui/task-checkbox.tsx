/**
 * File: src/shared/ui/task-checkbox.tsx
 * Purpose: Shared visual primitive for rendering markdown task-list checkboxes.
 * Why it exists: preview and PDF export need the exact same checkbox glyph and box geometry so task list items stay visually consistent across render paths.
 * What it does: renders a compact checkbox shell and draws a checkmark SVG only when the item is checked.
 * Connected to: the markdown preview renderer, the PDF markdown document renderer, and any future read-only task list surfaces.
 */
import type { CSSProperties } from 'react'
import { cn } from '@/shared/lib/cn'

export interface TaskCheckboxProps {
  checked: boolean
  className?: string
  style?: CSSProperties
}

// Render the checkbox as a passive visual marker so markdown task-list items can share one glyph between screen preview and exported PDF output.
export function TaskCheckbox({ checked, className, style }: TaskCheckboxProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-[4px] border-2 border-solid box-border leading-none', className)}
      style={style}
    >
      {checked ? (
        <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" style={{ display: 'block' }}>
          <path d="M3 8.5L6.2 11.7L13 4.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}
