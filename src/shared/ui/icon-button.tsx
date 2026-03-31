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
    'transition-[transform,background-color,box-shadow,color,border-color] duration-150',
    'hover:-translate-y-px active:translate-y-px active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        neutral: 'bg-sidebar-muted text-sidebar-foreground hover:bg-sidebar-border active:bg-sidebar-border/90',
        subtle: 'bg-card text-card-foreground hover:bg-muted active:bg-muted/80',
        accent: 'bg-primary text-primary-foreground hover:bg-primary/90 active:shadow-none',
        ghost: 'bg-transparent text-inherit hover:bg-white/10 active:bg-white/15',
      },
      size: {
        default: 'h-10 w-10',
        sm: 'h-8 w-8',
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
    VariantProps<typeof iconButtonVariants> {}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, variant, size, type = 'button', ...props }, ref) {
    // Render a single-purpose icon action that can be reused for overflow, export, copy, and help controls.
    return (
      <button
        ref={ref}
        type={type}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)

IconButton.displayName = 'IconButton'
