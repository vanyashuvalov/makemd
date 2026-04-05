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

// Render a compact loading indicator and start a native browser animation so the spinner keeps rotating even if Tailwind animation classes are unavailable or overridden.
export function Spinner({ size = 'md', className, style, ...props }: SpinnerProps) {
  const spinnerRef = React.useRef<HTMLSpanElement | null>(null)

  React.useEffect(() => {
    const element = spinnerRef.current

    if (!element?.animate) {
      return
    }

    const animation = element.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' },
      ],
      {
        duration: 800,
        iterations: Infinity,
        easing: 'linear',
      }
    )

    return () => animation.cancel()
  }, [])

  return (
    <span
      ref={spinnerRef}
      aria-hidden="true"
      role="status"
      className={cn(
        'inline-block rounded-full border-current border-r-transparent',
        spinnerSizeClasses[size],
        className
      )}
      style={{ ...style, transformOrigin: '50% 50%', willChange: 'transform' }}
      {...props}
    />
  )
}
