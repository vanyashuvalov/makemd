'use client'

/**
 * File: src/shared/ui/button.tsx
 * Purpose: Primary action primitive reused across the Figma-inspired shell.
 * Why it exists: the design has repeated pill-shaped actions, and this component keeps those styles consistent.
 * What it does: exposes a small variant system for filled, secondary, ghost, outline, and slot-based buttons.
 * Connected to: sidebar actions, export controls, state switchers, and any future form or toolbar controls.
 */
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'
import { buttonVariants } from '@/shared/ui/button-variants'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  before?: React.ReactNode
  after?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, before, after, type = 'button', children, ...props }, ref) {
    // Render a reusable action button with optional leading and trailing slots so button content stays composable.
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {before ? <span className="shrink-0">{before}</span> : null}
        {children ? <span className="min-w-0 truncate">{children}</span> : null}
        {after ? <span className="shrink-0">{after}</span> : null}
      </button>
    )
  }
)

Button.displayName = 'Button'
