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
    'rounded-full text-sm font-medium transition-[transform,background-color,box-shadow,color,border-color] duration-150',
    'active:translate-y-px active:scale-[0.99]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:bg-primary/90 active:shadow-none',
        secondary: 'bg-secondary text-secondary-foreground hover:-translate-y-px hover:bg-secondary/80 active:shadow-none',
        ghost: 'bg-transparent text-foreground hover:bg-muted active:bg-muted/80',
        outline: 'border border-border bg-card text-card-foreground hover:-translate-y-px hover:bg-muted active:bg-muted/80',
        sidebar: 'bg-sidebar-muted text-sidebar-foreground hover:-translate-y-px hover:bg-sidebar-border active:bg-sidebar-border/90',
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
