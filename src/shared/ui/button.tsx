'use client'

/**
 * File: src/shared/ui/button.tsx
 * Purpose: Primary action primitive reused across the Figma-inspired shell.
 * Why it exists: the design has repeated pill-shaped actions, and this component keeps those styles consistent.
 * What it does: exposes a small variant system for filled, secondary, ghost, and outline buttons.
 * Connected to: sidebar actions, export controls, state switchers, and any future form or toolbar controls.
 */
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'
import { buttonVariants } from '@/shared/ui/button-variants'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = 'button', ...props }, ref) {
    // Render a reusable action button that keeps the mockups visually consistent across the app shell.
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
