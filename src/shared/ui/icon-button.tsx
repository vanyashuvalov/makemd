'use client'

/**
 * File: src/shared/ui/icon-button.tsx
 * Purpose: Compact icon-only action primitive for menus, exports, and bulk actions.
 * Why it exists: the Figma states use several circular icon buttons where text labels would waste space.
 * What it does: standardizes size, shape, and hover behavior for icon-only interactions.
 * Connected to: document rows, selection bars, and the PDF export rail.
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'

export const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-full',
    'transition-[background-color,color,border-color] duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'bg-transparent text-inherit hover:bg-white/10 active:bg-white/15',
        outline: 'border border-border bg-card text-card-foreground hover:bg-muted active:bg-muted/80',
        sidebar:
          'bg-sidebar-muted text-sidebar-foreground hover:bg-sidebar-border active:bg-sidebar-border/90',
        neutral:
          'bg-sidebar-icon text-sidebar-foreground/60 hover:bg-sidebar-icon-hover active:bg-sidebar-icon-active',
      },
      size: {
        default: 'h-10 w-10',
        sm: 'h-8 w-8',
        icon: 'h-6 w-6',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'default',
    },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  as?: 'button' | 'span'
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, variant, size, as = 'button', type = 'button', ...props }, ref) {
    // Render a single-purpose icon action that can be reused for overflow, export, copy, help, and slot-based icon surfaces.
    const Component = as

    return (
      <Component
        ref={ref as React.ForwardedRef<HTMLButtonElement & HTMLSpanElement>}
        {...(Component === 'button' ? { type } : {})}
        className={cn(iconButtonVariants({ variant, size }), 'cursor-pointer', className)}
        {...props}
      />
    )
  }
)

IconButton.displayName = 'IconButton'
