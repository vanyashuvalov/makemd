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
  fillColor?: string
  borderColor?: string
  checkColor?: string
}

// Render the checkbox as a passive visual marker so markdown task-list items can share one glyph between screen preview and exported PDF output.
export function TaskCheckbox({
  checked,
  className,
  style,
  fillColor = 'transparent',
  borderColor = 'currentColor',
  checkColor = 'currentColor',
}: TaskCheckboxProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden leading-none', className)}
      style={style}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20" fill="none" style={{ display: 'block' }}>
        <rect
          x="2"
          y="2"
          width="16"
          height="16"
          rx="3.75"
          fill={checked ? borderColor : fillColor}
          stroke={borderColor}
          strokeWidth="1.5"
        />
        {checked ? (
          <path
            d="M5.25 10.25L8.15 13.15L14.75 6.75"
            stroke={checkColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
    </span>
  )
}
