/**
 * File: src/shared/ui/button-variants.ts
 * Purpose: Shared button style recipe used by both server and client components.
 * Why it exists: style variants need to be reusable without importing from a client-only module.
 * What it does: exposes the canonical button class recipe for buttons and link-shaped button surrogates.
 * Connected to: `Button`, the workspace state switch, and any future button-like links.
 */
import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-full text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        outline: 'border border-border bg-card text-card-foreground hover:bg-muted',
        sidebar: 'bg-sidebar-muted text-sidebar-foreground hover:bg-sidebar-border',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-10 px-4',
        lg: 'h-14 px-6 text-base',
        icon: 'h-10 w-10 p-0',
        iconSm: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
