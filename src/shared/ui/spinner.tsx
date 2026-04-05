'use client'

/**
 * File: src/shared/ui/spinner.tsx
 * Purpose: Shared loading indicator primitive for compact async actions.
 * Why it exists: the workspace needs a visually reliable spinner that does not depend on SVG icon behavior or per-widget animation tricks.
 * What it does: renders a small border-based spinner with reusable size and tone variants so any button can show a loading state consistently.
 * Connected to: the PDF export controls today and any future loading-aware action buttons.
 */
import * as React from 'react'
import { cn } from '@/shared/lib/cn'

const spinnerSizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
} as const

export type SpinnerSize = keyof typeof spinnerSizeClasses

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize
}

// Render a compact border spinner so loading states stay obviously animated even when the surrounding button is disabled.
export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      role="status"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent',
        spinnerSizeClasses[size],
        className
      )}
      {...props}
    />
  )
}
